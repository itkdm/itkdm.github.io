---
title: "参数校验放在 Controller 还是 Service"
date: 2025-12-29T18:30:54+08:00
tags: ["Java", "Spring Boot", "后端架构", "参数校验", "Service"]
summary: "这篇文章把 Controller 校验和 Service 校验的职责边界拆开讲清楚：结构校验优先放边界层，业务校验必须放核心层，并给出一套能直接落地的 Spring Boot 代码组织方式。"
lang: "zh"
slug: "validation-controller-or-service"
draft: false
---

# 校验写在 Controller 还是 Service？

你一定见过这种“战争现场”：

- A 同学：**校验就该放 Controller**，请求进来先挡住，省得 Service 里一堆 if！
- B 同学：**校验必须放 Service**，不然绕过 Controller（RPC/定时任务/消息消费）直接炸！
- C 同学：都别吵了，我全放一起……结果半年后谁也不敢动。

这事之所以吵不完，是因为大家把“校验”当成了一个东西。实际上它至少是 **两类完全不同的校验**：

> **结构校验（输入校验 / 参数校验）**：字段是否为空、长度、格式、范围、枚举值是否有效……

> **业务校验（规则校验 / 领域校验）**：库存是否足够、状态是否允许变更、是否有权限、是否重复下单、金额计算是否合理……

**一句话定调：**

> **结构校验优先放 Controller（边界层），业务校验必须放 Service（核心层）。**  
> 并且：**Service 永远要能自证安全**（即便 Controller 已校验）。

下面我用“能落地”的方式，把争议彻底拆开讲清楚。

---

## 01 先别急着站队：你说的“校验”到底是哪一种？

### 结构校验（边界层该做的事）

这类校验的目标是：**保证进入系统的数据“形态正确、字段齐全”**。  
典型包括：

- 必填：`@NotNull @NotBlank`
- 长度：`@Size`
- 格式：`@Email @Pattern`
- 数值范围：`@Min @Max @Positive`
- 枚举：自定义注解校验枚举值
- JSON 解析、类型转换错误

这些校验有个特点：**不依赖数据库、不依赖上下文，不会查库存、不会查权限。**

它更像是“门禁”。

最适合放在 **Controller**：离用户最近、失败更快、错误信息更清晰。

---

### 业务校验（核心层必须做的事）

这类校验的目标是：**保证业务规则不被破坏**。

典型包括：

- 库存不足不能下单
- 订单已支付不能取消
- 同一用户同一商品 30 秒内不能重复下单
- 只有管理员能删除
- 金额必须等于明细之和（防篡改）

这些校验有个特点：**依赖业务上下文，可能查库、可能调用外部服务、可能需要事务一致性。**

它更像是 **“业务规则的护栏”**：确保流程不越界、数据不被破坏。

必须放在 **Service**：因为 Service 才是真正的业务边界。

---

## 02 为什么“只放 Controller”一定会翻车？

因为你的系统不只有 HTTP 入口。

今天你只有 Controller；明天你会有：

- **消息消费**（Kafka/RabbitMQ）
- **定时任务**
- **内部 RPC / gRPC**
- **批处理脚本**
- 甚至别的同事直接 `@Autowired service` 调方法

如果业务规则只写在 Controller，那么绕过 Controller 的入口都会变成“无门禁的侧门”。

> 结论：**业务校验不在 Service，就等于没写。**

---

## 03 那“全放 Service”是不是最安全？

安全是安全，但很多团队会因此走向另一个极端：

- Service 里堆满 `if (dto.getXxx() == null)` 这种**结构校验**
- 错误信息难读，接口体验差
- Controller 变得“空壳”，但 Service 膨胀成“泥球”

> 结构校验如果全放在 Service，就会把 “入口过滤” 和 “业务规则” 混在一起，Service 迅速膨胀，维护成本直线上升。

---

## 04 最佳实践：两层校验，职责清清楚楚

### 规则 1：Controller 做结构校验（边界校验）

- 用 **DTO + Bean Validation** 在 Controller 入口拦住
- 错误信息更贴近请求字段
- 失败更快更省资源

### 规则 2：Service 做业务校验（规则校验/领域校验）

- 任何能破坏业务一致性的规则，必须在 Service
- Service 要保证：**不管从哪里被调用，业务都不会被绕过**

### 规则 3：同一条规则只写一次（避免重复）

- 结构规则：只在边界层（Controller / Adapter）
- 业务规则：只在核心层（Service / Domain）

> 记住这个口诀：  
> **“边界保形，核心保真。”**  
> （边界保证数据形态正确，核心保证业务真实正确。）

---

## 05 可直接抄的代码结构（Spring Boot 示例）

### 1）Controller：DTO + JSR-380 参数校验

```java
@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public Long create(@Valid @RequestBody CreateOrderRequest req) {
        return orderService.createOrder(req);
    }
}

@Data
public class CreateOrderRequest {

    @NotNull(message = "用户ID不能为空")
    private Long userId;

    @NotNull(message = "商品ID不能为空")
    private Long productId;

    @NotNull(message = "购买数量不能为空")
    @Min(value = 1, message = "购买数量至少为1")
    @Max(value = 999, message = "购买数量不能超过999")
    private Integer count;

    @NotBlank(message = "收货地址不能为空")
    @Size(max = 200, message = "收货地址不能超过200字")
    private String address;
}
```

这层的目标：**让请求“合格入场”。**

---

### 2）统一返回参数错误（建议必配）

别让前端看到一堆难懂的异常堆栈。

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationException(MethodArgumentNotValidException e) {
        List<String> errors = e.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(err -> err.getField() + ": " + err.getDefaultMessage())
            .toList();

        return ResponseEntity.badRequest().body(errors);
    }
}
```

这样前端拿到的是明确字段错误，而不是含糊其辞的 500。

---

### 3）Service：只负责业务校验 + 业务动作

```java
@Service
public class OrderService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    public OrderService(ProductRepository productRepository,
                        OrderRepository orderRepository) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional
    public Long createOrder(CreateOrderRequest req) {
        Product product = productRepository.findById(req.getProductId())
            .orElseThrow(() -> new BizException("商品不存在"));

        if (product.getStock() < req.getCount()) {
            throw new BizException("库存不足");
        }

        boolean duplicated = orderRepository.existsRecentOrder(
            req.getUserId(), req.getProductId(), Duration.ofSeconds(30)
        );
        if (duplicated) {
            throw new BizException("请勿重复下单");
        }

        product.decreaseStock(req.getCount());

        Order order = new Order(req.getUserId(), req.getProductId(),
            req.getCount(), req.getAddress());
        orderRepository.save(order);

        return order.getId();
    }
}
```

注意这里做的都不是“字段有没有传”，而是“这笔订单在业务上能不能成立”。

---

## 06 再进一步：RPC、消息、定时任务也遵守同一原则

很多人只在 Web 接口里讲校验，一到别的入口就乱了。

其实原则完全一样：

- Web Controller：做结构校验
- MQ Consumer：做消息结构校验
- RPC Adapter：做协议参数校验
- Scheduler/Job Handler：做任务入参校验
- Service：统一兜底业务校验

也就是说，**每个入口都要做自己的边界校验，但核心规则仍然只能由 Service 负责。**

这才是可扩展的架构。

---

## 07 什么情况下校验可以继续下沉到 Domain？

如果你的项目复杂到一定程度，Service 也会继续变厚。

这时可以再往下走一步：把“稳定的业务规则”下沉到领域对象或领域服务。

比如：

```java
public class Order {

    public void cancel() {
        if (this.status == OrderStatus.PAID) {
            throw new BizException("已支付订单不能取消");
        }
        this.status = OrderStatus.CANCELLED;
    }
}
```

这条规则本质上属于订单自身，而不是 Controller，也不只是应用服务流程的一部分。

所以更完整的分层会变成：

- Controller：结构校验
- Application Service：流程编排 + 调用领域对象
- Domain：核心业务不变量

但如果你现在还在讨论“校验放 Controller 还是 Service”，通常先把 **Controller / Service 边界理顺** 就够了，别一上来就过度设计。

---

## 08 面试里怎么回答，才像真的做过项目？

如果面试官问你：
**“参数校验放 Controller 还是 Service？”**

你不要只回一句“都可以，看团队”。

更好的回答方式是：

> 我会把校验拆成两类看。  
> 结构校验，比如必填、长度、格式、范围，这类放在 Controller 或其他入口层，用 DTO + Bean Validation 来做，失败更早、提示更清晰。  
> 业务校验，比如库存、状态流转、权限、幂等、重复提交，这类必须放在 Service，因为 Service 才是业务边界，不能依赖 Controller 唯一入口。  
> 如果系统还有 RPC、MQ、定时任务等入口，它们也应该做各自的结构校验，但业务规则仍然由 Service 统一兜底。  
> 简单说就是：边界层保输入合法，核心层保业务正确。

这就不是“背八股”，而是**真正理解了分层职责**。

---

## 09 最后给一个工程化判断标准

以后再遇到“这个校验写哪”的争论，你就问自己两句话：

### 问题 1：这条规则是在判断“数据长得像不像话”吗？

如果是：

- 判空
- 长度
- 格式
- 枚举值
- 类型转换

放 **Controller / 入口层**。

### 问题 2：这条规则是在判断“业务能不能这么做”吗？

如果是：

- 有没有权限
- 状态能不能流转
- 库存够不够
- 能不能重复提交
- 金额是否合理

放 **Service / 领域层**。

用这个标准，基本不会错。

---

## 总结

这场争论真正的答案不是“Controller”或者“Service”二选一，而是：

- **结构校验放边界**
- **业务校验放核心**
- **Service 必须具备自我保护能力**

所以最合理的结论就是：

> **Controller 负责让错误请求别进来，Service 负责让错误业务别发生。**

这才是一个长期可维护系统该有的样子。
