---
title: "198-打家劫舍"
order: 4
section: "算法"
topic: "LeetCode hot100"
lang: "zh"
summary: "经典动态规划。不能偷相邻房屋，求最大金额。状态转移：dp[i] = max(dp[i-1], dp[i-2] + nums[i])。"
icon: "🧠"
featured: false
toc: true
updated: 2026-03-07
---

> 你是一个专业的小偷，计划偷窃沿街的房屋。每间房内都藏有一定的现金，影响你偷窃的唯一制约因素就是相邻的房屋装有相互连通的防盗系统，**如果两间相邻的房屋在同一晚上被小偷闯入，系统会自动报警**。
>
> 给定一个代表每个房屋存放金额的非负整数数组，计算你 **不触动警报装置的情况下** ，一夜之内能够偷窃到的最高金额。

## 思路：动态规划

这是**动态规划的经典题目**，核心是「不能选相邻元素，求最大和」。

### 状态定义

`dp[i]` 表示偷到第 `i` 个房屋时能获得的最大金额。

### 状态转移方程

对于第 `i` 个房屋，有两种选择：

1. **不偷第 i 个** → 最大金额 = `dp[i-1]`（保持前一个房屋的最大值）
2. **偷第 i 个** → 最大金额 = `dp[i-2] + nums[i]`（不能偷第 i-1 个）

取两者最大值：**`dp[i] = max(dp[i-1], dp[i-2] + nums[i])`**

### 边界条件

- 只有 1 个房屋：`dp[0] = nums[0]`
- 有 2 个房屋：`dp[1] = max(nums[0], nums[1])`

## 代码实现

### 方法一：动态规划（数组版）

```java
class Solution {
    public int rob(int[] nums) {
        int n = nums.length;
        
        // 边界条件
        if (n == 1) return nums[0];
        if (n == 2) return Math.max(nums[0], nums[1]);
        
        // dp[i] 表示偷到第 i 个房屋时的最大金额
        int[] dp = new int[n];
        dp[0] = nums[0];
        dp[1] = Math.max(nums[0], nums[1]);
        
        // 从第 3 个房屋开始递推
        for (int i = 2; i < n; i++) {
            dp[i] = Math.max(dp[i - 1], dp[i - 2] + nums[i]);
        }
        
        return dp[n - 1];
    }
}
```

### 方法二：空间优化（滚动变量）⭐推荐

由于 `dp[i]` 只依赖于 `dp[i-1]` 和 `dp[i-2]`，可以用两个变量代替数组：

```java
class Solution {
    public int rob(int[] nums) {
        int n = nums.length;
        
        if (n == 1) return nums[0];
        if (n == 2) return Math.max(nums[0], nums[1]);
        
        // 用两个变量代替数组
        int prev2 = nums[0];                    // dp[i-2]
        int prev1 = Math.max(nums[0], nums[1]); // dp[i-1]
        
        for (int i = 2; i < n; i++) {
            int current = Math.max(prev1, prev2 + nums[i]);
            prev2 = prev1;
            prev1 = current;
        }
        
        return prev1;
    }
}
```

## 示例推导

以 `nums = [2, 7, 9, 3, 1]` 为例：

```
房屋索引：0   1   2   3   4
房屋金额：2   7   9   3   1

dp[0] = 2
dp[1] = max(2, 7) = 7
dp[2] = max(dp[1], dp[0] + 9) = max(7, 2+9) = 11
dp[3] = max(dp[2], dp[1] + 3) = max(11, 7+3) = 11
dp[4] = max(dp[3], dp[2] + 1) = max(11, 11+1) = 12

最终结果：12（偷房屋 0、2、4：2 + 9 + 1 = 12）
```

## 复杂度分析

| 方法 | 时间复杂度 | 空间复杂度 |
|------|------------|------------|
| 数组版 | O(n) | O(n) |
| 滚动变量版 | O(n) | O(1) ⭐ |

## 面试延伸

这个系列还有进阶题目：

| 题目 | 变化 |
|------|------|
| **打家劫舍 I** | 线性房屋（本题） |
| **打家劫舍 II** | 房屋围成一圈，首尾相邻 |
| **打家劫舍 III** | 房屋是二叉树结构 |

**环形房屋思路：** 分成两种情况取最大值
- 不偷第 1 个房屋：计算 `nums[1...n-1]`
- 不偷最后 1 个房屋：计算 `nums[0...n-2]`

---

**📚 相关题目：** [70-爬楼梯](/zh/docs/algorithms-leetcode-hot100-070-climbing-stairs) - 动态规划入门
