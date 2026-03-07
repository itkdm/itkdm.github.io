---
title: "070-爬楼梯"
order: 2
section: "算法"
topic: "LeetCode hot100"
lang: "zh"
summary: "经典动态规划入门题，斐波那契数列变种。理解状态转移方程 dp[i] = dp[i-1] + dp[i-2]。"
icon: "🧠"
featured: false
toc: true
updated: 2026-03-07
---

> 假设你正在爬楼梯。需要 `n` 阶你才能到达楼顶。
>
> 每次你可以爬 `1` 或 `2` 个台阶。你有多少种不同的方法可以爬到楼顶呢？

## 思路：动态规划（斐波那契数列）

这道题是**动态规划的入门经典**，本质是斐波那契数列的变种。

### 状态定义

`dp[i]` 表示爬到第 `i` 阶台阶的方法数。

### 状态转移方程

要到达第 `i` 阶，只有两种方式：

1. 从第 `i-1` 阶爬 1 步上来
2. 从第 `i-2` 阶爬 2 步上来

所以：**`dp[i] = dp[i-1] + dp[i-2]`**

### 初始条件

- `dp[1] = 1`：只有 1 阶时，只有 1 种方法
- `dp[2] = 2`：有 2 阶时，有 2 种方法（1+1 或 2）

## 代码实现

### 方法一：动态规划（数组版）

```java
class Solution {
    public int climbStairs(int n) {
        // 边界条件
        if (n < 2) {
            return n;
        }
        
        // dp[i] 表示爬到第 i 阶的方法数
        int[] dp = new int[n + 1];
        dp[1] = 1;
        dp[2] = 2;
        
        // 从第 3 阶开始递推
        for (int i = 3; i <= n; i++) {
            dp[i] = dp[i - 1] + dp[i - 2];
        }
        
        return dp[n];
    }
}
```

### 方法二：空间优化（滚动变量）⭐推荐

由于 `dp[i]` 只依赖于 `dp[i-1]` 和 `dp[i-2]`，可以用两个变量代替数组：

```java
class Solution {
    public int climbStairs(int n) {
        if (n < 2) {
            return n;
        }
        
        // 用两个变量代替数组，节省空间
        int prev2 = 1;  // dp[i-2]
        int prev1 = 2;  // dp[i-1]
        int current = 0;
        
        for (int i = 3; i <= n; i++) {
            current = prev1 + prev2;
            prev2 = prev1;
            prev1 = current;
        }
        
        return prev1;
    }
}
```

## 复杂度分析

| 方法 | 时间复杂度 | 空间复杂度 |
|------|------------|------------|
| 数组版 | O(n) | O(n) |
| 滚动变量版 | O(n) | O(1) ⭐ |

## 示例推导

以 `n = 5` 为例：

```
dp[1] = 1  (1)
dp[2] = 2  (1+1, 2)
dp[3] = dp[2] + dp[1] = 2 + 1 = 3  (1+1+1, 1+2, 2+1)
dp[4] = dp[3] + dp[2] = 3 + 2 = 5
dp[5] = dp[4] + dp[3] = 5 + 3 = 8
```

## 面试延伸

如果题目变成：

- **每次可以爬 1、2、3 步** → `dp[i] = dp[i-1] + dp[i-2] + dp[i-3]`
- **有些台阶不能踩** → 遇到禁踩台阶时 `dp[i] = 0`
- **求最小代价** → `dp[i] = min(dp[i-1], dp[i-2]) + cost[i]`

---

**📚 相关题目：** [198-打家劫舍](/zh/docs/algorithms-leetcode-hot100-198-house-robber) - 同属动态规划入门题
