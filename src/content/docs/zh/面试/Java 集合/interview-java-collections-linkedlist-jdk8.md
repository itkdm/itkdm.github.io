

---
title: "LinkedList 源码精读（JDK 8 中文注释版）"
order: 33
section: "面试"
topic: "Java集合"
lang: "zh"
summary: "基于 JDK 8 的 LinkedList 源码，配合中文注释，梳理链表节点链接、按索引定位、迭代器 fail-fast、序列化与 Spliterator 等核心实现。"
icon: "📂"
featured: false
toc: true
updated: 2026-02-05
---

使用建议：

- JDK 8 仍是面试和生产的主流版本，优先精读。
- 关注双向链表的节点插入/删除（link/unlink）及按索引定位“从近端走”。
- 理解 modCount 驱动的 fail-fast 迭代器、descendingIterator 适配器。
- 了解序列化、自定义 Spliterator（批量拆分、特性标记）实现细节。

```java
// =========================
// 中文注释版说明
// - 基于 JDK 8 的 java.util.LinkedList 源码（Oracle 2013 版头注释）。
// =========================

package java.util;

import java.util.function.Consumer;

/**
 * {@code List} 与 {@code Deque} 接口的**双向链表**实现。
 * 实现了 List 的所有可选操作，并允许保存所有元素（包括 {@code null}）。
 *
 * <p>所有操作的时间复杂度符合双向链表的常识预期。
 * 按下标访问（index-based）的操作，会从链表头或链表尾开始遍历，选择距离目标下标更近的一端，以减少遍历步数。
 *
 * <p><strong>注意：该实现不是线程安全的（not synchronized）。</strong>
 * 若多个线程并发访问一个 LinkedList，并且至少有一个线程会对其进行结构性修改（structural modification），就必须在外部进行同步。
 * 结构性修改指添加/删除一个或多个元素；仅仅修改某个节点的值（set）不属于结构性修改。
 * 常见做法是对一个自然“封装”该列表的对象加锁。
 *
 * <p>如果不存在这样的封装对象，可以使用 {@link Collections#synchronizedList Collections.synchronizedList}
 * 在创建时进行包装，避免后续误用导致的未同步访问：
 * <pre>
 *   List list = Collections.synchronizedList(new LinkedList(...));
 * </pre>
 *
 * <p>由 {@code iterator} 与 {@code listIterator} 返回的迭代器是 <em>fail-fast</em>（快速失败）的：
 * 迭代器创建后，若链表发生结构性修改（除非通过迭代器自身的 {@code remove} 或 {@code add}），迭代器会抛出 {@link ConcurrentModificationException}。
 * 这样在并发修改场景下会尽快失败并保持行为确定，而不是在未来某个不确定的时刻产生非确定性结果。
 *
 * <p>注意：fail-fast 行为本质上是“尽力而为”，无法在未同步的并发修改下给出严格保证。
 * 因此不要编写依赖该异常来保证正确性的程序：fail-fast 只用于辅助暴露 bug。
 *
 * <p>该类属于
 * <a href="{@docRoot}/../technotes/guides/collections/index.html">Java Collections Framework</a>。
 *
 * @author  Josh Bloch
 * @see     List
 * @see     ArrayList
 * @since 1.2
 * @param <E> 集合中元素类型
 */

public class LinkedList<E>
    extends AbstractSequentialList<E>
    implements List<E>, Deque<E>, Cloneable, java.io.Serializable
{
    /** 链表元素个数 */
    transient int size = 0;

    /**
     * 指向首节点的指针。
     * 不变式（Invariant）：
     * (first == null && last == null) ||
     * (first.prev == null && first.item != null)
     */
    transient Node<E> first;

    /**
     * 指向尾节点的指针。
     * 不变式（Invariant）：
     * (first == null && last == null) ||
     * (last.next == null && last.item != null)
     */
    transient Node<E> last;

    /**
     * 构造一个空链表。
     */
    public LinkedList() {
    }

    /**
     * 构造一个链表，包含指定集合的所有元素，顺序与该集合迭代器遍历顺序一致。
     *
     * @param  c 要放入链表的集合
     * @throws NullPointerException 若集合为 null
     */
    public LinkedList(Collection<? extends E> c) {
        this();
        addAll(c);
    }

    /**
     * 将元素 e 作为首元素链接进来（插入到头部）。
     */
    private void linkFirst(E e) {
        final Node<E> f = first;
        final Node<E> newNode = new Node<>(null, e, f);
        first = newNode;
        if (f == null)
            last = newNode;
        else
            f.prev = newNode;
        size++;
        modCount++;
    }

    /**
     * 将元素 e 作为尾元素链接进来（插入到尾部）。
     */
    void linkLast(E e) {
        final Node<E> l = last;
        final Node<E> newNode = new Node<>(l, e, null);
        last = newNode;
        if (l == null)
            first = newNode;
        else
            l.next = newNode;
        size++;
        modCount++;
    }

    /**
     * 在非空节点 succ 之前插入元素 e（插入到 succ 的前面）。
     */
    void linkBefore(E e, Node<E> succ) {
        // assert succ != null;
        final Node<E> pred = succ.prev;
        final Node<E> newNode = new Node<>(pred, e, succ);
        succ.prev = newNode;
        if (pred == null)
            first = newNode;
        else
            pred.next = newNode;
        size++;
        modCount++;
    }

    /**
     * 断开并移除非空的首节点 f。
     */
    private E unlinkFirst(Node<E> f) {
        // assert f == first && f != null;
        final E element = f.item;
        final Node<E> next = f.next;
        f.item = null;
        f.next = null; // help GC：断开引用，帮助 GC 回收
        first = next;
        if (next == null)
            last = null;
        else
            next.prev = null;
        size--;
        modCount++;
        return element;
    }

    /**
     * 断开并移除非空的尾节点 l。
     */
    private E unlinkLast(Node<E> l) {
        // assert l == last && l != null;
        final E element = l.item;
        final Node<E> prev = l.prev;
        l.item = null;
        l.prev = null; // help GC
        last = prev;
        if (prev == null)
            first = null;
        else
            prev.next = null;
        size--;
        modCount++;
        return element;
    }

    /**
     * 断开并移除非空节点 x（中间节点/任意节点）。
     */
    E unlink(Node<E> x) {
        // assert x != null;
        final E element = x.item;
        final Node<E> next = x.next;
        final Node<E> prev = x.prev;

        if (prev == null) {
            // x 是首节点
            first = next;
        } else {
            prev.next = next;
            x.prev = null;
        }

        if (next == null) {
            // x 是尾节点
            last = prev;
        } else {
            next.prev = prev;
            x.next = null;
        }

        x.item = null;
        size--;
        modCount++;
        return element;
    }

    /**
     * 返回链表首元素。
     *
     * @return 链表首元素
     * @throws NoSuchElementException 若链表为空
     */
    public E getFirst() {
        final Node<E> f = first;
        if (f == null)
            throw new NoSuchElementException();
        return f.item;
    }

    /**
     * 返回链表尾元素。
     *
     * @return 链表尾元素
     * @throws NoSuchElementException 若链表为空
     */
    public E getLast() {
        final Node<E> l = last;
        if (l == null)
            throw new NoSuchElementException();
        return l.item;
    }

    /**
     * 删除并返回链表首元素。
     *
     * @return 首元素
     * @throws NoSuchElementException 若链表为空
     */
    public E removeFirst() {
        final Node<E> f = first;
        if (f == null)
            throw new NoSuchElementException();
        return unlinkFirst(f);
    }

    /**
     * 删除并返回链表尾元素。
     *
     * @return 尾元素
     * @throws NoSuchElementException 若链表为空
     */
    public E removeLast() {
        final Node<E> l = last;
        if (l == null)
            throw new NoSuchElementException();
        return unlinkLast(l);
    }

    /**
     * 在链表头部插入指定元素。
     *
     * @param e 要插入的元素
     */
    public void addFirst(E e) {
        linkFirst(e);
    }

    /**
     * 在链表尾部追加指定元素。
     *
     * <p>该方法等价于 {@link #add}。
     *
     * @param e 要追加的元素
     */
    public void addLast(E e) {
        linkLast(e);
    }

    /**
     * 判断链表是否包含指定元素。
     * 更严格地说：只要存在一个元素 {@code e} 满足
     * {@code (o==null ? e==null : o.equals(e))} 即返回 true。
     *
     * @param o 要判断的元素
     * @return 是否包含
     */
    public boolean contains(Object o) {
        return indexOf(o) != -1;
    }

    /**
     * 返回链表元素个数。
     *
     * @return size
     */
    public int size() {
        return size;
    }

    /**
     * 在链表尾部追加指定元素。
     *
     * <p>该方法等价于 {@link #addLast}。
     *
     * @param e 要追加的元素
     * @return {@code true}（符合 {@link Collection#add} 约定）
     */
    public boolean add(E e) {
        linkLast(e);
        return true;
    }

    /**
     * 删除链表中首次出现的指定元素（若存在）。
     * 若链表不包含该元素，则不发生改变。
     * 更严格地说：删除最小下标 {@code i} 处满足
     * {@code (o==null ? get(i)==null : o.equals(get(i)))} 的元素（若存在）。
     *
     * @param o 要删除的元素
     * @return 若链表发生变化则返回 {@code true}
     */
    public boolean remove(Object o) {
        if (o == null) {
            for (Node<E> x = first; x != null; x = x.next) {
                if (x.item == null) {
                    unlink(x);
                    return true;
                }
            }
        } else {
            for (Node<E> x = first; x != null; x = x.next) {
                if (o.equals(x.item)) {
                    unlink(x);
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 将指定集合中的所有元素按迭代器顺序追加到链表尾部。
     * 若在此过程中集合被修改，则该操作的行为未定义。
     * （如果集合就是本链表并且非空，就会发生这种情况。）
     *
     * @param c 要追加的集合
     * @return 若链表发生变化则返回 {@code true}
     * @throws NullPointerException 若集合为 null
     */
    public boolean addAll(Collection<? extends E> c) {
        return addAll(size, c);
    }

    /**
     * 从指定位置开始插入指定集合的所有元素。
     * 该位置原有元素（若存在）及之后元素整体右移（索引增加）。
     * 插入元素的相对顺序与集合迭代器顺序一致。
     *
     * @param index 插入起始位置
     * @param c 要插入的集合
     * @return 若链表发生变化则返回 {@code true}
     * @throws IndexOutOfBoundsException {@inheritDoc}
     * @throws NullPointerException 若集合为 null
     */
    public boolean addAll(int index, Collection<? extends E> c) {
        checkPositionIndex(index);

        Object[] a = c.toArray();
        int numNew = a.length;
        if (numNew == 0)
            return false;

        Node<E> pred, succ;
        if (index == size) {
            succ = null;
            pred = last;
        } else {
            succ = node(index);
            pred = succ.prev;
        }

        for (Object o : a) {
            @SuppressWarnings("unchecked") E e = (E) o;
            Node<E> newNode = new Node<>(pred, e, null);
            if (pred == null)
                first = newNode;
            else
                pred.next = newNode;
            pred = newNode;
        }

        if (succ == null) {
            last = pred;
        } else {
            pred.next = succ;
            succ.prev = pred;
        }

        size += numNew;
        modCount++;
        return true;
    }

    /**
     * 清空链表中的所有元素。
     * 调用结束后链表为空。
     */
    public void clear() {
        // 清除节点间的所有链接在功能上“不是必须的”，但：
        // - 有助于分代 GC（如果这些被丢弃节点跨越多代）
        // - 即使存在可达的 Iterator，也能确保尽快释放内存
        for (Node<E> x = first; x != null; ) {
            Node<E> next = x.next;
            x.item = null;
            x.next = null;
            x.prev = null;
            x = next;
        }
        first = last = null;
        size = 0;
        modCount++;
    }


    // Positional Access Operations（按位置/下标访问）

    /**
     * 返回指定位置的元素。
     *
     * @param index 要返回的元素下标
     * @return 指定位置元素
     * @throws IndexOutOfBoundsException {@inheritDoc}
     */
    public E get(int index) {
        checkElementIndex(index);
        return node(index).item;
    }

    /**
     * 将指定位置的元素替换为新值。
     *
     * @param index 要替换的元素下标
     * @param element 新元素
     * @return 替换前的旧元素
     * @throws IndexOutOfBoundsException {@inheritDoc}
     */
    public E set(int index, E element) {
        checkElementIndex(index);
        Node<E> x = node(index);
        E oldVal = x.item;
        x.item = element;
        return oldVal;
    }

    /**
     * 在指定位置插入元素。
     * 原先该位置（若存在）及之后元素整体右移（索引加一）。
     *
     * @param index 插入位置
     * @param element 要插入的元素
     * @throws IndexOutOfBoundsException {@inheritDoc}
     */
    public void add(int index, E element) {
        checkPositionIndex(index);

        if (index == size)
            linkLast(element);
        else
            linkBefore(element, node(index));
    }

    /**
     * 删除指定位置的元素。
     * 该位置之后元素整体左移（索引减一）。
     *
     * @param index 要删除的元素下标
     * @return 被删除的元素
     * @throws IndexOutOfBoundsException {@inheritDoc}
     */
    public E remove(int index) {
        checkElementIndex(index);
        return unlink(node(index));
    }

    /**
     * 判断 index 是否为“存在元素”的合法下标（0 <= index < size）。
     */
    private boolean isElementIndex(int index) {
        return index >= 0 && index < size;
    }

    /**
     * 判断 index 是否为“可插入位置”的合法下标（0 <= index <= size）。
     * 注意：允许 index == size（插入到末尾）。
     */
    private boolean isPositionIndex(int index) {
        return index >= 0 && index <= size;
    }

    /**
     * 构造 IndexOutOfBoundsException 的详情信息。
     * 在多种重构形式中，这种“抽取”方式对 client/server VM 都更友好（性能较好）。
     */
    private String outOfBoundsMsg(int index) {
        return "Index: "+index+", Size: "+size;
    }

    private void checkElementIndex(int index) {
        if (!isElementIndex(index))
            throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
    }

    private void checkPositionIndex(int index) {
        if (!isPositionIndex(index))
            throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
    }

    /**
     * 返回指定元素下标处的（非空）节点 Node。
     * 关键点：从离目标更近的一端开始遍历（头/尾二选一），降低平均遍历成本。
     */
    Node<E> node(int index) {
        // assert isElementIndex(index);

        if (index < (size >> 1)) {
            Node<E> x = first;
            for (int i = 0; i < index; i++)
                x = x.next;
            return x;
        } else {
            Node<E> x = last;
            for (int i = size - 1; i > index; i--)
                x = x.prev;
            return x;
        }
    }

    // Search Operations（搜索）

    /**
     * 返回指定元素第一次出现的下标；若不存在则返回 -1。
     * 更严格地说：返回最小下标 {@code i}，满足
     * {@code (o==null ? get(i)==null : o.equals(get(i)))}；若不存在则 -1。
     *
     * @param o 要查找的元素
     * @return 第一次出现的下标或 -1
     */
    public int indexOf(Object o) {
        int index = 0;
        if (o == null) {
            for (Node<E> x = first; x != null; x = x.next) {
                if (x.item == null)
                    return index;
                index++;
            }
        } else {
            for (Node<E> x = first; x != null; x = x.next) {
                if (o.equals(x.item))
                    return index;
                index++;
            }
        }
        return -1;
    }

    /**
     * 返回指定元素最后一次出现的下标；若不存在则返回 -1。
     * 更严格地说：返回最大下标 {@code i}，满足
     * {@code (o==null ? get(i)==null : o.equals(get(i)))}；若不存在则 -1。
     *
     * @param o 要查找的元素
     * @return 最后一次出现的下标或 -1
     */
    public int lastIndexOf(Object o) {
        int index = size;
        if (o == null) {
            for (Node<E> x = last; x != null; x = x.prev) {
                index--;
                if (x.item == null)
                    return index;
            }
        } else {
            for (Node<E> x = last; x != null; x = x.prev) {
                index--;
                if (o.equals(x.item))
                    return index;
            }
        }
        return -1;
    }

    // Queue operations（队列相关方法）

    /**
     * 获取（但不删除）队头（首元素）。
     *
     * @return 队头元素；若为空返回 {@code null}
     * @since 1.5
     */
    public E peek() {
        final Node<E> f = first;
        return (f == null) ? null : f.item;
    }

    /**
     * 获取（但不删除）队头（首元素）。
     *
     * @return 队头元素
     * @throws NoSuchElementException 若链表为空
     * @since 1.5
     */
    public E element() {
        return getFirst();
    }

    /**
     * 获取并删除队头（首元素）。
     *
     * @return 队头元素；若为空返回 {@code null}
     * @since 1.5
     */
    public E poll() {
        final Node<E> f = first;
        return (f == null) ? null : unlinkFirst(f);
    }

    /**
     * 获取并删除队头（首元素）。
     *
     * @return 队头元素
     * @throws NoSuchElementException 若链表为空
     * @since 1.5
     */
    public E remove() {
        return removeFirst();
    }

    /**
     * 将元素作为队尾（尾元素）加入。
     *
     * @param e 要加入的元素
     * @return {@code true}（符合 {@link Queue#offer} 约定）
     * @since 1.5
     */
    public boolean offer(E e) {
        return add(e);
    }

    // Deque operations（双端队列相关方法）

    /**
     * 在队头插入指定元素。
     *
     * @param e 要插入的元素
     * @return {@code true}（符合 {@link Deque#offerFirst} 约定）
     * @since 1.6
     */
    public boolean offerFirst(E e) {
        addFirst(e);
        return true;
    }

    /**
     * 在队尾插入指定元素。
     *
     * @param e 要插入的元素
     * @return {@code true}（符合 {@link Deque#offerLast} 约定）
     * @since 1.6
     */
    public boolean offerLast(E e) {
        addLast(e);
        return true;
    }

    /**
     * 获取（但不删除）队头元素；若为空返回 {@code null}。
     *
     * @return 队头元素或 {@code null}
     * @since 1.6
     */
    public E peekFirst() {
        final Node<E> f = first;
        return (f == null) ? null : f.item;
     }

    /**
     * 获取（但不删除）队尾元素；若为空返回 {@code null}。
     *
     * @return 队尾元素或 {@code null}
     * @since 1.6
     */
    public E peekLast() {
        final Node<E> l = last;
        return (l == null) ? null : l.item;
    }

    /**
     * 获取并删除队头元素；若为空返回 {@code null}。
     *
     * @return 队头元素或 {@code null}
     * @since 1.6
     */
    public E pollFirst() {
        final Node<E> f = first;
        return (f == null) ? null : unlinkFirst(f);
    }

    /**
     * 获取并删除队尾元素；若为空返回 {@code null}。
     *
     * @return 队尾元素或 {@code null}
     * @since 1.6
     */
    public E pollLast() {
        final Node<E> l = last;
        return (l == null) ? null : unlinkLast(l);
    }

    /**
     * 将元素压入栈（stack）顶部：等价于在链表头部插入。
     *
     * <p>该方法等价于 {@link #addFirst}.
     *
     * @param e 要压入的元素
     * @since 1.6
     */
    public void push(E e) {
        addFirst(e);
    }

    /**
     * 从栈（stack）顶部弹出元素：等价于删除并返回链表首元素。
     *
     * <p>该方法等价于 {@link #removeFirst()}。
     *
     * @return 栈顶元素（即链表首元素）
     * @throws NoSuchElementException 若链表为空
     * @since 1.6
     */
    public E pop() {
        return removeFirst();
    }

    /**
     * 从链表头到尾遍历时，删除首次出现的指定元素。
     * 若链表不包含该元素，则不发生改变。
     *
     * @param o 要删除的元素
     * @return 若删除成功返回 {@code true}
     * @since 1.6
     */
    public boolean removeFirstOccurrence(Object o) {
        return remove(o);
    }

    /**
     * 从链表头到尾遍历时，删除最后一次出现的指定元素（等价于从尾向头找第一个匹配并删除）。
     * 若链表不包含该元素，则不发生改变。
     *
     * @param o 要删除的元素
     * @return 若删除成功返回 {@code true}
     * @since 1.6
     */
    public boolean removeLastOccurrence(Object o) {
        if (o == null) {
            for (Node<E> x = last; x != null; x = x.prev) {
                if (x.item == null) {
                    unlink(x);
                    return true;
                }
            }
        } else {
            for (Node<E> x = last; x != null; x = x.prev) {
                if (o.equals(x.item)) {
                    unlink(x);
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 返回一个从指定位置开始的 ListIterator（按正确顺序遍历）。
     * 遵守 {@code List.listIterator(int)} 的通用约定。
     *
     * <p>该迭代器是 <em>fail-fast</em> 的：迭代器创建后，如果链表发生结构性修改（除非通过迭代器自身的 {@code remove}/{@code add}），
     * 将抛出 {@code ConcurrentModificationException}，尽快暴露并发修改问题。
     *
     * @param index 第一个将被 {@code next} 返回的元素下标
     * @return 从指定位置开始的 ListIterator
     * @throws IndexOutOfBoundsException {@inheritDoc}
     * @see List#listIterator(int)
     */
    public ListIterator<E> listIterator(int index) {
        checkPositionIndex(index);
        return new ListItr(index);
    }

    /**
     * ListIterator 的实现。
     *
     * 关键字段：
     * - expectedModCount：创建迭代器时记录 modCount，用于 fail-fast 检测
     * - next / nextIndex：指向“下一次 next() 将返回的节点及其索引”
     */
    private class ListItr implements ListIterator<E> {
        private Node<E> lastReturned;
        private Node<E> next;
        private int nextIndex;
        private int expectedModCount = modCount;

        ListItr(int index) {
            // assert isPositionIndex(index);
            next = (index == size) ? null : node(index);
            nextIndex = index;
        }

        public boolean hasNext() {
            return nextIndex < size;
        }

        public E next() {
            checkForComodification();
            if (!hasNext())
                throw new NoSuchElementException();

            lastReturned = next;
            next = next.next;
            nextIndex++;
            return lastReturned.item;
        }

        public boolean hasPrevious() {
            return nextIndex > 0;
        }

        public E previous() {
            checkForComodification();
            if (!hasPrevious())
                throw new NoSuchElementException();

            lastReturned = next = (next == null) ? last : next.prev;
            nextIndex--;
            return lastReturned.item;
        }

        public int nextIndex() {
            return nextIndex;
        }

        public int previousIndex() {
            return nextIndex - 1;
        }

        public void remove() {
            checkForComodification();
            if (lastReturned == null)
                throw new IllegalStateException();

            Node<E> lastNext = lastReturned.next;
            unlink(lastReturned);
            if (next == lastReturned)
                next = lastNext;
            else
                nextIndex--;
            lastReturned = null;
            expectedModCount++;
        }

        public void set(E e) {
            if (lastReturned == null)
                throw new IllegalStateException();
            checkForComodification();
            lastReturned.item = e;
        }

        public void add(E e) {
            checkForComodification();
            lastReturned = null;
            if (next == null)
                linkLast(e);
            else
                linkBefore(e, next);
            nextIndex++;
            expectedModCount++;
        }

        public void forEachRemaining(Consumer<? super E> action) {
            Objects.requireNonNull(action);
            while (modCount == expectedModCount && nextIndex < size) {
                action.accept(next.item);
                lastReturned = next;
                next = next.next;
                nextIndex++;
            }
            checkForComodification();
        }

        final void checkForComodification() {
            if (modCount != expectedModCount)
                throw new ConcurrentModificationException();
        }
    }

    /**
     * 双向链表节点结构。
     */
    private static class Node<E> {
        E item;
        Node<E> next;
        Node<E> prev;

        Node(Node<E> prev, E element, Node<E> next) {
            this.item = element;
            this.next = next;
            this.prev = prev;
        }
    }

    /**
     * 返回一个“逆序迭代器”（从尾到头遍历）。
     *
     * @since 1.6
     */
    public Iterator<E> descendingIterator() {
        return new DescendingIterator();
    }

    /**
     * 适配器：通过 ListItr.previous 提供 descendingIterator 的实现。
     */
    private class DescendingIterator implements Iterator<E> {
        private final ListItr itr = new ListItr(size());
        public boolean hasNext() {
            return itr.hasPrevious();
        }
        public E next() {
            return itr.previous();
        }
        public void remove() {
            itr.remove();
        }
    }

    @SuppressWarnings("unchecked")
    private LinkedList<E> superClone() {
        try {
            return (LinkedList<E>) super.clone();
        } catch (CloneNotSupportedException e) {
            throw new InternalError(e);
        }
    }

    /**
     * 返回该 {@code LinkedList} 的浅拷贝（shallow copy）。
     * 注意：元素本身不会被 clone。
     *
     * @return 浅拷贝后的 LinkedList 实例
     */
    public Object clone() {
        LinkedList<E> clone = superClone();

        // 将 clone 置为“初始/干净（virgin）”状态
        clone.first = clone.last = null;
        clone.size = 0;
        clone.modCount = 0;

        // 用当前链表的元素初始化 clone
        for (Node<E> x = first; x != null; x = x.next)
            clone.add(x.item);

        return clone;
    }

    /**
     * 返回一个数组，包含链表中所有元素，顺序为从头到尾。
     *
     * <p>返回的数组是“安全的”：链表不会保留对该数组的引用（即方法会新分配数组）。
     * 因此调用方可以自由修改返回数组，不影响链表本身。
     *
     * <p>该方法在“数组 API”和“集合 API”之间充当桥梁。
     *
     * @return 包含所有元素的 Object[]
     */
    public Object[] toArray() {
        Object[] result = new Object[size];
        int i = 0;
        for (Node<E> x = first; x != null; x = x.next)
            result[i++] = x.item;
        return result;
    }

    /**
     * 返回一个数组，包含链表中所有元素，顺序为从头到尾；
     * 返回数组的运行时类型与参数数组 {@code a} 的运行时类型一致。
     * 如果链表能放入 {@code a}，则直接填充并返回 {@code a}；
     * 否则新建一个相同运行时类型、长度为 size 的数组返回。
     *
     * <p>如果 {@code a} 的长度大于 size，那么数组中紧随最后一个元素的那一位会被设置为 {@code null}。
     * （仅在调用者明确知道链表中不包含 null 时，才可用它判断链表长度。）
     *
     * <p>示例：若 {@code x} 是只包含字符串的列表，可以用以下方式生成 String[]：
     * <pre>
     *     String[] y = x.toArray(new String[0]);
     * </pre>
     *
     * <p>注意：{@code toArray(new Object[0])} 在功能上等同于 {@code toArray()}。
     *
     * @param a 目标数组；若不够大将分配新数组
     * @return 包含列表元素的数组
     * @throws ArrayStoreException 若 a 的运行时组件类型不是所有元素运行时类型的父类型
     * @throws NullPointerException 若 a 为 null
     */
    @SuppressWarnings("unchecked")
    public <T> T[] toArray(T[] a) {
        if (a.length < size)
            a = (T[])java.lang.reflect.Array.newInstance(
                                a.getClass().getComponentType(), size);
        int i = 0;
        Object[] result = a;
        for (Node<E> x = first; x != null; x = x.next)
            result[i++] = x.item;

        if (a.length > size)
            a[size] = null;

        return a;
    }

    private static final long serialVersionUID = 876323262645176354L;

    /**
     * 将该 {@code LinkedList} 实例的状态保存到输出流（序列化）。
     *
     * @serialData 先写出 size（int），再按正确顺序写出所有元素（每个为 Object）。
     */
    private void writeObject(java.io.ObjectOutputStream s)
        throws java.io.IOException {
        // 写出序列化魔法字段（hidden serialization magic）
        s.defaultWriteObject();

        // 写出 size
        s.writeInt(size);

        // 按正确顺序写出所有元素
        for (Node<E> x = first; x != null; x = x.next)
            s.writeObject(x.item);
    }

    /**
     * 从输入流中重建（反序列化）该 {@code LinkedList} 实例。
     */
    @SuppressWarnings("unchecked")
    private void readObject(java.io.ObjectInputStream s)
        throws java.io.IOException, ClassNotFoundException {
        // 读取序列化魔法字段
        s.defaultReadObject();

        // 读取 size
        int size = s.readInt();

        // 按正确顺序读取所有元素
        for (int i = 0; i < size; i++)
            linkLast((E)s.readObject());
    }

    /**
     * 创建一个 <em><a href="Spliterator.html#binding">late-binding</a></em>（延迟绑定）
     * 且 <em>fail-fast</em> 的 {@link Spliterator} 用于遍历该链表元素。
     *
     * <p>该 Spliterator 报告 {@link Spliterator#SIZED} 与 {@link Spliterator#ORDERED}。
     * 子类覆盖实现时应记录额外的特性标记（characteristics）。
     *
     * @implNote
     * 该 Spliterator 额外报告 {@link Spliterator#SUBSIZED}，并实现 {@code trySplit} 以支持有限并行。
     *
     * @return 遍历该链表元素的 Spliterator
     * @since 1.8
     */
    @Override
    public Spliterator<E> spliterator() {
        return new LLSpliterator<E>(this, -1, 0);
    }

    /** Spliterators.IteratorSpliterator 的定制变体 */
    static final class LLSpliterator<E> implements Spliterator<E> {
        static final int BATCH_UNIT = 1 << 10;  // 批量数组大小的增长单位
        static final int MAX_BATCH = 1 << 25;  // 批量数组最大大小
        final LinkedList<E> list; // 未遍历前允许为 null
        Node<E> current;      // 当前节点；初始化前为 null
        int est;              // size 估计值；-1 表示尚未初始化
        int expectedModCount; // est 初始化时记录的 modCount
        int batch;            // 拆分批次大小

        LLSpliterator(LinkedList<E> list, int est, int expectedModCount) {
            this.list = list;
            this.est = est;
            this.expectedModCount = expectedModCount;
        }

        final int getEst() {
            int s; // 强制初始化
            final LinkedList<E> lst;
            if ((s = est) < 0) {
                if ((lst = list) == null)
                    s = est = 0;
                else {
                    expectedModCount = lst.modCount;
                    current = lst.first;
                    s = est = lst.size;
                }
            }
            return s;
        }

        public long estimateSize() { return (long) getEst(); }

        public Spliterator<E> trySplit() {
            Node<E> p;
            int s = getEst();
            if (s > 1 && (p = current) != null) {
                int n = batch + BATCH_UNIT;
                if (n > s)
                    n = s;
                if (n > MAX_BATCH)
                    n = MAX_BATCH;
                Object[] a = new Object[n];
                int j = 0;
                do { a[j++] = p.item; } while ((p = p.next) != null && j < n);
                current = p;
                batch = j;
                est = s - j;
                return Spliterators.spliterator(a, 0, j, Spliterator.ORDERED);
            }
            return null;
        }

        public void forEachRemaining(Consumer<? super E> action) {
            Node<E> p; int n;
            if (action == null) throw new NullPointerException();
            if ((n = getEst()) > 0 && (p = current) != null) {
                current = null;
                est = 0;
                do {
                    E e = p.item;
                    p = p.next;
                    action.accept(e);
                } while (p != null && --n > 0);
            }
            if (list.modCount != expectedModCount)
                throw new ConcurrentModificationException();
        }

        public boolean tryAdvance(Consumer<? super E> action) {
            Node<E> p;
            if (action == null) throw new NullPointerException();
            if (getEst() > 0 && (p = current) != null) {
                --est;
                E e = p.item;
                current = p.next;
                action.accept(e);
                if (list.modCount != expectedModCount)
                    throw new ConcurrentModificationException();
                return true;
            }
            return false;
        }

        public int characteristics() {
            return Spliterator.ORDERED | Spliterator.SIZED | Spliterator.SUBSIZED;
        }
    }

}

```
