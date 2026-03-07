---
title: "075-颜色分类"
order: 6
section: "算法"
topic: "LeetCode hot100"
lang: "zh"
summary: "荷兰国旗问题。使用三指针（left、right、i）一趟扫描完成原地排序，时间 O(n)，空间 O(1)。"
icon: "🧠"
featured: false
toc: true
updated: 2026-03-07
---

> 给定一个包含红色、白色和蓝色、共 `n` 个元素的数组 `nums` ，**原地** 对它们进行排序，使得相同颜色的元素相邻，并按照红色、白色、蓝色顺序排列。
>
> 我们使用整数 `0`、`1` 和 `2` 分别表示红色、白色和蓝色。
>
> **必须在不使用库内置的 sort 函数的情况下解决这个问题。**

## 思路：三指针（荷兰国旗问题）

这是经典的**荷兰国旗问题（Dutch National Flag Problem）**，由 Dijkstra 提出。

### 核心思想

用三个指针将数组分成四个区域：

```
[0...left-1]  : 全部是 0（红色）
[left...i-1]  : 全部是 1（白色）
[i...right]   : 未处理区域
[right+1...n-1]: 全部是 2（蓝色）
```

### 指针定义

| 指针 | 含义 |
|------|------|
| `left` | 指向下一个 0 应该放置的位置 |
| `right` | 指向下一个 2 应该放置的位置 |
| `i` | 当前正在处理的元素 |

### 算法步骤

1. 初始化：`left = 0`, `right = n-1`, `i = 0`
2. 当 `i <= right` 时循环：
   - 如果 `nums[i] == 0`：与 `nums[left]` 交换，`left++`, `i++`
   - 如果 `nums[i] == 1`：`i++`（不用交换，1 自然会在中间）
   - 如果 `nums[i] == 2`：与 `nums[right]` 交换，`right--`（`i` 不增加，因为换来的元素还需要检查）

## 代码实现

```java
class Solution {
    public void sortColors(int[] nums) {
        int n = nums.length;
        int left = 0;      // 指向下一个 0 的位置
        int right = n - 1; // 指向下一个 2 的位置
        int i = 0;         // 当前处理位置
        
        while (i <= right) {
            if (nums[i] == 0) {
                // 当前是 0，交换到左边
                swap(nums, i, left);
                left++;
                i++;
            } else if (nums[i] == 1) {
                // 当前是 1，不用交换，继续
                i++;
            } else {
                // 当前是 2，交换到右边
                swap(nums, i, right);
                right--;
                // 注意：i 不增加，因为从右边换来的元素还需要检查
            }
        }
    }
    
    private void swap(int[] nums, int i, int j) {
        int temp = nums[i];
        nums[i] = nums[j];
        nums[j] = temp;
    }
}
```

## 图解示例

以 `nums = [2, 0, 2, 1, 1, 0]` 为例：

```
初始状态：
[2, 0, 2, 1, 1, 0]
 ↑           ↑
 i,right    left

i=0, nums[0]=2 → 与 right 交换
[0, 0, 2, 1, 1, 2]
 ↑        ↑
 i       right

i=0, nums[0]=0 → 与 left 交换
[0, 0, 2, 1, 1, 2]
 ↑  ↑     ↑
    left  i

i=1, nums[1]=0 → 与 left 交换
[0, 0, 2, 1, 1, 2]
    ↑ ↑   ↑
      left i

i=2, nums[2]=2 → 与 right 交换
[0, 0, 1, 1, 2, 2]
    ↑   ↑ ↑
        i right

i=3, nums[3]=1 → i++
[0, 0, 1, 1, 2, 2]
    ↑     ↑ ↑
          i right

i=4 > right，结束

最终结果：[0, 0, 1, 1, 2, 2] ✅
```

## 为什么 `nums[i] == 2` 时 `i` 不增加？

因为从 `right` 位置交换过来的元素**可能是 0、1、2 中的任意一个**，需要在下一轮继续检查。

而 `nums[i] == 0` 时，从 `left` 交换过来的元素**一定是 1**（因为 `left` 到 `i` 之间都是 1），所以可以直接 `i++`。

## 复杂度分析

| 复杂度 | 分析 |
|--------|------|
| **时间复杂度** | O(n) - 只需一趟扫描 |
| **空间复杂度** | O(1) - 原地排序，只用了常数个变量 |

## 常见错误

| 错误 | 原因 | 修正 |
|------|------|------|
| `nums[i] == 2` 时 `i++` | 换来的元素没检查 | `i` 不增加 |
| 循环条件 `i < right` | 会漏掉 `i == right` 的情况 | 改为 `i <= right` |
| 先 `left++` 再交换 | 逻辑混乱 | 先交换再移动指针 |

## 面试延伸

**Q1: 如果是 4 种颜色怎么办？**

→ 可以用两个 `left` 指针和两个 `right` 指针，或者先按 0/1 分组，再按 2/3 分组。

**Q2: 如果元素不是 0/1/2，而是任意可比较的值？**

→ 这就是快速排序的 `partition` 思想，可以用类似方法进行三路快排。

---

**📚 相关题目：** [169-多数元素](/zh/docs/algorithms-leetcode-hot100-169-majority-element) - 摩尔投票法
