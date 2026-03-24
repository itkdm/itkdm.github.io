---
title: "JMeter接口关联（Correlation）"
order: 9
section: "性能测试"
topic: "JMeter 实践"
lang: "zh"
slug: "perf-jmeter-correlation"
summary: "掌握从响应中提取 token、请求 ID 等动态数据并传递给后续接口的方法，构建真实业务流程压测脚本。"
icon: "🔗"
featured: false
toc: true
updated: 2026-03-14
---

# JMeter接口关联（Correlation）

## 一、什么是接口关联

在真实业务系统中，一个接口的返回结果往往会被下一个接口使用。

例如：

用户登录：

```text
POST /api/login
```

返回结果：

```json
{
  "code": 200,
  "token": "abc123xyz"
}
```

后续接口需要使用 token：

```text
GET /api/user/profile
Authorization: Bearer abc123xyz
```

由于 token 每次登录都会变化，因此压测脚本必须：

1. 从响应中提取 token
2. 在后续请求中使用 token

这个过程就叫 **接口关联（Correlation）**。

简单来说：

> 接口关联就是把一个请求的响应数据，传递给下一个请求。

---

## 二、为什么需要接口关联

如果不做关联，会出现以下问题：

例如脚本写死：

```text
Authorization: Bearer abc123xyz
```

但是：

```text
token 每次登录都会变化
```

结果就是：

```text
接口返回 401
认证失败
```

压测结果完全错误。

因此在真实压测中必须实现：

```text
动态数据传递
```

---

## 三、JMeter关联流程

接口关联通常包含两个步骤：

```text
1 提取数据
2 使用数据
```

流程示意：

```text
登录接口
   ↓
提取 token
   ↓
保存变量
   ↓
后续接口使用 ${token}
```

---

## 四、提取响应数据

JMeter 提供多种提取方式：

| 提取方式 | 适用场景 |
| --- | --- |
| Regular Expression Extractor | 正则提取 |
| JSON Extractor | JSON响应 |
| XPath Extractor | XML响应 |

在现代 API 中最常用的是：

```text
JSON Extractor
```

---

## 五、JSON Extractor 使用

假设登录接口返回：

```json
{
  "code": 200,
  "data": {
    "token": "abc123xyz"
  }
}
```

### 添加 JSON Extractor

右键登录接口：

```text
Add → Post Processors → JSON Extractor
```

配置：

| 参数 | 值 |
| --- | --- |
| Variable Name | token |
| JSON Path | $.data.token |

配置完成后：

JMeter 会自动提取：

```text
abc123xyz
```

并保存为变量：

```text
${token}
```

---

## 六、使用提取变量

在后续接口中可以直接使用变量。

例如：

请求头：

```text
Authorization: Bearer ${token}
```

或者：

请求参数：

```json
{
  "token": "${token}"
}
```

运行时：

```text
${token} → abc123xyz
```

---

## 七、完整关联示例

假设系统有两个接口：

```text
登录接口
获取用户信息接口
```

### 第一步 登录

请求：

```text
POST /api/login
```

返回：

```json
{
  "token": "abc123xyz"
}
```

### 第二步 提取 token

使用：

```text
JSON Extractor
```

配置：

```text
Variable Name = token
JSON Path = $.token
```

### 第三步 调用用户接口

请求：

```text
GET /api/user/profile
```

Header：

```text
Authorization: Bearer ${token}
```

执行流程：

```text
用户登录
 ↓
提取token
 ↓
调用用户接口
```

这样每个线程都会使用自己的 token。

---

## 八、JMeter关联常见问题

### 变量未提取成功

如果 JSON Path 错误：

```text
${token} = null
```

解决方法：

使用：

```text
View Results Tree
```

查看响应数据。

### 提取多个值

如果返回多个数据，例如：

```json
{
  "ids": [1, 2, 3, 4]
}
```

可以提取：

```text
$.ids[*]
```

### 变量作用域问题

变量必须在 **后续请求** 中使用。

如果顺序错误，例如：

```text
先使用变量
后提取变量
```

则会失败。

---

## 九、企业真实压测脚本结构

在企业压测中，脚本通常是这样的结构：

```text
Thread Group
 ├ Login API
 │   └ JSON Extractor (token)
 ├ Query User API
 │   └ Header: Authorization ${token}
 └ Order API
     └ Header: Authorization ${token}
```

这样可以模拟：

```text
真实用户行为
```

---

## 十、总结

接口关联是 JMeter 中最重要的能力之一。

关联流程：

```text
1 发送请求
2 提取响应数据
3 保存为变量
4 后续请求使用变量
```

常见提取方式：

```text
JSON Extractor
Regular Expression Extractor
XPath Extractor
```

掌握接口关联后，就可以实现：

* 登录 → 查询用户
* 登录 → 下单
* 登录 → 支付

这些 **真实业务流程压测**。
