---
title: "ArrayList 不同 JDK 版本的实现差异总览"
order: 30
section: "面试"
topic: "Java集合"
lang: "zh"
slug: "interview-java-collections-arraylist-diff"
summary: "对比 JDK 7 / 8 / 11 / 21 中 ArrayList 的关键实现差异，帮助在面试中答出“版本相关”的细节。"
icon: "🧬"
featured: true
toc: true
updated: 2026-02-04
---

> 本文聚焦 **JDK 7u（更新版）/ 8 / 11 / 21 中 ArrayList 实现上的关键差异**，帮助你在面试时回答“你了解过不同 JDK 版本中 ArrayList 的变化吗？”这一类问题。  
> **版本说明**：最早的 JDK 7 GA 版本中，无参构造是 `public ArrayList() { this(10); }`，会直接分配容量 10 的数组；后续的 JDK 7u 更新以及 JDK 8+ 中，无参构造改为“先指向空数组，第一次 `add` 时再按默认容量 10 分配”。本文以及本站源码精读统一以 **JDK 7u/8 之后的实现** 为基准。  
> 详细源码可参考本系列的 4 篇「源码精读」文档，这里只总结对“理解原理 & 面试作答”最有价值的差异点。

## 1. 构造与底层数组初始化策略差异

- **JDK 7**：
  - 无参构造：`elementData` 指向共享的空数组 `EMPTY_ELEMENTDATA`，**不会立刻分配长度为 10 的真实数组**；
  - 第一次通过 `add` 等操作触发 `ensureCapacityInternal` 时，才根据 `DEFAULT_CAPACITY`（10）和最小需要容量分配真实数组；
- **JDK 8 / 11 / 21**：
  - 引入了两个不同的空数组：
    - `EMPTY_ELEMENTDATA`：表示“实际容量确实为 0”的情况，比如用集合初始化时集合长度为零；
    - `DEFAULTCAPACITY_EMPTY_ELEMENTDATA`：表示“无参构造的默认空列表”；
  - 无参构造会使用 `DEFAULTCAPACITY_EMPTY_ELEMENTDATA`，同样在第一次 `add` 时才分配容量 10 的真实数组；
  - 这样可以在语义上区分“默认容量的空列表”和“真正期望容量为 0 的列表”，在 `ensureCapacity` 等场景下行为更精确。

面试可总结为一句话：

> 从 JDK 7 开始，无参构造都是“先指向共享空数组，第一次 add 时再分配容量 10”，JDK 8 之后只是多加了一个专用的 `DEFAULTCAPACITY_EMPTY_ELEMENTDATA` 空数组来区分“默认空列表”和“容量为 0 的列表”。

## 2. 扩容策略与最大容量处理

- **共同点（所有版本）**：
  - 触发条件：当 `minCapacity > elementData.length` 时才会扩容；
  - 首选增长因子都是围绕 **“原容量的 1.5 倍”** 展开：
    - JDK 7/8：`newCapacity = oldCapacity + (oldCapacity >> 1)`；
    - JDK 11：在 `newCapacity(int minCapacity)` 中同样先算一遍 `old + old>>1` 作为候选；
    - JDK 21：在 `grow(int minCapacity)` 中把 `oldCapacity >> 1` 作为 `ArraysSupport.newLength` 的 `preferred growth`；
  - 如果 1.5 倍仍小于 `minCapacity`，则直接使用 `minCapacity`（即“宁可多给，也不能不够用”）；
  - 都要对“接近 `Integer.MAX_VALUE` 的超大数组”做额外保护，避免溢出或 VM 限制导致的 OOME。

- **差异点（实现方式上的演进）**：
  - **JDK 7 / 8**：
    - 显式定义 `MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8`；
    - `grow(int minCapacity)` 中先算 1.5 倍，再用 `MAX_ARRAY_SIZE` + `hugeCapacity(minCapacity)` 手动处理极限值；
    - 逻辑完全写死在 `ArrayList` 类内部。
  - **JDK 11**：
    - 把“如何算新容量”抽到 `newCapacity(int minCapacity)` 里，但仍然用 `MAX_ARRAY_SIZE` + `hugeCapacity` 这套方案；
    - 同时在 `newCapacity` 里额外区分了 `DEFAULTCAPACITY_EMPTY_ELEMENTDATA` 的情况（默认空列表第一次扩容要考虑 `DEFAULT_CAPACITY`）。
  - **JDK 21**：
    - 不再在类中直接写 1.5 倍和 `MAX_ARRAY_SIZE` 判断，而是调用通用工具方法：

      ```java
      int newCapacity = ArraysSupport.newLength(
          oldCapacity,
          minCapacity - oldCapacity, // 最小增长
          oldCapacity >> 1           // 首选增长（约 1.5 倍）
      );
      ```

    - `ArraysSupport.newLength` 内部统一处理“溢出检查 + 最大数组长度限制”，让不同集合类可以共享同一套安全策略。

可以重点记住：

> 不同版本里 **“自动扩容 ≈ 1.5 倍 + 不足时补到 minCapacity + 超大容量保护”** 这一思想是稳定的，只是从 JDK 7 → 8/11 → 21，不断把这套逻辑抽象得更通用、更安全（从 `grow`/`hugeCapacity` 演进到 `newCapacity`，再到 `ArraysSupport.newLength`）。

## 3. ensureCapacity 相关行为的演进

- **JDK 7**：
  - 针对初始为空数组的情况，引入 `minExpand` 判断，避免一开始就扩到 10。
- **JDK 8 / 11 / 21**：
  - 行为进一步简化和收敛，逻辑上仍是“显式预留容量”，只是实现细节略有不同；
  - 重点仍然是：**批量 add 之前先调用 `ensureCapacity`，可以显著减少扩容次数**。

在面试中通常只要说明：

> `ensureCapacity` 在各版本都用于“手动预热容量”，避免频繁扩容，对有明确规模预期的场景很重要。

## 4. equals / hashCode / removeIf / replaceAll 等新 API

- **JDK 7**：
  - 实现较为“传统”，不包含 `removeIf`、`replaceAll` 等新风格默认方法；
  - `equals` / `hashCode` 逻辑相对简单。
- **JDK 8 / 11 / 21**：
  - 增加了很多与 **Lambda / Stream** 配套的 API，例如：
    - `removeIf(Predicate)`：按条件批量删除；
    - `replaceAll(UnaryOperator)`：批量替换元素；
    - 更完善的 `spliterator()` 实现，支持流式处理；
  - JDK 11/21 还对 `equals` / `hashCode` / `SubList` 等做了更精细的实现与一致性保证。

面试常见问法：

> “你知道 ArrayList 在 JDK 8 之后多了哪些跟 Lambda 相关的方法吗？”  
> 可以点出 `removeIf`、`replaceAll`、`spliterator` 并简单说下实现大致思路。

## 5. SubList 实现与 fail-fast 语义的细化

- **早期版本（JDK 7/8）**：
  - `SubList` 共享外部 `ArrayList` 的 `elementData`；
  - 通过 `modCount` / `expectedModCount` 做 fail-fast 检测，但实现相对简单。
- **JDK 11 / 21**：
  - 对 `SubList` 的层级结构、`modCount` 传播、`spliterator` 等做了更多精细化处理；
  - 目标是：在**多层 subList 嵌套、多种遍历方式**下，都尽量保持语义一致，且能在并发修改时尽早抛出 `ConcurrentModificationException`。

这一块细节比较多，面试时可以只记一个重点：

> `subList` 视图与原始 `ArrayList` 共用底层数组，结构修改会互相影响；高版本中对 fail-fast 的实现更严谨，但不能视为“线程安全保证”。

## 6. JDK 21 新增的一些 API

在 JDK 21 中，`ArrayList` 作为 `List` 的实现，支持了一些新增的便捷方法，例如：

- `getFirst()` / `getLast()`；
- `addFirst(E)` / `addLast(E)`（委托到头插 / 尾插逻辑）。

这些方法本质上没有改变内部结构，只是让 `List` 在用法上**更接近双端队列**，在现代 Java 代码与面试题中可能会被提到。

（这些是 List 新增的 default 方法）

---

## 7. 面试如何简要作答 “ArrayList 在不同 JDK 版本的差异？”

可以按照“版本时间线 + 关键点”来组织答案，例如：

1. **JDK 7**：无参构造已经是 lazy 分配（先用共享空数组，第一次 add 才按默认容量 10 分配），扩容策略是 1.5 倍，`subList` / 迭代器实现比较传统；
2. **JDK 8**：在 JDK 7 的基础上区分了两类空数组（默认空列表 vs 容量为 0 的列表），并补充了 `removeIf` / `replaceAll` / `spliterator` 等与 Lambda/Stream 相关的 API；
3. **JDK 11**：在 `equals` / `hashCode` / `SubList` 等方面做了更细致的实现，fail-fast 逻辑更严谨；
4. **JDK 21**：引入内部工具类（如 `ArraysSupport`），并新增 `getFirst/addFirst` 等 API，同时保持原有扩容与 fail-fast 思路不变。

最后可以加一句：

> “整体上 ArrayList 的**核心数据结构与扩容逻辑在各版本是一致的**，更多是围绕内存优化、新 API 支持和 fail-fast 细节在演进。”

不同版本里 **“自动扩容 ≈ 1.5 倍 + 不足时补到 minCapacity + 超大容量保护”** 这一思想是稳定的
