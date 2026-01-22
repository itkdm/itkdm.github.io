---
title: "Rust 概览"
order: 10
section: "服务端"
lang: "zh"
slug: "rust-overview"
summary: "零成本抽象与内存安全并存的系统级语言，适合高性能与高可靠场景。"
topic: "Rust"
icon: "🦀"
toc: true
updated: 2026-01-14
---

Rust 主打 **内存安全 + 高性能**，常用于：

- 网络服务：异步框架（Tokio、Actix）支撑高并发
- 系统工具 / CLI：体积小、启动快
- 嵌入式 / WebAssembly：运行时开销极低

对比 Java：
- 没有 GC，需要显式“所有权/借用”模型
- 二进制部署简单，启动快，内存占用低
- 学习曲线更陡，但性能与安全性回报高

