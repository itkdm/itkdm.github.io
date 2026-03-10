---
title: "JMeter 基础使用"
order: 6
section: "性能测试"
topic: "JMeter"
lang: "zh"
slug: "perf-jmeter-enterprise"
summary: "JMeter 安装配置、核心结构、创建第一个压测脚本、GUI 与命令行模式。"
icon: "⚡"
featured: false
toc: true
updated: 2026-03-10
---

## 一、JMeter 简介

JMeter 是 Apache 开源的性能测试工具，广泛用于 Web 应用和 API 接口的性能测试。

JMeter 的主要功能包括：

* 模拟大量用户请求
* 测试系统性能
* 统计响应时间
* 生成压测报告

JMeter 支持多种协议，例如：

* HTTP / HTTPS
* JDBC
* FTP
* TCP

在企业实践中，JMeter 最常用于：

```
API 接口压测
Web 系统性能测试
数据库性能测试
```

---

## 二、JMeter 安装

### 1. 下载

官方网站：

```
https://jmeter.apache.org
```

下载 Binary 版本即可。

例如：

```
apache-jmeter-5.x.zip
```

---

### 2. 解压

解压到任意目录，例如：

```
/opt/jmeter
```

---

### 3. 启动

进入 JMeter 的 bin 目录：

```
bin/jmeter
```

启动方式：

Linux / Mac：

```bash
./jmeter
```

Windows：

```
jmeter.bat
```

启动后会打开 **JMeter GUI 界面**。

---

## 三、JMeter 核心结构

JMeter 的测试结构通常如下：

```
Test Plan
└ Thread Group
  └ Sampler
  └ Listener
```

各组件作用：

| 组件 | 作用 |
| ------------ | ---- |
| Test Plan | 测试计划 |
| Thread Group | 并发用户 |
| Sampler | 请求定义 |
| Listener | 结果查看 |

---

## 四、创建第一个压测脚本

下面通过一个简单示例说明如何压测一个 API。

假设要压测接口：

```
GET /api/product/list
```

---

## 五、创建 Test Plan

启动 JMeter 后，默认会有一个：

```
Test Plan
```

Test Plan 是整个测试的入口。

通常可以在 Test Plan 中配置：

* 用户变量
* 测试描述
* 全局设置

---

## 六、添加线程组（Thread Group）

右键：

```
Test Plan → Add → Threads → Thread Group
```

Thread Group 用于模拟用户并发。

常见配置：

| 参数 | 说明 |
| ----------------- | ---- |
| Number of Threads | 用户数 |
| Ramp-Up Period | 启动时间 |
| Loop Count | 循环次数 |

示例：

```
线程数 = 100
Ramp-Up = 10 秒
Loop = 10
```

含义：

```
10 秒内逐渐启动 100 个用户
每个用户发送 10 次请求
```

---

## 七、添加 HTTP 请求

右键 Thread Group：

```
Add → Sampler → HTTP Request
```

配置示例：

| 参数 | 值 |
| ----------- | ----------------- |
| Method | GET |
| Server Name | example.com |
| Path | /api/product/list |

完整请求：

```
GET https://example.com/api/product/list
```

---

## 八、添加监听器（Listener）

监听器用于查看压测结果。

右键 Thread Group：

```
Add → Listener
```

常见 Listener：

* View Results Tree
* Summary Report
* Aggregate Report

推荐使用：

```
Aggregate Report
```

---

## 九、运行压测

点击 JMeter 工具栏：

```
Start
```

JMeter 会开始执行压测脚本。

此时可以在 Listener 中看到结果。

---

## 十、查看压测结果

在 **Aggregate Report** 中可以看到：

| 指标 | 含义 |
| ---------- | ------ |
| Samples | 请求数量 |
| Average | 平均响应时间 |
| Min | 最小响应时间 |
| Max | 最大响应时间 |
| Error % | 错误率 |
| Throughput | 吞吐量 |

例如：

| Samples | Avg | Error% | Throughput |
| ------- | ----- | ------ | ---------- |
| 1000 | 120ms | 0% | 800/sec |

说明：

```
平均响应时间 = 120ms
QPS ≈ 800
```

---

## 十一、GUI 模式与命令行模式

JMeter 有两种运行方式：

### GUI 模式

适用于：

```
编写脚本
调试脚本
```

但不适合大规模压测。

---

### 命令行模式

适用于：

```
正式压测
大规模测试
```

运行命令：

```bash
jmeter -n -t test.jmx -l result.jtl
```

参数说明：

| 参数 | 含义 |
| -- | ------ |
| -n | 非 GUI 模式 |
| -t | 测试脚本 |
| -l | 结果文件 |

---

## 十二、JMeter 使用注意事项

在实际压测中，需要注意以下问题：

### 1. 不要使用 GUI 模式压大流量

GUI 会占用大量资源。

推荐：

```
命令行模式
```

---

### 2. 压测机性能要足够

如果压测机 CPU 满了，压测结果会失真。

---

### 3. 真实业务场景

压测不应该只测试单接口，而应该模拟真实业务流程。

例如：

```
登录 → 浏览商品 → 下单
```

---

## 十三、总结

JMeter 是企业中最常见的性能测试工具。

基本使用流程：

1. 创建 Test Plan
2. 添加 Thread Group
3. 添加 HTTP Request
4. 添加 Listener
5. 执行压测
6. 分析结果

掌握 JMeter 基础使用，是进行性能测试的重要一步。

---

## 上一篇 | 下一篇

📖 [压测工具概览](/zh/docs/perf-tools-overview/) | 📖 [JMeter 核心组件详解](/zh/docs/perf-jmeter-components/)
