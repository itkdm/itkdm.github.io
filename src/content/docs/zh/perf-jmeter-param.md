---
title: "JMeter 参数化详解"
order: 8
section: "性能测试"
topic: "JMeter"
lang: "zh"
slug: "perf-jmeter-param"
summary: "使用 CSV Data Set Config 实现用户数据模拟和参数化测试。"
icon: "📊"
featured: false
toc: true
updated: 2026-03-10
---

## 一、什么是参数化

在真实业务场景中，不同用户会使用不同的数据访问系统。

例如：

* 不同用户登录
* 不同商品查询
* 不同订单创建

如果压测脚本使用固定数据，例如：

```
username=test
password=123456
```

那么所有虚拟用户都会使用同一个账号，这通常会导致：

* 数据冲突
* 登录失败
* 压测结果不真实

因此需要使用 **参数化（Parameterization）**。

参数化是指：

> 在压测过程中为每个请求动态提供不同的数据。

---

## 二、参数化的常见场景

在企业压测中，参数化非常常见。

例如：

### 用户登录

```
用户 1 登录
用户 2 登录
用户 3 登录
```

---

### 商品查询

```
查询商品 ID=1001
查询商品 ID=1002
查询商品 ID=1003
```

---

### 创建订单

```
订单 1
订单 2
订单 3
```

如果没有参数化，所有请求都会使用同一数据，这样压测结果是不可信的。

---

## 三、JMeter 参数化方式

JMeter 支持多种参数化方式：

| 方式 | 说明 |
| ---------------------- | ---------- |
| CSV Data Set Config | 从 CSV 文件读取数据 |
| User Defined Variables | 自定义变量 |
| 函数变量 | JMeter 内置函数 |

在实际项目中最常用的是：

```
CSV Data Set Config
```

---

## 四、CSV Data Set Config

CSV Data Set Config 用于从文件读取测试数据。

例如创建一个文件：

```
users.csv
```

内容：

```
username,password
user1,123456
user2,123456
user3,123456
user4,123456
```

---

## 五、添加 CSV 配置

在 JMeter 中：

右键 Thread Group：

```
Add → Config Element → CSV Data Set Config
```

配置参数：

| 参数 | 说明 |
| ------------------ | ------- |
| Filename | CSV 文件路径 |
| Variable Names | 变量名 |
| Delimiter | 分隔符 |
| Recycle on EOF | 是否循环读取 |
| Stop thread on EOF | 是否停止线程 |

示例配置：

```
Filename: users.csv
Variable Names: username,password
Delimiter: ,
```

---

## 六、在请求中使用变量

CSV 文件中的变量可以通过：

```
${变量名}
```

来引用。

例如：

登录请求：

```
POST /api/login
```

请求参数：

```json
{
  "username": "${username}",
  "password": "${password}"
}
```

这样每个虚拟用户都会使用不同账号。

---

## 七、参数读取方式

CSV Data Set Config 支持多种读取方式。

### Sequential（顺序读取）

按顺序读取：

```
user1
user2
user3
```

适合：

```
用户数据
订单数据
```

---

### Random（随机读取）

随机读取数据：

```
user3
user1
user2
```

适合：

```
商品查询
随机业务
```

---

## 八、生成动态数据

在压测中，有时候需要生成动态数据，例如：

* 唯一订单号
* 当前时间
* 随机字符串

JMeter 提供了很多函数。

例如：

### 生成随机数

```
${__Random(1,10000)}
```

生成：

```
5483
9211
137
```

---

### 当前时间戳

```
${__time()}
```

生成：

```
1712345678900
```

---

### UUID

```
${__UUID()}
```

生成：

```
550e8400-e29b-41d4-a716-446655440000
```

这些数据可以用于：

```
订单 ID
请求 ID
唯一参数
```

---

## 九、企业真实参数化示例

假设压测登录接口：

```
POST /api/login
```

用户数据：

```
users.csv
```

内容：

```
username,password
user1,123456
user2,123456
user3,123456
```

JMeter 结构：

```
Thread Group
├ CSV Data Set Config
└ HTTP Request (Login)
```

请求参数：

```json
{
  "username": "${username}",
  "password": "${password}"
}
```

运行压测时：

```
用户 1 登录
用户 2 登录
用户 3 登录
```

每个线程都会使用不同数据。

---

## 十、参数化常见问题

### 数据不够

如果压测：

```
1000 线程
```

但 CSV 只有：

```
100 条数据
```

就会重复使用数据。

解决方案：

```
准备足够数据
```

例如：

```
10000 用户
```

---

### 数据冲突

例如：

多个线程同时使用同一个订单 ID。

解决方案：

```
生成随机 ID
```

例如：

```
${__UUID()}
```

---

## 十一、总结

参数化是性能测试中非常重要的一项技术。

常见参数化方式：

* CSV 数据文件
* 变量
* JMeter 函数

企业压测通常使用：

```
CSV Data Set Config
```

来模拟真实用户数据。

掌握参数化后，就可以模拟：

* 大量用户
* 不同订单
* 不同商品

这也是进行真实业务压测的重要基础。

---

## 上一篇 | 下一篇

📖 [JMeter 核心组件详解](/zh/docs/perf-jmeter-components/) | 📖 [业务压测设计](/zh/docs/perf-business-design/)
