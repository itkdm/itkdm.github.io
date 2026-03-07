---
title: "739-每日温度"
order: 4
section: "算法"
topic: "LeetCode hot100"
lang: "zh"
summary: "使用单调栈（存下标）在一次线性扫描中求出每一天距离下一个更高温度的天数。"
icon: "🌡️"
featured: false
toc: true
updated: 2026-01-29
---

> 给定一个整数数组 `temperatures` ，表示每天的温度，返回一个数组 `answer` ，其中 `answer[i]` 是指对于第 `i` 天，下一个更高温度出现在几天后。如果气温在这之后都不会升高，请在该位置用 `0` 来代替。

## 思路：单调栈（存下标）

- 从左到右遍历每天的温度。
- 用一个栈保存「还没遇到更高温度的天的下标」，并保持**栈内对应温度从栈顶到栈底严格递增**。
- 当看到新的温度 `cur` 时：
  - 只要 `cur` 比栈顶那天的温度高，就说明栈顶那天等到的第一个更高温度就是今天；
  - 弹出栈顶下标 `prev`，答案 `ans[prev] = i - prev`；
  - 可能一次性解决多天，所以要用 `while`。
- 当前这一天 `i` 处理完后入栈，等待未来更热的天来“结算”。

时间复杂度 \(O(n)\)，每个下标最多入栈、出栈各一次。

## 代码实现

```java
class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        int len = temperatures.length;
        int[] ans = new int[len]; // 默认全为 0：如果右边没更热的一天，就保持 0

        // 栈里存“下标”，表示这些天还没等到右边更热的一天
        // 维持一个性质：从栈顶到栈底，对应的温度是“递增”的（等价于：从栈底到栈顶温度递减）
        // 这样当遇到更高温度时，可以不断弹出被“解决”的天
        Deque<Integer> stack = new ArrayDeque<>();

        // 从左到右遍历每一天
        for (int i = 0; i < len; i++) {
            int cur = temperatures[i]; // 今天的温度

            // 只要今天比“栈顶那天”更热：
            // 说明栈顶那天的“右边第一个更高温度”就是今天 i
            // 用 while 是因为今天可能会连续解决多天（只要它们都比今天冷）
            while (!stack.isEmpty() && temperatures[stack.peek()] < cur) {
                int prev = stack.pop();      // 被解决的那一天（下标）
                ans[prev] = i - prev;        // 等待天数 = 今天 - 那一天
            }

            // 今天这一天还没找到“右边更热的一天”，先把它入栈，等待未来更热的天来解决
            stack.push(i);
        }

        return ans;
    }
}
```

## Deque 的两套 API：怎么记更顺手？

`Deque` 可以当栈用，本质有两种写法，**选一套坚持用就不容易乱**：

- **栈风格（栈顶在 first）**：`push` / `pop` / `peek`  
  - 对应到底层是 `addFirst` / `removeFirst` / `peekFirst`，语义就是“操作队头”。
- **双端显式（栈顶在 last）**：`addLast` / `pollLast` / `peekLast`  
  - 语义是“操作队尾”，常配合队列/单调队列题目一起使用。

在这道题里我们是“栈思路”，用 `push + pop + peek` 就足够清晰了。

