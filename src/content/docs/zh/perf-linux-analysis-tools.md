---
title: "Linux性能分析工具"
order: 19
section: "性能测试"
topic: "性能分析"
lang: "zh"
slug: "perf-linux-analysis-tools"
summary: "掌握 top、vmstat、iostat、sar 等基础工具，用系统视角判断 CPU、内存和 IO 是否成为瓶颈。"
icon: "🐧"
featured: false
toc: true
updated: 2026-03-14
---

# Linux性能分析工具

## 一、为什么后端工程师要会看 Linux 指标

压测出现问题时，第一反应不应该总是看代码。

因为很多问题先体现在系统层：

* CPU 是否打满
* 内存是否紧张
* 磁盘 IO 是否过高
* 网络是否拥塞

而这些问题，最直接的入口就是 Linux 工具。

---

## 二、最常用的几类工具

后端压测分析里，最常用的工具其实不多：

* `top`
* `vmstat`
* `iostat`
* `sar`
* `ss` 或 `netstat`

先把这几个掌握，已经能覆盖大部分场景。

---

## 三、top：先看整体资源情况

`top` 是最常见的入口。

你主要看：

* CPU 使用率
* load average
* 内存占用
* 进程 CPU 排名

### 重点理解

* `us`：用户态 CPU
* `sy`：内核态 CPU
* `id`：空闲 CPU
* `wa`：IO wait

如果：

```text
wa 很高
```

说明不一定是 CPU 不够，也可能是磁盘 IO 慢。

---

## 四、vmstat：看系统节奏

`vmstat` 更适合观察系统整体状态变化。

常用命令：

```bash
vmstat 1
```

重点看：

* `r`：等待 CPU 的进程数
* `si/so`：是否在交换内存
* `wa`：IO 等待

### 判断思路

* `r` 很高：CPU 可能紧张
* `si/so` 不为 0：内存压力大
* `wa` 很高：IO 可能是瓶颈

---

## 五、iostat：看磁盘 IO

当你怀疑数据库、日志、落盘存在问题时，`iostat` 很有用。

常用命令：

```bash
iostat -x 1
```

重点看：

* `%util`：磁盘利用率
* `await`：IO 等待时间
* `r/s`、`w/s`：读写次数

### 简单判断

如果：

```text
%util 接近 100%
await 很高
```

那就说明磁盘压力已经很大。

---

## 六、sar：看历史趋势

有些问题不是瞬时出现，而是持续变化。

例如：

* 某个时间段 CPU 突然升高
* 网络流量在高峰时飙升

这时 `sar` 比 `top` 更适合看趋势。

例如：

```bash
sar -u 1
sar -n DEV 1
sar -r 1
```

可以分别看：

* CPU
* 网络
* 内存

---

## 七、网络连接也要看

有时候瓶颈不是 CPU，也不是 DB，而是连接数。

例如：

* 短连接过多
* TIME_WAIT 太多
* 某端口连接堆积

可以用：

```bash
ss -s
ss -ant
```

重点观察：

* 连接总数
* 各状态连接数

---

## 八、一个简单排查流程

假设压测时 RT 突然升高，你可以这样看：

1. 用 `top` 看 CPU 和 load
2. 用 `vmstat` 看是否 IO wait 或 swap
3. 用 `iostat` 看磁盘是否打满
4. 用 `ss` 看连接数是否异常

这样几分钟内就能大致知道：

* 是 CPU 问题
* 是内存问题
* 是 IO 问题
* 还是连接问题

---

## 九、Java 后端工程师最常见的误区

### 1. 只看 CPU

CPU 不高，不代表系统没问题。

### 2. 不看 `wa`

很多人看到 CPU 空闲就放心了，但 IO wait 很高时，系统一样很慢。

### 3. 不结合应用指标

Linux 工具只能告诉你系统层现象，最终还要结合：

* JVM
* SQL
* Redis

一起看。

---

## 十、总结

Linux 工具的价值在于：

* 帮你快速判断问题属于哪一层
* 帮你缩小排查范围

对 Java 后端工程师来说，不需要一开始掌握很多命令。  
先熟练使用：

* `top`
* `vmstat`
* `iostat`
* `sar`

已经能解决大部分压测排查问题。

