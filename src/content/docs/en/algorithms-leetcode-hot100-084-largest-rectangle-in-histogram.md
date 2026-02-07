---
title: "LeetCode Hot 100: 084 - Largest Rectangle in Histogram"
order: 5
section: "Algorithms"
topic: "LeetCode hot100"
lang: "en"
summary: "Use a monotonic increasing stack (storing indices) with a sentinel trick to find the maximum rectangle area with each bar as the minimum height in one pass."
icon: "📊"
featured: false
toc: true
updated: 2026-01-29
---

> Given an array of integers `heights` representing the histogram's bar height where the width of each bar is 1, return *the area of the largest rectangle in the histogram*.

![Example image](https://assets.leetcode.com/uploads/2021/01/04/histogram.jpg)

## Idea: Monotonic increasing stack + sentinel trick

- Core idea: For each bar, find the maximum rectangle that uses it as the **minimum height**.
- Use a monotonic increasing stack (storing indices) to maintain bars whose right boundary hasn't been found yet.
- When encountering a shorter bar, the right boundary of the top bar in the stack is determined, so we can calculate the area.
- Add a sentinel bar with height 0 at the end to ensure all bars are processed.

Time complexity: \(O(n)\), each index is pushed and popped at most once.

## Java implementation

```java
class Solution {
    public int largestRectangleArea(int[] heights) {
        int len = heights.length;

        // New array: add a sentinel with height 0 at the end to trigger final processing
        int[] newArray = new int[len + 1];
        System.arraycopy(heights, 0, newArray, 0, len);
        newArray[len] = 0;

        int ans = 0;
        // Monotonic increasing stack: store indices, ensuring newArray[bottom..top] is increasing
        Deque<Integer> stack = new ArrayDeque<>();

        for (int i = 0; i <= len; i++) {
            int cur = newArray[i];

            // cur is shorter: cur is the first bar to the right shorter than the top bar
            // The right boundary of the top bar is determined, calculate area
            while (!stack.isEmpty() && newArray[stack.peek()] > cur) {
                int mid = stack.pop();
                int height = newArray[mid]; // Use mid as the minimum height

                // leftLess: index of the first bar to the left shorter than mid; -1 if none
                int leftLess = stack.isEmpty() ? -1 : stack.peek();

                // width = right boundary (i-1) - left boundary (leftLess+1) + 1 = i - leftLess - 1
                int width = i - leftLess - 1;

                ans = Math.max(ans, height * width);
            }

            // Push to stack, maintain monotonic increasing (wait for a shorter bar to process)
            stack.push(i);
        }

        return ans;
    }
}
```

## Array copying methods

### `System.arraycopy` (most common, fastest, low-level optimized)

Suitable for: copying a segment of one array to another (including copying after expansion)

```java
int n = heights.length;
int[] a = new int[n + 1];
System.arraycopy(heights, 0, a, 0, n);
a[n] = 0; // sentinel
```

- Copies **element references/values** (int is a value)
- For object arrays, it's a **shallow copy** (only copies references)

### `Arrays.copyOf` (best for "expand and copy")

Suitable for: the most common "copy and expand to new length" scenario in competitive programming

```java
import java.util.Arrays;

int[] a = Arrays.copyOf(heights, heights.length + 1);
a[heights.length] = 0;
```

- Concise and semantically clear
- Internally uses efficient copying
