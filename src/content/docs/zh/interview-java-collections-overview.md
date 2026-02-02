---
title: "Java 集合概览"
order: 1
section: "面试"
topic: "Java集合"
lang: "zh"
summary: "聚焦 Java 集合框架在真实面试中的高频问题与追问路径，帮你系统梳理核心考点。"
icon: "📚"
featured: true
toc: true
updated: 2026-02-02
---

本系列聚焦 **Java 集合框架相关的真实面试题**，典型考察内容包括：

- `List / Set / Map` 的核心区别与常见实现（`ArrayList`、`LinkedList`、`HashSet`、`HashMap` 等）
- `HashMap` 的底层结构演进（数组 + 链表 / 红黑树）、扩容机制、负载因子
- `ConcurrentHashMap` 的分段锁 / CAS / 红黑树等并发设计要点
- 有序与排序：`TreeMap` / `TreeSet` 与 `Comparable` / `Comparator`
- 线程安全集合：`Collections.synchronizedXxx`、`CopyOnWriteArrayList` 等的适用场景与代价

后续会在本「Java集合」小分类下按主题继续扩展，例如：

- 只聊 `HashMap`：从 JDK7 到 JDK8 的实现差异与常见面试追问
- 常见集合性能对比与选型题（为什么用 `ArrayList` 而不是 `LinkedList`？）
- 并发场景下集合使用的坑与最佳实践

建议搭配阅读「真实面试题」总览篇，一起从 **宏观结构 + 专题深挖** 的角度提升答题思路。

