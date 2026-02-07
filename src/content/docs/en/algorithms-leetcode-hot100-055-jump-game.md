---
title: "LeetCode Hot 100: 055 - Jump Game"
order: 9
section: "Algorithms"
topic: "LeetCode hot100"
lang: "en"
summary: "Greedy approach: maintain the farthest reachable position from the start, and check if we can reach the last index."
icon: "🏃"
featured: false
toc: true
updated: 2026-02-06
---

> You are given an integer array `nums`. You are initially positioned at the array's **first index**, and each element in the array represents your maximum jump length at that position.
>
> Return `true` if you can reach the last index, or `false` otherwise.

**Example 1:**

```
Input: nums = [2,3,1,1,4]
Output: true
Explanation: Jump 1 step from index 0 to 1, then 3 steps to the last index.
```

**Example 2:**

```
Input: nums = [3,2,1,0,4]
Output: false
Explanation: You will always arrive at index 3 no matter what. Its maximum jump length is 0, which makes it impossible to reach the last index.
```

## Idea: Greedy algorithm

Core idea: maintain a variable `maxReach` that represents the **farthest index reachable** from the start.

- Traverse the array, for each position `i`:
  - If `i > maxReach`, this position is unreachable (there's a gap), return `false`.
  - Otherwise, update `maxReach = Math.max(maxReach, i + nums[i])`.
  - If `maxReach >= nums.length - 1`, we can already reach the last index, return `true`.

## Java implementation

```java
public class JumpGame {
    public boolean canJump(int[] nums) {
        // maxReach: the farthest index reachable from the start
        int maxReach = 0;

        // traverse from index 0
        for (int i = 0; i < nums.length; i++) {

            // if i exceeds the farthest reachable position
            // this position is unreachable (there's a gap)
            if (i > maxReach) {
                return false;
            }

            // update the farthest reachable position
            maxReach = Math.max(maxReach, i + nums[i]);

            // if we can already reach the last index, success
            if (maxReach >= nums.length - 1) {
                return true;
            }
        }

        // if we finish traversal without reaching the end, failure
        return false;
    }
}
```

## Complexity analysis

- **Time complexity**: O(n), only one pass through the array.
- **Space complexity**: O(1), only constant extra space is used.
