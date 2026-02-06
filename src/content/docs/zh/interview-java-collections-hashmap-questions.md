---
title: "HashMap 高频面试题"
order: 36
section: "面试"
topic: "Java集合"
lang: "zh"
slug: "interview-java-collections-hashmap-questions"
summary: "系统梳理与 HashMap 相关的高频面试题，从基础特性、底层结构、扩容与树化机制，到并发与 JDK 版本差异。"
icon: "❓"
featured: false
toc: true
updated: 2026-02-05
---

> 本文整理了与 **HashMap** 相关的常见面试题，适合作为在看完源码之后的复习清单。下面的问答均以 **JDK8 HashMap** 为主，必要时对比 JDK7。

---

## 1) HashMap 底层数据结构是什么？JDK7 / JDK8 有什么区别？

**答：**

- **JDK7：数组 + 链表**。桶（bucket）里用链表解决哈希冲突。
- **JDK8：数组 + 链表 + 红黑树**。当同一桶内链表过长时，可能树化为红黑树降低查找复杂度。
- 另一个重要差异：**JDK7 链表插入是头插**，JDK8 改为**尾插**（并且迁移/扩容实现也不同）。

---

## 2) put/get 的流程分别是什么？如何定位桶？为什么用 `(n-1)&hash`？

**答：**

- **put 流程（简化）：**
  1. 对 key 求 `hashCode()`，JDK8 做扰动：`h ^ (h >>> 16)` 得到 hash。
  2. 计算桶下标：`index = (n - 1) & hash`。
  3. 桶为空：直接放入。
  4. 桶不为空：遍历链表/树。若存在相同 key（hash 相同且 equals 相等）就覆盖 value；否则插入新节点（JDK8 尾插），必要时树化/扩容。
- **get 流程：**
  1. 同样计算 hash 与 index。
  2. 桶为空返回 null；桶不为空先比较首节点，再在链表/树中按规则查找匹配 key。
- **为什么 `(n-1)&hash`：**
  因为 `n` 是 2 的幂，`(n-1)` 的二进制低位全为 1，位与等价于对 `n` 取模但更快；也要求容量必须是 2 的幂。

### 2.1 为什么要对 hashCode 做“扰动运算”？

**答：**

- 直接使用用户的 `hashCode()`，很多类（尤其是自定义的）高位信息丰富（很多高位不同）但低位分布差（但是低位相同），容易集中在某些桶里。
- HashMap 用 `h ^ (h >>> 16)` 这种简单的高位扰动，把高 16 位信息“混”到低位，让**低位也更随机**，配合 `(n-1)&hash` 降低系统性冲突。
- 扰动逻辑本身很轻量（几次位运算），相对于一次数组访问的成本可以忽略，却能显著改善极端情况下的冲突表现。
- 其实可以理解为，高16位与低16位进行了一次异或。之所以用异或就是对0,1更加均衡，比如用或的话，之前低位是1，高位无论是什么都影响不了低位，比如用与，之前低位是0，那么此时高位无论是什么也都影响不了低位。

### 2.2 为什么一定要用 `(n-1)&hash` 而不是 `% n`？

**答：**

- 位与运算比取模 `%` 更快，这是直接的性能收益（尤其是早期 JDK/CPU 上更明显）。
- 由于容量 `n` 总是 2 的幂，`(n-1)` 的二进制是形如 `0b000111...111` 的低位掩码，`(n-1)&hash` 恰好等价于 `hash % n`。
- 同时这样配合高位扰动，可以在**实现简单**的前提下获得还不错的哈希分布效果。

### 2.3 为什么 HashMap 的容量必须是 2 的幂？

**答：**

- 为了让 `(n-1)&hash` 与 `% n` 完全等价，`n` 必须是 2 的幂，否则会丢弃某些组合导致分布不均。
- 扩容时从 `oldCap` 翻倍到 `newCap`，只需要看 `hash & oldCap` 这一位就能判断元素是留在原下标还是移动到 `index + oldCap`，不必重新取模计算，极大简化了迁移逻辑。
- 综上：**2 的幂** 是为了同时满足“高效寻址 + 简单扩容迁移 + 相对均匀分布”三个目标，是 HashMap 设计的基础假设之一。

---

## 3) 发生哈希冲突怎么处理？链表/红黑树分别怎么查找与插入？

**答：**

- 冲突表示多个 key 映射到同一桶。
- **链表：**顺序遍历，按“hash 相同且 equals”为同 key；没找到就插入（JDK8 尾插）。
- **红黑树：**在树中按规则定位（以 hash/可比较性/tie-breaker 等综合决定顺序）查找，插入后保持红黑树平衡，平均/最坏查找约为 **O(log n)**。

---

## 4) 判断 key 相等靠什么？`hashCode` 一样就一定相等吗？`equals` 的作用是什么？

**答：**

- HashMap 判断“同一个 key”的条件是：**hash 相同 &&（key == k 或 key.equals(k) 为 true）**。
- `hashCode` 相同 **不代表** 对象相等，只能说明“可能在同一桶”，最终必须靠 `equals` 确认。
- 因此自定义 key 必须正确实现 `equals/hashCode`：**equals 相等 ⇒ hashCode 必须相等**。

---

## 5) 为什么 HashMap 的容量要是 2 的幂？

**答：**

- 让下标计算可以用 `(n-1)&hash` 代替取模 `%`，更快。
- 更关键：2 的幂配合扰动函数能让 hash 的低位分布更均匀，减少冲突。
- 扩容翻倍时迁移也更高效（见第 7 题 lo/hi 拆分）。

---

## 6) 什么情况下会触发扩容？`threshold` 怎么计算？默认 loadFactor 是多少，为什么是 0.75？

**答：**

- 主要触发条件：**size > threshold**（结构性插入后超过阈值就扩容）。
- `threshold = capacity * loadFactor`。
- 默认 `loadFactor = 0.75`：在空间利用率和冲突概率之间做折中。越大越省空间但冲突更多；越小冲突更少但浪费空间更多。

---

## 7) 扩容后元素怎么迁移？JDK8 的 lo/hi 分裂规则是什么？为什么不用重新取模？

**答：**

- 扩容通常容量翻倍：`newCap = oldCap * 2`。
- JDK8 迁移不需要重新 `% newCap`，因为 `newCap` 只是多了一个更高位。
- 对同一桶里的每个节点，判断：
  - `(hash & oldCap) == 0` → 位置不变（lo 链）；
  - `(hash & oldCap) != 0` → 新下标 = 原下标 + oldCap（hi 链）。
- 这就是“lo/hi 分裂”，只看一位即可，效率高。

通俗理解：
扩容翻倍后，(newCap-1) 比 (oldCap-1) 多了 oldCap 这一位的 1，所以新下标比旧下标只多看这一位；因此只要判断 (hash & oldCap) 是 0 还是非 0，就能决定元素留在原桶 j 还是移动到 j+oldCap，这就是 lo/hi 分裂。
oldCap = 16 = 0b1_0000

oldMask = oldCap - 1 = 15 = 0b0_1111（只看低 4 位）

newMask = newCap - 1 = 31 = 0b1_1111（看低 5 位）
---

## 8) 什么时候链表会树化？阈值 8 和容量 64 是什么含义？为什么这么设计？

**答：**

- 树化阈值：桶内链表长度达到 **8**（`TREEIFY_THRESHOLD`）后会尝试树化。
- 但真正树化还要求 table 容量 **≥ 64**（`MIN_TREEIFY_CAPACITY`）。
- 如果链表达到 8 但 table < 64，优先 **resize 扩容**，因为小表冲突多往往是容量太小导致，扩容更划算；维护红黑树在小容量下成本高、收益低。

---

## 9) 红黑树什么时候退化回链表？阈值是多少？（6）

**答：**

- 退化阈值是 **6**（`UNTREEIFY_THRESHOLD`）。
- 删除或扩容拆分后，如果树中节点数变少到一定程度，会退回链表，避免维护红黑树的额外开销。

---

## 10) HashMap 的时间复杂度是多少？最坏情况为什么会退化？

**答：**

- 平均情况下：`put/get` **O(1)**（哈希均匀）。
- 极端冲突时：
  - JDK7（只有链表）：最坏 **O(n)**；
  - JDK8（可能树化）：桶内树查找最坏可到 **O(log n)**（但如果没树化仍可能是 O(n)）。
- 退化原因：hash 分布差/大量碰撞（例如坏的 `hashCode`、恶意构造 key）。

---

## 11) HashMap 为什么线程不安全？会出现什么问题？

**答：**

HashMap 无同步保护，多线程并发会产生数据竞争，常见问题：

- **丢数据**：两个线程同时 `put` 到同一桶，后写覆盖或链表指针更新丢失。
- **读到不一致数据**：一个线程扩容迁移时，另一个线程 `get/put` 看到中间状态。
- `size/threshold` 维护不一致，甚至出现结构异常（JDK7 更典型）。

---

## 12) JDK7 并发 resize 为什么可能出现“链表成环”？JDK8 还会吗？

**答：**

- **JDK7** 在扩容迁移时使用**头插法**重建链表。多线程同时 `resize` 时，节点 `next` 指针在交错更新下可能被反转并形成环，导致 `get`/遍历死循环（经典问题）。
- **JDK8** 迁移逻辑改为 **lo/hi 拆分 + 尾插**，大幅降低“成环”这种典型问题的发生方式；但 **HashMap 仍然线程不安全**，并发下依然可能丢数据、结构不一致，所以不能在并发场景用它替代线程安全容器。

---

## 13) 多线程场景用什么替代？（ConcurrentHashMap / synchronizedMap / 手动加锁）各自差异？

**答：**

- **ConcurrentHashMap（推荐）**：高并发设计，JDK8 主要用 CAS + bin 级别的 `synchronized`（锁粒度更细），读写性能好。
- **`Collections.synchronizedMap(new HashMap())`**：外层对每个方法加同一把锁，简单但并发性能差；迭代时还需要手动同步整个遍历过程。
- **手动加锁（ReentrantLock / synchronized）**：可控但容易写错，适合你需要复合操作原子性（例如 check-then-act）时自己设计锁策略。

---

## 14) HashMap 允许 `null` 吗？能有几个 null key？null key 放在哪个桶？

**答：**

- 允许 **1 个 null key**，允许多个 null value。
- null key 的 hash 视为 0，所以桶下标为 `0`（index=0）。
- Hashtable/ConcurrentHashMap（经典版本）对 null 的支持不同（见第 21/22）。

---

## 15) key/value 可以是可变对象吗？如果 key 参与 hash/equals 的字段变了会怎样？

**答：**

- **value 可变一般没问题**，因为定位不靠 value。
- **key 强烈建议不可变**。如果 key 的 `hashCode/equals` 依赖的字段在 put 之后变了：
  - 这个 entry 还在旧桶里，但你用新 key 状态去 `get`，会算出不同 hash/index，导致**找不到**；
  - 甚至可能出现“逻辑上重复 key”（再 put 一次找不到旧的，于是插入新节点）。

---

## 16) 用自定义对象当 key，需要满足什么约定？（equals/hashCode 必须一致、不可变更佳）

**答：**

- 必须正确重写 `equals()` 和 `hashCode()`：
  - **equals 相等 ⇒ hashCode 必须相等**；
  - `hashCode` 尽量分布均匀。
- key 最好**不可变**（或至少参与 equals/hash 的字段不可变）。
- `equals` 要满足自反/对称/传递/一致性，且与 `hashCode` 保持契约。

---

## 17) HashMap 默认初始容量是多少？默认 loadFactor？树化阈值/退化阈值/最小树化容量？

**答：**（JDK8 常量）

- 默认初始容量（table 初次分配时的默认容量）：**16**；
- 默认负载因子：**0.75**；
- 树化阈值：**8**（`TREEIFY_THRESHOLD`）；
- 退化阈值：**6**（`UNTREEIFY_THRESHOLD`）；
- 最小树化容量：**64**（`MIN_TREEIFY_CAPACITY`）。

---

## 18) 什么时候才真正创建 table 数组？（懒初始化：第一次 put 才分配）

**答：**

- JDK8 HashMap 通常是**懒初始化**：构造时不一定马上分配 table，第一次 `put` 时才创建（或在第一次 `resize` 时创建）。
- 如果你传入 `initialCapacity`，构造时会先计算出合适的阈值/容量规划，但 table 仍可能延后到第一次 `put` 才真正分配。

---

## 19) HashMap 遍历是有序的吗？为什么 HashMap 不保证顺序？要有序用什么？（LinkedHashMap/TreeMap）

**答：**

- **HashMap 遍历无序**，顺序取决于 hash 分布、桶位置、扩容迁移等，实现细节可能变化，且扩容后顺序可能改变。
- 要“插入顺序”用 **LinkedHashMap（insertion-order）**；
- 要“访问顺序/LRU”也用 **LinkedHashMap（accessOrder=true）**；
- 要“按 key 排序/范围查询”用 **TreeMap**。

---

## 20) fail-fast 是什么？迭代时为什么会抛 ConcurrentModificationException？怎么避免？

**答：**

- fail-fast：迭代器在遍历时检测到容器发生了**结构性修改**（非迭代器自身 `remove`）就快速失败抛异常。
- HashMap 通过 `modCount` 和迭代器里的 `expectedModCount` 比较来判断。
- 避免方式：
  - 单线程：遍历期间不要结构性修改（或用迭代器自身的 `remove`）。
  - 多线程：使用 `ConcurrentHashMap` 或在外层加锁并在锁内完成遍历与修改（`synchronizedMap` 迭代也要手动同步）。

---

## 21) HashMap vs Hashtable 区别？

**答：**

- Hashtable 是老类：**方法级 `synchronized`**，线程安全但并发性能差。
- Hashtable **不允许 null key / null value**；HashMap 允许 1 个 null key、多个 null value。
- HashMap 在 JDK8 有树化机制，Hashtable 传统实现没有这种优化。
- 现在更推荐：并发用 **ConcurrentHashMap**，非并发用 **HashMap**。

---

## 22) HashMap vs ConcurrentHashMap 区别？ConcurrentHashMap 怎么保证并发？

**答：**

- HashMap：非线程安全，适合单线程或外部同步。
- ConcurrentHashMap：线程安全，高并发优化。
- JDK8 ConcurrentHashMap 的核心思路：
  - table 初始化/扩容等用 CAS 与协作迁移；
  - 写入时对桶（bin）级别加锁（常见是 `synchronized` 锁住桶头节点），比全表锁粒度小；
  - 读操作大多无锁（依赖 volatile/CAS 可见性）。
- 因此它在并发读写下性能明显优于 `synchronizedMap`/Hashtable。

---

## 23) HashMap vs LinkedHashMap（插入顺序/访问顺序/LRU）区别？

**答：**

- LinkedHashMap 在 HashMap 基础上维护一个**双向链表**记录顺序：
  - 默认是**插入顺序**；
  - 也可设置 `accessOrder=true` 变为**访问顺序**（`get/put` 会把节点移动到链表尾部）。
- LRU 常用写法：继承 LinkedHashMap 并重写 `removeEldestEntry()`，当 size 超过阈值就淘汰最老元素。
- 代价：维护链表带来额外内存与少量操作开销。

---

## 24) HashMap vs TreeMap（红黑树排序、范围查询）区别？

**答：**

- HashMap：基于哈希，平均 O(1)，**不保证顺序**。
- TreeMap：基于红黑树（按 key 的自然顺序或 Comparator），基本操作 **O(log n)**，并支持：
  - 有序遍历（升序/降序）；
  - 范围查询（`subMap`/`headMap`/`tailMap`）；
  - 最值（`firstKey`/`lastKey`）。
- 需要排序/范围能力选 TreeMap；只需要快速 key-value 查找选 HashMap。

