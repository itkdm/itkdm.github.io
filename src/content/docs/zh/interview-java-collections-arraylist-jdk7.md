---
title: "ArrayList 源码精读（JDK 7 中文注释版）"
order: 31
section: "面试"
topic: "Java集合"
lang: "zh"
slug: "interview-java-collections-arraylist-jdk7"
summary: "基于 JDK 7 的 ArrayList 源码，配合中文注释，深入理解底层实现细节。"
icon: "📂"
featured: true
toc: true
updated: 2026-02-04
---
> 版本说明  
> 本页源码基于 **JDK 7u 系列（更新版）** 的 `ArrayList` 实现，并与 JDK 8 延续的写法基本一致：无参构造不会直接分配长度为 10 的数组，而是先让 `elementData` 指向空数组，第一次 `add` 时再按默认容量 10 分配。  
> 需要注意的是，**最早的 JDK 7 GA 版本** 中无参构造曾经是 `public ArrayList() { this(10); }`，会立即分配容量为 10 的数组；如果你在别的源码仓库（例如早期 `openjdk/jdk7`）看到这种写法，属于更早期实现的差异。


```java
/*
 * 本文件基于 JDK 7 的 ArrayList 源码
 * 方便中文读者深入理解实现原理。代码结构与 JDK 源码保持一致。
 */

package java.util;

import sun.misc.SharedSecrets;

/**
 * ArrayList：基于动态数组实现的 List。
 *
 * 主要特性：
 * 1）底层用 Object[] 顺序存储元素，支持随机访问，get/set 时间复杂度 O(1)。
 * 2）支持自动扩容，容量不够时按 1.5 倍扩容（old + old >> 1）。
 * 3）线程不安全，适用于单线程或外部自行加锁的并发场景。
 * 4）迭代器为 fail-fast：结构被并发修改时，会尽快抛出 ConcurrentModificationException。
 *
 * 对比：
 * - VS LinkedList：ArrayList 适合“读多写少、随机访问多”的场景；LinkedList 适合频繁在中间插入/删除。
 * - VS Vector：Vector 所有方法基本都 synchronized，开销更大；ArrayList 默认不加锁。
 */

// 继承 / 实现关系说明：
// - AbstractList<E>：提供 List 的骨架实现（get,set等通用方法），避免从零开始实现全部逻辑；
// - List<E>：对外暴露为一个标准 List，保证可以被所有依赖 List 接口的代码使用；
// - RandomAccess：标记接口，表明“支持快速随机访问”，供算法（如 Collections.sort）根据此优化实现；
// - Cloneable：具有拷贝能力，可以进行深拷贝和浅拷贝操作；
// - java.io.Serializable：允许 ArrayList 被序列化（写到磁盘 / 网络传输）。
public class ArrayList<E> extends AbstractList<E>
        implements List<E>, RandomAccess, Cloneable, java.io.Serializable
{
    // 序列化版本号，保证反序列化时类版本兼容
    private static final long serialVersionUID = 8683452581122892189L;

    // 默认初始容量：10
    private static final int DEFAULT_CAPACITY = 10;

    // 共享的空数组，用于初始的“逻辑空”ArrayList，节省内存
    private static final Object[] EMPTY_ELEMENTDATA = {};

    /**
     * 存储元素的真实数组：
     * - 容量 = elementData.length
     * - 当 elementData == EMPTY_ELEMENTDATA 且首次添加元素时，会扩容到默认容量 10
     *
     * transient：不直接参与默认序列化，转而由 writeObject / readObject 自行处理。
     */
    private transient Object[] elementData;

    // 实际元素个数（逻辑大小），永远满足 0 <= size <= elementData.length
    private int size;

    /**
     * 构造方法一：指定初始容量。
     *
     * 使用场景：已知大概元素个数，可以避免多次扩容。
     */
    public ArrayList(int initialCapacity) {
        //默认就会调用，调用父类 AbstractList 的无参构造，确保父类成员（如 modCount）完成初始化
        super();
        if (initialCapacity < 0)
            throw new IllegalArgumentException("Illegal Capacity: "+
                                               initialCapacity);
        this.elementData = new Object[initialCapacity];
    }

    /**
     * 构造方法二：无参构造。
     *
     * 注意：不会立刻分配长度为 10 的数组，而是先指向 EMPTY_ELEMENTDATA，
     * 在第一次 add 时通过 ensureCapacityInternal 触发扩容到默认容量 10。
     */
    public ArrayList() {
        super();
        this.elementData = EMPTY_ELEMENTDATA;
    }

    /**
     * 构造方法三：使用另一个集合的所有元素来初始化。
     *
     * 细节：
     * - 先调用 c.toArray() 拿到 Object[]，再根据 c 的具体类型做不同处理。
     * - 如果 c 本身就是 ArrayList，直接复用其底层数组（浅拷贝语义，共享元素引用）。
     * - 否则拷贝一份 Object[]，保证类型安全。
     */
    public ArrayList(Collection<? extends E> c) {
        Object[] a = c.toArray();        // 先转成 Object[]
        size = a.length;
        if (c.getClass() == ArrayList.class) {
          elementData = a;               // 源就是 ArrayList，直接复用其底层数组
        } else {
          // 否则拷贝一份，保证类型是 Object[]
          elementData = Arrays.copyOf(a, size, Object[].class);
        }
    }

    /**
     * trimToSize：将容量缩小到当前 size，释放多余空间。
     *
     * 使用场景：列表元素不再增长，希望节省内存（例如长生命周期的大集合对象）。
     */
    public void trimToSize() {
        // 继承自父类，结构性修改计数 +1，迭代器通过比较 modCount 实现 fail-fast 并发修改检测
        modCount++;
        if (size < elementData.length) {
            elementData = Arrays.copyOf(elementData, size);
        }
    }

    /**
     * ensureCapacity：手动“预热容量”，避免未来频繁扩容。
     *
     * - 对已经创建、且 elementData 不再是 EMPTY_ELEMENTDATA 的列表，minExpand = 0，
     *   也就是只要 minCapacity > 0 就可能触发扩容。
     * - 对刚创建、还没 add 过元素（elementData == EMPTY_ELEMENTDATA）的列表，
     *   只有当 minCapacity > DEFAULT_CAPACITY（10）才会立刻扩容，否则仍然延迟到第一次 add。
     */
    public void ensureCapacity(int minCapacity) {
        // minExpand：当前状态下“触发主动扩容”的最小门槛
        // - 若已经分配了真实数组（elementData != EMPTY_ELEMENTDATA），门槛为 0，任何正的 minCapacity 都可以考虑扩容；
        // - 若仍是共享空数组（elementData == EMPTY_ELEMENTDATA），门槛为 DEFAULT_CAPACITY（10），
        //   只有当 minCapacity > 10 时才会在这里立刻扩容，否则沿用“第一次 add 时再扩到 10”的惰性策略。
        int minExpand = (elementData != EMPTY_ELEMENTDATA)
            ? 0
            : DEFAULT_CAPACITY;

        // 只有当调用方要求的最小容量大于 minExpand 时，才真正去检查并可能触发扩容
        if (minCapacity > minExpand) {
            ensureExplicitCapacity(minCapacity);
        }
    }

    // 计算“最低需要容量”：如果当前是空数组，则至少为 DEFAULT_CAPACITY
    private static int calculateCapacity(Object[] elementData, int minCapacity) {
        // 如果还在用共享空数组，说明当前是通过无参构造创建且尚未真正分配过空间
        if (elementData == EMPTY_ELEMENTDATA) {
            // 初次分配时容量至少为 DEFAULT_CAPACITY（10），也可能更大（若调用方指定的 minCapacity > 10）
            return Math.max(DEFAULT_CAPACITY, minCapacity);
        }
        // 如果已经是正常数组，则直接使用调用方要求的 minCapacity 作为最低需求
        return minCapacity;
    }

    // 内部通用扩容入口：所有 add 操作最终都会走到这里
    private void ensureCapacityInternal(int minCapacity) {
        // 先根据当前数组状态算出真正需要的最低容量，再交给 ensureExplicitCapacity 执行检查与扩容
        ensureExplicitCapacity(calculateCapacity(elementData, minCapacity));
    }

    // 真正检查并扩容：只要 minCapacity 超过当前数组长度，就调用 grow
    private void ensureExplicitCapacity(int minCapacity) {
        modCount++;

        // overflow-conscious code
        // 当最小需要容量 > 当前数组长度时，触发 grow 扩容
        if (minCapacity - elementData.length > 0)
            grow(minCapacity);
    }

    // 能够分配的数组的最大长度（预留若干“头信息”空间），避免接近 Integer.MAX_VALUE 带来的问题
    private static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8;

    /**
     * grow：扩容核心逻辑。
     *
     * 扩容策略：
     * 1）先计算 newCapacity = oldCapacity + oldCapacity/2，即 1.5 倍；
     * 2）如果 1.5 倍仍小于 minCapacity，则直接取 minCapacity；
     * 3）如果超过了 MAX_ARRAY_SIZE，则交给 hugeCapacity 做极大值处理；
     * 4）最终通过 Arrays.copyOf 完成数组拷贝。
     *
     * 注意：扩容是“代价高”的 O(n) 操作，所以设计成均摊——平时少扩容、一次扩得多。
     */
    private void grow(int minCapacity) {
        // overflow-conscious code
        int oldCapacity = elementData.length;
        int newCapacity = oldCapacity + (oldCapacity >> 1); // 1.5 倍
        if (newCapacity - minCapacity < 0)
            newCapacity = minCapacity;                      // 仍不够就取 minCapacity
        if (newCapacity - MAX_ARRAY_SIZE > 0)
            newCapacity = hugeCapacity(minCapacity);        // 超出上限再特殊处理
        // minCapacity is usually close to size, so this is a win:
        elementData = Arrays.copyOf(elementData, newCapacity);
    }

    // hugeCapacity：处理极端大容量请求（接近 Integer.MAX_VALUE）
    private static int hugeCapacity(int minCapacity) {
        if (minCapacity < 0) // overflow
            throw new OutOfMemoryError();
        return (minCapacity > MAX_ARRAY_SIZE) ?
            Integer.MAX_VALUE :
            MAX_ARRAY_SIZE;
    }

    // 返回当前元素个数
    public int size() {
        return size;
    }

    // 判断是否为空（size == 0）
    public boolean isEmpty() {
        return size == 0;
    }

    /**
     * contains：是否包含某元素。
     * 本质是调用 indexOf(o) 判断结果是否 >= 0，时间复杂度 O(n)。
     */
    public boolean contains(Object o) {
        return indexOf(o) >= 0;
    }

    /**
     * indexOf：从前往后线性查找元素第一次出现的位置，不存在返回 -1。
     *
     * 细节：
     * - 为了支持 null，分成两条分支：o == null / o != null。
     * - 比较时使用 equals，保持与 Collection 的语义一致。
     */
    public int indexOf(Object o) {
        if (o == null) {
            for (int i = 0; i < size; i++)
                if (elementData[i]==null)
                    return i;
        } else {
            for (int i = 0; i < size; i++)
                if (o.equals(elementData[i]))
                    return i;
        }
        return -1;
    }

    /**
     * lastIndexOf：从后往前线性查找元素最后一次出现的位置。
     *
     * 和 indexOf 类似，只是遍历顺序反过来。
     */
    public int lastIndexOf(Object o) {
        if (o == null) {
            for (int i = size-1; i >= 0; i--)
                if (elementData[i]==null)
                    return i;
        } else {
            for (int i = size-1; i >= 0; i--)
                if (o.equals(elementData[i]))
                    return i;
        }
        return -1;
    }

    /**
     * clone：浅拷贝。
     *
     * - 利用 Object.clone 复制对象本身（字段值逐位复制）；
     * - 再用 Arrays.copyOf 拷贝一份新的 elementData 数组；
     * - modCount 置为 0，表示“新对象从 0 开始记录结构修改次数”。
     *
     * 注意：元素本身不会被 clone，两个 ArrayList 持有的是同一批元素对象的引用。
     */
    public Object clone() {
        try {
            ArrayList<?> v = (ArrayList<?>) super.clone();
            v.elementData = Arrays.copyOf(elementData, size);
            v.modCount = 0;
            return v;
        } catch (CloneNotSupportedException e) {
            // this shouldn't happen, since we are Cloneable
            throw new InternalError();
        }
    }

    /**
     * toArray()：返回一个“刚好装下所有元素”的 Object[] 副本。
     *
     * - 不会暴露内部的 elementData（防止外部修改内部数组破坏封装）。
     * - 返回数组的长度 == size。
     */
    public Object[] toArray() {
        return Arrays.copyOf(elementData, size);
    }

    /**
     * 泛型 toArray(T[] a)：与 Collection 接口的规范一致。
     *
     * 规则：
     * - 若 a.length < size：新建一个与 a 运行时类型相同、长度为 size 的数组，并拷贝元素；
     * - 若 a.length >= size：把元素拷贝到 a 中，若 a.length > size，则 a[size] 置为 null；
     * - 返回值始终是存放了所有元素的数组。
     */
    @SuppressWarnings("unchecked")
    public <T> T[] toArray(T[] a) {
        if (a.length < size)
            // Make a new array of a's runtime type, but my contents:
            return (T[]) Arrays.copyOf(elementData, size, a.getClass());
        System.arraycopy(elementData, 0, a, 0, size);
        if (a.length > size)
            a[size] = null;
        return a;
    }

    // ====================== 位置访问操作（按索引） ======================

    @SuppressWarnings("unchecked")
    E elementData(int index) {
        return (E) elementData[index];
    }

    // get：按索引获取元素（带边界检查）
    public E get(int index) {
        rangeCheck(index);

        return elementData(index);
    }

    // set：按索引替换元素，返回旧值
    public E set(int index, E element) {
        rangeCheck(index);

        E oldValue = elementData(index);
        elementData[index] = element;
        return oldValue;
    }

    /**
     * add(e)：在尾部追加一个元素。
     *
     * 流程：
     * 1）ensureCapacityInternal(size + 1)：确保容量足够；如有必要，会触发扩容；
     * 2）elementData[size] = e；size++。
     *
     * 时间复杂度：均摊 O(1)。
     */
    public boolean add(E e) {
        ensureCapacityInternal(size + 1);  // Increments modCount!!
        elementData[size++] = e;
        return true;
    }

    /**
     * add(index, element)：在指定位置插入元素。
     *
     * 流程：
     * 1）rangeCheckForAdd(index)：检查 0 <= index <= size；
     * 2）ensureCapacityInternal(size + 1)：容量不够则扩容；
     * 3）System.arraycopy(...)：把 [index, size-1] 的元素整体右移一位；
     * 4）elementData[index] = element；size++。
     *
     * 时间复杂度：O(n - index)，越靠前插入，成本越高。
     */
    public void add(int index, E element) {
        rangeCheckForAdd(index);

        ensureCapacityInternal(size + 1);  // Increments modCount!!
        System.arraycopy(elementData, index, elementData, index + 1,
                         size - index);
        elementData[index] = element;
        size++;
    }

    /**
     * remove(index)：删除指定下标的元素，并返回被删除的元素。
     *
     * 流程：
     * 1）rangeCheck(index)：检查 0 <= index < size；
     * 2）保存旧值 oldValue；
     * 3）将 [index+1, size-1] 整体左移一位；
     * 4）最后一个位置置 null，size--；
     * 5）返回 oldValue。
     *
     * 时间复杂度：O(n - index)。
     */
    public E remove(int index) {
        rangeCheck(index);

        modCount++;
        E oldValue = elementData(index);

        int numMoved = size - index - 1;
        if (numMoved > 0)
            System.arraycopy(elementData, index+1, elementData, index,
                             numMoved);
        elementData[--size] = null; // clear to let GC do its work

        return oldValue;
    }

    /**
     * remove(Object o)：删除第一次出现的指定元素。
     *
     * 细节：
     * - 为支持 null，依然分为 o == null / o != null 两条路径；
     * - 内部调用 fastRemove，不再返回被删除的值，只关心是否删除成功；
     * - 遍历到第一个匹配元素后立即返回，后续相同元素不会删除。
     */
    public boolean remove(Object o) {
        if (o == null) {
            for (int index = 0; index < size; index++)
                if (elementData[index] == null) {
                    fastRemove(index);
                    return true;
                }
        } else {
            for (int index = 0; index < size; index++)
                if (o.equals(elementData[index])) {
                    fastRemove(index);
                    return true;
                }
        }
        return false;
    }

    /*
     * fastRemove：不做边界检查且不返回删除值的“快速删除”实现。
     *
     * 使用场景：index 已经通过其他公共方法（如 remove(Object)）做过检查。
     */
    private void fastRemove(int index) {
        modCount++;
        int numMoved = size - index - 1;
        if (numMoved > 0)
            System.arraycopy(elementData, index+1, elementData, index,
                             numMoved);
        elementData[--size] = null; // clear to let GC do its work
    }

    /**
     * clear：清空整个列表。
     *
     * 实现方式：
     * - 遍历所有下标，把 elementData[i] 置为 null（帮助 GC 回收对象）；
     * - 最后 size = 0。
     */
    public void clear() {
        modCount++;

        // clear to let GC do its work
        for (int i = 0; i < size; i++)
            elementData[i] = null;

        size = 0;
    }

    /**
     * addAll(c)：把集合 c 的所有元素追加到当前列表末尾。
     *
     * 实现思路：一次性扩容 + 一次性批量拷贝，避免逐个 add 产生多次扩容。
     */
    public boolean addAll(Collection<? extends E> c) {
        Object[] a = c.toArray();
        int numNew = a.length;
        ensureCapacityInternal(size + numNew);  // Increments modCount
        System.arraycopy(a, 0, elementData, size, numNew);
        size += numNew;
        return numNew != 0;
    }

    /**
     * addAll(index, c)：从指定下标开始插入集合 c 的所有元素。
     *
     * 步骤：
     * 1）检查 index 合法性；
     * 2）一次性保证 size + numNew 的容量；
     * 3）先把 [index, size-1] 整体右移 numNew 个位置；
     * 4）将数组 a 拷贝到 index 开始的位置。
     */
    public boolean addAll(int index, Collection<? extends E> c) {
        rangeCheckForAdd(index);

        Object[] a = c.toArray();
        int numNew = a.length;
        ensureCapacityInternal(size + numNew);  // Increments modCount

        int numMoved = size - index;
        if (numMoved > 0)
            System.arraycopy(elementData, index, elementData, index + numNew,
                             numMoved);

        System.arraycopy(a, 0, elementData, index, numNew);
        size += numNew;
        return numNew != 0;
    }

    /**
     * removeRange：删除指定区间 [fromIndex, toIndex) 的一段元素。
     *
     * 只对包内可见，通常通过 subList().clear() 间接触发。
     */
    protected void removeRange(int fromIndex, int toIndex) {
        modCount++;
        int numMoved = size - toIndex;
        System.arraycopy(elementData, toIndex, elementData, fromIndex,
                         numMoved);

        // clear to let GC do its work
        int newSize = size - (toIndex-fromIndex);
        for (int i = newSize; i < size; i++) {
            elementData[i] = null;
        }
        size = newSize;
    }

    /**
     * rangeCheck：用于 get/set/remove 等操作。
     *
     * 约定：
     * - 只检查 index >= size；
     * - index < 0 的情况由数组访问时抛出 ArrayIndexOutOfBoundsException。
     */
    private void rangeCheck(int index) {
        if (index >= size)
            throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
    }

    /**
     * rangeCheckForAdd：用于 add / addAll。
     *
     * 与 rangeCheck 不同点：允许 index == size（相当于尾插），同时检查 index >= 0。
     */
    private void rangeCheckForAdd(int index) {
        if (index > size || index < 0)
            throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
    }

    // 统一生成“越界异常”的提示信息："Index: x, Size: y"
    private String outOfBoundsMsg(int index) {
        return "Index: "+index+", Size: "+size;
    }

    /**
     * removeAll：删除当前列表中所有“在集合 c 中存在”的元素。
     *
     * 内部调用 batchRemove(c, false) 来实现。
     */
    public boolean removeAll(Collection<?> c) {
        return batchRemove(c, false);
    }

    /**
     * retainAll：仅保留当前列表与集合 c 的交集元素。
     *
     * 内部调用 batchRemove(c, true) —— complement = true 表示“保留交集”。
     */
    public boolean retainAll(Collection<?> c) {
        return batchRemove(c, true);
    }

    // 批量删除/保留的核心实现：一次线性扫描，利用读写双指针 r / w 完成就地过滤
    private boolean batchRemove(Collection<?> c, boolean complement) {
        final Object[] elementData = this.elementData;
        int r = 0, w = 0;
        boolean modified = false;
        try {
            for (; r < size; r++)
                if (c.contains(elementData[r]) == complement)
                    elementData[w++] = elementData[r];
        } finally {
            // Preserve behavioral compatibility with AbstractCollection,
            // even if c.contains() throws.
            if (r != size) {
                System.arraycopy(elementData, r,
                                 elementData, w,
                                 size - r);
                w += size - r;
            }
            if (w != size) {
                // clear to let GC do its work
                for (int i = w; i < size; i++)
                    elementData[i] = null;
                modCount += size - w;
                size = w;
                modified = true;
            }
        }
        return modified;
    }

    /**
     * writeObject：自定义序列化逻辑。
     *
     * 过程：
     * 1）先用 defaultWriteObject 写出非 transient 字段（如 size、modCount 等）；
     * 2）再写一个 int 表示“数组容量”（这里为了兼容 clone，只写 size）；
     * 3）按顺序写出前 size 个元素；
     * 4）最后检查序列化过程中 modCount 是否被修改，以维持 fail-fast 语义。
     */
    private void writeObject(java.io.ObjectOutputStream s)
        throws java.io.IOException{
        // Write out element count, and any hidden stuff
        int expectedModCount = modCount;
        s.defaultWriteObject();

        // Write out size as capacity for behavioural compatibility with clone()
        s.writeInt(size);

        // Write out all elements in the proper order.
        for (int i=0; i<size; i++) {
            s.writeObject(elementData[i]);
        }

        if (modCount != expectedModCount) {
            throw new ConcurrentModificationException();
        }
    }

    /**
     * readObject：自定义反序列化逻辑。
     *
     * 过程：
     * 1）先把 elementData 置为 EMPTY_ELEMENTDATA（清理旧状态）；
     * 2）通过 defaultReadObject 读取 size 等字段；
     * 3）读取一个 int 表示“容量”（这里被忽略，只用 size 来决定实际分配的数组大小）；
     * 4）通过 SharedSecrets 做数组分配安全检查；
     * 5）ensureCapacityInternal(size)，再按顺序读入所有元素。
     */
    private void readObject(java.io.ObjectInputStream s)
        throws java.io.IOException, ClassNotFoundException {
        elementData = EMPTY_ELEMENTDATA;

        // Read in size, and any hidden stuff
        s.defaultReadObject();

        // Read in capacity
        s.readInt(); // ignored

        if (size > 0) {
            // be like clone(), allocate array based upon size not capacity
            int capacity = calculateCapacity(elementData, size);
            SharedSecrets.getJavaOISAccess().checkArray(s, Object[].class, capacity);
            ensureCapacityInternal(size);

            Object[] a = elementData;
            // Read in all elements in the proper order.
            for (int i=0; i<size; i++) {
                a[i] = s.readObject();
            }
        }
    }

    /**
     * listIterator(int index)：从指定下标开始的 ListIterator。
     *
     * 注意：index 可以等于 size，此时返回的迭代器一开始就处于“尾后”位置。
     */
    public ListIterator<E> listIterator(int index) {
        if (index < 0 || index > size)
            throw new IndexOutOfBoundsException("Index: "+index);
        return new ListItr(index);
    }

    // listIterator()：等价于 listIterator(0)
    public ListIterator<E> listIterator() {
        return new ListItr(0);
    }

    // iterator()：返回一个只支持向前遍历、删除操作的 Itr
    public Iterator<E> iterator() {
        return new Itr();
    }

    /**
     * Itr：单向迭代器实现（实现 Iterator<E> 接口）。
     *
     * 成员变量：
     * - cursor：下一个要返回的元素下标；
     * - lastRet：上一次返回元素的下标（初始为 -1），用于支持 remove 操作；
     * - expectedModCount：创建迭代器时记录的 modCount，用于 fail-fast 检测。
     *
     * fail-fast 原理：
     * - 每次 next / remove 前都会检查 modCount 是否等于 expectedModCount；
     * - 如果不相等，说明在迭代过程中出现了“外部结构修改”，直接抛 ConcurrentModificationException。
     */
    private class Itr implements Iterator<E> {
        int cursor;       // index of next element to return 下一次返回元素的索引
        int lastRet = -1; // index of last element returned; -1 if no such 上一次返回的索引
        int expectedModCount = modCount; // 期望的 modCount，用于 fail-fast

        public boolean hasNext() {
            return cursor != size;
        }

        @SuppressWarnings("unchecked")
        public E next() {
            checkForComodification();
            int i = cursor;
            if (i >= size)
                throw new NoSuchElementException();
            Object[] elementData = ArrayList.this.elementData;
            if (i >= elementData.length)
                throw new ConcurrentModificationException();
            cursor = i + 1;
            return (E) elementData[lastRet = i];
        }

        public void remove() {
            if (lastRet < 0)
                throw new IllegalStateException();
            checkForComodification();

            try {
                ArrayList.this.remove(lastRet);
                cursor = lastRet;
                lastRet = -1;
                expectedModCount = modCount;
            } catch (IndexOutOfBoundsException ex) {
                throw new ConcurrentModificationException();
            }
        }

        final void checkForComodification() {
            if (modCount != expectedModCount)
                throw new ConcurrentModificationException();
        }
    }

    /**
     * ListItr：双向迭代器，实现 ListIterator<E>。
     *
     * 在 Itr 的基础上新增：
     * - hasPrevious / previous：支持向前遍历；
     * - nextIndex / previousIndex：返回“下一个 / 上一个”元素的下标；
     * - set(e)：修改上一次返回元素的值；
     * - add(e)：在当前 cursor 位置插入新元素。
     */
    private class ListItr extends Itr implements ListIterator<E> {
        ListItr(int index) {
            super();
            cursor = index;
        }

        public boolean hasPrevious() {
            return cursor != 0;
        }

        public int nextIndex() {
            return cursor;
        }

        public int previousIndex() {
            return cursor - 1;
        }

        @SuppressWarnings("unchecked")
        public E previous() {
            checkForComodification();
            int i = cursor - 1;
            if (i < 0)
                throw new NoSuchElementException();
            Object[] elementData = ArrayList.this.elementData;
            if (i >= elementData.length)
                throw new ConcurrentModificationException();
            cursor = i;
            return (E) elementData[lastRet = i];
        }

        public void set(E e) {
            if (lastRet < 0)
                throw new IllegalStateException();
            checkForComodification();

            try {
                ArrayList.this.set(lastRet, e);
            } catch (IndexOutOfBoundsException ex) {
                throw new ConcurrentModificationException();
            }
        }

        public void add(E e) {
            checkForComodification();

            try {
                int i = cursor;
                ArrayList.this.add(i, e);
                cursor = i + 1;
                lastRet = -1;
                expectedModCount = modCount;
            } catch (IndexOutOfBoundsException ex) {
                throw new ConcurrentModificationException();
            }
        }
    }

    /**
     * subList：返回 [fromIndex, toIndex) 范围上的“视图”列表（SubList）。
     *
     * 特点：
     * - 视图与原列表共享同一底层 elementData 数组，空间上更高效；
     * - 通过 SubList 进行的结构修改（add/remove）会反映到原列表；
     * - 但如果通过原列表对结构做修改，再操作 SubList 可能触发 fail-fast。
     */
    public List<E> subList(int fromIndex, int toIndex) {
        subListRangeCheck(fromIndex, toIndex, size);
        return new SubList(this, 0, fromIndex, toIndex);
    }

    static void subListRangeCheck(int fromIndex, int toIndex, int size) {
        if (fromIndex < 0)
            throw new IndexOutOfBoundsException("fromIndex = " + fromIndex);
        if (toIndex > size)
            throw new IndexOutOfBoundsException("toIndex = " + toIndex);
        if (fromIndex > toIndex)
            throw new IllegalArgumentException("fromIndex(" + fromIndex +
                                               ") > toIndex(" + toIndex + ")");
    }

    // SubList：基于父列表的一个“窗口视图”实现
    private class SubList extends AbstractList<E> implements RandomAccess {
        private final AbstractList<E> parent;   // 父列表
        private final int parentOffset;         // 在父列表中的起始偏移
        private final int offset;              // 在 ArrayList.this.elementData 中的起始偏移
        int size;                              // 视图的大小

        SubList(AbstractList<E> parent,
                int offset, int fromIndex, int toIndex) {
            this.parent = parent;
            this.parentOffset = fromIndex;
            this.offset = offset + fromIndex;
            this.size = toIndex - fromIndex;
            this.modCount = ArrayList.this.modCount;
        }

        public E set(int index, E e) {
            rangeCheck(index);
            checkForComodification();
            E oldValue = ArrayList.this.elementData(offset + index);
            ArrayList.this.elementData[offset + index] = e;
            return oldValue;
        }

        public E get(int index) {
            rangeCheck(index);
            checkForComodification();
            return ArrayList.this.elementData(offset + index);
        }

        public int size() {
            checkForComodification();
            return this.size;
        }

        public void add(int index, E e) {
            rangeCheckForAdd(index);
            checkForComodification();
            parent.add(parentOffset + index, e);
            this.modCount = parent.modCount;
            this.size++;
        }

        public E remove(int index) {
            rangeCheck(index);
            checkForComodification();
            E result = parent.remove(parentOffset + index);
            this.modCount = parent.modCount;
            this.size--;
            return result;
        }

        protected void removeRange(int fromIndex, int toIndex) {
            checkForComodification();
            parent.removeRange(parentOffset + fromIndex,
                               parentOffset + toIndex);
            this.modCount = parent.modCount;
            this.size -= toIndex - fromIndex;
        }

        public boolean addAll(Collection<? extends E> c) {
            return addAll(this.size, c);
        }

        public boolean addAll(int index, Collection<? extends E> c) {
            rangeCheckForAdd(index);
            int cSize = c.size();
            if (cSize==0)
                return false;

            checkForComodification();
            parent.addAll(parentOffset + index, c);
            this.modCount = parent.modCount;
            this.size += cSize;
            return true;
        }

        public Iterator<E> iterator() {
            return listIterator();
        }

        public ListIterator<E> listIterator(final int index) {
            checkForComodification();
            rangeCheckForAdd(index);
            final int offset = this.offset;

            return new ListIterator<E>() {
                int cursor = index;
                int lastRet = -1;
                int expectedModCount = ArrayList.this.modCount;

                public boolean hasNext() {
                    return cursor != SubList.this.size;
                }

                @SuppressWarnings("unchecked")
                public E next() {
                    checkForComodification();
                    int i = cursor;
                    if (i >= SubList.this.size)
                        throw new NoSuchElementException();
                    Object[] elementData = ArrayList.this.elementData;
                    if (offset + i >= elementData.length)
                        throw new ConcurrentModificationException();
                    cursor = i + 1;
                    return (E) elementData[offset + (lastRet = i)];
                }

                public boolean hasPrevious() {
                    return cursor != 0;
                }

                @SuppressWarnings("unchecked")
                public E previous() {
                    checkForComodification();
                    int i = cursor - 1;
                    if (i < 0)
                        throw new NoSuchElementException();
                    Object[] elementData = ArrayList.this.elementData;
                    if (offset + i >= elementData.length)
                        throw new ConcurrentModificationException();
                    cursor = i;
                    return (E) elementData[offset + (lastRet = i)];
                }

                public int nextIndex() {
                    return cursor;
                }

                public int previousIndex() {
                    return cursor - 1;
                }

                public void remove() {
                    if (lastRet < 0)
                        throw new IllegalStateException();
                    checkForComodification();

                    try {
                        SubList.this.remove(lastRet);
                        cursor = lastRet;
                        lastRet = -1;
                        expectedModCount = ArrayList.this.modCount;
                    } catch (IndexOutOfBoundsException ex) {
                        throw new ConcurrentModificationException();
                    }
                }

                public void set(E e) {
                    if (lastRet < 0)
                        throw new IllegalStateException();
                    checkForComodification();

                    try {
                        ArrayList.this.set(offset + lastRet, e);
                    } catch (IndexOutOfBoundsException ex) {
                        throw new ConcurrentModificationException();
                    }
                }

                public void add(E e) {
                    checkForComodification();

                    try {
                        int i = cursor;
                        SubList.this.add(i, e);
                        cursor = i + 1;
                        lastRet = -1;
                        expectedModCount = ArrayList.this.modCount;
                    } catch (IndexOutOfBoundsException ex) {
                        throw new ConcurrentModificationException();
                    }
                }

                final void checkForComodification() {
                    if (expectedModCount != ArrayList.this.modCount)
                        throw new ConcurrentModificationException();
                }
            };
        }

        public List<E> subList(int fromIndex, int toIndex) {
            subListRangeCheck(fromIndex, toIndex, size);
            return new SubList(this, offset, fromIndex, toIndex);
        }

        private void rangeCheck(int index) {
            if (index < 0 || index >= this.size)
                throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
        }

        private void rangeCheckForAdd(int index) {
            if (index < 0 || index > this.size)
                throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
        }

        private String outOfBoundsMsg(int index) {
            return "Index: "+index+", Size: "+this.size;
        }

        private void checkForComodification() {
            if (ArrayList.this.modCount != this.modCount)
                throw new ConcurrentModificationException();
        }
    }
}
```



