---
title: "Kafka 高频面试题详解"
order: 5
section: "中间件"
topic: "消息队列"
lang: "zh"
slug: "message-queue-kafka-faq"
summary: "Kafka 高频面试题汇总：使用场景、队列模型 vs 发布订阅、Partition、副本机制、ISR、消息顺序、不丢失、不重复消费、重试机制等。"
icon: "🎯"
featured: true
toc: true
updated: 2026-03-07
---

本文整理了 Kafka 相关的高频面试题，涵盖使用场景、核心概念、高可用机制、消息可靠性等关键知识点。

---

## 在什么场景下会使用 Kafka？

Kafka 主要用于**高吞吐的消息传输和实时数据流处理**场景，比如日志采集、用户行为埋点、实时计算、数据上报等。

和大数据生态结合特别好，比如 Flink、Spark、Hadoop、ClickHouse 等。

**典型场景：**

| 场景 | 说明 |
|------|------|
| **日志采集** | 收集各服务日志，统一传输到存储或分析系统 |
| **用户行为埋点** | 点击、曝光、搜索等行为数据上报 |
| **实时计算** | 与 Flink/Spark Streaming 配合做实时分析 |
| **数据管道** | 连接不同数据系统，作为数据流转枢纽 |

---

## 队列模型 vs 发布订阅模型？

### 队列模型（点对点）

**核心特点：**

- **一条消息通常只会被一个消费者消费**
- **适合做任务分发**

**举例：**

系统里来了很多任务：图片压缩、视频转码、发邮件等任务，只需要有一个消费者处理一次就可以。

```
┌──────────┐
│  Task    │
│  Queue   │ ──→ Consumer-A (处理任务 1)
│          │ ──→ Consumer-B (处理任务 2)
│          │ ──→ Consumer-C (处理任务 3)
└──────────┘
```

### 发布订阅模型（Pub/Sub）

**核心特点：**

- **一条消息可以被多个消费者消费**
- **适合做事件通知**

**举例：**

一条"订单已支付"消息发出去后：

- 库存系统收到
- 营销系统收到
- 积分系统收到
- 数据分析系统收到

当某个事件发生后，可能有很多下游系统都想知道，比如用户注册。

```
┌──────────┐
│  Event   │ ──→ 库存系统
│  Topic   │ ──→ 营销系统
│          │ ──→ 积分系统
│          │ ──→ 数据分析系统
└──────────┘
```

### 最核心的区别

| 模型 | 重点 | 适用场景 |
|------|------|----------|
| **队列模型** | **任务分摊** | 任务分发、负载均衡 |
| **发布订阅模型** | **事件广播** | 事件通知、多方处理 |

---

## 核心术语：Producer、Consumer、Broker、Topic、Partition

| 术语 | 说明 |
|------|------|
| **Producer（生产者）** | 负责发送消息的一方 |
| **Consumer（消费者）** | 负责读取消息的一方 |
| **Broker** | Kafka 服务器节点。Kafka 集群通常由多个 Broker 组成，每个 Broker 都可以存储一部分消息数据 |
| **Topic（主题）** | 消息的分类名称（逻辑概念） |
| **Partition（分区）** | Topic 的物理拆分单位，一个 Topic 可以分成多个 Partition |

---

## 什么是 Partition？为什么要有 Partition？

### Partition 是什么？

- Partition 是 Topic 的物理拆分单位，也是 Kafka 真正存消息的地方
- 在 RabbitMQ 叫做 Queue，在 RocketMQ 叫做 MessageQueue
- 不同 Partition 分区的内容是并列的，完全不一样；同一个 Partition 内消息是有序的
- 如果想要一系列指定消息有序处理，那么就指定 key 放在同一个 Partition 里面
- Kafka 里一个消费者组内，一个 Partition 同一时刻只能被一个 Consumer 消费

### 为什么要有 Partition？

**1. 提高吞吐量**

- 生产者并行写多个分区
- 消费者并行读多个分区

**2. 支持横向扩展**

- 分布式扩展，在不同服务器上面部署不同 Partition，分摊压力

**3. 支持消费者并发消费**

- 想让一个 Topic 被更多 Consumer 并行消费，就必须有更多 Partition

```
Topic: order-events
├─ Partition-0 (Broker-A) ──→ Consumer-1
├─ Partition-1 (Broker-B) ──→ Consumer-2
└─ Partition-2 (Broker-C) ──→ Consumer-3
```

---

## 为什么 Kafka 只能保证分区内有序，不能保证全局有序？

### 根本原因

一个 Topic 往往有多个 Partition，而多个 Partition 是并行写入、并行消费的。如果要保证全局有序势必会影响并行能力。

### 局部有序方案

同一个 key 的消息，进入同一个 Partition，就可以保持顺序。

**示例：**

```
订单 ID=1001 的所有操作 → Partition-0 → 有序处理
订单 ID=1002 的所有操作 → Partition-1 → 有序处理
订单 ID=1003 的所有操作 → Partition-0 → 有序处理
```

这样既保证了同一订单的操作顺序，又支持了不同订单的并行处理。

---

## Kafka 的多副本机制

Kafka 的多副本机制指的是同一个 Partition 会在不同 Broker 上保存多份副本（Replica），其中一个作为 Leader，对外提供读写服务，其余作为 Follower 负责同步 Leader 的数据。

```
Partition-0
├─ Leader (Broker-A) ←── 生产者写入，消费者读取
├─ Follower-1 (Broker-B) ←── 从 Leader 拉取数据
└─ Follower-2 (Broker-C) ←── 从 Leader 拉取数据
```

### 好处

- 提高高可用性和数据可靠性
- 当 Leader 所在 Broker 宕机时，可以从同步状态良好的副本中选举新的 Leader，实现故障切换
- 减少单点故障和数据丢失风险

---

## ISR 是什么？Leader 选举机制？

### ISR 是什么？

**ISR（In-Sync Replicas）** 表示与当前 Leader 保持同步、数据比较新的副本集合。

Kafka 在 Leader 选举时优先从 ISR 中选择新的 Leader，因为这样更安全、数据更完整。

### 初始选举 Leader

Partition 初始会在其副本中指定一个 Leader，对外提供读写服务。

### Leader 宕机后如何选举？

1. Leader 所在 Broker 宕机后，由 Controller 感知 Broker 故障
2. Controller 为受影响的 Partition 重新选主
3. 通常优先从 ISR 中选
4. 如果 ISR 为空，是否允许从非 ISR 副本中选 Leader 取决于 `unclean.leader.election.enable` 配置
   - 开启后可提升可用性，但可能带来数据丢失风险

### 如何判断 Leader 宕机？

Controller 主要通过 Broker 的存活状态/心跳机制来判断 Leader 所在 Broker 是否宕机。

---

## Leader 和 Follower 如何同步？

```
┌─────────────────────────────────────────────────────────┐
│  1. Producer 写 Leader                                   │
│     生产者只把消息发给 Partition 的 Leader                    │
│                                                         │
│  2. Leader 先落本地日志                                   │
│     Leader 先把消息追加到自己的 Partition Log               │
│     Kafka 的底层就是追加写日志                               │
│                                                         │
│  3. Follower 发 Fetch 请求拉数据                           │
│     Follower 会不断向 Leader 发 Fetch 请求                     │
│     请求"从我当前 Offset 之后的新数据"                        │
│     Follower 是 Pull 模式（拉取模式）                        │
│                                                         │
│  4. Follower 写本地日志并追赶 Leader                        │
│     Follower 把拉到的数据也按相同顺序追加到自己的日志里       │
│     如果它持续跟得上，就留在 ISR；跟不上太久就被踢出 ISR      │
└─────────────────────────────────────────────────────────┘
```

### 可能出现不属于 ISR 的副本的原因

当前副本所在机器资源紧张，跟不上 Leader 的节奏。

---

## Kafka 如何保证消息的消费顺序？

### 方案一（不推荐）

1 个 Topic 只对应一个 Partition，利用 Kafka 分区内有序特性。

**缺点：** 吞吐量受限，无法并行消费。

### 方案二（推荐）

发送消息的时候指定 Key/Partition。

**优点：** 既保证了相关消息的顺序，又支持了其他消息的并行处理。

---

## Kafka 如何保证消息不丢失？

### 生产端

- 修改配置 `acks=all`，Leader 会等待所有 In-Sync Replicas 确认，不要用默认的 `acks=0`
- 生产端要允许重试，并开启幂等性

这一步解决的是两类问题：

- 网络抖动、短暂错误时，生产者可以重试，不至于直接把消息丢掉
- 重试时又尽量避免"其实已经写成功了，但又重发一遍"带来的重复

### Broker 端

发挥副本机制，最常见的高可靠组合：

| 配置 | 说明 |
|------|------|
| `replication.factor=3` | 指定多少个副本 |
| `min.insync.replicas=2` | 指定当生产者使用 `acks=all` 时，至少需要多少个 ISR 内副本才允许写成功 |
| Producer 用 `acks=all` | 保证 ISR 中所有副本都同步才是写入 |

这意味着：只要 ISR 少于要求的数量，Kafka 宁可让生产失败，也不轻易接受一条"高风险写入"。这样做的目的就是降低 Leader 刚写完就宕机导致消息丢失的概率。

- 还要关闭 `unclean.leader.election.enable`，防止从落后副本选择为 Leader

### 消费端

**可能问题：** 先提交了 Offset，业务处理却失败了。

**可靠做法：** 先处理业务，处理成功后再提交 Offset。

---

## Kafka 如何保证消息不重复消费？

### 根本原因

服务端侧已经消费的数据没有成功提交 Offset。

### 方式一：手动提交 Offset，并且在业务成功后提交

```
1. 拉取消息
2. 执行业务处理
3. 处理成功后再提交 Offset
```

### 方式二：业务幂等

- 去重表 / 唯一键约束 / 状态机

---

## Kafka 重试机制是什么？

### 默认重试机制

- Kafka 中消费异常失败并不会卡住后续消息的消费，通常会重试几次以后跳过
- 默认立刻重试至多 10 次
- 可通过重新实现 `kafkaListenerContainerFactory` 来实现自定义重试次数和间隔（FixedBackOff 类）

### 自定义重试失败后逻辑

需要手动实现，重写 `DefaultErrorHandler` 的 `handleRemaining` 函数，加上自定义的告警等操作。

- `DefaultErrorHandler` 只是默认的一个错误处理器，Spring Kafka 还提供了 `CommonErrorHandler` 接口
- 手动实现 `CommonErrorHandler` 就可以实现更多的自定义操作，有很高的灵活性
- 例如根据不同的错误类型，实现不同的重试逻辑以及业务逻辑等

### 死信队列（DLQ）

**死信队列（Dead Letter Queue，简称 DLQ）** 用来处理失败，或者超过一定的重试次数仍无法被成功处理的消息。

- `@RetryableTopic` 是 Spring Kafka 中的一个注解，它用于配置某个 Topic 支持消息重试
- 对于死信队列的处理，既可以用 `@DltHandler` 处理，也可以使用 `@KafkaListener` 重新消费
- 实现一个死信队列比如新建一个 Topic，这个 Topic 就是专门处理失败消息的

### 总结

消费失败以后是通过重试队列和死信队列来处理的。

---

## 📚 相关文章

- [消息队列核心概念详解](/zh/docs/message-queue-core-concepts) - 深入理解 Producer、Consumer、ACK、幂等性等概念
- [主流消息队列产品对比与选型](/zh/docs/message-queue-products-comparison) - Kafka、RabbitMQ、RocketMQ 等产品对比

---

**💡 提示：** 本文整理了 Kafka 高频面试知识点，建议结合实战加深理解。
