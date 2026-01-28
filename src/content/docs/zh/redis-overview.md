---
title: "Redis 概览"
order: 3
section: "数据库"
lang: "zh"
summary: "高性能内存数据库，适合缓存、排行榜、会话和分布式协调。"
icon: "🧱"
topic: "Redis"
toc: true
updated: 2026-01-14
---

Redis 以 **内存存储、读写高性能、丰富数据结构** 著称：

- 常用数据结构：String、Hash、List、Set、Sorted Set、Stream
- 典型场景：缓存、会话、排行榜、计数器、消息队列（轻量场景）
- 持久化：AOF、RDB，可平衡性能与数据安全
- 高可用与扩展：主从复制、哨兵、Cluster 分片

实践建议：
- 结合过期时间与淘汰策略，避免缓存雪崩/穿透/击穿
- 合理使用 pipeline 与批量操作，减少 RTT
- 对关键命令设定超时，避免阻塞

