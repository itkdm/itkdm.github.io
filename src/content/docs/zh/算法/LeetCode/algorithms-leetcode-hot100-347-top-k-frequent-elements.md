---
title: "347-前 K 个高频元素"
order: 6
section: "算法"
topic: "LeetCode hot100"
lang: "zh"
summary: "哈希表统计频率 + 小根堆只维护 k 个候选，时间复杂度 O(n log k)。"
icon: "📊"
featured: false
toc: true
updated: 2026-02-04
---

> 给你一个整数数组 `nums` 和一个整数 `k` ，请你返回其中出现频率前 `k` 高的元素。你可以按任意顺序返回答案。

## 思路：哈希表 + 小根堆（维护 Top K）

核心想法：**不要把所有元素都排序**，而是只维护“目前出现频率最高的 k 个”。

- **步骤 1：统计频率**
  - 用 `Map<Integer, Integer>` 统计每个数字出现次数。
- **步骤 2：小根堆维护 k 个候选**
  - 堆元素：`int[]{num, count}`（数字 + 频率）
  - 堆排序：按 `count` 升序（小根堆）
  - 含义：堆顶永远是“当前 Top k 中频率最小的那个”（门槛）
- **步骤 3：遍历频率表**
  - 堆未满（`size < k`）：直接入堆
  - 堆已满且当前频率更大：弹出堆顶，再入堆
  - 否则跳过

## 复杂度

- 时间复杂度：建表 \(O(n)\)，维护堆 \(O(m \log k)\)，其中 \(m\) 为不同元素个数，整体常写作 **\(O(n \log k)\)**。
- 空间复杂度：哈希表 \(O(m)\) + 堆 \(O(k)\)。

## Java 实现（推荐写法：避免 `a[1] - b[1]` 溢出）

```java
import java.util.*;

class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        // 1) count frequency
        Map<Integer, Integer> freq = new HashMap<>();
        for (int num : nums) {
            freq.put(num, freq.getOrDefault(num, 0) + 1);
        }

        // 2) min-heap by frequency: keep only k elements
        PriorityQueue<int[]> pq = new PriorityQueue<>(
                (a, b) -> Integer.compare(a[1], b[1])
        );

        for (Map.Entry<Integer, Integer> e : freq.entrySet()) {
            int num = e.getKey();
            int count = e.getValue();

            if (pq.size() < k) {
                pq.offer(new int[]{num, count});
            } else if (pq.peek()[1] < count) {
                pq.poll();
                pq.offer(new int[]{num, count});
            }
        }

        // 3) extract answer (any order is ok)
        int[] ans = new int[k];
        for (int i = 0; i < k; i++) {
            ans[i] = pq.poll()[0];
        }
        return ans;
    }
}
```

## `PriorityQueue` 小抄

- `offer(e)` / `add(e)`：入堆
- `poll()`：弹出堆顶（为空返回 `null`）
- `peek()`：查看堆顶（不弹出）
- `size()` / `isEmpty()`

`PriorityQueue` 默认按“最小”在堆顶；通过 `Comparator` 决定谁更小。

