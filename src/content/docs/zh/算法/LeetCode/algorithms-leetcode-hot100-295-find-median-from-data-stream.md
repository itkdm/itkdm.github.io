---
title: "295-数据流的中位数"
order: 7
section: "算法"
topic: "LeetCode hot100"
lang: "zh"
summary: "经典“双堆”模型：用大顶堆维护较小一半、小顶堆维护较大一半，在线查询中位数。"
icon: "🧠"
featured: false
toc: true
updated: 2026-02-05
---

> 中位数是有序整数列表中的中间值。如果列表大小为偶数，则中位数是两个中间值的平均值。  
> 设计 `MedianFinder`：支持 `addNum(int num)` 持续加入数据，并用 `findMedian()` 返回当前中位数。

## 思路：两个堆维护两半数据

用两个优先队列维护数据流的“两半”：

- **`low`：大顶堆**，存“较小的一半”，堆顶是这半边的最大值（左中位数候选）
- **`high`：小顶堆**，存“较大的一半”，堆顶是这半边的最小值（右中位数候选）

维护两个不变式：

1. `low` 中所有元素都 **≤** `high` 中所有元素
2. `low.size() == high.size()` 或 `low.size() == high.size() + 1`  
   （让 `low` 至多比 `high` 多 1 个元素，这样奇数个时中位数就是 `low.peek()`）

## 代码实现（Java）


```java
class MedianFinder {
    // low：大顶堆，存“较小的一半”，堆顶是这半边的最大值（左中位数候选）
    PriorityQueue<Integer> low;
    // high：小顶堆，存“较大的一半”，堆顶是这半边的最小值（右中位数候选）
    PriorityQueue<Integer> high;

    public MedianFinder() {
        low = new PriorityQueue<>((a,b) -> Integer.compare(b,a)); // 大顶堆
        high = new PriorityQueue<>((a,b) -> Integer.compare(a,b)); // 小顶堆（也可省 comparator）
    }
    
    public void addNum(int num) {
        // 目标不变式：
        // 1) low 中所有元素 <= high 中所有元素
        // 2) low.size() == high.size() 或 low.size() == high.size() + 1

        // num 属于较小一半 -> 放入 low
        if (low.isEmpty() || num <= low.peek()) {
            low.offer(num);
            // low 太多：把 low 的最大值挪到 high
            if (low.size() > high.size() + 1) {
                high.offer(low.poll());
            }
        } else {
            // num 属于较大一半 -> 放入 high
            high.offer(num);
            // high 比 low 多：把 high 的最小值挪到 low
            if (high.size() > low.size()) {
                low.offer(high.poll());
            }
        }
    }
    
    public double findMedian() {
        // 总数为偶数：取两边堆顶平均（拆开 /2.0 避免 int 相加溢出）
        if (low.size() == high.size()) {
            return low.peek() / 2.0 + high.peek() / 2.0;
        }
        // 总数为奇数：low 多一个，堆顶即中位数
        return low.peek();
    }
}
```

## 复杂度

- **时间复杂度**
  - `addNum`：\(O(\log n)\)（堆插入/弹出）
  - `findMedian`：\(O(1)\)
- **空间复杂度**：\(O(n)\)

## 常见坑

- **平均值溢出**：`(a + b) / 2.0` 可能在 `a + b` 时发生 `int` 溢出；可以像代码里那样拆开做：`a / 2.0 + b / 2.0`，或者用 `long` 承接。
- **尺寸平衡**：实现时要保证不变式（尤其是“low 至多多 1”），否则中位数会算错。

