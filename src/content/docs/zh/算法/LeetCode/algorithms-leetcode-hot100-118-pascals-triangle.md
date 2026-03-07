---
title: "118-杨辉三角"
order: 3
section: "算法"
topic: "LeetCode hot100"
lang: "zh"
summary: "经典二维动态规划。每个数等于它左上方和右上方的数的和。理解二维数组的遍历和边界处理。"
icon: "🧠"
featured: false
toc: true
updated: 2026-03-07
---

> 给定一个非负整数 `numRows`，生成「杨辉三角」的前 `numRows` 行。
>
> 在「杨辉三角」中，每个数是它左上方和右上方的数的和。

## 思路：二维动态规划

杨辉三角是**二维动态规划的经典入门题**。

### 状态定义

`dp[i][j]` 表示第 `i` 行第 `j` 列的值（从 0 开始计数）。

### 状态转移方程

```
dp[i][j] = dp[i-1][j-1] + dp[i-1][j]
```

即：当前位置 = 左上方 + 右上方

### 边界条件

- 每行的**第一个元素**和**最后一个元素**都是 1
- 即：`dp[i][0] = 1`，`dp[i][i] = 1`

## 代码实现

```java
class Solution {
    public List<List<Integer>> generate(int numRows) {
        List<List<Integer>> result = new ArrayList<>();
        
        if (numRows <= 0) {
            return result;
        }
        
        // dp[i][j] 表示第 i 行第 j 列的值
        int[][] dp = new int[numRows][numRows];
        
        for (int i = 0; i < numRows; i++) {
            List<Integer> row = new ArrayList<>();
            
            for (int j = 0; j <= i; j++) {
                // 边界条件：每行的开头和结尾都是 1
                if (j == 0 || j == i) {
                    dp[i][j] = 1;
                } else {
                    // 状态转移：左上方 + 右上方
                    dp[i][j] = dp[i - 1][j - 1] + dp[i - 1][j];
                }
                row.add(dp[i][j]);
            }
            
            result.add(row);
        }
        
        return result;
    }
}
```

## 图解示例

以 `numRows = 5` 为例：

```
第 0 行:           1
第 1 行:         1   1
第 2 行:       1   2   1
第 3 行:     1   3   3   1
第 4 行:   1   4   6   4   1
```

每个数的来源：

```
       1
      1 1
     1 2 1    ← 2 = 1 + 1 (左上方 + 右上方)
    1 3 3 1   ← 3 = 1 + 2, 3 = 2 + 1
   1 4 6 4 1  ← 4 = 1 + 3, 6 = 3 + 3, 4 = 3 + 1
```

## 复杂度分析

| 复杂度 | 分析 |
|--------|------|
| **时间复杂度** | O(numRows²) - 需要填充三角形中的所有元素 |
| **空间复杂度** | O(numRows²) - 二维数组存储所有值 |

## 数学性质

杨辉三角有很多有趣的数学性质：

1. **对称性**：每行左右对称
2. **二项式系数**：第 n 行第 k 个数 = C(n,k) = n!/(k!(n-k)!)
3. **每行和**：第 n 行所有数的和 = 2^n
4. **斜对角线**：斜着看是自然数、三角形数等数列

## 面试延伸

如果面试官追问：

- **只求第 n 行** → 可以用一维数组优化空间
- **求第 n 行第 k 个数** → 直接用组合数公式 C(n,k)
- **大数溢出** → 用 `long` 或 `BigInteger`，或者用递推公式避免阶乘

---

**📚 相关题目：** [70-爬楼梯](/zh/docs/algorithms-leetcode-hot100-070-climbing-stairs) - 一维动态规划入门
