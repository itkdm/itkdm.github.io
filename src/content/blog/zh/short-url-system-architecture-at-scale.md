---
title: "短链系统的架构设计"
date: 2025-11-10T09:12:26+08:00
tags: ["系统设计", "短链系统", "高并发", "架构设计", "Java"]
summary: "这篇文章从原理到实现系统拆解短链系统，包括短链价值、核心架构、短码生成算法、高并发优化和典型工程落地，适合作为短链服务的设计入门与实战参考。"
lang: "zh"
slug: "short-url-system-architecture-at-scale"
draft: false
---

# 从原理到实践

> 在互联网时代，短链已经成为我们日常生活中不可或缺的一部分。无论是微博、微信还是各种营销活动，短链都扮演着重要的角色。本文将深入探讨短链系统的设计原理和实现方案，帮助开发者构建一个高性能、高可用的短链服务。

## 一、什么是短链？

### 1.1 短链的定义

短链（Short URL），顾名思义，就是将原本很长的URL通过某种算法或映射关系，转换成一个简短、易记的URL。

**原始URL示例：**

```
https://oss.kdm.com/code-output/1981750250490274037762/html/19825503918532500217377409/v1/index.html
```

**短链示例：**

```
https://s.kdm.com/abc123
```

### 1.2 短链的特点

- **简短易记**：通常只有6-8个字符，便于记忆和输入
- **易于分享**：在社交媒体、短信等场景下，短链更友好
- **可追踪**：可以统计访问量、来源、设备等信息
- **可控制**：可以设置过期时间、访问次数限制等
- **可隐藏**：隐藏原始URL的内部结构，保护隐私

### 1.3 短链的应用场景

1. 1. **社交媒体分享**：微博、Twitter等平台的链接缩短
2. 2. **营销推广**：广告链接、活动链接的追踪和统计
3. 3. **短信营销**：短信中需要短链接节省字符
4. 4. **二维码生成**：短链配合二维码使用，提升扫描成功率
5. 5. **内部系统**：企业内部系统的链接分享和统计

## 二、为什么需要短链？

### 2.1 解决长URL的问题

#### 问题1：URL过长

原始URL可能包含：

- 用户ID（19位数字）
- 应用ID（19位数字）
- 版本号、路径等
- 总长度可能超过100字符

**影响：**

- 不便于记忆和输入
- 在短信中占用大量字符（短信通常按条数计费）
- 在社交媒体中影响美观
- 二维码密度过高，扫描困难

#### 问题2：暴露内部结构

原始URL可能暴露：

- 用户ID、应用ID等敏感信息
- 系统架构和路径结构
- 版本号等内部信息

**影响：**

- 安全风险：可能被恶意利用
- 隐私泄露：暴露用户信息
- 系统架构泄露：可能被攻击者利用

### 2.2 短链带来的价值

#### 价值1：数据统计

通过短链可以统计：

- **访问量**：PV、UV统计
- **访问来源**：来源网站、来源渠道
- **访问设备**：PC、移动端、平板等
- **访问地域**：IP地址、地理位置
- **访问时间**：访问时间分布

#### 价值2：权限控制

通过短链可以实现：

- **访问权限**：控制哪些用户可以访问
- **过期时间**：设置链接的有效期
- **访问次数**：限制访问次数
- **IP限制**：限制访问IP范围

#### 价值3：营销追踪

通过短链可以追踪：

- **推广效果**：不同渠道的转化率
- **用户行为**：点击、访问、转化等
- **ROI分析**：投入产出比分析

## 三、短链系统的核心设计

### 3.1 系统架构设计

```
┌─────────────┐  
│   用户请求   │  
│  s.itkdm.com │  
│   /abc123   │  
└──────┬──────┘  
       │  
       ▼  
┌─────────────────┐  
│   短链服务层     │  
│  (ShortUrlService)│  
└──────┬──────────┘  
       │  
       ▼  
┌─────────────────┐  
│   映射查询层     │  
│  (数据库/缓存)   │  
└──────┬──────────┘  
       │  
       ▼  
┌─────────────────┐  
│   访问统计层     │  
│  (统计服务)      │  
└──────┬──────────┘  
       │  
       ▼  
┌─────────────────┐  
│   302重定向      │  
│   到原始URL      │  
└─────────────────┘
```

### 3.2 核心组件

1. 1. **短码生成器**：生成唯一的短码
2. 2. **映射存储**：存储短码与原始URL的映射关系
3. 3. **访问服务**：处理短链访问请求
4. 4. **统计服务**：记录访问统计信息
5. 5. **管理服务**：短链的增删改查

## 四、短码生成算法

### 4.1 算法选择

#### 方案1：自增ID + Base62编码（推荐）

**原理：**

- 使用数据库自增ID作为唯一标识
- 将ID转换为Base62编码（0-9, a-z, A-Z）
- 优点：简单、高效、无冲突
- 缺点：可能被猜测，需要加盐

**Java实现：**

```
public class ShortCodeGenerator {  
    private static final String BASE62_CHARS =   
        "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";  
      
    /**  
     * 将数字ID转换为Base62编码  
     */  
    public static String encode(long id) {  
        if (id == 0) {  
            return String.valueOf(BASE62_CHARS.charAt(0));  
        }  
          
        StringBuilder sb = new StringBuilder();  
        while (id > 0) {  
            sb.append(BASE62_CHARS.charAt((int)(id % 62)));  
            id /= 62;  
        }  
        return sb.reverse().toString();  
    }  
      
    /**  
     * 将Base62编码转换为数字ID  
     */  
    public static long decode(String code) {  
        long id = 0;  
        for (int i = 0; i < code.length(); i++) {  
            char c = code.charAt(i);  
            int index = BASE62_CHARS.indexOf(c);  
            id = id * 62 + index;  
        }  
        return id;  
    }  
}
```

**示例：**

- ID: 1 → 编码: `1`
- ID: 62 → 编码: `10`
- ID: 1000000 → 编码: `4c92`

#### 方案2：哈希算法 + 冲突检测

**原理：**

- 对原始URL进行MD5或SHA256哈希
- 取哈希值的前N位作为短码
- 如果冲突，则加盐重新哈希
- 优点：不可预测、安全性高
- 缺点：可能冲突，需要处理

**Java实现：**

```
public class HashShortCodeGenerator {  
    private static final int CODE_LENGTH = 6;  
      
    /**  
     * 基于URL哈希生成短码  
     */  
    public static String generate(String originalUrl, long salt) {  
        String input = originalUrl + salt;  
        MessageDigest md = MessageDigest.getInstance("MD5");  
        byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));  
          
        // 转换为Base62编码  
        StringBuilder sb = new StringBuilder();  
        for (int i = 0; i < CODE_LENGTH; i++) {  
            int index = Math.abs(hash[i]) % 62;  
            sb.append(BASE62_CHARS.charAt(index));  
        }  
        return sb.toString();  
    }  
}
```

#### 方案3：雪花算法 + Base62编码

**原理：**

- 使用雪花算法生成唯一ID
- 将ID转换为Base62编码
- 优点：分布式唯一、高性能
- 缺点：ID较长，编码后也较长

### 4.2 短码长度选择

- **6位**：可表示 62^6 = 568亿个短码（推荐）
- **7位**：可表示 62^7 = 3.5万亿个短码
- **8位**：可表示 62^8 = 218万亿个短码

**建议：**

- 小规模系统：6位足够
- 大规模系统：7-8位
- 考虑未来扩展：建议7位

## 五、数据库设计

### 5.1 短链映射表

```
CREATE TABLE `short_url` (  
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',  
  `short_code` VARCHAR(10) NOT NULL COMMENT '短码',  
  `original_url` VARCHAR(2048) NOT NULL COMMENT '原始URL',  
  `user_id` BIGINT(20) DEFAULT NULL COMMENT '用户ID',  
  `app_id` BIGINT(20) DEFAULT NULL COMMENT '应用ID',  
  `status` TINYINT(1) NOT NULL DEFAULT '1' COMMENT '状态：1-启用，0-禁用',  
  `expire_time` DATETIME DEFAULT NULL COMMENT '过期时间',  
  `max_visits` INT(11) DEFAULT NULL COMMENT '最大访问次数',  
  `current_visits` INT(11) NOT NULL DEFAULT '0' COMMENT '当前访问次数',  
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',  
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',  
  PRIMARY KEY (`id`),  
  UNIQUE KEY `uk_short_code` (`short_code`),  
  KEY `idx_user_id` (`user_id`),  
  KEY `idx_create_time` (`create_time`)  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='短链映射表';
```

### 5.2 访问统计表

```
CREATE TABLE `short_url_statistics` (  
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',  
  `short_code` VARCHAR(10) NOT NULL COMMENT '短码',  
  `visit_time` DATETIME NOT NULL COMMENT '访问时间',  
  `ip_address` VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',  
  `user_agent` VARCHAR(512) DEFAULT NULL COMMENT '用户代理',  
  `referer` VARCHAR(512) DEFAULT NULL COMMENT '来源页面',  
  `device_type` VARCHAR(20) DEFAULT NULL COMMENT '设备类型：PC/Mobile/Tablet',  
  `browser` VARCHAR(50) DEFAULT NULL COMMENT '浏览器',  
  `os` VARCHAR(50) DEFAULT NULL COMMENT '操作系统',  
  `country` VARCHAR(50) DEFAULT NULL COMMENT '国家',  
  `province` VARCHAR(50) DEFAULT NULL COMMENT '省份',  
  `city` VARCHAR(50) DEFAULT NULL COMMENT '城市',  
  PRIMARY KEY (`id`),  
  KEY `idx_short_code` (`short_code`),  
  KEY `idx_visit_time` (`visit_time`)  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='短链访问统计表';
```

## 六、Java实现方案

### 6.1 项目结构

```
edu-page-gen-backend  
├── src/main/java/com/itkdm/edupagegenbackend/  
│   ├── shorturl/  
│   │   ├── controller/  
│   │   │   └── ShortUrlController.java      # 短链控制器  
│   │   ├── service/  
│   │   │   ├── ShortUrlService.java         # 短链服务接口  
│   │   │   └── impl/  
│   │   │       └── ShortUrlServiceImpl.java # 短链服务实现  
│   │   ├── mapper/  
│   │   │   └── ShortUrlMapper.java          # 数据访问层  
│   │   ├── model/  
│   │   │   ├── entity/  
│   │   │   │   └── ShortUrl.java            # 短链实体  
│   │   │   ├── dto/  
│   │   │   │   ├── request/  
│   │   │   │   │   ├── CreateShortUrlRequest.java  
│   │   │   │   │   └── ShortUrlStatisticsRequest.java  
│   │   │   │   └── response/  
│   │   │   │       ├── ShortUrlResponse.java  
│   │   │   │       └── ShortUrlStatisticsResponse.java  
│   │   │   └── vo/  
│   │   │       └── ShortUrlStatisticsVO.java  
│   │   └── util/  
│   │       └── ShortCodeGenerator.java      # 短码生成器  
│   └── ...
```

### 6.2 核心代码实现

#### 6.2.1 短码生成器

```
package com.itkdm.edupagegenbackend.shorturl.util;  
  
import java.util.Random;  
  
/**  
 * 短码生成器  
 * 使用自增ID + Base62编码的方式生成短码  
 *   
 * @author kongdeming  
 * @since 2025/01/29  
 */  
public class ShortCodeGenerator {  
      
    private static final String BASE62_CHARS =   
        "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";  
      
    private static final int CODE_LENGTH = 6;  
      
    /**  
     * 将数字ID转换为Base62编码  
     *   
     * @param id 数字ID  
     * @return Base62编码的短码  
     */  
    public static String encode(long id) {  
        if (id == 0) {  
            return String.valueOf(BASE62_CHARS.charAt(0));  
        }  
          
        StringBuilder sb = new StringBuilder();  
        while (id > 0) {  
            sb.append(BASE62_CHARS.charAt((int)(id % 62)));  
            id /= 62;  
        }  
          
        // 如果长度不足，前面补0  
        while (sb.length() < CODE_LENGTH) {  
            sb.append(BASE62_CHARS.charAt(0));  
        }  
          
        return sb.reverse().toString();  
    }  
      
    /**  
     * 将Base62编码转换为数字ID  
     *   
     * @param code Base62编码的短码  
     * @return 数字ID  
     */  
    public static long decode(String code) {  
        if (code == null || code.isEmpty()) {  
            return 0;  
        }  
          
        long id = 0;  
        for (int i = 0; i < code.length(); i++) {  
            char c = code.charAt(i);  
            int index = BASE62_CHARS.indexOf(c);  
            if (index == -1) {  
                throw new IllegalArgumentException("Invalid short code: " + code);  
            }  
            id = id * 62 + index;  
        }  
        return id;  
    }  
      
    /**  
     * 生成随机短码（用于哈希冲突时的备选方案）  
     *   
     * @return 随机短码  
     */  
    public static String generateRandom() {  
        Random random = new Random();  
        StringBuilder sb = new StringBuilder();  
        for (int i = 0; i < CODE_LENGTH; i++) {  
            int index = random.nextInt(62);  
            sb.append(BASE62_CHARS.charAt(index));  
        }  
        return sb.toString();  
    }  
}
```

#### 6.2.2 短链实体类

```
package com.itkdm.edupagegenbackend.shorturl.model.entity;  
  
import com.baomidou.mybatisplus.annotation.IdType;  
import com.baomidou.mybatisplus.annotation.TableId;  
import com.baomidou.mybatisplus.annotation.TableName;  
import lombok.Data;  
  
import java.time.LocalDateTime;  
  
/**  
 * 短链实体  
 *   
 * @author kongdeming  
 * @since 2025/01/29  
 */  
@Data  
@TableName("short_url")  
public class ShortUrl {  
      
    /**  
     * 主键ID  
     */  
    @TableId(type = IdType.AUTO)  
    private Long id;  
      
    /**  
     * 短码  
     */  
    private String shortCode;  
      
    /**  
     * 原始URL  
     */  
    private String originalUrl;  
      
    /**  
     * 用户ID  
     */  
    private Long userId;  
      
    /**  
     * 应用ID  
     */  
    private Long appId;  
      
    /**  
     * 状态：1-启用，0-禁用  
     */  
    private Integer status;  
      
    /**  
     * 过期时间  
     */  
    private LocalDateTime expireTime;  
      
    /**  
     * 最大访问次数  
     */  
    private Integer maxVisits;  
      
    /**  
     * 当前访问次数  
     */  
    private Integer currentVisits;  
      
    /**  
     * 创建时间  
     */  
    private LocalDateTime createTime;  
      
    /**  
     * 更新时间  
     */  
    private LocalDateTime updateTime;  
}
```

#### 6.2.3 短链服务接口

```
package com.itkdm.edupagegenbackend.shorturl.service;  
  
import com.itkdm.edupagegenbackend.shorturl.model.dto.request.CreateShortUrlRequest;  
import com.itkdm.edupagegenbackend.shorturl.model.dto.response.ShortUrlResponse;  
  
/**  
 * 短链服务接口  
 *   
 * @author kongdeming  
 * @since 2025/01/29  
 */  
public interface ShortUrlService {  
      
    /**  
     * 创建短链  
     *   
     * @param request 创建短链请求  
     * @return 短链响应  
     */  
    ShortUrlResponse createShortUrl(CreateShortUrlRequest request);  
      
    /**  
     * 根据短码获取原始URL  
     *   
     * @param shortCode 短码  
     * @return 原始URL  
     */  
    String getOriginalUrl(String shortCode);  
      
    /**  
     * 访问短链（包含统计）  
     *   
     * @param shortCode 短码  
     * @param ipAddress IP地址  
     * @param userAgent 用户代理  
     * @param referer 来源页面  
     * @return 原始URL  
     */  
    String visitShortUrl(String shortCode, String ipAddress, String userAgent, String referer);  
      
    /**  
     * 禁用短链  
     *   
     * @param shortCode 短码  
     */  
    void disableShortUrl(String shortCode);  
      
    /**  
     * 删除短链  
     *   
     * @param shortCode 短码  
     */  
    void deleteShortUrl(String shortCode);  
}
```

#### 6.2.4 短链服务实现

```
package com.itkdm.edupagegenbackend.shorturl.service.impl;  
  
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;  
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;  
import com.itkdm.edupagegenbackend.shorturl.mapper.ShortUrlMapper;  
import com.itkdm.edupagegenbackend.shorturl.model.entity.ShortUrl;  
import com.itkdm.edupagegenbackend.shorturl.model.dto.request.CreateShortUrlRequest;  
import com.itkdm.edupagegenbackend.shorturl.model.dto.response.ShortUrlResponse;  
import com.itkdm.edupagegenbackend.shorturl.service.ShortUrlService;  
import com.itkdm.edupagegenbackend.shorturl.util.ShortCodeGenerator;  
import com.itkdm.edupagegenbackend.common.exception.ServiceException;  
import com.itkdm.edupagegenbackend.common.result.ResultCode;  
import lombok.extern.slf4j.Slf4j;  
import org.springframework.beans.factory.annotation.Value;  
import org.springframework.stereotype.Service;  
import org.springframework.transaction.annotation.Transactional;  
  
import java.time.LocalDateTime;  
  
/**  
 * 短链服务实现  
 *   
 * @author kongdeming  
 * @since 2025/01/29  
 */  
@Slf4j  
@Service  
public class ShortUrlServiceImpl extends ServiceImpl<ShortUrlMapper, ShortUrl>   
        implements ShortUrlService {  
      
    @Value("${short-url.domain:https://s.itkdm.com}")  
    private String shortUrlDomain;  
      
    @Override  
    @Transactional(rollbackFor = Exception.class)  
    public ShortUrlResponse createShortUrl(CreateShortUrlRequest request) {  
        // 1. 验证原始URL  
        String originalUrl = request.getOriginalUrl();  
        if (originalUrl == null || originalUrl.trim().isEmpty()) {  
            throw new ServiceException(ResultCode.PARAM_ERROR, "原始URL不能为空");  
        }  
          
        // 2. 检查是否已存在该URL的短链  
        LambdaQueryWrapper<ShortUrl> wrapper = new LambdaQueryWrapper<>();  
        wrapper.eq(ShortUrl::getOriginalUrl, originalUrl);  
        wrapper.eq(ShortUrl::getUserId, request.getUserId());  
        wrapper.eq(ShortUrl::getStatus, 1);  
        ShortUrl existing = this.getOne(wrapper);  
          
        if (existing != null) {  
            // 如果已存在，直接返回  
            return buildResponse(existing);  
        }  
          
        // 3. 创建新的短链记录  
        ShortUrl shortUrl = new ShortUrl();  
        shortUrl.setOriginalUrl(originalUrl);  
        shortUrl.setUserId(request.getUserId());  
        shortUrl.setAppId(request.getAppId());  
        shortUrl.setStatus(1);  
        shortUrl.setCurrentVisits(0);  
          
        // 设置过期时间  
        if (request.getExpireDays() != null && request.getExpireDays() > 0) {  
            shortUrl.setExpireTime(LocalDateTime.now().plusDays(request.getExpireDays()));  
        }  
          
        // 设置最大访问次数  
        if (request.getMaxVisits() != null && request.getMaxVisits() > 0) {  
            shortUrl.setMaxVisits(request.getMaxVisits());  
        }  
          
        // 4. 保存到数据库（获取自增ID）  
        this.save(shortUrl);  
          
        // 5. 生成短码  
        String shortCode = ShortCodeGenerator.encode(shortUrl.getId());  
        shortUrl.setShortCode(shortCode);  
        this.updateById(shortUrl);  
          
        log.info("创建短链成功: shortCode={}, originalUrl={}, userId={}",   
                shortCode, originalUrl, request.getUserId());  
          
        return buildResponse(shortUrl);  
    }  
      
    @Override  
    public String getOriginalUrl(String shortCode) {  
        if (shortCode == null || shortCode.trim().isEmpty()) {  
            throw new ServiceException(ResultCode.PARAM_ERROR, "短码不能为空");  
        }  
          
        LambdaQueryWrapper<ShortUrl> wrapper = new LambdaQueryWrapper<>();  
        wrapper.eq(ShortUrl::getShortCode, shortCode);  
        wrapper.eq(ShortUrl::getStatus, 1);  
          
        ShortUrl shortUrl = this.getOne(wrapper);  
          
        if (shortUrl == null) {  
            throw new ServiceException(ResultCode.NOT_FOUND, "短链不存在或已失效");  
        }  
          
        // 检查是否过期  
        if (shortUrl.getExpireTime() != null &&   
            LocalDateTime.now().isAfter(shortUrl.getExpireTime())) {  
            throw new ServiceException(ResultCode.NOT_FOUND, "短链已过期");  
        }  
          
        // 检查是否超过最大访问次数  
        if (shortUrl.getMaxVisits() != null &&   
            shortUrl.getCurrentVisits() >= shortUrl.getMaxVisits()) {  
            throw new ServiceException(ResultCode.NOT_FOUND, "短链访问次数已达上限");  
        }  
          
        return shortUrl.getOriginalUrl();  
    }  
      
    @Override  
    @Transactional(rollbackFor = Exception.class)  
    public String visitShortUrl(String shortCode, String ipAddress, String userAgent, String referer) {  
        // 1. 获取原始URL  
        String originalUrl = getOriginalUrl(shortCode);  
          
        // 2. 更新访问次数  
        LambdaQueryWrapper<ShortUrl> wrapper = new LambdaQueryWrapper<>();  
        wrapper.eq(ShortUrl::getShortCode, shortCode);  
        ShortUrl shortUrl = this.getOne(wrapper);  
          
        if (shortUrl != null) {  
            shortUrl.setCurrentVisits(shortUrl.getCurrentVisits() + 1);  
            this.updateById(shortUrl);  
        }  
          
        // 3. 异步记录访问统计（这里简化处理，实际应该使用消息队列）  
        // recordVisitStatistics(shortCode, ipAddress, userAgent, referer);  
          
        return originalUrl;  
    }  
      
    @Override  
    public void disableShortUrl(String shortCode) {  
        LambdaQueryWrapper<ShortUrl> wrapper = new LambdaQueryWrapper<>();  
        wrapper.eq(ShortUrl::getShortCode, shortCode);  
        ShortUrl shortUrl = this.getOne(wrapper);  
          
        if (shortUrl != null) {  
            shortUrl.setStatus(0);  
            this.updateById(shortUrl);  
            log.info("禁用短链: shortCode={}", shortCode);  
        }  
    }  
      
    @Override  
    public void deleteShortUrl(String shortCode) {  
        LambdaQueryWrapper<ShortUrl> wrapper = new LambdaQueryWrapper<>();  
        wrapper.eq(ShortUrl::getShortCode, shortCode);  
        this.remove(wrapper);  
        log.info("删除短链: shortCode={}", shortCode);  
    }  
      
    /**  
     * 构建响应对象  
     */  
    private ShortUrlResponse buildResponse(ShortUrl shortUrl) {  
        ShortUrlResponse response = new ShortUrlResponse();  
        response.setShortCode(shortUrl.getShortCode());  
        response.setShortUrl(shortUrlDomain + "/" + shortUrl.getShortCode());  
        response.setOriginalUrl(shortUrl.getOriginalUrl());  
        response.setExpireTime(shortUrl.getExpireTime());  
        response.setMaxVisits(shortUrl.getMaxVisits());  
        response.setCurrentVisits(shortUrl.getCurrentVisits());  
        return response;  
    }  
}
```

#### 6.2.5 短链控制器

```
package com.itkdm.edupagegenbackend.shorturl.controller;  
  
import com.itkdm.edupagegenbackend.common.result.ResultMessage;  
import com.itkdm.edupagegenbackend.common.result.ResultUtil;  
import com.itkdm.edupagegenbackend.shorturl.model.dto.request.CreateShortUrlRequest;  
import com.itkdm.edupagegenbackend.shorturl.model.dto.response.ShortUrlResponse;  
import com.itkdm.edupagegenbackend.shorturl.service.ShortUrlService;  
import cn.dev33.satoken.stp.StpUtil;  
import io.swagger.v3.oas.annotations.Operation;  
import io.swagger.v3.oas.annotations.tags.Tag;  
import jakarta.servlet.http.HttpServletRequest;  
import jakarta.validation.Valid;  
import lombok.extern.slf4j.Slf4j;  
import org.springframework.beans.factory.annotation.Autowired;  
import org.springframework.http.HttpStatus;  
import org.springframework.web.bind.annotation.*;  
  
/**  
 * 短链控制器  
 *   
 * @author kongdeming  
 * @since 2025/01/29  
 */  
@Slf4j  
@RestController  
@RequestMapping("/short-url")  
@Tag(name = "短链管理", description = "短链的创建、访问、统计等接口")  
public class ShortUrlController {  
      
    @Autowired  
    private ShortUrlService shortUrlService;  
      
    @PostMapping("/create")  
    @Operation(summary = "创建短链", description = "根据原始URL创建短链")  
    public ResultMessage<ShortUrlResponse> createShortUrl(  
            @Valid @RequestBody CreateShortUrlRequest request) {  
        Long userId = StpUtil.getLoginIdAsLong();  
        request.setUserId(userId);  
          
        ShortUrlResponse response = shortUrlService.createShortUrl(request);  
        return ResultUtil.data(response);  
    }  
      
    @GetMapping("/{shortCode}")  
    @Operation(summary = "访问短链", description = "根据短码访问短链，返回302重定向")  
    public void visitShortUrl(  
            @PathVariable String shortCode,  
            HttpServletRequest request) {  
        String ipAddress = getClientIpAddress(request);  
        String userAgent = request.getHeader("User-Agent");  
        String referer = request.getHeader("Referer");  
          
        String originalUrl = shortUrlService.visitShortUrl(  
                shortCode, ipAddress, userAgent, referer);  
          
        // 302重定向到原始URL  
        response.sendRedirect(originalUrl);  
    }  
      
    @GetMapping("/{shortCode}/info")  
    @Operation(summary = "获取短链信息", description = "根据短码获取短链详细信息")  
    public ResultMessage<ShortUrlResponse> getShortUrlInfo(@PathVariable String shortCode) {  
        String originalUrl = shortUrlService.getOriginalUrl(shortCode);  
        // 这里简化处理，实际应该返回完整的短链信息  
        return ResultUtil.data(null);  
    }  
      
    @DeleteMapping("/{shortCode}")  
    @Operation(summary = "删除短链", description = "根据短码删除短链")  
    public ResultMessage<Void> deleteShortUrl(@PathVariable String shortCode) {  
        shortUrlService.deleteShortUrl(shortCode);  
        return ResultUtil.success();  
    }  
      
    /**  
     * 获取客户端IP地址  
     */  
    private String getClientIpAddress(HttpServletRequest request) {  
        String ip = request.getHeader("X-Forwarded-For");  
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {  
            ip = request.getHeader("X-Real-IP");  
        }  
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {  
            ip = request.getRemoteAddr();  
        }  
        return ip;  
    }  
}
```

## 七、性能优化

### 7.1 缓存策略

短链访问是高频操作，必须使用缓存：

```
@Service  
public class ShortUrlServiceImpl implements ShortUrlService {  
      
    @Autowired  
    private RedisTemplate<String, String> redisTemplate;  
      
    private static final String CACHE_KEY_PREFIX = "short_url:";  
    private static final int CACHE_EXPIRE_SECONDS = 3600; // 1小时  
      
    @Override  
    public String getOriginalUrl(String shortCode) {  
        // 1. 先从缓存获取  
        String cacheKey = CACHE_KEY_PREFIX + shortCode;  
        String cachedUrl = redisTemplate.opsForValue().get(cacheKey);  
        if (cachedUrl != null) {  
            return cachedUrl;  
        }  
          
        // 2. 缓存未命中，从数据库查询  
        String originalUrl = getOriginalUrlFromDb(shortCode);  
          
        // 3. 写入缓存  
        if (originalUrl != null) {  
            redisTemplate.opsForValue().set(  
                cacheKey, originalUrl, CACHE_EXPIRE_SECONDS, TimeUnit.SECONDS);  
        }  
          
        return originalUrl;  
    }  
}
```

### 7.2 数据库优化

1. 1. **索引优化**

- `short_code` 字段必须建立唯一索引
- `user_id` 字段建立普通索引
- `create_time` 字段建立索引（用于查询）

2. 2. **分表策略**

- 如果数据量很大，可以按时间分表
- 例如：`short_url_2025_01`、`short_url_2025_02`

3. 3. **读写分离**

- 读操作使用从库
- 写操作使用主库

### 7.3 异步处理

访问统计应该异步处理，避免影响响应时间：

```
@Service  
public class ShortUrlServiceImpl implements ShortUrlService {  
      
    @Autowired  
    private RabbitTemplate rabbitTemplate;  
      
    @Override  
    public String visitShortUrl(String shortCode, String ipAddress,   
                                String userAgent, String referer) {  
        String originalUrl = getOriginalUrl(shortCode);  
          
        // 异步记录访问统计  
        ShortUrlVisitEvent event = new ShortUrlVisitEvent();  
        event.setShortCode(shortCode);  
        event.setIpAddress(ipAddress);  
        event.setUserAgent(userAgent);  
        event.setReferer(referer);  
        event.setVisitTime(LocalDateTime.now());  
          
        rabbitTemplate.convertAndSend("short-url-visit-exchange",   
                                     "short-url-visit", event);  
          
        return originalUrl;  
    }  
}
```

## 八、安全考虑

### 8.1 防刷机制

1. 1. **IP限流**：同一IP在短时间内访问次数限制
2. 2. **短码限流**：同一短码在短时间内访问次数限制
3. 3. **验证码**：可疑访问需要验证码

### 8.2 URL校验

1. 1. **白名单**：只允许特定域名的URL
2. 2. **黑名单**：禁止恶意URL
3. 3. **URL格式校验**：确保URL格式正确

### 8.3 权限控制

1. 1. **用户权限**：只有创建者可以管理短链
2. 2. **访问权限**：可以设置访问密码
3. 3. **IP白名单**：限制访问IP范围

## 九、监控与统计

### 9.1 访问统计

- **PV统计**：页面访问量
- **UV统计**：独立访客数
- **来源统计**：访问来源分析
- **地域统计**：访问地域分布
- **设备统计**：设备类型分布

### 9.2 性能监控

- **响应时间**：短链跳转响应时间
- **错误率**：404、500等错误率
- **缓存命中率**：缓存命中率统计
- **数据库QPS**：数据库查询QPS

## 十、总结

短链系统虽然看似简单，但要构建一个高性能、高可用的短链服务，需要考虑很多方面：

1. 1. **算法选择**：自增ID + Base62编码是最简单高效的方案
2. 2. **缓存策略**：必须使用缓存提升性能
3. 3. **异步处理**：统计等非关键路径应该异步处理
4. 4. **安全防护**：防刷、URL校验、权限控制
5. 5. **监控统计**：完善的监控和统计系统

希望本文能够帮助各位开发者理解和实现短链系统。在实际项目中，还需要根据具体业务需求进行调整和优化。
