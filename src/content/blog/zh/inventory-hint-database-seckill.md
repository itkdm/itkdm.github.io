---
title: "MyBatis 去 XML 的另一种写法：Provider 与 SQL Builder"
date: 2026-02-07T20:06:23+08:00
tags: ["Java", "MyBatis", "ORM", "后端开发"]
summary: "从一个没有 Mapper XML 的项目切入，重新理解 MyBatis 的“去 XML”并不等于“全写注解”，而是还可以通过 Provider 和 SQL Builder 把动态 SQL 放回 Java 代码中。"
lang: "zh"
slug: "inventory-hint-database-seckill"
draft: false
---

一直以来，我对 MyBatis 都有个很强的惯性认知：

> Mapper 接口负责声明方法，Mapper.xml 负责写 SQL。

改条件就去 XML 里写 `<if test="">`，调参数就继续改动态 SQL，很多人从入门到工作多年，都是这样用过来的。

直到最近我看到一个项目，翻遍了 `resources/mapper`，居然一份 XML 都没找到。

我第一反应是：

> 这项目肯定是全用 `@Select`、`@Update` 这类注解硬写 SQL 了。

结果点开 Mapper 之后，我才发现自己想简单了。

---

## 1. 去 XML，不只有 `@Select`

如果只是最简单的单表按主键查询，用注解确实很舒服：

```java
@Select("select * from tb_user where id = #{id}")
UserDO selectById(Long id);
```

但只要一进入动态 SQL 场景，很多人写着写着就会变成这样：

```java
@Select("<script>" +
        "select * from tb_user " +
        "<where>" +
        " <if test='name != null and name != \"\"'> and name like concat('%', #{name}, '%') </if>" +
        " <if test='age != null'> and age >= #{age} </if>" +
        "</where>" +
        "</script>")
List<UserDO> list(UserQuery req);
```

这种写法的体验通常都不太好：

- 字符串拼接可读性差
- 没有 SQL 高亮
- 一复杂起来就很难维护

所以很多团队最后还是会回到 XML，至少动态 SQL 放在 XML 里，结构还算清楚。

---

## 2. 真正让我改观的是 `@SelectProvider`

我在那个项目里看到的 Mapper 是这样的：

```java
@SelectProvider(type = UserSqlProvider.class, method = "selectByCondition")
List<UserDO> selectByCondition(UserQuery req);
```

当时我心里第一反应是：

> Provider？这又是什么东西？

点进去一看，是这种写法：

```java
public class UserSqlProvider {

    public String selectByCondition(UserQuery req) {
        return new SQL() {{
            SELECT("id, name, age, status, create_time");
            FROM("tb_user");

            if (req.getName() != null && !req.getName().isBlank()) {
                WHERE("name like concat('%', #{name}, '%')");
            }
            if (req.getMinAge() != null) {
                WHERE("age >= #{minAge}");
            }
            if (req.getStatus() != null) {
                WHERE("status = #{status}");
            }

            ORDER_BY("create_time desc");
        }}.toString();
    }
}
```

这时候我才意识到：

- `SQL()`
- `SELECT()`
- `WHERE()`
- `ORDER_BY()`

这些并不是项目自己封装的 DSL，而是 **MyBatis 自带的 SQL Builder**。

也就是说，所谓“去 XML”，其实并不只有“把 SQL 全塞进注解字符串里”这一条路。

它还可以是：

- Mapper 接口里仍然只声明方法
- 动态 SQL 写到 Provider 类中
- SQL 最终仍由 MyBatis 执行
- 只是载体从 XML 变成了 Java 方法

---

## 3. Provider 的本质是什么？

如果用一句话来概括，Provider 的本质就是：

> 把原本写在 XML 里的动态 SQL 逻辑，搬回 Java 代码里组织。

它解决的问题主要是两个：

- 动态 SQL 的表达能力
- Java 代码内聚带来的可维护性

比如条件查询、动态筛选、拼接排序字段，这类逻辑用 Provider 往往会比 XML 更贴近业务代码。

再举一个例子，比如动态排序：

```java
public String list(UserQuery req) {
    return new SQL() {{
        SELECT("*");
        FROM("tb_user");

        if (req.getName() != null && !req.getName().isBlank()) {
            WHERE("name like concat('%', #{name}, '%')");
        }

        if ("create_time".equals(req.getOrderBy())) {
            ORDER_BY("create_time desc");
        } else if ("age".equals(req.getOrderBy())) {
            ORDER_BY("age desc");
        } else {
            ORDER_BY("id desc");
        }
    }}.toString();
}
```

这类代码有几个明显好处：

- 动态条件逻辑直接用 Java `if`
- 参数对象和查询逻辑更贴近
- 排序字段可以自然地做白名单校验

尤其是动态排序这种需求，放在 XML 里往往一不小心就会走向字符串拼接；放在 Provider 里，白名单校验反而更顺手。

---

## 4. 但 Provider 不是银弹

看到这里，很容易产生一个误解：

> 既然 Provider 这么灵活，那是不是以后 MyBatis 都不需要 XML 了？

我觉得并不是。

Provider 解决的是“中等复杂度动态 SQL”的体验问题，但它并不能彻底解决复杂 SQL 的表达成本。

比如下面这些场景：

- 多表复杂 Join
- 深层子查询
- CTE
- 窗口函数
- 大段报表 SQL

理论上你都可以继续用 Builder 写，但写着写着就会变成“在 Java 里造 SQL 抽象树”，可读性反而可能还不如直接写原生 SQL。

所以更合理的结论应该是：

- **中等复杂度动态查询**：Provider 很适合
- **复杂报表 / 超长 SQL**：XML 或独立 SQL 文件可能更直观

也就是说，Provider 不是要替代所有 SQL 载体，而是多提供了一种更适合某类场景的写法。

---

## 5. Provider 最容易踩的坑：参数绑定

如果你真打算在项目里系统性使用 Provider，有一个地方很容易踩坑：参数绑定。

### 5.1 单参数对象：最省心

像这种写法：

```java
List<UserDO> list(UserQuery req);
```

Provider 里直接写：

- `#{name}`
- `#{minAge}`
- `#{status}`

通常就能映射到 `req` 的属性，体验最好。

### 5.2 多参数场景：一定要加 `@Param`

如果是这种写法：

```java
@SelectProvider(type = UserSqlProvider.class, method = "get")
UserDO get(@Param("id") Long id, @Param("status") Integer status);
```

那 Provider 里就必须清楚地按参数名来取值。

否则非常容易出现这种典型问题：

- 参数名变成 `param1` / `param2`
- Provider 里写的占位符和实际参数对不上
- 最后报错还不够直观

很多人第一次碰 Provider，最容易卡的不是 SQL Builder 本身，而是参数传递和占位符绑定这块。

---

## 6. 这件事为什么值得重新理解？

我觉得这次最有意思的点不是“学到了一个 MyBatis 的冷门注解”，而是它让我重新理解了“去 XML”这件事。

以前我脑子里的等式一直是：

> 去 XML = 改成注解 SQL

但真正看完这个项目之后，我觉得更准确的理解应该是：

> 去 XML = SQL 载体从 XML 转移，不一定等于 SQL 表达能力退化。

也就是说，XML 并不是唯一能承载动态 SQL 的地方。

在 MyBatis 体系里，至少还有一条非常现实的路线：

- Mapper 继续保持接口风格
- 动态 SQL 交给 Provider
- 复杂条件交给 Java 逻辑组织
- 最终由 MyBatis 负责执行

这种方式对很多不喜欢 XML、但又不想把 SQL 全塞进注解字符串的人来说，确实是一个很有价值的折中方案。

---

## 7. 最后一句话

写了很多年 MyBatis 之后，我越来越觉得：真正限制我们的，往往不是框架本身，而是我们对框架的固有印象。

很多人一提 MyBatis，就默认想到：

- XML
- `<if>`
- `<where>`
- `<foreach>`

这些当然都没错，但这并不代表 MyBatis 只能这样用。

`@SelectProvider` 和 SQL Builder 的存在，其实就在提醒我们一件事：

> MyBatis 的“去 XML”，并不只是“把 SQL 写进注解里”，而是可以把动态 SQL 的组织方式重新放回 Java。

如果你的项目正好卡在“XML 太重、注解太乱”这两个极端之间，那 Provider 这条路，确实值得认真看一眼。
