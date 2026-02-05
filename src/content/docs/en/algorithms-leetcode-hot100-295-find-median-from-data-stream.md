---
title: "295 - Find Median from Data Stream"
order: 7
section: "Algorithms"
topic: "LeetCode hot100"
lang: "en"
summary: "Classic two-heap approach: max-heap for the lower half, min-heap for the upper half; support online median queries."
icon: "🧠"
featured: false
toc: true
updated: 2026-02-05
---

> Design `MedianFinder` to support `addNum(int num)` for streaming inserts and `findMedian()` to return the current median. If the count is even, return the average of the two middle values.

## Idea: two heaps for two halves

Maintain two priority queues:

- **`low` (max-heap)**: holds the smaller half; the top is the largest of this half (left-median candidate).
- **`high` (min-heap)**: holds the larger half; the top is the smallest of this half (right-median candidate).

Invariants:

1. Every element in `low` ≤ every element in `high`.
2. `low.size() == high.size()` or `low.size() == high.size() + 1`  
   (let `low` have at most one extra element; when the total is odd, median is `low.peek()`).

## Java code

```java
class MedianFinder {
    // low: max-heap, smaller half
    PriorityQueue<Integer> low;
    // high: min-heap, larger half
    PriorityQueue<Integer> high;

    public MedianFinder() {
        low = new PriorityQueue<>((a,b) -> Integer.compare(b,a)); // max-heap
        high = new PriorityQueue<>(); // min-heap
    }
    
    public void addNum(int num) {
        // put into low if it belongs to the smaller half
        if (low.isEmpty() || num <= low.peek()) {
            low.offer(num);
            // rebalance: low can be at most 1 larger than high
            if (low.size() > high.size() + 1) {
                high.offer(low.poll());
            }
        } else {
            // otherwise into high
            high.offer(num);
            // rebalance if high gets larger
            if (high.size() > low.size()) {
                low.offer(high.poll());
            }
        }
    }
    
    public double findMedian() {
        if (low.size() == high.size()) {
            // even count: average of two tops (split to avoid int overflow)
            return low.peek() / 2.0 + high.peek() / 2.0;
        }
        // odd count: low has one more
        return low.peek();
    }
}
```

## Complexity

- **Time**: `addNum` \(O(\log n)\) for heap ops; `findMedian` \(O(1)\).
- **Space**: \(O(n)\) to store the stream.

## Common pitfalls

- **Overflow in average**: use `a / 2.0 + b / 2.0` or cast to `long` before averaging to avoid `int` overflow.
- **Invariant maintenance**: always ensure `low` is at most one element larger than `high`, and all elements in `low` are `<=` all in `high`; otherwise medians go wrong.
