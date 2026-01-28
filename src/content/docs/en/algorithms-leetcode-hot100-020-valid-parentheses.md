---
title: "LeetCode Hot 100: 020 - Valid Parentheses"
order: 1
section: "Algorithms"
topic: "LeetCode hot100"
lang: "en"
summary: "Use a stack (ArrayDeque) plus a map to validate a parentheses string, and see why Deque is preferred over the legacy Stack."
icon: "🧠"
featured: false
toc: true
updated: 2026-01-27
---

> Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['`, `']'`, determine if the input string is valid.
>
> A valid string must satisfy:
>
> 1. Left brackets must be closed by the same type of right brackets.
> 2. Left brackets must be closed in the correct order.
> 3. Every right bracket has a corresponding left bracket of the same type.

## Idea: Use a stack to match bracket pairs

- **Left brackets**: push onto the stack and wait for a matching right bracket later.
- **Right brackets**: must match the type of the **top element of the stack**, otherwise the string is invalid.

Two simple pruning rules:

- If the string length is odd, it cannot be fully matched → immediately return `false`.
- After traversing the whole string, if the stack is not empty, there are unmatched left brackets → invalid.

## Java implementation

```java
class Solution {
    public boolean isValid(String s) {
        // length of the string
        int len = s.length();
        // odd length => impossible to be fully matched
        if (len % 2 == 1) {
            return false;
        }
        // map each left bracket to its corresponding right bracket
        Map<Character, Character> map = new HashMap<>();
        map.put('(', ')');
        map.put('{', '}');
        map.put('[', ']');

        // use a stack to store left brackets, top should match the next right bracket
        Deque<Character> stack = new ArrayDeque<>();
        // scan the whole string
        for (int i = 0; i < len; i++) {
            char ch = s.charAt(i);
            // left bracket
            if (map.containsKey(ch)) {
                stack.push(ch);
            } else {
                // right bracket: check match
                // if stack is empty or top doesn't match this right bracket -> invalid
                if (stack.isEmpty() || ch != map.get(stack.peek())) {
                    return false;
                }
                // matched one pair, pop the top
                stack.pop();
            }
        }
        // valid only when no unmatched left brackets remain
        return stack.isEmpty();
    }
}
```

## Why `Deque` (`ArrayDeque`) instead of `Stack`?

- **`Stack` is a legacy design**
  - `Stack` extends `Vector`, which is an early collection type in the Java ecosystem.
  - Many methods in `Vector` are synchronized, aiming for thread safety, which is unnecessary for typical algorithm problems.
- **Synchronization overhead in `Stack` is usually wasted**
  - `push` / `pop` / `peek` are all synchronized, which adds overhead with no benefit in single-threaded scenarios like LeetCode.
- **`ArrayDeque` as a stack is faster and more memory-friendly**
  - `ArrayDeque` is backed by an array with contiguous memory, which gives better cache locality and performance in practice.

So in competitive programming / interview problems, the common recommendation is:

- Use `Deque<E>` as the interface (so it can act as a stack or a queue).
- Use `ArrayDeque<E>` as the implementation when you need a stack.

