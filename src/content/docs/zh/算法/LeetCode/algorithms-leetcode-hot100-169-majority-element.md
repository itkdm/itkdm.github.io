---
title: "169-多数元素"
order: 5
section: "算法"
topic: "LeetCode hot100"
lang: "zh"
summary: "找出现次数超过 n/2 的元素。摩尔投票法（Boyer-Moore Voting）是最优解，时间 O(n)，空间 O(1)。"
icon: "🧠"
featured: false
toc: true
updated: 2026-03-07
---

> 给定一个大小为 `n` 的数组 `nums` ，返回其中的多数元素。多数元素是指在数组中出现次数 **大于** `⌊ n/2 ⌋` 的元素。
>
> 你可以假设数组是非空的，并且给定的数组总是存在多数元素。

## 思路分析

这道题有多种解法，从易到难：

### 方法一：哈希表计数（直观）

用 HashMap 统计每个元素出现的次数，超过 n/2 的就是答案。

```java
class Solution {
    public int majorityElement(int[] nums) {
        Map<Integer, Integer> countMap = new HashMap<>();
        int n = nums.length;
        
        for (int num : nums) {
            countMap.put(num, countMap.getOrDefault(num, 0) + 1);
            if (countMap.get(num) > n / 2) {
                return num;
            }
        }
        
        return -1; // 不会执行，题目保证有解
    }
}
```

- 时间复杂度：O(n)
- 空间复杂度：O(n)

### 方法二：摩尔投票法（Boyer-Moore Voting）⭐最优

**核心思想：** 把多数元素和其他元素「一换一」抵消，最后剩下的一定是多数元素。

**算法步骤：**

1. 维护一个候选元素 `candidate` 和计数器 `count`
2. 遍历数组：
   - 如果 `count == 0`，更新 `candidate` 为当前元素
   - 如果当前元素 == `candidate`，`count++`
   - 否则 `count--`
3. 最后的 `candidate` 就是多数元素

```java
class Solution {
    public int majorityElement(int[] nums) {
        int candidate = 0;
        int count = 0;
        
        for (int num : nums) {
            // 计数器为 0，更换候选元素
            if (count == 0) {
                candidate = num;
            }
            
            // 相同则计数 +1，不同则 -1
            if (num == candidate) {
                count++;
            } else {
                count--;
            }
        }
        
        return candidate;
    }
}
```

## 摩尔投票法图解

以 `nums = [2, 2, 1, 1, 1, 2, 2]` 为例：

```
索引  元素  candidate  count  说明
0     2      2         1     count=0，选 2 为候选，count+1
1     2      2         2     相同，count+1
2     1      2         1     不同，count-1
3     1      2         0     不同，count-1，count 归零
4     1      1         1     count=0，换 1 为候选，count+1
5     2      1         0     不同，count-1，count 归零
6     2      2         1     count=0，换 2 为候选，count+1

最终候选：2 ✅（确实是多数元素，出现 4 次 > 7/2）
```

## 为什么摩尔投票法有效？

**关键前提：** 多数元素出现次数 > n/2

- 每次 `count--` 相当于「多数元素 1 个 + 其他元素 1 个」配对抵消
- 由于多数元素超过一半，即使最坏情况（每次都和多数元素抵消），最后也会剩下至少 1 个多数元素

## 复杂度对比

| 方法 | 时间复杂度 | 空间复杂度 | 推荐度 |
|------|------------|------------|--------|
| 哈希表 | O(n) | O(n) | ⭐⭐⭐ |
| 排序法 | O(n log n) | O(1) | ⭐⭐ |
| 摩尔投票 | O(n) | O(1) | ⭐⭐⭐⭐⭐ |

## 面试延伸

如果面试官追问：

**Q1: 如果不保证一定有多数元素怎么办？**

→ 最后再遍历一遍数组，验证 `candidate` 的出现次数是否真的 > n/2

**Q2: 找出现次数 > n/3 的元素？**

→ 扩展摩尔投票法，维护**两个**候选元素（因为最多只能有 2 个元素出现次数 > n/3）

```java
// 找所有出现次数 > n/3 的元素
public List<Integer> majorityElement(int[] nums) {
    int candidate1 = 0, candidate2 = 0;
    int count1 = 0, count2 = 0;
    
    // 第一遍：找出两个候选
    for (int num : nums) {
        if (count1 > 0 && num == candidate1) {
            count1++;
        } else if (count2 > 0 && num == candidate2) {
            count2++;
        } else if (count1 == 0) {
            candidate1 = num;
            count1 = 1;
        } else if (count2 == 0) {
            candidate2 = num;
            count2 = 1;
        } else {
            count1--;
            count2--;
        }
    }
    
    // 第二遍：验证候选元素
    List<Integer> result = new ArrayList<>();
    // ... 验证代码略
    return result;
}
```

---

**📚 相关题目：** [75-颜色分类](/zh/docs/algorithms-leetcode-hot100-075-sort-colors) - 双指针经典题
