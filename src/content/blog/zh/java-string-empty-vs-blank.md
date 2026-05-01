---
title: "Java 字符串判空：isEmpty 与 isBlank 的区别"
date: 2025-10-31T16:50:04+08:00
tags: ["Java", "字符串", "isEmpty", "isBlank", "开发规范"]
summary: "这篇文章系统梳理了 Java、Apache Commons、Hutool、Guava 和 Spring 中常见的字符串判空方法，重点解释 isEmpty、isBlank 以及 null 处理之间的差异。"
lang: "zh"
slug: "java-string-empty-vs-blank"
draft: false
---

# 字符串判空

在实际代码编写中，我们经常进行字符串的判空操作，来进行参数校验。

但是不同工具类下面又有好多不同的方法，我们常常分不清，到处乱用，而没有形成统一的规范。

这篇文章就详细介绍一下我们常见的字符串判空方法！

## Java 标准库 (String 类)

### **`isEmpty()`**

- **方法描述**: 判断字符串是否为空，即长度是否为 0。
- **适用场景**: 用来检查字符串是否为 `""`（空字符串），但不考虑是否为空格。
- **示例**:

  ```
  String str = "";  
  boolean isEmpty = str.isEmpty(); // true
  ```

### **`trim()` + `isEmpty()`**

- **方法描述**: 如果需要检查一个字符串是否只包含空格并且没有其他内容，通常可以先调用 `trim()` 方法去掉空格后，再用 `isEmpty()` 来检查。
- **示例**:

  ```
  String str = "   ";   
  boolean isBlank = str.trim().isEmpty(); // true
  ```

## **Apache Commons Lang (`StringUtils` 类)**

Apache Commons Lang 提供了强大的字符串工具类 `StringUtils`，它比 Java 标准库提供的 `String` 类更加丰富。

### **`isEmpty()`**

- **方法描述**: 与 Java 的 `String.isEmpty()` 相同，检查字符串是否为空。
- **示例**:

  ```
  String str = "";  
  boolean isEmpty = StringUtils.isEmpty(str); // true
  ```

### **`isBlank()`**

- **方法描述**: 检查字符串是否为空或仅由空格字符组成。和 `isEmpty()` 不同，`isBlank()` 会返回 `true` 如果字符串只包含空格。
- **示例**:

  ```
  String str = "  ";  
  boolean isBlank = StringUtils.isBlank(str); // true
  ```

### **`isNotEmpty()`** 和 **`isNotBlank()`**

- 这两个方法分别是 `isEmpty()` 和 `isBlank()` 的反义方法，用来判断字符串是否非空。

### **`defaultString()`**

- **方法描述**: 如果字符串为 `null`，返回一个默认值。这个方法非常方便在处理可能为 `null` 的字符串时使用。
- **示例**:

  ```
  String str = null;  
  String result = StringUtils.defaultString(str, "default"); // "default"
  ```

## **Hutool (Hutool 库)**

Hutool 是一个非常流行的 Java 工具库，它也提供了字符串相关的实用方法。

### **`StrUtil.isBlank()`**

- **方法描述**: 与 Apache Commons Lang 的 `StringUtils.isBlank()` 类似，判断字符串是否为空或仅包含空格。
- **示例**:

  ```
  String str = "  ";  
  boolean isBlank = StrUtil.isBlank(str); // true
  ```

### **`StrUtil.isEmpty()`**

- **方法描述**: 判断字符串是否为空（即长度为 0）。
- **示例**:

  ```
  String str = "";  
  boolean isEmpty = StrUtil.isEmpty(str); // true
  ```

### **`StrUtil.isNotBlank()`****`StrUtil.isNotEmpty()`**

- 与 `isBlank()` 和 `isEmpty()` 互为反义方法，用于检查字符串是否非空或非空格。

### **`StrUtil.nullToEmpty()`**

- **方法描述**: 将 `null` 字符串转为 `""`（空字符串），这样避免了 `NullPointerException`。
- **示例**:

  ```
  String str = null;  
  String result = StrUtil.nullToEmpty(str); // ""
  ```

## **Google Guava (`Strings` 类)**

Guava 提供了 `Strings` 类来处理字符串的一些常见操作。

### **`isNullOrEmpty()`**

- **方法描述**: 检查字符串是否为 `null` 或空字符串。
- **示例**:

  ```
  String str = "";  
  boolean isEmpty = Strings.isNullOrEmpty(str); // true
  ```

### **`isNullOrEmpty()` 与 isEmpty() 区别**

- `Strings.isNullOrEmpty()` 是 Guava 提供的扩展版本，除了检查空字符串外，还考虑了 `null` 情况。Java 标准库的 `String.isEmpty()` 只会检查非 `null` 的空字符串。

## **Spring Framework (`StringUtils` 类)**

Spring 的 `StringUtils` 提供了类似 Apache Commons 的功能，但它的实现更注重 Spring 框架中的兼容性。

### **`isEmpty()`**:

- **方法描述**: 与 `String.isEmpty()` 类似，检查字符串是否为空。
- **示例**:

  ```
  String str = "";  
  boolean isEmpty = StringUtils.isEmpty(str); // true
  ```

### **`isBlank()`**:

- **方法描述**: 检查字符串是否为空或只包含空白字符（如空格、制表符等）。
- **示例**:

  ```
  String str = " ";  
  boolean isBlank = StringUtils.isBlank(str); // true
  ```

### 总结

|  |
| --- |
|  |

| 方法名 | 作用 | 包/库 |
| --- | --- | --- |
| `isEmpty()` | 判断字符串是否为空（长度为 0） | Java `String`、`StringUtils` (Apache) |
| `isBlank()` | 判断字符串是否为空或只包含空格 | Apache `StringUtils`、Hutool `StrUtil`、Spring `StringUtils` |
| `trim().isEmpty()` | 去除空格后判断是否为空 | Java |
| `isNullOrEmpty()` | 判断字符串是否为 `null` 或空字符串 | Guava `Strings` |
| `nullToEmpty()` | 将 `null` 转为空字符串 | Hutool `StrUtil` |
| `defaultString()` | 如果字符串为 `null`，返回默认值 | Apache `StringUtils` |

### 区别：

- **`isEmpty()`** 只关心字符串是否长度为 0，不考虑空格和 `null`。
- **`isBlank()`** 除了检查字符串是否为空外，还会考虑空白字符（如空格、制表符等）。
- 一些方法（如 `Strings.isNullOrEmpty()` 或 `StrUtil.nullToEmpty()`）还处理了 `null` 情况，避免了 `NullPointerException`。

除了上面这些，还有比如**lombok**中的@NonNull主键，比如Object类中的isNull()方法等等,当然还有**Jakarta Bean Validation**中的一些注解。

通常，选择哪个方法取决于我们的需求。如果想简单地检查字符串是否为空或仅包含空格，`isBlank()` 是最合适的。如果只关心是否为空，`isEmpty()` 就足够了。

 

这篇文章就讨论到这里，如果大家有问题，欢迎留言！ 如果有收获，也感谢大家点赞，关注，转发！
