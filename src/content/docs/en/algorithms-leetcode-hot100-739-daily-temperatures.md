---
title: "LeetCode Hot 100: 739 - Daily Temperatures"
order: 4
section: "Algorithms"
topic: "LeetCode hot100"
lang: "en"
summary: "Use a monotonic stack (storing indices) to find the number of days until a warmer temperature in one linear scan."
icon: "🌡️"
featured: false
toc: true
updated: 2026-01-29
---

> Given an array of integers `temperatures` representing the daily temperatures, return *an array `answer`* such that `answer[i]` is the number of days you have to wait after the \(i\)-th day to get a warmer temperature. If there is no future day for which this is possible, keep `answer[i] == 0` instead.

## Idea: Monotonic stack (storing indices)

- Traverse daily temperatures from left to right.
- Use a stack to store "indices of days that haven't encountered a warmer day yet", maintaining **strictly increasing temperatures from top to bottom**.
- When seeing a new temperature `cur`:
  - As long as `cur` is higher than the temperature of the day at the top of the stack, that day's first warmer day is today;
  - Pop the top index `prev`, set `ans[prev] = i - prev`;
  - May solve multiple days at once, so use `while`.
- After processing the current day `i`, push it onto the stack, waiting for a warmer day in the future to "resolve" it.

Time complexity: \(O(n)\), each index is pushed and popped at most once.

## Java implementation

```java
class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        int len = temperatures.length;
        int[] ans = new int[len]; // Default all 0: if no warmer day to the right, keep 0

        // Stack stores "indices", representing days that haven't found a warmer day to the right
        // Maintain property: temperatures from top to bottom are "increasing" (equivalent to: decreasing from bottom to top)
        // This way, when encountering a higher temperature, we can continuously pop "resolved" days
        Deque<Integer> stack = new ArrayDeque<>();

        // Traverse each day from left to right
        for (int i = 0; i < len; i++) {
            int cur = temperatures[i]; // Today's temperature

            // As long as today is warmer than the "day at the top":
            // The "first warmer day to the right" for the top day is today i
            // Use while because today may resolve multiple days in a row (as long as they're all colder than today)
            while (!stack.isEmpty() && temperatures[stack.peek()] < cur) {
                int prev = stack.pop();      // The resolved day (index)
                ans[prev] = i - prev;        // Days to wait = today - that day
            }

            // Today hasn't found a "warmer day to the right" yet, push it onto the stack, waiting for a warmer day in the future to resolve it
            stack.push(i);
        }

        return ans;
    }
}
```

## Two sets of Deque APIs: which is easier to remember?

`Deque` can be used as a stack, essentially with two styles. **Pick one and stick with it to avoid confusion**:

- **Stack style (top at first)**: `push` / `pop` / `peek`  
  - Corresponds to `addFirst` / `removeFirst` / `peekFirst` at the low level, meaning "operate on the head".
- **Explicit double-ended (top at last)**: `addLast` / `pollLast` / `peekLast`  
  - Meaning "operate on the tail", often used together with queue/monotonic queue problems.

In this problem, we use a "stack approach", so `push + pop + peek` is clear enough.
