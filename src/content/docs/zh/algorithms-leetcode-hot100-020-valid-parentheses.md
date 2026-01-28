---
title: "020-有效的括号"
order: 1
section: "算法"
topic: "LeetCode hot100"
lang: "zh"
summary: "使用栈（ArrayDeque）与 Map 判断括号字符串是否有效，并解释为什么更推荐用 Deque 而不是老旧的 Stack。"
icon: "🧠"
featured: false
toc: true
updated: 2026-01-27
---

> 给定一个只包括 `'('`，`')'`，`'{'`，`'}'`，`'['`，`']'` 的字符串 `s` ，判断字符串是否有效。
>
> 有效字符串需满足：
>
> 1. 左括号必须用相同类型的右括号闭合。
> 2. 左括号必须以正确的顺序闭合。
> 3. 每个右括号都有一个对应的相同类型的左括号。

## 思路：用栈匹配成对括号

- **左括号**：入栈，等待后面出现与之匹配的右括号。
- **右括号**：必须与「当前栈顶的左括号」匹配，否则字符串无效。

另外有两个剪枝：

- 字符串长度如果是奇数，肯定不可能全部成对闭合，直接返回 `false`。
- 遍历结束后，如果栈还不为空，说明还有多余的左括号，也是不合法的。

## 代码实现

```java
class Solution {
    public boolean isValid(String s) {
        // 计算字符串长度
        int len = s.length();
        // 如果字符串长度为奇数，必然有一个不能闭合
        if (len % 2 == 1) {
            return false;
        }
        // 左右括号成对，适合用 map 数据结构来存储
        Map<Character, Character> map = new HashMap<>();
        map.put('(', ')');
        map.put('{', '}');
        map.put('[', ']');

        // 用栈来存储左括号，栈顶就应该有最近的右括号匹配
        Deque<Character> stack = new ArrayDeque<>();
        // 遍历整个字符串
        for (int i = 0; i < len; i++) {
            // 获取当前字符
            char ch = s.charAt(i);
            // 当前字符属于左括号
            if (map.containsKey(ch)) {
                // 入栈
                stack.push(ch);
            } else {
                // 当前字符属于右括号，进行匹配
                // 栈为空或者当前字符和栈顶括号不匹配，说明不符合，直接返回 false
                if (stack.isEmpty() || ch != map.get(stack.peek())) {
                    return false;
                }
                // 成功匹配一对，将当前栈顶元素弹出
                stack.pop();
            }
        }
        // 如果栈中有剩余那么不符合要求，为空说明匹配完成并且没有剩余
        return stack.isEmpty();
    }
}
```

## 为什么用 `Deque`（`ArrayDeque`），而不直接用 `Stack`？

- **`Stack` 是老设计（遗留类）**
  - `Stack` 继承自 `Vector`，属于早期 Java 集合框架产物。
  - `Vector` 的很多方法是同步的（`synchronized`），设计上偏「线程安全容器」，解算法题并不需要。
- **`Stack` 的同步开销通常是多余的**
  - `Stack` 的 `push/pop/peek` 都带同步，属于没有必要的成本。
- **`ArrayDeque` 当栈更快、更省内存**
  - `ArrayDeque` 用数组实现，连续内存，局部性更好，性能通常更好。

在 LeetCode 等算法题场景下，推荐：

- 接口使用 `Deque<E>`（更通用，既可以当栈也可以当队列）
- 实现类使用 `ArrayDeque<E>` 作为栈的替代。

