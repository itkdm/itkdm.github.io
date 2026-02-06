---
title: "LeetCode Hot 100: 121 - Best Time to Buy and Sell Stock"
order: 8
section: "Algorithms"
topic: "LeetCode hot100"
lang: "en"
summary: "Greedy scan: track the minimum price so far, and update the best profit if selling today is better."
icon: "📈"
featured: false
toc: true
updated: 2026-02-04
---

> You are given an array `prices` where `prices[i]` is the price of a given stock on the \(i\)-th day.
>
> You want to maximize your profit by choosing **a single day** to buy one stock and choosing **a different day in the future** to sell that stock.
>
> Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return `0`.

## Greedy idea

While scanning the array:

- Keep `minPrice`: the minimum price seen so far (best day to buy up to today).
- For each price `p`, the best profit if we sell today is `p - minPrice`.
- Track the maximum of those profits.

This is \(O(n)\) time and \(O(1)\) extra space.

## Java implementation

```java
class Solution {
    public int maxProfit(int[] prices) {
        int minPrice = Integer.MAX_VALUE; // minimum so far (best buy)
        int maxProfit = 0;                // best profit so far (default 0)

        for (int p : prices) {
            if (p < minPrice) {
                minPrice = p;             // cheaper buy day found
            } else {
                // try selling today
                maxProfit = Math.max(maxProfit, p - minPrice);
            }
        }
        return maxProfit;
    }
}
```

