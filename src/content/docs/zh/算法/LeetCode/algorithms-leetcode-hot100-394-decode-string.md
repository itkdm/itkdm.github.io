---
title: "394-字符串解码"
order: 3
section: "算法"
topic: "LeetCode hot100"
lang: "zh"
summary: "解析 k[encoded_string] 编码规则，使用双栈保存重复次数与字符串上下文，支持嵌套括号并在 O(n) 时间内完成解码。"
icon: "🧩"
featured: false
toc: true
updated: 2026-01-28
---

> 给定一个经过编码的字符串，返回它解码后的字符串。
>
> 编码规则为: `k[encoded_string]`，表示其中方括号内部的 `encoded_string` 正好重复 `k` 次。注意 `k` 保证为正整数。
>
> 你可以认为输入字符串总是有效的；输入字符串中没有额外的空格，且输入的方括号总是符合格式要求的。
>
> 此外，你可以认为原始数据不包含数字，所有的数字只表示重复的次数 `k` ，例如不会出现像 `3a` 或 `2[4]` 的输入。
>
> 测试用例保证输出的长度不会超过 \(10^5\)。

## 思路：双栈（次数栈 + 字符串栈）

- **次数栈**：保存每一层括号对应的重复次数 `k`
- **字符串栈**：保存进入当前括号层之前已经构建好的外层字符串

遍历字符串：

- **数字**：解析多位数 `k`（`num = num * 10 + digit`）
- **`[`**：把 `num` 和当前已构建的 `cur` 入栈，进入新一层；并重置 `num`、`cur`
- **`]`**：出栈得到 `k` 和外层字符串 `prev`，把当前 `cur` 重复 `k` 次追加到 `prev`，并让 `cur = prev`
- **字母**：直接追加到 `cur`

## 代码实现

```java
class Solution {
    public String decodeString(String s) {
        // numStack：用来保存“每一层括号对应的重复次数 k”
        // 例如遇到 "3[...]" 时，把 3 压栈；遇到 ']' 时再弹出来使用
        Stack<Integer> numStack = new Stack<>();

        // strStack：用来保存“进入当前括号层之前已经构建好的字符串（外层字符串）”
        // 因为遇到 '[' 后，接下来会开始构建括号内的内容，外层 cur 需要先存起来
        Stack<StringBuilder> strStack = new Stack<>();

        // num：当前正在解析的重复次数（可能是多位数）
        // 例如读到字符 '1' '2'，最终 num 会变成 12
        int num = 0;

        // cur：当前层正在构建的字符串（括号内/外都可能）
        // 用 StringBuilder 是为了高效拼接（比 String + 更省时间和内存）
        StringBuilder cur = new StringBuilder();

        // 逐字符扫描输入字符串
        for (char ch : s.toCharArray()) {

            // 情况1：当前字符是数字，说明正在读重复次数 k
            if (Character.isDigit(ch)) {
                // 处理多位数的关键逻辑：
                // 假设 num 已经读到 1，再读到 '2'：num = 1*10 + 2 = 12
                num = num * 10 + (ch - '0');

                // 情况2：遇到 '['，表示一个 k[...] 的开始
            } else if (ch == '[') {
                // 进入新括号层之前，必须把“外层状态”保存起来：
                // 1) 保存这一层括号的重复次数 k
                numStack.push(num);

                // 2) 保存进入括号前已构建的字符串（外层 cur）
                //    例如 "ab3[...]"，这里要保存 "ab"
                strStack.push(cur);

                // 开始构建括号内部的字符串：
                // num 归零，准备读取括号内可能出现的新数字（用于更深层嵌套）
                num = 0;

                // cur 换成一个新的 StringBuilder，用来专门收集当前括号内的内容
                cur = new StringBuilder();

                // 情况3：遇到 ']'，表示当前括号层结束，需要“出栈并展开”
            } else if (ch == ']') {
                // 当前层结束后，取出这一层的重复次数 k
                int k = numStack.pop();

                // 取出进入这一层之前的字符串 prev（外层字符串）
                StringBuilder prev = strStack.pop();

                // 把当前层构建好的字符串 cur 重复 k 次，拼接到 prev 后面
                // 例如 prev="ab"，cur="c"，k=3 => prev 变成 "abccc"
                for (int i = 0; i < k; i++) {
                    prev.append(cur);
                }

                // 拼接完成后，cur 应该变成“回到外层后的结果”
                // 这样后续如果还有字符，会继续在外层结果后追加
                cur = prev;

                // 情况4：普通字母（题目保证原始数据不含数字，所以这里就是字母）
            } else {
                // 字母直接追加到当前层的 cur 中
                cur.append(ch);
            }
        }

        // 扫描结束后，cur 就是完整解码结果
        return cur.toString();
    }
}
```

## 备注：`Stack` vs `Deque`

上面用 `Stack` 能 AC；如果想写得更现代一些，可以把两个栈都换成 `Deque`（例如 `ArrayDeque`）来实现同样的逻辑。

