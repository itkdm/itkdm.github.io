---
title: "LeetCode Hot 100: 347 - Top K Frequent Elements"
order: 2
section: "Algorithms"
topic: "LeetCode hot100"
lang: "en"
summary: "Count with a hash map, then keep only k candidates in a min-heap for O(n log k) time."
icon: "📊"
featured: false
toc: true
updated: 2026-02-04
---

> Given an integer array `nums` and an integer `k`, return the `k` most frequent elements. You may return the answer in any order.

## Idea: HashMap + Min-Heap (maintain Top K)

Instead of sorting all elements by frequency, we maintain a min-heap of size at most `k`:

- **Step 1: Count frequencies**
  - Use `Map<Integer, Integer>` to count occurrences.
- **Step 2: Min-heap keeps the best k**
  - Heap element: `int[]{num, count}`
  - Comparator: sort by `count` ascending
  - Meaning: the heap top is the **current smallest frequency among the top k** (the threshold).
- **Step 3: Iterate over the frequency map**
  - If heap size < k: push directly
  - Else if current count > heap top count: pop top, then push current
  - Otherwise: skip

## Complexity

- Time: building the map \(O(n)\), heap maintenance \(O(m \log k)\) where \(m\) is the number of distinct elements → commonly written as **\(O(n \log k)\)**.
- Space: \(O(m)\) for the map and \(O(k)\) for the heap.

## Java implementation (avoid `a[1] - b[1]` overflow)

```java
import java.util.*;

class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        Map<Integer, Integer> freq = new HashMap<>();
        for (int num : nums) {
            freq.put(num, freq.getOrDefault(num, 0) + 1);
        }

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

        int[] ans = new int[k];
        for (int i = 0; i < k; i++) {
            ans[i] = pq.poll()[0];
        }
        return ans;
    }
}
```

## `PriorityQueue` quick notes

- `offer(e)` / `add(e)`: push
- `poll()`: pop top (returns `null` if empty)
- `peek()`: view top without popping

