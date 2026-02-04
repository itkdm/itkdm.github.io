---
title: "215 - Kth Largest Element in an Array"
order: 10
section: "Algorithms"
topic: "LeetCode hot100"
lang: "en"
summary: "Use Quickselect (randomized partition) to find the k-th largest element in expected O(n) time."
icon: "🎯"
featured: false
toc: true
updated: 2026-02-03
---

> Given an integer array `nums` and an integer `k`, return the **k**-th largest element in the array.  
> Note that it is the k-th largest element in the **sorted order**, not the k-th distinct element.  
> Follow-up: Can you solve it in \(O(n)\) time complexity?

## Idea: Quickselect

This is basically “quicksort’s partition step”, but we **only recurse/iterate on one side**.

- Convert “k-th largest” into “index `len - k` in the ascending sorted array”.
- Each `partition` puts a `pivot` into its final position `j`:
  - `<= pivot` on the left, `>= pivot` on the right.
- If `j == targetIndex`, we’re done; otherwise, only continue on the left or right side.

Expected time complexity is \(O(n)\), space complexity is \(O(1)\) (in-place swaps).

## Java implementation

```java
import java.util.Random;

class Solution {
    // Random number generator: used to pick a pivot to avoid O(n^2) on bad inputs
    private static final Random rand = new Random();

    public int findKthLargest(int[] nums, int k) {
        int len = nums.length;

        // “k-th largest” -> index (len - k) in ascending order
        int targetIndex = len - k;

        // current search range [left, right]
        int left = 0;
        int right = len - 1;

        // keep partitioning until pivot lands on targetIndex
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
     * Do one Hoare-style partition on [left, right]:
     * return the final index j of the pivot.
     */
    private int partion(int[] nums, int left, int right) {
        // 1) randomly pick a pivot index and move the pivot to the far left
        int i = left + rand.nextInt(right - left + 1);
        int pivot = nums[i];
        swap(nums, i, left);

        // 2) two-pointer scan on [left+1, right]
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

        // 3) place pivot back to its final position j
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

## Two common questions 

### 1) Why pick the pivot randomly?

- **Avoid worst cases**: If you always pick a fixed position (e.g. `left`), nearly sorted arrays can make each partition shrink by only 1 element, degrading to \(O(n^2)\).
- **Random is more stable**: a random pivot makes “reasonably balanced cuts” much more likely, so the *expected* time is \(O(n)\).

### 2) Why move the pivot to the left first?

- **Less bookkeeping**: once the pivot is fixed at `left`, the two pointers only need to scan `[left+1, right]` and never “accidentally” touch the pivot.
- **Simple cleanup**: after partitioning, `j` is exactly where the pivot should go, so `swap(left, j)` finishes the step neatly.

