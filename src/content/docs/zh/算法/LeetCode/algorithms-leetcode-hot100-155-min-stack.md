---
title: "155-最小栈"
order: 2
section: "算法"
topic: "LeetCode hot100"
lang: "zh"
summary: "设计一个支持 push、pop、top 操作，并能在常数时间内检索到最小元素的栈，使用双栈（数据栈+辅助栈）实现。"
icon: "📚"
featured: false
toc: true
updated: 2026-01-27
---

> 设计一个支持 `push` ，`pop` ，`top` 操作，并能在常数时间内检索到最小元素的栈。
>
> 实现 `MinStack` 类:
>
> - `MinStack()` 初始化堆栈对象。
> - `void push(int val)` 将元素val推入堆栈。
> - `void pop()` 删除堆栈顶部的元素。
> - `int top()` 获取堆栈顶部的元素。
> - `int getMin()` 获取堆栈中的最小元素。

## 思路：双栈实现

使用两个栈：
- **数据栈**：正常存放所有数据
- **辅助栈**：存放每个时刻的最小值

关键点：
- 每次 `push` 时，辅助栈同步 push 当前最小值
- 每次 `pop` 时，两个栈同步 pop
- `getMin()` 直接返回辅助栈栈顶元素，时间复杂度 O(1)

## 代码实现

```java
class MinStack {
    //正常存放数据的栈
    Deque<Integer> data;
    //存放最小值的辅助栈
    Deque<Integer> mins;

    //初始化
    public MinStack() {
        data = new ArrayDeque<>();
        mins = new ArrayDeque<>();
    }
    
    //入栈
    public void push(int val) {
        //数据栈直接push
        data.push(val);
        //辅助栈如果为空也直接push
        if(mins.isEmpty()){
            mins.push(val);
        }else{
            //否则就要取最小值
            mins.push(Math.min(val,mins.peek()));
        }
    }
    
    //出栈
    public void pop() {
        data.pop();
        mins.pop();
    }
    
    //获取数据栈栈顶元素
    public int top() {
        return data.peek();
    }
    //获取辅助栈栈顶元素
    public int getMin() {
        return mins.peek();
    }
}

/**
 * Your MinStack object will be instantiated and called as such:
 * MinStack obj = new MinStack();
 * obj.push(val);
 * obj.pop();
 * int param_3 = obj.top();
 * int param_4 = obj.getMin();
 */
```

## 为什么要用 ArrayDeque，而不用 LinkedList？

`ArrayDeque` 底层是连续数组，`LinkedList` 底层是链表，频繁创建 Node 节点，浪费内存，节点在内存分散。

`LinkedList` 的优势一般在：

- 需要**在中间位置**做大量插入/删除
