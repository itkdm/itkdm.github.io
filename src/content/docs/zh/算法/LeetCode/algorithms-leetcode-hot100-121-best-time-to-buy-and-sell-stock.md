---
title: "121-买卖股票的最佳时机"
order: 8
section: "算法"
topic: "LeetCode hot100"
lang: "zh"
summary: "使用贪心算法，遍历过程中记录历史最低价，计算每天卖出能获得的最大利润。"
icon: "📈"
featured: false
toc: true
updated: 2026-02-04
---

>给定一个数组 `prices` ，它的第 `i` 个元素 `prices[i]` 表示一支给定股票第 `i` 天的价格。
>
>你只能选择 **某一天** 买入这只股票，并选择在 **未来的某一个不同的日子** 卖出该股票。设计一个算法来计算你所能获取的最大利润。
>
>返回你可以从这笔交易中获取的最大利润。如果你不能获取任何利润，返回 `0` 。

**示例 1：**

```
输入：[7,1,5,3,6,4]
输出：5
解释：在第 2 天（股票价格 = 1）的时候买入，在第 5 天（股票价格 = 6）的时候卖出，最大利润 = 6-1 = 5 。
     注意利润不能是 7-1 = 6, 因为卖出价格需要大于买入价格；同时，你不能在买入前卖出股票。
```

**示例 2：**

```
输入：prices = [7,6,4,3,1]
输出：0
解释：在这种情况下, 没有交易完成, 所以最大利润为 0。
```

```JAVA
class Solution {
    public int maxProfit(int[] prices) {
        int minPrice = Integer.MAX_VALUE; // 记录历史最低价（最适合买入价）
        int maxProfit = 0;                // 记录最大利润，默认 0（不交易）

        for (int p : prices) {            // 遍历每天价格 p
            if (p < minPrice) {           // 如果今天更便宜
                minPrice = p;             // 更新最低价：假设今天买入更划算
            } else {
                maxProfit = Math.max(maxProfit, p - minPrice);
                // 否则：尝试今天卖出
                // p - minPrice 是 "用历史最低价买入、今天卖出"的利润
            }
        }
        return maxProfit;
    }
}
```

