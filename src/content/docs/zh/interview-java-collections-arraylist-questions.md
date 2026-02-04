---
title: "ArrayList 高频面试题全整理"
order: 35
section: "面试"
topic: "Java集合"
lang: "zh"
slug: "interview-java-collections-arraylist-questions"
summary: "系统梳理与 ArrayList 相关的高频面试题，从基础用法、扩容机制到并发与源码细节。"
icon: "❓"
featured: true
toc: true
updated: 2026-02-04
---

> 本文整理了与 **ArrayList** 相关的常见面试题，按照“基础 → 源码 → 性能与并发 → 实战场景”分层组织，适合作为复习清单。
> 每个问题只给出**精简但有信息量的答案骨架**，你可以根据需要在本地继续扩展细节。

## 一、基础概念与使用场景类

### 1. ArrayList 和数组有什么区别？

- 数组：
  - 长度固定，一旦创建无法改变；
  - 只提供下标访问，没有统一的增删查改接口；
  - 适合长度明确、不需要频繁增删的场景。
- ArrayList：
  - 基于 **动态数组** 实现，容量不足时会自动扩容；
  - 提供统一的 `add/remove/get/set` 等 API；
  - 更适合“读多写少、随机访问多”的场景。

### 2. ArrayList 和 LinkedList 的区别？如何选择？

- 底层结构：
  - `ArrayList`：连续数组，支持 O(1) 随机访问；
  - `LinkedList`：双向链表，随机访问是 O(n)。
- 插入删除：
  - `ArrayList`：中间插入/删除需要搬迁元素，O(n)；
  - `LinkedList`：只改指针，理论上 O(1)，但前提是你已经拿到节点引用。
- 典型选择：
  - 大量随机访问 → `ArrayList`；
  - 频繁在头/中间插入删除，且数据量不大 → `LinkedList`。

### 3. ArrayList 是否线程安全？如何在多线程下使用？

- ArrayList **不是线程安全** 的；
- 常见解决方式：
  - 外层加锁：`Collections.synchronizedList(new ArrayList<>())`；
  - 或使用并发集合：`CopyOnWriteArrayList` 等；
  - 或者根据场景自己封装更细粒度的锁。

## 二、底层实现与扩容机制类

### 4. ArrayList 的底层是如何存储元素的？

- 核心字段：`transient Object[] elementData`；
- `size` 表示“逻辑元素个数”，在`add/remove`时进行变化，和数组Length并不关联，`elementData.length` 表示“容量”；
- 绝大多数操作（`get/set/add/remove`）最终都是对这个数组的读写和 `System.arraycopy`。

### 5. ArrayList 的扩容策略是什么？为什么是 1.5 倍？

- 当新加入元素使得当前操作所需要的最小容量 `minCapacity > elementData.length` 时触发扩容；
- 新容量一般为：`newCapacity = oldCapacity + (oldCapacity >> 1)`，即 **1.5 倍扩容**；
- 如果 1.5 倍仍不够，就直接使用 `minCapacity`；
- 设计动机：
  - 过小：频繁扩容，整体开销大；
  - 过大：一次扩容浪费内存；
  - 1.5 倍是工程上相对折中、被广泛采用的方案。

### 6. `ensureCapacity` 有什么用？什么时候需要手动调用？

- 作用：**预先保证容量**，在批量插入前减少或避免多次扩容；
- 典型场景：
  - 已知即将插入 N 个元素：可以先调用 `list.ensureCapacity(currentSize + N)`；
  - 例如从数据库一次性加载大量数据、批量构建缓存等。

## 三、fail-fast、迭代器与并发修改类

### 7. 什么是 fail-fast？ArrayList 是如何实现的？

- 含义：在迭代过程中，一旦检测到结构被“意外修改”，尽快抛出 `ConcurrentModificationException`；
- 关键字段：`modCount` 和 迭代器内部的 `expectedModCount`；
- 关键点：
  - 每次结构性修改（add/remove/clear 等）都会 `modCount++`；
  - 迭代器在创建时保存 `expectedModCount = modCount`；
  - 在 `next/remove/forEachRemaining` 等操作前后检查 `modCount` 是否变化。

### 8. 在遍历 ArrayList 时删除元素，有哪些正确和错误的写法？

- 错误示例：

```java
for (E e : list) {
    if (/* 条件 */) {
        list.remove(e); // 可能触发 ConcurrentModificationException
    }
}
```

- 正确方式：
  - 使用显式迭代器并调用 `iterator.remove()`；
  - 或从后往前用普通 `for` 循环 + `remove(index)`；
  - 或在 JDK 8+ 使用 `removeIf(predicate)`。

## 四、常见源码细节题

### 9. `ArrayList#remove(int index)` 和 `remove(Object o)` 有什么区别？

- `remove(int index)`：
  - 通过下标删除，逻辑是：`rangeCheck` → 保存旧值 → `System.arraycopy` 搬迁元素 → `size--`；
  - 返回被删除的元素。
- `remove(Object o)`：
  - 先线性扫描找到第一次出现的位置，再调用内部的 `fastRemove(index)`；
  - 返回 `boolean` 表示是否删除成功。

### 10. `subList` 返回的子列表有哪些“坑”？

- `subList` 返回的是**视图**，共享同一 `elementData`；
- 通过 `subList` 修改会影响原始列表；
- 若在 `subList` 存在期间通过原始列表做结构修改，再操作 `subList` 可能抛 `ConcurrentModificationException`；
- 不少面试会问：“`subList` 的结果能安全地强转成 `ArrayList` 并独立使用吗？”——答案是**不能**，如果需要独立副本，应显式 `new ArrayList<>(subList)`。

## 五、性能与内存相关问题

### 11. ArrayList 的时间复杂度如何？（按典型操作）

- `get/set`：平均 O(1)；
- `add(e)` 尾插：均摊 O(1)，偶尔会遇到 O(n)（扩容时数组拷贝）；
- `add(index, e)` / `remove(index)`：O(n - index)，中间位置开销最大；
- `contains` / `indexOf`：线性查找，O(n)。

### 12. `trimToSize` 有什么用？什么时候会用到？

- 作用：把 `elementData` 的容量缩小到当前 `size`，释放多余空间；
- 典型使用场景：
  - 大集合使用完成后还要长时间驻留内存，但后续不会再增长；
  - 如：一次性加载配置、构造后变为“查询多、写少”的只读列表。

## 六、设计与对比类开放题

### 13. 为什么说 ArrayList 适合“读多写少”的场景？

可以从以下几个角度简要说明：

- 读（随机访问）是 O(1)，非常快；
- 写（中间插入/删除）可能引起大量元素搬迁；
- 扩容本身也是 O(n) 的操作，只是均摊到多次 add 上；
- 多线程下需要额外同步或使用并发集合。

### 14. 如果要设计一个“更适合写多读少”的 List，你会怎么做？

- 可以从下面几个角度思考：
  - 是否可以用链表或分段数组（chunked array）结构；
  - 是否可以按批量操作、日志合并（如 Copy-On-Write 思路）来优化；
  - 在高并发场景下，是否可以使用分段锁、CAS 等手段。

---

## 七、如何用这些答案“讲故事”打动面试官？

在真正的面试场景里，不必逐题背答案，可以尝试用下面的结构来回答关于 ArrayList 的开放式问题：

1. 先用一句话给出**结论 & 场景定位**（例如：ArrayList 是基于动态数组的非线程安全 List，适合读多写少的单线程或外部加锁场景）；
2. 再从 **数据结构 + 扩容策略 + 迭代器 & fail-fast + 并发注意点** 四个维度展开；
3. 偶尔点到几个 **JDK 版本差异与源码细节**，证明你“看过源码而不是只背 API”；
4. 最后给一两个实际项目中的使用例子（例如：分页结果列表、缓存快照、DTO 集合等）。



