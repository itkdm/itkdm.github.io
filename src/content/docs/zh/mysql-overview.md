---
title: "MySQL 基础概览"
order: 1
section: "数据库"
lang: "zh"
summary: "主流开源关系型数据库，事务、索引与查询优化的入门速览。"
icon: "🐬"
topic: "MySQL"
toc: true
updated: 2026-01-14
---

MySQL 以 **易用、社区活跃、生态完善** 著称，常用于：

- 业务数据库：电商、内容、支付等 OLTP 场景
- 数据仓库前置：与 ETL/数据中台配合

关键知识点：

- 存储引擎：InnoDB（事务、行级锁、MVCC）
- 索引：B+ 树索引、覆盖索引、联合索引
- 查询优化：`EXPLAIN`、慢查询日志、合理的分页/排序策略
- 事务隔离：默认 RR（Repeatable Read），理解幻读与 Next-Key Lock

