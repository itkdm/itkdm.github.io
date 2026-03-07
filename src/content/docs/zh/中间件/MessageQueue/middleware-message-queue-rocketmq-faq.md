---
title: "RocketMQ 高频面试题详解"
order: 6
section: "中间件"
topic: "消息队列"
lang: "zh"
slug: "message-queue-rocketmq-faq"
summary: "RocketMQ 高频面试题汇总：使用场景、架构设计、消息类型、顺序消费、消息可靠性、事务消息、消息堆积等核心知识点。"
icon: "🚀"
featured: true
toc: true
updated: 2026-03-07
---

本文整理了 RocketMQ 相关的高频面试题，涵盖使用场景、架构设计、消息可靠性、事务消息、消息堆积等关键知识点。

---

## 在什么场景下会使用 RocketMQ？

RocketMQ 更偏向**电商、金融、订单等业务系统**，对**消息可靠性要求极高**，不能丢消息，且公司业务以 Java 生态为主。

**典型场景：**

| 场景 | 说明 |
|------|------|
| **订单系统** | 下单、支付、发货、签收等状态流转，要求消息绝对可靠 |
| **交易核心** | 金融交易、支付结算，对数据一致性要求极高 |
| **削峰填谷** | 大促活动期间缓冲流量，保护下游系统 |
| **异步解耦** | 核心链路异步化，提升系统响应速度 |
| **分布式事务** | 跨服务的最终一致性事务场景 |

**为什么选择 RocketMQ？**

- ✅ **高可靠性**：支持事务消息、多级确认机制，保证消息不丢失
- ✅ **强一致性**：支持顺序消息，满足订单、支付等场景的严格顺序要求
- ✅ **Java 生态**：阿里出品，与 Spring、Dubbo 等 Java 框架深度集成
- ✅ **业务友好**：支持定时消息、延迟消息、事务消息等业务场景

---

## RocketMQ 架构详解

### 核心组件

```
┌─────────────────────────────────────────────────────────────────┐
│                        RocketMQ 架构                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐                                                  │
│   │ Producer │ ──→ 发送消息                                      │
│   └──────────┘                                                  │
│        │                                                        │
│        ▼                                                        │
│   ┌──────────────────────────────────────────────────────────┐ │
│   │                      NameServer                           │ │
│   │  （轻量级注册中心，存储 Topic 路由信息、Broker 状态）           │ │
│   └──────────────────────────────────────────────────────────┘ │
│        ▲                                                        │
│        │  路由发现                                                │
│        ▼                                                        │
│   ┌──────────────────────────────────────────────────────────┐ │
│   │                      Broker                               │ │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │ │
│   │  │ Master-1    │  │ Master-2    │  │ Master-3    │       │ │
│   │  │ + Slave-1   │  │ + Slave-2   │  │ + Slave-3   │       │ │
│   │  └─────────────┘  └─────────────┘  └─────────────┘       │ │
│   │         │               │               │                 │ │
│   │         └───────────────┼───────────────┘                 │ │
│   │                         ▼                                 │ │
│   │              ┌─────────────────────┐                      │ │
│   │              │   CommitLog         │                      │ │
│   │              │   （消息持久化存储）    │                      │ │
│   │              └─────────────────────┘                      │ │
│   └──────────────────────────────────────────────────────────┘ │
│        │                                                        │
│        ▼                                                        │
│   ┌──────────┐                                                  │
│   │ Consumer │ ←── 消费消息                                      │
│   └──────────┘                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 核心组件说明

| 组件 | 作用 | 特点 |
|------|------|------|
| **Producer** | 消息生产者 | 负责发送消息，支持同步/异步/单向发送 |
| **Consumer** | 消息消费者 | 负责消费消息，支持推/拉两种模式 |
| **NameServer** | 注册中心 | 轻量级、无状态、集群部署，存储路由信息 |
| **Broker** | 消息服务器 | 存储消息、处理收发请求，支持主从架构 |
| **Topic** | 消息主题 | 消息的一级分类 |
| **MessageQueue** | 消息队列 | Topic 的物理分区，类似 Kafka 的 Partition |

### Broker 主从架构

```
Broker Cluster
├─ Broker-A
│   ├─ Master (可读可写)
│   └─ Slave (只读，从 Master 同步数据)
├─ Broker-B
│   ├─ Master
│   └─ Slave
└─ Broker-C
    ├─ Master
    └─ Slave
```

- **Master**：处理生产者的写入请求和消费者的读取请求
- **Slave**：从 Master 同步数据，提供读服务（可配置），Master 宕机时 Slave 可提升为 Master

### NameServer 特点

- **轻量级**：无状态、部署简单
- **集群部署**：多个 NameServer 互不通信，Producer/Consumer 连接任意一个即可
- **路由管理**：存储 Topic 到 Broker 的路由映射关系
- **心跳检测**：Broker 定期向 NameServer 发送心跳，上报存活状态

---

## RocketMQ 消息类型对比

| 消息类型 | 适用场景 | 关键特性 |
|----------|----------|----------|
| **普通消息** | 微服务解耦、事件驱动 | 无顺序要求，消息相互独立 |
| **顺序消息** | 订单处理、数据同步 | 同一消息组内严格有序 |
| **定时/延迟消息** | 延迟任务、超时处理 | 5.x 支持任意精度定时 |
| **事务消息** | 分布式事务 | 半消息机制 + 事务回查 |

### 1. 普通消息

最常用的消息类型，消息之间没有依赖关系。

```java
// 发送普通消息
Message msg = new Message("OrderTopic", "CreateOrder", 
    "orderId:1001,body:xxx".getBytes());
producer.send(msg);
```

### 2. 顺序消息

保证同一消息组内的消息严格按照发送顺序被消费。

**实现原理：**

- 发送时指定 `MessageQueueSelector`，将同一组消息发送到同一个 MessageQueue
- 消费时使用 `MessageListenerOrderly`，保证同一队列的消息顺序消费

```java
// 发送顺序消息
producer.send(msg, new MessageQueueSelector() {
    @Override
    public MessageQueue select(List<MessageQueue> mqs, Message msg, Object arg) {
        Long orderId = (Long) arg;
        // 根据订单 ID 选择同一个队列
        return mqs.get((int) (orderId % mqs.size()));
    }
}, orderId);

// 消费顺序消息
consumer.registerMessageListener(new MessageListenerOrderly() {
    @Override
    public ConsumeOrderlyStatus consumeMessage(List<MessageExt> msgs, 
                                                ConsumeOrderlyContext context) {
        // 顺序处理消息
        return ConsumeOrderlyStatus.SUCCESS;
    }
});
```

### 3. 定时/延迟消息

消息发送后不会立即被消费，而是在指定时间后才可被消费。

```java
// 延迟消息（18 个延迟级别）
Message msg = new Message("OrderTopic", "PayTimeout", 
    "orderId:1001".getBytes());
// 延迟级别：1s 5s 10s 30s 1m 2m 3m 4m 5m 6m 7m 8m 9m 10m 20m 30m 1h 2h
msg.setDelayTimeLevel(3); // 10 秒后消费
producer.send(msg);
```

**5.x 版本支持任意精度定时**，可以指定具体的时间戳。

### 4. 事务消息

用于实现分布式事务的最终一致性。

```java
// 发送事务消息
TransactionSendResult result = producer.sendMessageInTransaction(
    new Message("OrderTopic", "OrderCreated", 
        "orderId:1001".getBytes()),
    null // 本地事务参数
);
```

---

## 如何保证消费顺序？

### 问题场景

订单创建 → 订单支付 → 订单发货，这三个消息必须按顺序处理，不能乱序。

### RocketMQ 的顺序保证机制

**1. 发送端：保证同一组消息进入同一个 MessageQueue**

```java
// 使用 MessageQueueSelector，根据业务 Key 选择队列
producer.send(msg, new MessageQueueSelector() {
    @Override
    public MessageQueue select(List<MessageQueue> mqs, Message msg, Object arg) {
        // 同一订单 ID 的消息总是发送到同一个队列
        return mqs.get((int) (orderId % mqs.size()));
    }
}, orderId);
```

**2. 消费端：使用顺序消费监听器**

```java
consumer.registerMessageListener(new MessageListenerOrderly() {
    @Override
    public ConsumeOrderlyStatus consumeMessage(List<MessageExt> msgs, 
                                                ConsumeOrderlyContext context) {
        // 锁定当前队列，保证同一时刻只有一个线程消费
        for (MessageExt msg : msgs) {
            // 处理消息
        }
        return ConsumeOrderlyStatus.SUCCESS;
    }
});
```

### 关键原理

| 机制 | 说明 |
|------|------|
| **队列选择** | 发送时通过 Hash 或取模，保证同一组消息进入同一队列 |
| **队列锁定** | 消费时锁定 MessageQueue，同一时刻只有一个消费者线程处理 |
| **本地顺序** | 单个队列内消息天然有序（FIFO） |

### 注意事项

- ⚠️ 顺序消息会牺牲一定的并发性能
- ⚠️ 如果某个消息消费失败，会阻塞后续消息（可设置最大重试次数后跳过）
- ⚠️ 需要保证消费者幂等性，防止重试导致重复处理

---

## 如何保证消息不丢失？

消息丢失可能发生在三个阶段：**生产端 → Broker 端 → 消费端**。

### 1. 生产端保证

**问题：** 消息发送失败，生产者不知道。

**解决方案：**

```java
// 方式一：同步发送 + 重试
SendResult result = producer.send(msg);
if (result.getSendStatus() != SendStatus.SEND_OK) {
    // 发送失败，记录日志或重试
}

// 方式二：异步发送 + 回调
producer.send(msg, new SendCallback() {
    @Override
    public void onSuccess(SendResult result) {
        // 发送成功
    }
    @Override
    public void onException(Throwable e) {
        // 发送失败，重试或记录
    }
});
```

**关键配置：**

| 配置 | 推荐值 | 说明 |
|------|--------|------|
| `sendMsgTimeout` | 3000ms+ | 发送超时时间，避免网络抖动导致失败 |
| `retryTimesWhenSendFailed` | 2+ | 发送失败重试次数 |
| `retryTimesWhenSendAsyncFailed` | 2+ | 异步发送失败重试次数 |

### 2. Broker 端保证

**问题：** Broker 收到消息后，还没持久化就宕机了。

**解决方案：**

```java
// 使用同步刷盘（最可靠，性能较低）
producer.setSendMessageWithVIPChannel(false);
// Broker 配置：flushDiskType=SYNC_FLUSH

// 使用同步复制（主从同步）
// Broker 配置：brokerRole=SYNC_MASTER
```

**关键配置：**

| 配置 | 推荐值 | 说明 |
|------|--------|------|
| `flushDiskType` | SYNC_FLUSH | 同步刷盘，消息落盘后才返回成功 |
| `brokerRole` | SYNC_MASTER | 同步复制，Master 等待 Slave 确认 |
| `flushCommitLogLeastPages` | 1 | 至少刷多少页才返回 |
| `flushConsumeQueueLeastPages` | 1 | 消费队列至少刷多少页 |

**刷盘方式对比：**

| 方式 | 可靠性 | 性能 | 适用场景 |
|------|--------|------|----------|
| **同步刷盘** | ⭐⭐⭐⭐⭐ | 较低 | 金融、交易等核心场景 |
| **异步刷盘** | ⭐⭐⭐⭐ | 高 | 一般业务场景 |

**复制方式对比：**

| 方式 | 可靠性 | 性能 | 适用场景 |
|------|--------|------|----------|
| **同步复制** | ⭐⭐⭐⭐⭐ | 较低 | 对可靠性要求极高的场景 |
| **异步复制** | ⭐⭐⭐⭐ | 高 | 一般业务场景 |

### 3. 消费端保证

**问题：** 消息消费成功了，但还没提交 Offset 就宕机了，导致消息重复消费；或者先提交 Offset 但业务处理失败，导致消息丢失。

**解决方案：**

```java
// 方式一：消费成功后再提交 Offset（推荐）
consumer.registerMessageListener(new MessageListenerConcurrently() {
    @Override
    public ConsumeConcurrentlyStatus consumeMessage(List<MessageExt> msgs, 
                                                     ConsumeConcurrentlyContext context) {
        try {
            // 1. 先处理业务
            for (MessageExt msg : msgs) {
                // 业务逻辑
            }
            // 2. 业务成功后返回 SUCCESS，自动提交 Offset
            return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
        } catch (Exception e) {
            // 3. 业务失败返回 RECONSUME_LATER，会重试
            return ConsumeConcurrentlyStatus.RECONSUME_LATER;
        }
    }
});
```

**关键配置：**

| 配置 | 推荐值 | 说明 |
|------|--------|------|
| `consumeTimeout` | 15m+ | 消费超时时间，避免长时间处理导致重试 |
| `maxReconsumeTimes` | 16 | 最大重试次数，超过后进入死信队列 |
| `suspendCurrentQueueTimeMillis` | 1000 | 消费失败后暂停时间 |

### 总结：消息不丢失的完整方案

```
┌─────────────────────────────────────────────────────────────────┐
│                     消息不丢失完整方案                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  生产端：                                                        │
│  ✓ 同步发送 + 重试机制                                           │
│  ✓ 发送失败记录日志，人工介入                                    │
│                                                                 │
│  Broker 端：                                                     │
│  ✓ 同步刷盘（SYNC_FLUSH）                                        │
│  ✓ 同步复制（SYNC_MASTER）                                       │
│  ✓ 多副本部署，避免单点故障                                      │
│                                                                 │
│  消费端：                                                        │
│  ✓ 先处理业务，成功后再提交 Offset                                │
│  ✓ 消费失败返回 RECONSUME_LATER，触发重试                        │
│  ✓ 实现消费者幂等性，防止重复消费                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 如何保证消费不重复？

### 根本原因

网络抖动、消费者宕机等原因导致 Offset 提交失败，消息会被重新消费。

**RocketMQ 保证的是"至少一次"投递，不保证"恰好一次"。**

### 解决方案：消费者幂等性

**核心思想：** 无论消息被消费多少次，业务结果都是一样的。

**常见方案：**

| 方案 | 说明 | 适用场景 |
|------|------|----------|
| **唯一键约束** | 数据库唯一索引，重复插入会失败 | 订单创建、用户注册等 |
| **去重表** | 先查去重表，存在则跳过，不存在则插入 | 通用场景 |
| **状态机** | 检查当前状态，只有合法状态转换才处理 | 订单状态流转 |
| **Redis 去重** | 用 Redis 记录已消费的消息 ID | 高性能场景 |

### 方案一：数据库唯一键

```java
// 订单表设置唯一索引：order_id
public void createOrder(Order order) {
    try {
        orderMapper.insert(order); // 有唯一索引
    } catch (DuplicateKeyException e) {
        // 重复消费，直接忽略
        log.warn("订单已存在，跳过：{}", order.getOrderId());
    }
}
```

### 方案二：去重表

```java
// 创建去重表
CREATE TABLE message_dedup (
    message_id VARCHAR(64) PRIMARY KEY,
    consumer_group VARCHAR(64),
    consume_time DATETIME
);

// 消费逻辑
@Transactional
public void consumeMessage(MessageExt msg) {
    String messageId = msg.getMsgId();
    
    // 先插入去重表（有唯一索引）
    dedupMapper.insert(new DedupRecord(messageId, ...));
    
    // 再处理业务
    processBusiness(msg);
}
```

### 方案三：状态机

```java
// 订单状态：CREATED → PAID → SHIPPED → COMPLETED
public void payOrder(String orderId) {
    Order order = orderMapper.selectById(orderId);
    
    // 只有 CREATED 状态才能支付
    if (!"CREATED".equals(order.getStatus())) {
        log.warn("订单状态不正确，跳过：{}", orderId);
        return;
    }
    
    order.setStatus("PAID");
    orderMapper.update(order);
}
```

### 方案四：Redis 去重

```java
public void consumeMessage(MessageExt msg) {
    String key = "msg:dedup:" + msg.getMsgId();
    
    // SETNX 原子操作，成功返回 1 表示首次消费
    Boolean success = redisTemplate.opsForValue()
        .setIfAbsent(key, "1", Duration.ofDays(3));
    
    if (Boolean.FALSE.equals(success)) {
        log.warn("消息已消费，跳过：{}", msg.getMsgId());
        return;
    }
    
    // 处理业务
    processBusiness(msg);
}
```

---

## RocketMQ 如何实现分布式事务？

### 事务消息原理

RocketMQ 的事务消息基于**半消息（Half Message）机制**实现，保证本地事务和消息发送的最终一致性。

### 事务消息流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    RocketMQ 事务消息流程                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 生产者发送半消息（Half Message）                              │
│     ──→ Broker 存储消息，但对消费者不可见                          │
│                                                                 │
│  2. Broker 返回半消息发送成功                                     │
│                                                                 │
│  3. 生产者执行本地事务                                           │
│     ──→ 本地数据库操作（如创建订单）                               │
│                                                                 │
│  4. 根据本地事务结果，向 Broker 提交：                             │
│     - COMMIT：提交消息，消费者可见                                │
│     - ROLLBACK：回滚消息，删除半消息                              │
│     - UNKNOW：暂时不提交，等待事务回查                            │
│                                                                 │
│  5. 事务回查机制（当生产者提交 UNKNOW 或宕机时）                    │
│     - Broker 定期扫描超时未提交的半消息                            │
│     - 主动回调生产者的 checkLocalTransaction 方法                 │
│     - 生产者检查本地事务状态，返回 COMMIT/ROLLBACK                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 代码示例

```java
// 1. 创建事务生产者
TransactionMQProducer producer = new TransactionMQProducer("tx-producer-group");
producer.setNamesrvAddr("127.0.0.1:9876");

// 2. 设置事务监听器
producer.setTransactionListener(new TransactionListener() {
    
    // 执行本地事务
    @Override
    public LocalTransactionState executeLocalTransaction(Message msg, Object arg) {
        try {
            // 执行本地事务（如创建订单）
            createOrder(msg.getBody());
            
            // 本地事务成功，提交消息
            return LocalTransactionState.COMMIT_MESSAGE;
            
        } catch (Exception e) {
            // 本地事务失败，回滚消息
            return LocalTransactionState.ROLLBACK_MESSAGE;
        }
    }
    
    // 事务回查
    @Override
    public LocalTransactionState checkLocalTransaction(MessageExt msg) {
        // 检查本地事务状态
        boolean success = checkOrderExists(msg.getMsgId());
        
        if (success) {
            return LocalTransactionState.COMMIT_MESSAGE;
        } else {
            return LocalTransactionState.ROLLBACK_MESSAGE;
        }
    }
});

// 3. 发送事务消息
TransactionSendResult result = producer.sendMessageInTransaction(
    new Message("OrderTopic", "OrderCreated", 
        "orderId:1001".getBytes()),
    null
);
```

### 三种返回状态

| 状态 | 说明 | Broker 处理 |
|------|------|------------|
| **COMMIT_MESSAGE** | 本地事务成功 | 提交消息，消费者可见 |
| **ROLLBACK_MESSAGE** | 本地事务失败 | 回滚消息，删除半消息 |
| **UNKNOW** | 事务状态未知 | 等待事务回查 |

### 事务回查机制

**触发条件：**

- 生产者提交 `UNKNOW` 状态
- 生产者发送消息后宕机，未提交事务状态

**回查流程：**

1. Broker 定期扫描超时未提交的半消息（默认 60 秒）
2. 主动回调生产者的 `checkLocalTransaction` 方法
3. 生产者检查本地事务状态（如查询数据库）
4. 返回 `COMMIT_MESSAGE` 或 `ROLLBACK_MESSAGE`

**配置参数：**

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `transactionCheckInterval` | 60000ms | 事务回查间隔 |
| `transactionMsgMaxCheckTime` | 15 | 最大回查次数 |
| `transactionMsgCheckImmunityTime` | 60000ms | 消息免检查时间 |

### 注意事项

- ⚠️ 事务消息只支持**单阶段**，不支持分布式事务的两阶段提交
- ⚠️ 本地事务必须**幂等**，因为可能被多次回查
- ⚠️ 事务消息的**吞吐量较低**，不适合高并发场景

---

## 如何解决消息堆积问题？

### 问题场景

消费者处理速度跟不上生产者发送速度，导致消息在 Broker 端大量堆积。

### 排查步骤

**1. 查看堆积情况**

```bash
# 使用 RocketMQ 命令行工具
mqadmin consumerProgress -n "127.0.0.1:9876" -g "order-consumer-group"
```

输出示例：
```
#Consumer Group  #Topic  #Subscription  #Diff  #LastTimestamp
order-consumer-group  OrderTopic  true  100000  1709712000000
```

`Diff` 列表示堆积的消息数量。

**2. 查看消费者状态**

```bash
mqadmin consumerStatus -n "127.0.0.1:9876" -g "order-consumer-group"
```

### 解决方案

#### 方案一：增加消费者数量（推荐）

**前提：** Topic 的 MessageQueue 数量 >= 消费者数量

```
当前状态：
Topic: OrderTopic (4 个 MessageQueue)
Consumer: 2 个实例
结果：2 个消费者并行消费

优化后：
Topic: OrderTopic (4 个 MessageQueue)
Consumer: 4 个实例
结果：4 个消费者并行消费，吞吐量翻倍
```

**注意：** 消费者数量不能超过 MessageQueue 数量，多余的消费者会空闲。

#### 方案二：增加 MessageQueue 数量

```bash
# 扩容 MessageQueue
mqadmin updateTopic -n "127.0.0.1:9876" -c "broker-a" -t "OrderTopic" -r 8 -w 8
```

- `-r 8`：读队列数量
- `-w 8`：写队列数量

**注意：** 扩容后可能影响顺序消息的顺序性。

#### 方案三：优化消费者处理逻辑

**问题定位：**

```java
// 检查消费者代码，是否有耗时操作
consumer.registerMessageListener(new MessageListenerConcurrently() {
    @Override
    public ConsumeConcurrentlyStatus consumeMessage(List<MessageExt> msgs, 
                                                     ConsumeConcurrentlyContext context) {
        // 检查是否有以下问题：
        // 1. 数据库慢查询
        // 2. 外部 API 调用超时
        // 3. 锁竞争
        // 4. 同步阻塞操作
        
        for (MessageExt msg : msgs) {
            // 优化前：同步调用外部 API（耗时 500ms）
            callExternalApi(msg);
            
            // 优化后：异步处理 or 批量处理
            asyncProcess(msg);
        }
        
        return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
    }
});
```

**优化手段：**

| 优化方式 | 说明 |
|----------|------|
| **批量处理** | 多条消息合并处理，减少数据库交互 |
| **异步处理** | 消息只负责触发，实际业务异步执行 |
| **缓存优化** | 增加缓存，减少数据库查询 |
| **索引优化** | 优化数据库索引，提升查询速度 |

#### 方案四：临时扩容 + 分流

**紧急处理方案：**

1. 部署一批临时消费者，专门处理堆积消息
2. 创建一个新的 Topic，将积压消息转发到新 Topic
3. 用更多消费者并行消费新 Topic

```java
// 临时消费者：只转发消息，不处理业务
public void redirectMessage(MessageExt msg) {
    Message newMsg = new Message("OrderTopic-Backup", 
                                  msg.getBody());
    backupProducer.send(newMsg);
}
```

### 预防措施

| 措施 | 说明 |
|------|------|
| **监控告警** | 设置堆积阈值，超过阈值自动告警 |
| **限流降级** | 生产者端限流，避免突发流量 |
| **弹性伸缩** | 根据堆积情况自动扩缩容消费者 |
| **死信队列** | 多次重试失败的消息进入死信队列，避免阻塞 |

### 监控指标

```yaml
# 关键监控指标
- 堆积量（Diff）> 10000 告警
- 消费 TPS < 生产 TPS 的 50% 告警
- 消费延迟时间 > 5 分钟 告警
- 消费者实例数 = 0 严重告警
```

---

## 📚 相关文章

- [消息队列核心概念详解](/zh/docs/message-queue-core-concepts) - 深入理解 Producer、Consumer、ACK、幂等性等概念
- [Kafka 高频面试题详解](/zh/docs/message-queue-kafka-faq) - Kafka 相关面试知识点
- [主流消息队列产品对比与选型](/zh/docs/message-queue-products-comparison) - Kafka、RabbitMQ、RocketMQ 等产品对比

---

**💡 提示：** 本文整理了 RocketMQ 高频面试知识点，建议结合实战加深理解。RocketMQ 在电商、金融等对可靠性要求高的场景中应用广泛，掌握其核心原理对面试和工作都很有帮助。
