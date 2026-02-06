---
title: "HashMap High-Frequency Interview Q&A"
order: 36
section: "Interview"
topic: "Java Collections"
lang: "en"
slug: "interview-java-collections-hashmap-questions"
summary: "A structured list of common HashMap interview questions: fundamentals, internals, resizing/treeification, concurrency pitfalls, and JDK 7 vs JDK 8 differences."
icon: "❓"
featured: false
toc: true
updated: 2026-02-05
---

> This page is a **review checklist** after reading the source code. The Q&A is based on **JDK 8 HashMap**, with occasional comparisons to JDK 7.

---

## 1) What is the underlying data structure of HashMap? What’s the difference between JDK 7 and JDK 8?

**Answer:**

- **JDK 7**: **array + linked list**. Each bucket uses a linked list to resolve hash collisions.
- **JDK 8**: **array + linked list + red–black tree**. A long collision chain may be treeified into a red–black tree to reduce lookup time.
- Another important change: **JDK 7 inserts nodes at the head** of the bucket list, while **JDK 8 uses tail insertion** (and the resize/migration logic is also different).

---

## 2) What are the `put` / `get` flows? How is the bucket located? Why `(n - 1) & hash`?

**Answer:**

- **`put` flow (simplified):**
  1. Compute `hashCode()` for the key; JDK 8 applies a spread function: `h ^ (h >>> 16)` to get the final hash.
  2. Compute the bucket index: `index = (n - 1) & hash`.
  3. If the bucket is empty: insert directly.
  4. If not empty: traverse the list/tree. If the same key exists (same hash and `equals`), overwrite the value; otherwise insert a new node (tail insert in JDK 8), and treeify/resize if needed.
- **`get` flow:**
  1. Compute `hash` and `index` the same way.
  2. If bucket is empty, return `null`. Otherwise compare the first node, then search the list/tree according to the rules.
- **Why `(n - 1) & hash`:**
  - When `n` is a power of two, `(n - 1)` has all lower bits set to 1. Bitwise AND is equivalent to `hash % n` but typically faster.
  - This also implies the capacity is expected to be a power of two.

### 2.1 Why do we “spread” / mix `hashCode()` (the perturbation in JDK 8)?

**Answer:**

- Many `hashCode()` implementations have “good” high bits but “bad” low bits. Since bucket indexing uses low bits heavily, poor low-bit distribution can cause heavy clustering.
- JDK 8 uses `h ^ (h >>> 16)` to fold high-bit information into low bits so the **low bits become more random**, reducing systematic collisions.
- This mixing is cheap (a few bit ops) but can significantly improve distribution in extreme cases.

### 2.2 Why must we use `(n - 1) & hash` instead of `% n`?

**Answer:**

- Bitwise AND is generally faster than modulo.
- With `n` being a power of two, `(n - 1) & hash` is exactly equivalent to `hash % n`.
- Combined with the spread function, it gives good distribution with a simple implementation.

### 2.3 Why must the capacity be a power of two?

**Answer:**

- To make `(n - 1) & hash` fully equivalent to `% n`, `n` must be a power of two. Otherwise, you lose some bit combinations and the distribution becomes uneven.
- When resizing from `oldCap` to `newCap = oldCap * 2`, you only need to check `hash & oldCap` to decide whether an entry stays at the original index or moves to `index + oldCap`—no modulo recomputation needed.
- In short: power-of-two capacity enables **fast indexing + simple migration + decent distribution**.

---

## 3) How are hash collisions handled? How do linked lists / red–black trees search and insert?

**Answer:**

- A collision means multiple keys map to the same bucket.
- **Linked list**: linear scan; a key matches if “hash equal and `equals` true”. If not found, insert (tail in JDK 8).
- **Red–black tree**: locate in the tree based on hash/comparability/tie-breaking rules; insert and rebalance. Average/worst lookup is around **\(O(\log n)\)** within that bucket.

---

## 4) How does HashMap decide two keys are equal? Is equal `hashCode` enough? What does `equals` do?

**Answer:**

- HashMap treats keys as the same if: **same hash AND (reference-equal OR `equals` returns true)**.
- Same `hashCode` **does not** mean objects are equal; it only suggests they may land in the same bucket. Final confirmation requires `equals`.
- For custom keys, implement `equals`/`hashCode` correctly: **`equals` true ⇒ `hashCode` must be equal**.

---

## 5) Why does HashMap require the capacity to be a power of two?

**Answer:**

- Allows `(n - 1) & hash` instead of `% n`.
- More importantly: the power-of-two design works well with hash spreading to make low bits more evenly distributed, reducing collisions.
- Migration during doubling resize is simpler and faster (see the lo/hi split in Q7).

---

## 6) When does resizing happen? How is `threshold` computed? What is the default load factor and why `0.75`?

**Answer:**

- Primary trigger: **`size > threshold`** (after a structural insert, if size exceeds threshold, resize).
- `threshold = capacity * loadFactor`.
- Default `loadFactor = 0.75`: a trade-off between memory usage and collision probability. Larger saves memory but increases collisions; smaller reduces collisions but wastes space.

---

## 7) How are entries migrated after resizing? What is the JDK 8 lo/hi split rule? Why no modulo recomputation?

**Answer:**

- Resize typically doubles capacity: `newCap = oldCap * 2`.
- In JDK 8, migration does **not** need `% newCap` because `newCap` adds exactly one more higher bit.
- For each node in a bucket, check:
  - `(hash & oldCap) == 0` → stays at the same index (lo list).
  - `(hash & oldCap) != 0` → new index is `oldIndex + oldCap` (hi list).
- This is the “lo/hi split”: one bit check decides the destination, so it’s fast.

Intuition:
After doubling, `(newCap - 1)` has one extra 1-bit compared to `(oldCap - 1)`, so the new index is either the old index or the old index plus `oldCap`. Checking `hash & oldCap` tells you which case it is.

---

## 8) When does a bucket chain treeify? What do thresholds 8 and capacity 64 mean? Why this design?

**Answer:**

- Treeify threshold: when the bucket’s list length reaches **8** (`TREEIFY_THRESHOLD`), HashMap will *try* to treeify.
- But it only treeifies if the table capacity is **≥ 64** (`MIN_TREEIFY_CAPACITY`).
- If the chain is long but the table is small (< 64), HashMap prefers **resize** instead of treeify: long chains often mean the table is too small, and resizing is usually more beneficial than maintaining a tree.

---

## 9) When does a red–black tree degrade back to a linked list? What’s the threshold? (6)

**Answer:**

- The untreeify threshold is **6** (`UNTREEIFY_THRESHOLD`).
- After deletions or during resize splits, if the number of nodes in that tree bin drops, it can revert to a list to avoid tree maintenance overhead.

---

## 10) What’s the time complexity of HashMap? Why can it degrade in the worst case?

**Answer:**

- Average: `put/get` is **\(O(1)\)** with good hash distribution.
- In extreme collision scenarios:
  - JDK 7 (list only): worst-case **\(O(n)\)** within a bucket.
  - JDK 8 (tree bins possible): bucket lookup can become **\(O(\log n)\)** after treeification (but before treeification it can still be \(O(n)\)).
- Root causes: poor hash distribution, many collisions (bad `hashCode`, adversarial keys, etc.).

---

## 11) Why is HashMap not thread-safe? What problems can happen?

**Answer:**

HashMap has no synchronization. Under concurrent access, you can see:

- **Lost updates / lost entries**: two threads `put` into the same bucket and pointer updates race.
- **Inconsistent reads**: one thread resizes/migrates while another reads/writes and observes intermediate states.
- `size/threshold` and structure can become inconsistent (especially visible in older implementations).

---

## 12) Why could JDK 7 concurrent resize form a cycle in the linked list? Does JDK 8 still have it?

**Answer:**

- **JDK 7** rebuilds bucket lists with **head insertion** during resize. With multiple threads resizing concurrently, pointer updates can interleave and create a cycle, causing infinite loops in `get` / traversal.
- **JDK 8** changed migration to **lo/hi split + tail insertion**, which largely avoids that classic “cycle” failure mode.
- But **HashMap is still not thread-safe** in JDK 8: data loss and structural inconsistency are still possible under concurrency.

---

## 13) What should you use instead in multi-threaded scenarios? (ConcurrentHashMap / synchronizedMap / manual locking)

**Answer:**

- **ConcurrentHashMap (recommended)**: designed for concurrency. In JDK 8 it mainly uses CAS + bin-level `synchronized` (much finer-grained than a single global lock). Reads are mostly lock-free.
- **`Collections.synchronizedMap(new HashMap())`**: coarse-grained lock (one lock per method). Simple but poor under high contention; iteration still requires external synchronization.
- **Manual locking (`ReentrantLock` / `synchronized`)**: flexible but easier to get wrong; useful when you need composite atomic operations (e.g., check-then-act).

---

## 14) Does HashMap allow `null`? How many null keys? Which bucket is used?

**Answer:**

- Allows **one `null` key**, and allows multiple `null` values.
- `null` key’s hash is treated as `0`, so it goes to bucket index `0`.
- Hashtable / (classic) ConcurrentHashMap handle nulls differently (see related questions in your notes).

---

## 15) Can key/value be mutable objects? What happens if fields used by `hashCode/equals` change after `put`?

**Answer:**

- A mutable **value** is generally fine, because lookup does not depend on values.
- A mutable **key** is strongly discouraged. If fields that participate in `hashCode/equals` change after insertion:
  - The entry remains in the old bucket, but future `get` computes a different hash/index → you **cannot find it**.
  - You may also accidentally create “duplicate logical keys” by inserting again.

---

## 16) If you use a custom object as a key, what contracts must it satisfy?

**Answer:**

- Correctly override `equals()` and `hashCode()`:
  - **`equals` true ⇒ `hashCode` must be equal**
  - `hashCode` should be reasonably well-distributed.
- Keys should ideally be **immutable** (or at least the fields used by `equals/hashCode` must not change).
- `equals` should be reflexive/symmetric/transitive/consistent, and consistent with `hashCode`.

---

## 17) What are the defaults: initial capacity, load factor, treeify/untreeify thresholds, min treeify capacity?

**Answer (JDK 8 constants):**

- Default initial capacity (table capacity on first allocation): **16**
- Default load factor: **0.75**
- Treeify threshold: **8** (`TREEIFY_THRESHOLD`)
- Untreeify threshold: **6** (`UNTREEIFY_THRESHOLD`)
- Minimum capacity to allow treeification: **64** (`MIN_TREEIFY_CAPACITY`)

---

## 18) When is the table array actually created? (Lazy init)

**Answer:**

- JDK 8 HashMap often uses **lazy initialization**: it may not allocate the table in the constructor, and only creates it on the first `put` (or the first `resize`).
- If you pass an `initialCapacity`, it precomputes a suitable threshold/capacity plan, but table allocation may still be deferred until first use.

---

## 19) Is HashMap traversal ordered? Why doesn’t it guarantee order? What to use for ordering?

**Answer:**

- **HashMap iteration order is not guaranteed**. It depends on hash distribution, bucket positions, resizes, and internal details that can change.
- For insertion order: **LinkedHashMap** (insertion-order).
- For access order / LRU: **LinkedHashMap** with `accessOrder=true`.
- For sorted keys / range queries: **TreeMap**.

---

## 20) What is fail-fast? Why can iteration throw `ConcurrentModificationException`? How to avoid it?

**Answer:**

- Fail-fast iterators detect **structural modifications** during iteration (other than iterator’s own `remove`) and throw `ConcurrentModificationException`.
- HashMap uses `modCount` and the iterator’s `expectedModCount` to detect changes.
- How to avoid:
  - Single-thread: don’t structurally modify during iteration (or use iterator’s `remove`).
  - Multi-thread: use `ConcurrentHashMap`, or external locking; for `synchronizedMap`, you must synchronize the whole iteration.

---

## 21) HashMap vs Hashtable: what are the differences?

**Answer:**

- Hashtable is legacy: **method-level `synchronized`**, thread-safe but slow under contention.
- Hashtable **does not allow null keys or null values**; HashMap allows one null key and multiple null values.
- HashMap in JDK 8 has tree bins; classic Hashtable does not.
- Today: use **ConcurrentHashMap** for concurrency; otherwise **HashMap**.

---

## 22) HashMap vs ConcurrentHashMap: what are the differences? How does ConcurrentHashMap achieve concurrency?

**Answer:**

- HashMap: not thread-safe; fine for single-threaded or externally synchronized use.
- ConcurrentHashMap: thread-safe and optimized for concurrency.
- JDK 8 ConcurrentHashMap core ideas:
  - CAS + cooperative resizing for initialization/expansion.
  - Writes use bin-level locking (often `synchronized` on the bin head), much finer than a global lock.
  - Reads are mostly lock-free (via volatile/CAS visibility).

---

## 23) HashMap vs LinkedHashMap: what are the differences (insertion order / access order / LRU)?

**Answer:**

- LinkedHashMap extends HashMap with a **doubly linked list** to maintain order:
  - Default: **insertion order**.
  - Optional: **access order** (`accessOrder=true`), where `get/put` moves the entry to the tail.
- Typical LRU pattern: subclass LinkedHashMap and override `removeEldestEntry()` to evict when size exceeds a limit.
- Cost: extra memory for the linked list and some additional pointer updates.

---

## 24) HashMap vs TreeMap: what are the differences (ordering / red–black tree / range query)?

**Answer:**

- HashMap: hashing-based, average \(O(1)\), **no ordering guarantee**.
- TreeMap: red–black-tree-based, operations \(O(\log n)\), and supports:
  - ordered traversal (ascending/descending),
  - range queries (`subMap` / `headMap` / `tailMap`),
  - extremes (`firstKey` / `lastKey`).
- Choose TreeMap when you need ordering/range queries; choose HashMap for fast key-value lookup.

