---
title: "MySQL 锁机制入门"
date: 2025-09-16T15:15:57+08:00
tags: ["MySQL", "锁", "并发控制", "数据库", "InnoDB"]
summary: "这篇文章从零开始讲解 MySQL 锁机制，涵盖表锁、行锁、记录锁、间隙锁和临键锁，适合作为理解 InnoDB 并发控制的入门文章。"
lang: "zh"
slug: "mysql-locks-explained-for-beginners"
draft: false
---

# 零基础也能懂的 MySQL 锁

## 💡 为什么 MySQL 需要锁？

1. 1. **生活类比：共享资源**

想象一下，你和室友住在一个宿舍，桌上只有一本《高数教材》。

- 如果大家同时去翻这本书，一个人写笔记、另一个人撕掉一页、第三个人又在画重点，结果会乱成一锅粥。
- 于是宿舍长规定：谁要看书，就得“锁”一下，不然大家一起动手，书就废了。

👉 这就是数据库里**锁的意义**：当很多人（并发事务）同时操作同一份数据（共享资源）时，必须有个秩序，否则结果就不可控。

---

1. 2. **数据库的实际问题**

在 MySQL 里，如果没有锁，可能会发生以下情况：

- **数据被同时修改**  
  两个用户几乎同时给同一个商品下单，库存是 1，本来只能卖给一个人，结果没锁就都减掉了，库存成了 -1。
- **数据读取不一致**  
  一个用户正在统计班级人数，另一个用户刚好在删除学生，读到的数据前后不一样。
- **破坏事务的隔离性**  
  MySQL 事务强调 “ACID”，其中 I 是 **Isolation（隔离性）**，锁就是实现它的手段。

今天这篇文章，就带大家全面吃透InnoDB锁机制，从底层原理再到实战优化，通俗易懂，一文讲透！

## 认识锁

**MySQL 的锁**，本质上就是一种并发控制手段。它通过限制事务对数据的读写权限，保证了在高并发场景下数据的正确性与一致性。

**锁的分类**

| 分类维度 | 锁类型 | 说明 |
| --- | --- | --- |
| 操作类型 | 共享锁 (S) | 多事务可读，不能写 |
|  | 排他锁 (X) | 独占读写 |
| 粒度 | 表级锁 | 开销小，并发差 |
|  | 行级锁 | 开销大，并发好 |
|  | 页级锁 | MySQL 很少用 |
| 使用方式 | 乐观锁 | 更新时检查版本 |
|  | 悲观锁 | 访问前先加锁 |

## 表级锁

在 MySQL 中，**表级锁（Table-level Lock）** 是一种锁定整张表的机制。它是 MySQL 中开销最小但并发度最低的锁类型。

### 表级锁的特点

- **锁定对象**：整张表。
- **开销**：加锁与释放的开销小，适合读多写少的场景。
- **并发度**：低。因为一个事务占用锁时，其他事务无法同时对该表做相关操作。

### 表级锁的分类

**表读锁（Table Read Lock）**

- 允许多个会话同时读表。
- 不允许任何写操作。

**表写锁（Table Write Lock）**

- 事务独占整个表。
- 期间，其他事务既不能读，也不能写。

### 代码实现

1. 1. 加锁语法

```
-- 给表加只读锁（共享锁）  
LOCK TABLES table_name READ;  
  
-- 给表加写锁（排他锁）  
LOCK TABLES table_name WRITE;
```

1. 2. 解锁语法

```
-- 释放当前会话的所有表锁  
UNLOCK TABLES;
```

1. 3. 示例

```
-- 用户 A  
LOCK TABLES students WRITE;   -- 加写锁  
UPDATE students SET age = 21 WHERE id = 1;  
  
-- 用户 B  
SELECT * FROM students;       -- 会被阻塞，直到用户 A UNLOCK
```

### 实际使用场景

**MyISAM 引擎**：主要使用表级锁，锁粒度粗，**InnoDB 引擎**：默认使用行级锁。

#### 批量数据操作

当需要一次性更新、删除、插入大量数据时，为了避免锁开销过大，可能会直接加表级锁：

```
LOCK TABLES orders WRITE;  
UPDATE orders SET status = 'archived' WHERE created_at < '2022-01-01';  
UNLOCK TABLES;
```

#### DDL 操作

对表结构的修改（`ALTER TABLE`、`DROP TABLE`、`CREATE INDEX` 等），MySQL 会自动加表级锁，避免结构和数据同时被改乱。

\*\*企业应用中：\*\*表级锁更多是“数据库自己用”，DBA 或开发者手动去加表锁的情况极少。

## 行级锁

**行级锁（Row-level Lock）** 是指对数据库表中的某一行或多行记录加锁。  
 它是 InnoDB 存储引擎最常用的锁机制，可以在保证数据一致性的同时，提升并发性能。

### 行级锁的特点

- **锁定范围小**：只针对具体的行，而不是整个表。
- **并发性能高**：多个事务可以同时操作不同的行，互不影响。
- **开销大**：比表锁更复杂，需要更多系统资源来管理。
- **可能出现死锁**：不同事务相互等待对方释放行锁。

### 行级锁分类

| 锁类型 | 锁定记录 | 锁定间隙 | 典型场景 |
| --- | --- | --- | --- |
| 记录锁 | ✔ | ✘ | 唯一索引等值命中 |
| 间隙锁 | ✘ | ✔ | 范围查询，防止插入 |
| 临键锁 | ✔ | ✔ | 非唯一索引等值 / 范围查询 |

- **记录锁（Record Lock）**：就像你在某个座位上贴了“已占用”，别人不能坐这张椅子（= 锁定具体的一行记录）。
- **间隙锁（Gap Lock）**：不光是你的椅子，你还在椅子前后各拉了一条警戒线，别人不能在你旁边新放一张桌椅（= 锁定某行和某行之间的空隙，禁止插入）。
- **邻键锁（Next-Key Lock）**：你不仅锁了座位（记录），还顺带把前后的警戒线一起锁了（= 记录锁 + 间隙锁）。这是 InnoDB 默认的锁方式，用来防止“幻读”。

👉 打个比方：

- 记录锁 = “占座”。
- 间隙锁 = “不许在我周围摆新桌子”。
- 邻键锁 = “占座 + 禁止别人插新桌子”。

### 记录锁

**定义**：**直接锁定索引中的某一条具体记录**，是粒度最细的行级锁，仅影响被锁定的行。

**触发条件**

- 使用 **主键/唯一索引** 进行 **等值查询**，并显式加锁：

+ • `FOR UPDATE`（排他锁）
+ • `LOCK IN SHARE MODE`（共享锁）

- 命中的是**已存在的记录**。

示例代码

```
-- 针对 users 表，主键 id=10 等值查询并加排他锁  
SELECT * FROM users WHERE id = 10 FOR UPDATE;
```

代码注解

1. 1. `id = 10`：条件命中主键索引，能精准定位到单行。
2. 2. `FOR UPDATE`：显式加排他锁，其他事务不能修改 id=10 这行，也不能对它再加排他锁。
3. 3. 若条件未走索引（比如用 `name='Tom'`，而 name 无索引），会触发全表扫描，记录锁退化为 **表锁**，严重影响并发。

实现机制

- InnoDB 通过索引直接定位目标行，只对该记录加锁。
- 没有索引时，只能扫描整表 → 给每一行都加锁 → 等价于锁全表。

### 间隙锁

定义

**间隙锁**指锁定 **索引记录之间的间隙区间**，而不是具体某一条记录。

- 区间遵循 **左开右开**的规则，例如 `(20,30)` 表示锁定 20 和 30 之间的间隙，但不包含 20 和 30 本身。
- 锁住间隙后，其他事务就不能在该区间内插入新行。

---

触发条件

1. 1. 使用 **非唯一索引** 做 **范围查询**（`BETWEEN`、`>`、`<` 等），并显式加锁：

- `FOR UPDATE`（排他锁）
- `LOCK IN SHARE MODE`（共享锁）

2. 2. 隔离级别必须是 **REPEATABLE READ（可重复读）**，在 **READ COMMITTED** 下通常不会触发。

---

示例代码

```
-- 针对 users 表的 age 字段（假设 age 有普通索引）  
-- 查询 20-30 之间的数据并加排他锁  
SELECT * FROM users WHERE age BETWEEN 20 AND 30 FOR UPDATE;
```

---

代码注解

1. 1. `age BETWEEN 20 AND 30`：条件使用了 **普通索引**，并且是范围查询，因此触发间隙锁。
2. 2. `FOR UPDATE`：显式添加排他锁，使得间隙锁真正生效。
3. 3. 若隔离级别不是 **RR**（REPEATABLE READ）（例如 `READ COMMITTED`），则不会触发间隙锁，查询只会锁定已存在的记录。

---

核心作用

👉 **防止其他事务在间隙中插入新数据，从根本上解决幻读问题。**

比如上面的 SQL 执行后：

- 事务 A 持有 `(20,30)` 的间隙锁；
- 此时事务 B 试图执行：

  ```
  INSERT INTO users (id, age) VALUES (101, 22);  -- 被阻塞  
  INSERT INTO users (id, age) VALUES (102, 25);  -- 被阻塞
  ```
- 因为 `22、25` 落在 `(20,30)` 区间内，都会被间隙锁阻止，直到事务 A 提交或回滚。

### 邻键锁

定义

**邻键锁** = **记录锁 + 间隙锁** 的组合。

- 它既锁定某条具体记录，又锁定该记录前面的间隙。
- 区间遵循 **左开右闭** 规则，例如 `(15,20]` 表示锁住 `(15,20)` 这个间隙和 `id=20` 这条记录。

---

触发条件

1. 1. 在 **REPEATABLE READ 隔离级别** 下；
2. 2. 使用索引进行 **范围查询**（如 `>`, `<`, `>=` 等），并显式加锁：

- `FOR UPDATE`（排他锁）
- `LOCK IN SHARE MODE`（共享锁）

3. 3. InnoDB 默认会使用 **邻键锁** 来防止幻读。

---

示例代码 1：范围查询（主键索引）

```
-- 针对 users 表的主键 id，查询 id > 15 的数据并加锁  
SELECT * FROM users WHERE id > 15 FOR UPDATE;
```

代码注解

1. 1. `id > 15`：条件命中主键（唯一索引），但这是范围查询。
2. 2. `FOR UPDATE`：显式排他锁，使 InnoDB 使用邻键锁。
3. 3. 假设表中有 `id=15, 20, 25`：

- 锁定范围 = `(15,20]`（间隙 + 20 这条记录）
- `(20,25]`（间隙 + 25 这条记录）
- `(25,+∞)`（间隙）

也就是说，不仅把 `20、25` 锁住，还把它们前面的区间都锁住了，别人无法插入 `id=16、18、22` 这样的新行。

---

示例代码 2：非唯一索引等值查询

```
-- sku 字段为普通索引（可能有重复值）  
SELECT * FROM products WHERE sku = 100 FOR UPDATE;
```

代码注解

- 对 `sku=100` 的所有记录加 **记录锁**；
- 同时锁住 `(前一个sku,100]` 的 **间隙**；
- 因此其他事务无法插入新的 `sku=100` 记录，也不能在它前面区间插入相邻的值。

**验证**（两会话）：

- **Session A** 执行上面的 SQL 并未提交；
- **Session B** 尝试：

  ```
  INSERT INTO products (id, sku, price) VALUES (101, 100, 50); -- 被阻塞  
  INSERT INTO products (id, sku, price) VALUES (102, 99, 20);  -- 可能也被阻塞，取决于区间锁范围
  ```

---

示例代码 3：范围更新

```
-- 把年龄在 20-30 岁的用户都加锁  
SELECT * FROM users WHERE age BETWEEN 20 AND 30 FOR UPDATE;
```

代码注解

- 假设 `age` 上有二级索引：

+ • 邻键锁会覆盖 `(20,25]`、`(25,28]`、`(28,30]` 等区间 + 对应记录。

- 其他事务想插入 `age=22, 29` 的新行会被阻塞，确保当前事务看到的结果集稳定，不会发生幻读。

---

默认行为

- 在 **REPEATABLE READ 隔离级别** 下，InnoDB 默认使用 **邻键锁** 来保证事务的可重复读。
- 这种锁定方式确保：

1. 1. 范围内的已有记录不能被修改或删除；
2. 2. 范围内不能插入新的数据（避免幻读）。

---

核心作用

👉 **邻键锁保证“读到的范围”在整个事务期间都不变。**

例如：

- 事务 A 执行 `SELECT * FROM users WHERE id > 15 FOR UPDATE;`
- 在事务 A 提交前：

+ • 事务 B **不能修改** id=20,25 的记录；
+ • 事务 B **不能插入** id=16,17,22 的新行；

- 这样事务 A 下次再查询时，结果集和之前一致，不会出现幻影数据。

## 索引类型对锁范围的影响

索引类型（唯一索引 / 非唯一索引）会直接决定 **锁的范围**。同样一条 SQL，在不同索引下可能触发 **记录锁、间隙锁或邻键锁**，这是并发优化时必须掌握的重点。

---

测试环境

表结构：

```
CREATE TABLE accounts (  
    acc_id INT PRIMARY KEY,        -- 主键：账户唯一标识（唯一索引，保证每条记录唯一）  
    balance INT NOT NULL,          -- 账户余额（必填，不允许为 NULL）  
    level   INT NOT NULL,          -- 用户等级（必填，不允许为 NULL）  
    KEY idx_level (level)          -- 普通索引：加速基于 level 的查询（非唯一，可能多个用户同级）  
);
```

数据分布：

| acc\_id | balance平衡 | level水平 |
| --- | --- | --- |
| 1 | 500 | 1 |
| 2 | 800 | 2 |
| 3 | 1200 | 2 |
| 4 | 1500 | 3 |

03.1 场景1：等值查询（非唯一索引）

执行 SQL：

```
SELECT * FROM accounts WHERE level = 2 FOR UPDATE;
```

加锁逻辑

- **非唯一索引 idx\_level**：

+ • 锁住 `level=2` 的所有行（acc\_id=2,3）；
+ • 锁住 `(1,2)` 和 `(2,3)` 两个间隙，防止插入新的 `level=2`。

- **主键 acc\_id**：

+ • 对 acc\_id=2 和 acc\_id=3 加记录锁。

实际效果

- 事务 B 尝试 `INSERT INTO accounts VALUES(5,1000,2);` 会被阻塞；
- 但 `INSERT INTO accounts VALUES(6,2000,4);` 可以成功，因为不在锁范围。

📌 **对比唯一索引**：如果 `level` 是唯一索引，则只会锁住一条记录，不需要额外的间隙锁。

---

03.2 场景2：范围查询（主键索引）

执行 SQL：

```
SELECT * FROM accounts WHERE acc_id >= 2 FOR UPDATE;
```

加锁逻辑

- **主键 acc\_id（唯一索引）**：

+ • 锁住 `(1,2]`（间隙 + acc\_id=2）
+ • 锁住 `(2,3]`（间隙 + acc\_id=3）
+ • 锁住 `(3,4]`（间隙 + acc\_id=4）
+ • 锁住 `(4,+∞)`（大于4的间隙）

实际效果

- 事务 B 不能插入 `acc_id=2.5`、`acc_id=5` 这样的记录；
- 不能修改 acc\_id=2,3,4 的行；
- 确保事务 A 在本次事务期间，多次执行相同 SQL，结果集不会变化（防幻读）。

---

三种行级锁的核心区别

| 锁类型 | 锁定记录 | 锁定间隙 | 适用场景 |
| --- | --- | --- | --- |
| 记录锁 | ✔ | ✘ | 唯一索引等值命中 |
| 间隙锁 | ✘ | ✔ | 范围查询 / 唯一等值未命中 |
| 邻键锁 | ✔ | ✔ | 非唯一索引等值 / 范围查询 |

👉 通俗比喻：

- 记录锁：占住椅子；
- 间隙锁：拦住椅子之间的空位；
- 邻键锁：椅子和空位一起拦。

---

03.4 锁冲突示例（死锁演示）

```
-- 事务1  
BEGIN;  
SELECT * FROM accounts WHERE level = 2 FOR UPDATE;  
  
-- 事务2  
BEGIN;  
SELECT * FROM accounts WHERE level = 2 FOR UPDATE;  
  
-- 事务1 或 事务2 继续插入同一范围的数据  
INSERT INTO accounts VALUES (7, 900, 2);
```

说明

1. 1. 事务1 已经锁住 `level=2` 的记录 + 间隙；
2. 2. 事务2 执行相同 SQL 时，会被阻塞；
3. 3. 当其中一个事务尝试插入 `level=2`，会形成循环等待；
4. 4. InnoDB 会自动检测死锁，回滚代价较小的事务，释放锁资源。

## 锁监控与优化策略

在高并发业务中，**锁冲突** 会导致 SQL 阻塞、事务等待甚至死锁，从而直接拖慢系统性能。  
 👉 因此，必须学会 **监控锁状态** + **优化加锁方式**。

### 监控锁状态

#### SHOW ENGINE INNODB STATUS

MySQL 自带命令，能快速查看 InnoDB 的锁情况。

```
SHOW ENGINE INNODB STATUS\G
```

输出重点关注两块：

- **LATEST DETECTED DEADLOCK**：最近一次死锁详情
- **TRANSACTIONS**：当前事务和持有锁的情况

---

#### Performance Schema 表（推荐方式）

MySQL 5.7+ 推荐使用 **performance\_schema** 系统表。

- 当前锁：

```
SELECT * FROM performance_schema.data_locks;
```

- 锁等待：

```
SELECT * FROM performance_schema.data_lock_waits;
```

📌 `data_locks` 显示谁持有锁，`data_lock_waits` 显示谁在等谁。

---

#### information\_schema 辅助查询

更直观地看到 **阻塞关系**：

```
SELECT  
    r.trx_id waiting_trx,  
    r.trx_mysql_thread_id waiting_thread,  
    b.trx_id blocking_trx,  
    b.trx_mysql_thread_id blocking_thread,  
    r.trx_query waiting_query  
FROM information_schema.innodb_lock_waits w  
JOIN information_schema.innodb_trx b ON w.blocking_trx_id = b.trx_id  
JOIN information_schema.innodb_trx r ON w.requesting_trx_id = r.trx_id;
```

👉 输出能直接告诉你：**哪个事务正在等待，哪个事务在阻塞**。

---

💻 实战示例

假设我们有一张 `accounts` 表：

```
CREATE TABLE accounts (  
    acc_id INT PRIMARY KEY,  
    balance INT NOT NULL,  
    level   INT NOT NULL  
);
```

会话 A

```
BEGIN;  
UPDATE accounts SET balance = balance - 100 WHERE acc_id = 1;  
-- 未提交
```

会话 B

```
UPDATE accounts SET balance = balance - 50 WHERE acc_id = 1;  
-- 被阻塞
```

此时执行监控 SQL，就能看到：

- 会话 B 在 **等待锁**
- 会话 A 正在 **持有锁**

这就是典型的行锁阻塞。

#### 锁优化策略

🚦 1. 走索引，减少锁范围

- **不走索引 = 扫全表 + 全表锁**
- **走索引 = 精准命中行锁**

```
-- ❌ 没索引，可能锁住整张表  
UPDATE accounts SET level=2 WHERE balance=1000;  
  
-- ✅ 有索引，只锁一行  
UPDATE accounts SET level=2 WHERE acc_id=100;
```

👉 **建议**：关键字段都要建索引（特别是 WHERE 条件里高频使用的字段）。

---

#### ⏳ 2. 缩短事务时间

事务越长，锁持有时间越久，别人就得等。

```
-- ❌ 不好：事务里夹杂耗时逻辑  
BEGIN;  
UPDATE accounts SET balance=balance-100 WHERE acc_id=1;  
DO SLEEP(10); -- 业务逻辑延迟  
COMMIT;  
  
-- ✅ 好：事务只做必要的 SQL  
-- 外部先处理逻辑  
BEGIN;  
UPDATE accounts SET balance=balance-100 WHERE acc_id=1;  
COMMIT;
```

👉 **建议**：事务里只保留核心 SQL，业务逻辑放在外面。

#### 🎯 4. 优先使用唯一索引

- **唯一索引**：直接定位到行 → 锁范围最小
- **普通索引**：可能触发间隙锁 → 锁范围更大

```
-- 唯一索引，只锁定一条记录  
SELECT * FROM accounts WHERE acc_id=100 FOR UPDATE;  
  
-- 普通索引，锁定范围 [20,30)  
SELECT * FROM accounts WHERE level=2 FOR UPDATE;
```

👉 **建议**：高并发更新场景，优先考虑 **唯一索引**。

#### 修改隔离级别

默认情况下，InnoDB 使用 **REPEATABLE READ** 隔离级别。  
 此时会触发 **间隙锁 / 临键锁**，不仅锁住记录，还会锁住记录之间的区间，容易导致插入阻塞。

如果业务能容忍 **幻读**（如统计类查询、报表业务），可以调整为 **READ COMMITTED**，此时只会使用 **记录锁**，锁冲突大幅减少。

```
-- 会话级别调整  
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;  
  
-- 全局调整  
SET GLOBAL TRANSACTION ISOLATION LEVEL READ COMMITTED;
```

对比示例

**REPEATABLE READ（默认）：**

```
-- 会话 A  
BEGIN;  
SELECT * FROM accounts WHERE acc_id BETWEEN 10 AND 20 FOR UPDATE;  
  
-- 会话 B  
INSERT INTO accounts VALUES(15,100,1);  
-- ❌ 被阻塞：间隙锁生效
```

**READ COMMITTED：**

```
-- 会话 A  
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;  
BEGIN;  
SELECT * FROM accounts WHERE acc_id BETWEEN 10 AND 20 FOR UPDATE;  
  
-- 会话 B  
INSERT INTO accounts VALUES(15,100,1);  
-- ✅ 成功插入：仅记录锁
```

👉 **建议**：

- **适合**：统计类查询、允许幻读的业务
- **不适合**：金融交易、转账结算等强一致性场景
- **技巧**：推荐只在 **会话级别** 调整，而不是全局修改

## 锁机制与隔离级别

| 隔离级别 | 锁策略 | 幻读风险 |
| --- | --- | --- |
| **READ UNCOMMITTED** | 无锁（允许脏读） | ✅ 存在 |
| **READ COMMITTED** | 记录锁为主（无间隙锁） | ✅ 存在 |
| **REPEATABLE READ** | 临键锁（记录锁 + 间隙锁，MySQL 默认） | ❌ 不存在 |
| **SERIALIZABLE** | 全表锁（悲观锁，所有读都转写锁） | ❌ 不存在 |

隔离级别越高，锁得越多，幻读风险越低；隔离级别越低，并发性能越好，但一致性差。
