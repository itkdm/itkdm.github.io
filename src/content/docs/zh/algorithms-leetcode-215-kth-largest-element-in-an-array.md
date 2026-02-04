---
title: "215-数组中第k个最大元素"
order: 10
section: "算法"
topic: "LeetCode hot100"
lang: "zh"
summary: "用 Quickselect（随机化分区）在期望 O(n) 时间内找到第 k 大元素。"
icon: "🎯"
featured: false
toc: true
updated: 2026-02-03
---

> 给定整数数组 `nums` 和整数 `k`，请返回数组中第 **k** 个最大的元素。  
> 注意：你需要找的是数组排序后的第 `k` 个最大的元素，而不是第 `k` 个不同的元素。  
> 要求：设计并实现时间复杂度为 \(O(n)\) 的算法。

## 思路：Quickselect（快速选择）

核心就是“快速排序的 partition”，但**只递归/迭代一侧**。

- 把“第 k 大”转换成“升序排序后下标为 `len - k` 的元素”。
- 每次 `partition` 把一个 `pivot` 放到它的最终位置 `j`：
  - `<= pivot` 在左边，`>= pivot` 在右边。
- 如果 `j == targetIndex`，直接返回；否则只去 `j` 的左半或右半继续找。

期望时间复杂度 \(O(n)\)，空间复杂度 \(O(1)\)（原地交换）。

## 代码实现（Java）

```java
import java.util.Random;

class Solution {
    // 随机数生成器：用于随机选择 pivot，避免在某些特殊数据上退化到 O(n^2)
    private static final Random rand = new Random();

    public int findKthLargest(int[] nums, int k) {
        int len = nums.length;

        // 把“第 k 大”转换为“升序排序后下标为 len-k 的元素”
        int targetIndex = len - k;

        // 当前处理的子数组范围 [left, right]
        int left = 0;
        int right = len - 1;

        // 不断在子数组中做划分，直到 pivot 的最终位置正好等于 targetIndex
        while (true) {
            int i = partion(nums, left, right);
            if (i == targetIndex) {
                return nums[i];
            } else if (i > targetIndex) {
                right = i - 1;
            } else {
                left = i + 1;
            }
        }
    }

    /**
     * 在子数组 [left, right] 上做一次划分（Hoare 风格）：
     * 返回 pivot 的最终下标 j
     */
    private int partion(int[] nums, int left, int right) {
        // 1) 随机选 pivot 下标，并把 pivot 交换到最左边
        int i = left + rand.nextInt(right - left + 1);
        int pivot = nums[i];
        swap(nums, i, left);

        // 2) 双指针扫描 [left+1, right]
        i = left + 1;
        int j = right;
        while (true) {
            while (i <= j && nums[i] < pivot) i++;
            while (i <= j && nums[j] > pivot) j--;
            if (i >= j) break;
            swap(nums, i, j);
            i++;
            j--;
        }

        // 3) pivot 放回最终位置 j
        swap(nums, j, left);
        return j;
    }

    private void swap(int[] nums, int a, int b) {
        int temp = nums[a];
        nums[a] = nums[b];
        nums[b] = temp;
    }
}
```

## 两个常见问题

### 1）为什么要随机选 pivot？

- **防止退化**：如果总选固定位置（如 `left`），遇到接近有序等数据时，partition 可能每次只缩小 1 个元素，时间变成 \(O(n^2)\)。
- **随机更稳**：随机 pivot 让“切分比较均衡”的概率更高，整体期望时间是 \(O(n)\)。

### 2）为什么把 pivot 先换到最左边？

- **省心**：把 pivot 固定在 `left`，双指针只扫描 `[left+1, right]`，不会“误操作”到 pivot。
- **收尾简单**：分区结束后 `j` 就是 pivot 该去的位置，直接 `swap(left, j)` 即可。

