---
title: "Go 概览"
order: 20
section: "服务端"
lang: "zh"
summary: "语法简洁、并发模型直观，适合云原生与微服务的工程实践。"
topic: "Go"
icon: "Go"
toc: true
updated: 2026-01-14
---

Go（Golang）以 **简单、并发、快速交付** 著称：

- 并发模型：goroutine + channel，易于写出高并发服务
- 工具链内置：`go test`、`go fmt`、`go mod` 开箱即用
- 常见场景：API 网关、微服务、云原生组件（K8s / Docker 生态）

与 Java 对比：
- 语言特性更“极简”，学习快，上手快
- GC 存在，但暂停时间通常可接受
- 标准库网络/并发能力强，框架依赖少

