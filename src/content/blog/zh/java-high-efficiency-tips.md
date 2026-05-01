---
title: "提升 Java 开发效率的 5 个实用技巧"
date: 2025-12-08T23:19:27+08:00
tags: ["Java", "JDK", "开发效率", "CompletableFuture", "Stream"]
summary: "这篇文章围绕 Stream、Optional、Try-With-Resources、模式匹配、CompletableFuture 和 record，系统整理了 6 个能在日常业务开发里直接提效的 Java 高阶技巧。"
lang: "zh"
slug: "java-high-efficiency-tips"
draft: false
---

很多团队嘴上说“要提升研发效率”，落到代码上却还是：

- 一堆 `for` 循环手搓集合处理
- 到处“判空+抛 NPE”
- `try/finally` 写到手抽筋
- `instanceof` + 强制类型转换一长串
- 异步逻辑写得又乱又难测

其实，很多问题 JDK 已经帮你想好了——只是大部分人没真正用起来。

下面我用**贴近实际业务的例子**，对比“传统写法”和“现代写法”，带你把这几个神级技巧用顺手：

> 目录：
>
> 1. 1. 使用 Stream API 进行函数式集合操作
> 2. 2. 使用 Optional 避免空指针异常
> 3. 3. 使用 Try-With-Resources 自动资源管理
> 4. 4. 使用模式匹配简化类型检查
> 5. 5. 使用 CompletableFuture 进行优雅的异步编程
> 6. 6. 使用 record 秒杀样板 DTO / VO 代码

你可以根据自己项目的 JDK 版本，挑着用。

---

## 技巧一：用 Stream API 接管你的集合处理

### 场景：订单列表筛选&排序&取字段

典型业务代码：从订单列表中筛选**已支付订单**，按创建时间倒序，只取订单 ID 发给下游系统。

#### 传统写法：for 循环 + if + 排序器

```
List<Order> paidOrders = new ArrayList<>();  
for (Order order : allOrders) {  
    if (order.getStatus() == OrderStatus.PAID) {  
        paidOrders.add(order);  
    }  
}  
  
paidOrders.sort(new Comparator<Order>() {  
    @Override  
    public int compare(Order o1, Order o2) {  
        return o2.getCreatedAt().compareTo(o1.getCreatedAt());  
    }  
});  
  
List<Long> orderIds = new ArrayList<>();  
for (Order order : paidOrders) {  
    orderIds.add(order.getId());  
}
```

问题：

- 业务意图被拆成三块：筛选/排序/取字段，读起来很散
- 容易在中间某一步插入奇怪的逻辑
- 每改一次就得改三处

#### 现代写法：Stream 一气呵成表达意图

```
List<Long> orderIds = allOrders.stream()  
        .filter(o -> o.getStatus() == OrderStatus.PAID)  
        .sorted(Comparator.comparing(Order::getCreatedAt).reversed())  
        .map(Order::getId)  
        .toList(); // JDK 16+，旧版本可用 collect(Collectors.toList())
```

现在一眼就能读出业务含义：

> 从所有订单中，筛选已支付 → 按创建时间倒序 → 取出订单 ID 列表

#### 再看一个实战例子：按用户聚合订单金额

**需求**：计算每个用户本月消费总额，用于风控/积分等。

传统写法：

```
Map<Long, BigDecimal> userAmountMap = new HashMap<>();  
for (Order order : monthlyOrders) {  
    Long userId = order.getUserId();  
    BigDecimal amount = order.getAmount();  
    if (amount == null) {  
        amount = BigDecimal.ZERO;  
    }  
    BigDecimal old = userAmountMap.get(userId);  
    if (old == null) {  
        userAmountMap.put(userId, amount);  
    } else {  
        userAmountMap.put(userId, old.add(amount));  
    }  
}
```

Stream 写法：

```
Map<Long, BigDecimal> userAmountMap = monthlyOrders.stream()  
        .collect(Collectors.groupingBy(  
                Order::getUserId,  
                Collectors.mapping(  
                        o -> o.getAmount() == null ? BigDecimal.ZERO : o.getAmount(),  
                        Collectors.reducing(BigDecimal.ZERO, BigDecimal::add)  
                )  
        ));
```

如果嫌上面太“函数式”，也可以拆一点：

```
Map<Long, BigDecimal> userAmountMap = monthlyOrders.stream()  
        .collect(Collectors.groupingBy(  
                Order::getUserId,  
                Collectors.reducing(  
                        BigDecimal.ZERO,  
                        o -> Optional.ofNullable(o.getAmount()).orElse(BigDecimal.ZERO),  
                        BigDecimal::add  
                )  
        ));
```

#### 实战建议

- **能不用 Stream 的地方也别硬上**（比如复杂嵌套业务逻辑），优先用在“数据加工型”代码里：筛选、转换、聚合
- 面向业务阅读：链式操作不要写太长，超过 3～4 步可以适当拆分变量
- 善用 IDE：很多 IDE 可以自动把 `for` 循环重构为 Stream（反之亦然）

---

## 技巧二：用 Optional 把 NPE 扼杀在摇篮里

### 场景：查用户信息，有些字段为空

比如从数据库查用户，如果用户不存在返回 `null`，然后层层往上抛，很容易在某个地方 NPE。

#### 传统写法：满屏 if (xxx != null)

```
public String getUserEmail(Long userId) {  
    User user = userRepository.findById(userId); // 可能返回 null  
    if (user == null) {  
        return null;  
    }  
    ContactInfo contact = user.getContactInfo();  
    if (contact == null) {  
        return null;  
    }  
    return contact.getEmail();  
}
```

调用方要么继续判空，要么直接 NPE：

```
String email = getUserEmail(id);  
if (email != null) {  
    emailService.sendWelcomeEmail(email);  
}
```

#### 现代写法：Repository 直接返回 Optional

```
public interface UserRepository {  
    Optional<User> findById(Long id);  
}
```

使用：

```
public Optional<String> getUserEmail(Long userId) {  
    return userRepository.findById(userId)  
            .map(User::getContactInfo)  
            .map(ContactInfo::getEmail);  
}
```

调用者更安全：

```
getUserEmail(userId)  
    .ifPresent(emailService::sendWelcomeEmail);
```

或者需要强制存在时：

```
String email = getUserEmail(userId)  
        .orElseThrow(() -> new BusinessException("用户邮箱不存在"));
```

#### 结合 Stream 的常见写法

比如只对“有手机号”的用户发送短信：

```
users.stream()  
        .map(User::getPhone)  
        .filter(Objects::nonNull)  
        .forEach(smsService::sendLoginNotice);
```

用 Optional 封装逻辑：

```
users.stream()  
        .map(User::getPhone)  
        .map(Optional::ofNullable)  
        .flatMap(Optional::stream) // JDK 9+  
        .forEach(smsService::sendLoginNotice);
```

#### 实战建议

- **不要到处 new Optional 属性**（比如实体类字段类型直接用 Optional）——那会把简单问题搞复杂
- 最适合的地方：

+ • Repository / Service 的返回值
+ • 某些“业务上允许缺失”的字段（比如用户头像、昵称等）的访问链条

- 善用 `orElseGet` 和 `orElseThrow`，减少“随便给个默认值”的情况

---

## 技巧三：Try-With-Resources 自动管理资源

### 场景：JDBC 查询 / IO 读写

最典型的就是数据库连接、文件流、网络流，如果忘记关闭，不是内存泄露就是连接耗尽。

#### 传统写法：try/finally 手动关闭

```
public List<User> findAllUsers() throws SQLException {  
    Connection conn = null;  
    PreparedStatement ps = null;  
    ResultSet rs = null;  
    List<User> result = new ArrayList<>();  
  
    try {  
        conn = dataSource.getConnection();  
        ps = conn.prepareStatement("SELECT id, name FROM user");  
        rs = ps.executeQuery();  
        while (rs.next()) {  
            result.add(mapRow(rs));  
        }  
    } finally {  
        if (rs != null) {  
            try { rs.close(); } catch (SQLException ignored) {}  
        }  
        if (ps != null) {  
            try { ps.close(); } catch (SQLException ignored) {}  
        }  
        if (conn != null) {  
            try { conn.close(); } catch (SQLException ignored) {}  
        }  
    }  
    return result;  
}
```

不仅啰嗦，而且很容易漏掉某个 close。

#### 现代写法：Try-With-Resources 一行搞定资源释放

```
public List<User> findAllUsers() throws SQLException {  
    List<User> result = new ArrayList<>();  
  
    try (Connection conn = dataSource.getConnection();  
         PreparedStatement ps = conn.prepareStatement("SELECT id, name FROM user");  
         ResultSet rs = ps.executeQuery()) {  
  
        while (rs.next()) {  
            result.add(mapRow(rs));  
        }  
    }  
  
    return result;  
}
```

好处：

- 所有实现了 `AutoCloseable` 的资源，在 `try` 结束时会**自动按声明顺序关闭**
- 没有 `finally` 嵌套，代码简洁干净
- 推荐在**所有 IO / DB / 网络调用代码里统一使用**

再看一个读取配置文件的例子。

传统写法：

```
Properties props = new Properties();  
FileInputStream in = null;  
try {  
    in = new FileInputStream("config.properties");  
    props.load(in);  
} finally {  
    if (in != null) {  
        try { in.close(); } catch (IOException ignored) {}  
    }  
}
```

Try-With-Resources：

```
Properties props = new Properties();  
try (FileInputStream in = new FileInputStream("config.properties")) {  
    props.load(in);  
}
```

#### 实战建议

- **自己的资源也可以实现 AutoCloseable**，然后放进 try-with-resources，比如封装好的 `TraceContext`、`BizContext` 等
- 如果你项目里还有大量 `try/finally`，可以一点点重构，优先从公共工具类、底层基础库开始

---

## 技巧四：模式匹配，让 instanceof 变得优雅

> 前提：JDK 16+ 支持 `instanceof` 模式匹配，JDK 21+ 支持 `switch` 模式匹配（预览/正式视版本而定）

### 场景：根据不同事件类型做不同处理

假设有一堆事件类型，共用一个父类：

```
sealed interface Event permits UserCreatedEvent, OrderPaidEvent, RefundEvent {}  
   
final class UserCreatedEvent implements Event { /* ... */ }  
final class OrderPaidEvent implements Event { /* ... */ }  
final class RefundEvent implements Event { /* ... */ }
```

#### 传统写法：instanceof + 强转

```
public void handleEvent(Event event) {  
    if (event instanceof UserCreatedEvent) {  
        UserCreatedEvent e = (UserCreatedEvent) event;  
        handleUserCreated(e);  
    } else if (event instanceof OrderPaidEvent) {  
        OrderPaidEvent e = (OrderPaidEvent) event;  
        handleOrderPaid(e);  
    } else if (event instanceof RefundEvent) {  
        RefundEvent e = (RefundEvent) event;  
        handleRefund(e);  
    } else {  
        throw new IllegalArgumentException("Unknown event: " + event);  
    }  
}
```

重复的强制类型转换很烦人。

#### 现代写法一：instanceof 模式匹配，内联变量

```
public void handleEvent(Event event) {  
    if (event instanceof UserCreatedEvent e) {  
        handleUserCreated(e);  
    } else if (event instanceof OrderPaidEvent e) {  
        handleOrderPaid(e);  
    } else if (event instanceof RefundEvent e) {  
        handleRefund(e);  
    } else {  
        throw new IllegalArgumentException("Unknown event: " + event);  
    }  
}
```

`instanceof UserCreatedEvent e` 直接在条件里声明变量 `e`，下面代码可以直接使用，无需再强转。

#### 现代写法二：模式匹配 switch（JDK 21+）

如果项目 JDK 足够新，可以用 `switch` 模式匹配让代码更像“业务规则表”：

```
public void handleEvent(Event event) {  
    switch (event) {  
        case UserCreatedEvent e -> handleUserCreated(e);  
        case OrderPaidEvent e   -> handleOrderPaid(e);  
        case RefundEvent e      -> handleRefund(e);  
    }  
}
```

好处：

- **穷尽检查（exhaustive）**：少处理一种子类型，编译器直接报错
- 结构更像配置，而不是一堆 `if/else`

#### 实战建议

- 先从 `instanceof` 模式匹配开始用起，改动成本极低
- 如果你在写类似“命令/事件路由”的代码，强烈建议尝试模式匹配 `switch`，非常贴近业务思维
- 搭配 `sealed` 类型使用，可以避免一堆 `default` 分支

---

## 技巧五：用 CompletableFuture 写出可读的异步代码

### 场景：并行远程调用，聚合结果

常见业务需求：查询订单详情时，需要并行调用多个服务：

- 基础订单信息（订单服务）
- 用户信息（用户服务）
- 优惠券信息（营销服务）

#### 传统写法：一个个同步调，性能浪费

```
public OrderDetailDTO getOrderDetail(Long orderId) {  
    Order order = orderClient.getOrder(orderId);           // RPC 1  
    User user = userClient.getUser(order.getUserId());     // RPC 2  
    Coupon coupon = couponClient.getCoupon(order.getCouponId()); // RPC 3  
   
    return assemble(order, user, coupon);  
}
```

所有调用串行执行，耗时大约是 3 次 RPC 耗时之和。

#### 现代写法：CompletableFuture 并行 & 聚合

```
public OrderDetailDTO getOrderDetail(Long orderId) {  
    Executor executor = orderDetailExecutor; // 业务专用线程池  
  
    CompletableFuture<Order> orderFuture = CompletableFuture.supplyAsync(  
            () -> orderClient.getOrder(orderId),  
            executor  
    );  
  
    CompletableFuture<User> userFuture = orderFuture.thenApplyAsync(  
            order -> userClient.getUser(order.getUserId()),  
            executor  
    );  
  
    CompletableFuture<Coupon> couponFuture = orderFuture.thenApplyAsync(  
            order -> couponClient.getCoupon(order.getCouponId()),  
            executor  
    );  
  
    return orderFuture  
            .thenCombine(userFuture, (order, user) -> new Object[]{order, user})  
            .thenCombine(couponFuture, (arr, coupon) -> {  
                Order order = (Order) arr[0];  
                User user = (User) arr[1];  
                return assemble(order, user, coupon);  
            })  
            .join(); // 阻塞等待全部完成，也可以抛出去  
}
```

上面稍微“炫技”了一点，我们拆开讲个更容易上手的写法。

#### 更易懂的一版：先起任务，再 `join`

```
public OrderDetailDTO getOrderDetail(Long orderId) {  
    Executor executor = orderDetailExecutor;  
  
    CompletableFuture<Order> orderFuture = CompletableFuture.supplyAsync(  
            () -> orderClient.getOrder(orderId),  
            executor  
    );  
  
    CompletableFuture<User> userFuture = orderFuture.thenApplyAsync(  
            order -> userClient.getUser(order.getUserId()),  
            executor  
    );  
  
    CompletableFuture<Coupon> couponFuture = orderFuture.thenApplyAsync(  
            order -> couponClient.getCoupon(order.getCouponId()),  
            executor  
    );  
  
    // 等待结果  
    Order order = orderFuture.join();  
    User user = userFuture.join();  
    Coupon coupon = couponFuture.join();  
  
    return assemble(order, user, coupon);  
}
```

好处：

- 实际耗时接近：**max(各 RPC 耗时)**，而不是简单相加
- 异步逻辑集中管理，没有满屏 `CountDownLatch`、`Future.get()`

#### 异常处理：用 exceptionally / handle

```
CompletableFuture<User> safeUserFuture = userFuture  
        .exceptionally(ex -> {  
            // 记录日志，返回兜底数据  
            log.error("get user failed", ex);  
            return User.empty();  
        });
```

或者统一处理：

```
CompletableFuture<OrderDetailDTO> detailFuture = ...  
        .handle((result, ex) -> {  
            if (ex != null) {  
                // 记录日志，抛业务异常  
                throw new BusinessException("查询订单详情失败", ex);  
            }  
            return result;  
        });
```

#### 实战建议

- **不要使用默认的 ForkJoinPool** 跑大量 RPC，最好注入业务专用线程池，避免和别的异步任务抢资源
- CompletableFuture 适合：

+ • 聚合多个异步结果
+ • 避免回调地狱（比自己手写回调要干净很多）

- 如果项目规模较大，可以封一层“异步服务”给上层调用，屏蔽掉复杂的组合逻辑

---

## 技巧六：用 `record` 秒杀样板 DTO / VO 代码（JDK 16+）

做业务开发，离不开各种：

- 请求参数对象 `XXXRequest`
- 返回结果对象 `XXXResponse`
- 查询结果、缓存数据 `XXXDTO` / `XXXVO`

这些类 90% 都只是“装数据”，结果要写一堆：

- 字段
- 构造器
- getter
- `equals` / `hashCode`
- `toString`

#### 传统写法：一屏幕都是样板代码

```
public class UserDTO {  
    private final Long id;  
    private final String name;  
    private final String email;  
  
    public UserDTO(Long id, String name, String email) {  
        this.id = id;  
        this.name = name;  
        this.email = email;  
    }  
  
    public Long getId() { return id; }  
    public String getName() { return name; }  
    public String getEmail() { return email; }  
  
    @Override  
    public boolean equals(Object o) { /* 省略 */ }  
  
    @Override  
    public int hashCode() { /* 省略 */ }  
  
    @Override  
    public String toString() { /* 省略 */ }  
}
```

开发效率低、类文件又臃肿。

#### 现代写法：一个 `record` 就够了

```
public record UserDTO(Long id, String name, String email) {  
}
```

就这么一行，自动帮你生成：

- 不可变字段（构造后不能改）
- 全参构造器
- `id()` / `name()` / `email()` 访问方法
- 合理的 `equals` / `hashCode` / `toString`

使用也很自然：

```
UserDTO user = new UserDTO(1L, "Tom", "tom@test.com");  
   
Long id = user.id();  
String name = user.name();
```

配合前面说的模式匹配也很好用，例如：

```
if (obj instanceof UserDTO u) {  
    log.info("user: {}", u);  
}
```

#### 实战建议

- 非业务实体、只是“数据载体”的类，优先考虑用 `record`：

+ • Controller 入参与出参 DTO
+ • RPC / MQ 消息体
+ • Cache 对象、查询结果行

- 需要**可变字段**、框架强依赖无参构造器的场景（比如某些旧 ORM），暂时还是用传统类
- 新模块、新服务可以约定：**能用 `record` 的地方不写 JavaBean**

---

## 小结：从“会用”到“习惯用”

最后总结一下这 6 个技巧的“最小落地方案”：

1. 1. **Stream API**：

- 从最常见的“筛选 + 排序 + 映射”场景改起
- 把 for 循环里的数据加工逻辑，逐步迁移到 Stream

2. 2. **Optional**：

- 优先改 Repository 的返回值
- 用 `map` / `ifPresent` / `orElseThrow` 代替层层判空

3. 3. **Try-With-Resources**：

- 所有 IO / DB / 网络调用统一用起来
- 尤其是公共底层工具类，收益最大

4. 4. **模式匹配**：

- 把 `instanceof + 强转` 改成 `instanceof Xxx x`
- 事件路由/命令分发类尝试用 `switch` 模式匹配

5. 5. **CompletableFuture**：

- 把“多个远程调用 + 聚合”的逻辑改成并行，减少接口耗时
- 统一在 Service 层封装好异步调用，避免上层到处自己玩线程池

1. 6. **record**：

- 用在纯“数据载体”类（DTO / VO / Request / Response / 消息体），用一行声明替代大量样板代码
- 默认不可变，适合作为值对象，减少并发场景下被意外修改的风险

真正拉开我们开发者水平差距的，往往不是“会不会某个 API”，而是：

**写出的代码，是不是既“业务表达清晰”，又“对机器友好”。**

 

感谢您的**关注**、**分享**、**点赞**！         

             后续将分享更多**开发技巧**！
