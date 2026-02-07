---
title: "LeetCode Hot 100: 394 - Decode String"
order: 3
section: "Algorithms"
topic: "LeetCode hot100"
lang: "en"
summary: "Parse k[encoded_string] encoding rules using dual stacks to store repetition counts and string context, supporting nested brackets and decoding in O(n) time."
icon: "🧩"
featured: false
toc: true
updated: 2026-01-28
---

> Given an encoded string, return its decoded string.
>
> The encoding rule is: `k[encoded_string]`, where the `encoded_string` inside the square brackets is being repeated exactly `k` times. Note that `k` is guaranteed to be a positive integer.
>
> You may assume that the input string is always valid; there are no extra white spaces, square brackets are well-formed, etc.
>
> Furthermore, you may assume that the original data does not contain any digits and that digits are only for those repeat numbers, `k`. For example, there will not be input like `3a` or `2[4]`.
>
> The test cases are generated so that the length of the output will never exceed \(10^5\).

## Idea: Dual stacks (count stack + string stack)

- **Count stack**: stores the repetition count `k` for each bracket level
- **String stack**: stores the outer string already built before entering the current bracket level

Traverse the string:

- **Digits**: parse multi-digit `k` (`num = num * 10 + digit`)
- **`[`**: push `num` and current `cur` onto stacks, enter a new level; reset `num` and `cur`
- **`]`**: pop `k` and outer string `prev`, append `cur` repeated `k` times to `prev`, set `cur = prev`
- **Letters**: directly append to `cur`

## Java implementation

```java
class Solution {
    public String decodeString(String s) {
        // numStack: stores "repetition count k for each bracket level"
        // For example, when encountering "3[...]", push 3; pop when encountering ']'
        Stack<Integer> numStack = new Stack<>();

        // strStack: stores "string already built before entering current bracket level (outer string)"
        // Because after encountering '[', we'll start building content inside brackets, outer cur needs to be saved first
        Stack<StringBuilder> strStack = new Stack<>();

        // num: repetition count currently being parsed (may be multi-digit)
        // For example, reading characters '1' '2', num will eventually become 12
        int num = 0;

        // cur: string currently being built at current level (may be inside or outside brackets)
        // Use StringBuilder for efficient concatenation (saves time and memory compared to String +)
        StringBuilder cur = new StringBuilder();

        // Scan input string character by character
        for (char ch : s.toCharArray()) {

            // Case 1: current character is a digit, reading repetition count k
            if (Character.isDigit(ch)) {
                // Key logic for multi-digit numbers:
                // Suppose num has already read 1, then reading '2': num = 1*10 + 2 = 12
                num = num * 10 + (ch - '0');

                // Case 2: encountering '[', indicates start of k[...]
            } else if (ch == '[') {
                // Before entering new bracket level, must save "outer state":
                // 1) Save repetition count k for this bracket level
                numStack.push(num);

                // 2) Save string already built before brackets (outer cur)
                //    For example "ab3[...]", save "ab" here
                strStack.push(cur);

                // Start building string inside brackets:
                // Reset num to 0, ready to read new digits that may appear inside (for deeper nesting)
                num = 0;

                // cur becomes a new StringBuilder, specifically for collecting content inside current brackets
                cur = new StringBuilder();

                // Case 3: encountering ']', indicates end of current bracket level, need to "pop and expand"
            } else if (ch == ']') {
                // After current level ends, get repetition count k for this level
                int k = numStack.pop();

                // Get string prev before entering this level (outer string)
                StringBuilder prev = strStack.pop();

                // Repeat current level's built string cur k times, append to prev
                // For example prev="ab", cur="c", k=3 => prev becomes "abccc"
                for (int i = 0; i < k; i++) {
                    prev.append(cur);
                }

                // After concatenation, cur should become "result after returning to outer level"
                // This way, if there are more characters later, they'll continue appending after outer result
                cur = prev;

                // Case 4: regular letters (problem guarantees original data contains no digits, so these are letters)
            } else {
                // Letters directly append to cur at current level
                cur.append(ch);
            }
        }

        // After scanning, cur is the complete decoded result
        return cur.toString();
    }
}
```

## Note: `Stack` vs `Deque`

Using `Stack` above can AC; if you want to write more modernly, you can replace both stacks with `Deque` (e.g., `ArrayDeque`) to implement the same logic.
