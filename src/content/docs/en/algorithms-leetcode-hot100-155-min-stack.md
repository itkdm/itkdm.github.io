---
title: "LeetCode Hot 100: 155 - Min Stack"
order: 2
section: "Algorithms"
topic: "LeetCode hot100"
lang: "en"
summary: "Design a stack that supports push, pop, top operations, and can retrieve the minimum element in constant time, using dual stacks (data stack + auxiliary stack)."
icon: "📚"
featured: false
toc: true
updated: 2026-01-27
---

> Design a stack that supports `push`, `pop`, `top`, and retrieving the minimum element in constant time.
>
> Implement the `MinStack` class:
>
> - `MinStack()` initializes the stack object.
> - `void push(int val)` pushes the element `val` onto the stack.
> - `void pop()` removes the element on the top of the stack.
> - `int top()` gets the top element of the stack.
> - `int getMin()` retrieves the minimum element in the stack.

## Idea: Dual stack implementation

Use two stacks:
- **Data stack**: normally stores all data
- **Auxiliary stack**: stores the minimum value at each moment

Key points:
- Each `push`: auxiliary stack synchronously pushes current minimum
- Each `pop`: both stacks synchronously pop
- `getMin()` directly returns the top element of auxiliary stack, O(1) time complexity

## Java implementation

```java
class MinStack {
    // Stack for normal data storage
    Deque<Integer> data;
    // Auxiliary stack for storing minimum values
    Deque<Integer> mins;

    // Initialization
    public MinStack() {
        data = new ArrayDeque<>();
        mins = new ArrayDeque<>();
    }
    
    // Push
    public void push(int val) {
        // Data stack directly pushes
        data.push(val);
        // Auxiliary stack directly pushes if empty
        if(mins.isEmpty()){
            mins.push(val);
        }else{
            // Otherwise take the minimum
            mins.push(Math.min(val, mins.peek()));
        }
    }
    
    // Pop
    public void pop() {
        data.pop();
        mins.pop();
    }
    
    // Get top element of data stack
    public int top() {
        return data.peek();
    }
    // Get top element of auxiliary stack
    public int getMin() {
        return mins.peek();
    }
}
```

/**
 * Your MinStack object will be instantiated and called as such:
 * MinStack obj = new MinStack();
 * obj.push(val);
 * obj.pop();
 * int param_3 = obj.top();
 * int param_4 = obj.getMin();
 */

## Why use ArrayDeque instead of LinkedList?

`ArrayDeque` uses a contiguous array at the bottom, while `LinkedList` uses a linked list, frequently creating Node objects, wasting memory, and nodes are scattered in memory.

`LinkedList`'s advantages are generally:
- Need to do a lot of insertions/deletions **at middle positions**
