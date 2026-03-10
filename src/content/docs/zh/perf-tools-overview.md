---
title: "压测工具概览"
order: 5
section: "性能测试"
topic: "压测工具"
lang: "zh"
slug: "perf-tools-overview"
summary: "主流压测工具对比与选型指南，包括 JMeter、k6、Gatling、Locust、wrk。"
icon: "🛠️"
featured: true
toc: true
updated: 2026-03-10
---

## 一、为什么需要压测工具

在性能测试中，我们需要模拟大量用户访问系统。如果依靠人工测试，很难模拟高并发场景。

例如：

```
1000 个用户同时访问系统
5000 QPS 请求
```

人工测试几乎无法完成，因此需要借助 **性能测试工具** 来模拟真实用户行为。

压测工具通常具备以下能力：

* 模拟大量并发用户
* 自动发送 HTTP 请求
* 统计响应时间
* 统计吞吐量
* 生成性能报告

通过这些工具，可以更真实地评估系统性能。

---

## 二、常见压测工具

目前常见的性能测试工具包括：

* JMeter
* k6
* Gatling
* Locust
* wrk

这些工具各有特点，适用于不同场景。

---

## 三、JMeter

### 简介

JMeter 是 Apache 开源的性能测试工具，也是企业中使用最广泛的压测工具之一。

JMeter 主要用于：

* Web API 压测
* 数据库压测
* Web 应用性能测试

### 优点

* 开源免费
* 功能丰富
* 支持 GUI 操作
* 支持多种协议（HTTP、FTP、JDBC 等）

### 缺点

* 资源消耗较高
* 在超大规模压测时性能有限
* GUI 模式下容易占用大量内存

### 适用场景

JMeter 非常适合：

* 中小规模系统压测
* 接口性能测试
* 企业内部系统压测

---

## 四、k6

### 简介

k6 是 Grafana 推出的现代化性能测试工具。

k6 使用 **JavaScript 编写测试脚本**，非常适合开发人员使用。

### 优点

* 轻量级
* 脚本简单
* 性能高
* 支持云压测

### 示例脚本

```javascript
import http from "k6/http";

export default function () {
  http.get("https://example.com/api");
}
```

### 适用场景

k6 适合：

* API 压测
* CI/CD 自动化测试
* DevOps 场景

---

## 五、Gatling

### 简介

Gatling 是一个高性能压测工具，使用 **Scala DSL** 编写测试脚本。

很多互联网公司在大规模压测中使用 Gatling。

### 优点

* 性能高
* 资源消耗低
* 报告可视化很好

### 示例脚本

```scala
scenario("API Test")
  .exec(http("request")
    .get("/api/test"))
```

### 适用场景

Gatling 非常适合：

* 大规模 API 压测
* 微服务系统测试

---

## 六、Locust

### 简介

Locust 是一个基于 Python 的性能测试工具。

Locust 的特点是 **用 Python 编写压测脚本**。

### 示例

```python
from locust import HttpUser, task

class User(HttpUser):
    @task
    def test_api(self):
        self.client.get("/api/test")
```

### 优点

* 使用 Python 编写脚本
* 易于扩展
* 支持分布式压测

### 适用场景

Locust 适合：

* Python 技术栈团队
* 复杂业务逻辑压测

---

## 七、wrk

### 简介

wrk 是一个轻量级 HTTP 压测工具。

wrk 主要用于：

* HTTP 服务性能测试
* 快速压测

### 示例

```bash
wrk -t12 -c400 -d30s http://example.com/api
```

参数说明：

* t：线程数
* c：并发连接数
* d：压测时间

### 优点

* 性能极高
* 非常轻量
* 适合快速测试

### 缺点

* 功能较简单
* 不适合复杂业务场景

---

## 八、压测工具对比

| 工具 | 语言 | 特点 | 适用场景 |
| ------- | ---------- | ---- | ------------ |
| JMeter | Java | 功能全面 | 企业常用压测 |
| k6 | JavaScript | 轻量现代 | DevOps / API |
| Gatling | Scala | 高性能 | 大规模压测 |
| Locust | Python | 易扩展 | Python 团队 |
| wrk | C | 极高性能 | HTTP 基准测试 |

---

## 九、企业常见工具选择

在实际企业中，常见的工具组合如下：

**中小型企业：**

```
JMeter
```

**互联网公司：**

```
JMeter + wrk
```

**DevOps 团队：**

```
k6
```

**Python 技术团队：**

```
Locust
```

**大规模性能测试：**

```
Gatling
```

---

## 十、总结

常见性能测试工具包括：

* JMeter
* k6
* Gatling
* Locust
* wrk

不同工具适用于不同场景：

* **JMeter**：最常见企业工具
* **k6**：现代化 API 压测工具
* **Gatling**：高性能压测工具
* **Locust**：Python 编写压测脚本
* **wrk**：轻量 HTTP 压测工具

在企业实践中，可以根据项目规模和技术栈选择合适的工具。

---

## 上一篇 | 下一篇

📖 [如何分析压测结果](/zh/docs/perf-result-analysis/) | 📖 [JMeter 企业级实践](/zh/docs/perf-jmeter-enterprise/)
