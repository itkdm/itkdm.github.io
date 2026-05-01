---
title: "生产环境中的 Chrome + Selenium 自动化截图实践"
date: 2025-11-05T23:01:04+08:00
tags: ["Selenium", "Chrome", "自动化测试", "截图", "Docker"]
summary: "这篇文章完整记录了在生产环境中落地 Chrome + Selenium 自动化截图时遇到的权限、兼容性、依赖和资源问题，以及最终通过 Docker 容器化实现稳定截图的解决方案。"
lang: "zh"
slug: "chrome-selenium-production-screenshot-guide"
draft: false
---

# 一次网页截图引发的“血案”：如何在生产环境中搞定 Chrome + Selenium，完成自动化截图！

> **新手提示**：如果你没有相关经验，建议先查看文末的 **快速上手指南：从零到一[1]** 部分，那里提供了完整的、从零开始的部署步骤，包括前置条件检查、Docker 安装、Selenium 部署和 Java 代码配置等详细说明。

## 前言：为什么需要自动化网页截图？

在现代Web应用中，**自动生成网页截图**是一个非常实用的功能。比如：

- **应用封面图自动生成**：用户创建应用后，系统自动截取页面作为封面展示
- **内容预览**：为文档、文章生成缩略图，提升用户体验
- **监控与审计**：定期截图记录页面状态，用于问题追溯
- **报表可视化**：将动态数据页面转换为静态图片

传统的做法是**手动截图**，但这种方式效率低、不可扩展。于是，我们选择了**程序化截图**方案：在后端服务中，通过代码自动打开网页并截图。

然而，这个看似简单的需求，在实际生产环境中却遇到了**各种"坑"**。本文完整记录了从问题排查到最终稳定出图的全过程，希望能帮助遇到类似问题的开发者少走弯路。

---

## 技术背景与环境

**生产环境：**

- 操作系统：CentOS 7（内核 3.10，glibc 2.17）
- 技术栈：Java 21、Spring Boot、Selenium 4.x
- 目标：在后端服务中**无头模式**打开网页并截图，用于应用封面图自动更新

**什么是无头模式？**  
无头模式（Headless）是指浏览器在后台运行，不显示图形界面，这对于服务器环境非常友好，既节省资源又避免界面依赖。

**技术选型：**  
我们选择了 **Selenium + Chrome** 的组合，这是目前最成熟的浏览器自动化方案。Selenium 提供了统一的 API，可以控制各种浏览器，而 Chrome 的无头模式性能优秀，渲染质量高。

---

## 问题概述

本以为这是一个简单的集成任务，却在实际部署中遇到了**5个主要问题**：

1. 1. **权限错误**：`Permission denied` - ChromeDriver 无法执行
2. 2. **浏览器缺失**：`cannot find Chrome binary` - 只装了驱动，没装浏览器
3. 3. **系统兼容性**：`GLIBC_2.18 not found` - CentOS 7 的 glibc 版本太老，无法运行现代 Chrome
4. 4. **依赖缺失**：`NoClassDefFoundError` - OpenTelemetry 追踪功能缺失依赖
5. 5. **资源不足**：`chrome not reachable` - 内存和共享内存不足导致崩溃

最终，我们通过**Docker 容器化方案**彻底解决了这些问题，实现了稳定可靠的自动化截图功能。

---

## 完整排障过程

---

## 第一幕：问题初现 - 日志里的异常

当业务正常运行时，系统会触发"按版本部署 → 异步生成应用截图"的流程。然而，第一次运行时，日志中就出现了异常，让我们意识到这个看似简单的功能背后，隐藏着不少技术挑战：

**第一类错误：权限拒绝**

```
java.io.IOException: Cannot run program "/opt/chromedriver/.../chromedriver":   
error=13, Permission denied
```

Selenium 抛出 `SessionNotCreatedException`，Java 堆栈指向 `ChromeDriver` 启动失败。这让我们意识到，问题可能不仅仅是代码层面的。

**第二类错误：浏览器缺失**  
修复权限问题后，又出现了新的错误：

```
session not created ... cannot find Chrome binary
```

原来，我们只安装了 ChromeDriver（驱动），但没有安装 Chrome 浏览器本身。这就像有车钥匙但没有车一样。

**第三类错误：系统兼容性**  
当我们尝试安装 Chrome 浏览器时，遇到了更严重的问题：

```
/lib64/libc.so.6: version `GLIBC_2.18' not found
```

CentOS 7 自带的 glibc 版本是 2.17，而现代 Chrome 需要 2.18 或更高版本。这意味着在 CentOS 7 上无法直接运行新版本的 Chrome。

**关键决策：容器化**  
经过分析，我们决定**放弃在宿主机安装 Chrome**，改用 **Docker + Selenium Standalone** 方案。这样可以将浏览器和驱动都放在容器中，完全隔离系统依赖。

**后续问题与解决**

- Docker 安装时遇到仓库连接问题 → 改用国内镜像源
- 容器启动后出现 OpenTelemetry 依赖缺失 → 关闭追踪功能
- 偶发 `chrome not reachable` 错误 → 增加共享内存，优化参数

最终，通过调整配置和参数，我们实现了稳定可靠的截图功能。

---

## 问题一：权限拒绝（Permission Denied）

### 症状

```
java.io.IOException: Cannot run program "/opt/chromedriver/.../chromedriver":   
error=13, Permission denied
```

当程序尝试执行 ChromeDriver 时，系统返回了"权限拒绝"错误。这在 Linux 系统中通常意味着文件没有执行权限，或者路径指向了目录而非可执行文件。

### 根因分析

**本次案例的真实原因：**  
路径 `/opt/chromedriver/142.0.7444.59/chromedriver` 实际上是一个**目录**，真正的可执行文件在**子目录**中：

```
/opt/chromedriver/142.0.7444.59/chromedriver/chromedriver  ← 这才是真正的可执行文件
```

当我们试图执行一个目录时，系统会返回权限错误。这就像试图"运行"一个文件夹而不是程序一样。

**为什么会出现这个问题？**  
ChromeDriver 下载解压后，通常会有一层版本号目录，然后才是真正的 `chromedriver` 可执行文件。如果路径配置不正确，就会指向目录而非文件。

### 解决方案（三选一）

```
# A. 直接改为真实文件路径  
/opt/chromedriver/142.0.7444.59/chromedriver/chromedriver --version  
  
# B. 扁平化软链（原路径不改代码）  
ln -sf /opt/chromedriver/142.0.7444.59/chromedriver/chromedriver \  
      /opt/chromedriver/142.0.7444.59/chromedriver  
  
# C. 放到 PATH  
cp /opt/chromedriver/142.0.7444.59/chromedriver/chromedriver /usr/local/bin/chromedriver  
chmod 0755 /usr/local/bin/chromedriver
```

### 其他常见原因排查

如果你遇到类似的权限问题，还可以检查以下几个方面：

1. 1. **文件系统挂载为 `noexec`**：某些分区可能被挂载为不允许执行，检查命令：

   ```
   mount | grep ' /opt '
   ```

   如果看到 `noexec`，需要换目录或重新挂载。
2. 2. **父目录缺少执行权限**：即使文件本身有权限，如果父目录没有执行权限，也可能导致问题。修复方法：

   ```
   chmod 755 /opt /opt/chromedriver/...
   ```
3. 3. **SELinux 安全策略**：SELinux 可能阻止了程序执行。可以先临时关闭验证：

   ```
   setenforce 0  # 临时关闭
   ```

   如果问题解决，说明是 SELinux 问题，可以调整策略或使用 `/usr/local/bin` 目录。

---

## 问题二：找不到 Chrome 浏览器

### 症状

```
session not created ... cannot find Chrome binary
```

### 问题分析

这个错误很容易理解：我们只安装了 **ChromeDriver**（驱动程序），但没有安装 **Chrome 浏览器**本身。

**ChromeDriver 和 Chrome 的关系：**

- **ChromeDriver**：是一个驱动程序，用于控制 Chrome 浏览器
- **Chrome**：是浏览器本体，负责实际渲染网页

两者必须**版本匹配**：如果 ChromeDriver 是 142 版本，Chrome 浏览器也必须是 142 版本。

### 在 CentOS 7 上安装 Chrome 的困境

当我们尝试安装 Chrome 浏览器时，遇到了更严重的问题：

```
/lib64/libc.so.6: version `GLIBC_2.18' not found
```

**什么是 glibc？**  
glibc（GNU C Library）是 Linux 系统的核心 C 库，几乎所有程序都依赖它。不同版本的 glibc 支持不同的系统调用和特性。

**版本不兼容问题：**

- CentOS 7 自带的 glibc 版本：**2.17**
- 现代 Chrome 需要：**≥2.18/2.25**

**为什么不能升级 glibc？**  
glibc 是系统核心组件，升级它可能导致整个系统不稳定，甚至无法启动。在生产环境中，**强烈不建议**升级系统 glibc。

### 决策：容器化方案

经过分析，我们决定**放弃在宿主机安装 Chrome**，改用 **Docker 容器化方案**。

这样做的好处：

- ✅ **完全隔离**：浏览器运行在容器中，不依赖宿主机系统版本
- ✅ **易于管理**：容器可以随时重启、更新，不影响宿主机
- ✅ **资源可控**：可以为容器分配固定资源，避免影响其他服务
- ✅ **版本灵活**：可以轻松切换不同版本的浏览器

**替代方案（不推荐）：**  
如果一定要在宿主机运行，可以尝试安装能运行在 glibc 2.17 的旧版 Chrome（如 Chrome 80-90），但会带来安全和兼容性风险，不建议在生产环境使用。

---

## 问题三：Docker 安装的挑战

既然决定使用容器化方案，第一步就是安装 Docker。在 CentOS 7 上安装 Docker 也遇到了一些问题。

### 问题 1：官方仓库连接失败

**症状：**

```
curl#35 - "TCP connection reset by peer"
```

**原因：**  
由于网络限制，无法访问 Docker 官方仓库。

**解决：**  
使用**国内镜像源**（如阿里云）配置 Docker 仓库。这样可以大大提高下载速度，避免连接问题。

### 问题 2：包版本冲突

**症状：**

```
docker-ce-cli conflicts with docker-buildx-plugin-0.14.1-1.el7
```

**原因：**  
不同版本的 Docker 组件之间存在依赖冲突，这通常是因为系统中已安装的版本与要安装的版本不兼容。

**解决：**  
先卸载所有相关组件，然后安装指定版本：

```
# 卸载冲突的组件  
yum remove -y docker-buildx-plugin docker-ce docker-ce-cli containerd.io docker-compose-plugin  
  
# 安装指定版本（这些版本在 CentOS 7 上验证可用）  
yum install -y containerd.io-1.6.26 docker-ce-20.10.24 docker-ce-cli-20.10.24
```

**基础配置**

```
cat >/etc/docker/daemon.json <<'JSON'  
{  
  "exec-opts": ["native.cgroupdriver=systemd"],  
  "storage-driver": "overlay2",  
  "log-driver": "json-file",  
  "log-opts": { "max-size": "100m" },  
  "registry-mirrors": ["https://registry.aliyuncs.com"]  
}  
JSON  
  
systemctl enable --now containerd  
systemctl enable --now docker
```

---

## 解决方案：Docker + Selenium Standalone

经过前面的问题排查，我们最终选择了 **Docker + Selenium Standalone** 方案。这是目前最稳定、最推荐的生产环境方案。

### 什么是 Selenium Standalone？

**Selenium Standalone** 是一个预配置的 Docker 镜像，包含了：

- ✅ Selenium Grid Hub（调度中心）：负责接收请求并分配给浏览器节点
- ✅ Chrome 浏览器（已配置好）：无需手动安装和配置
- ✅ ChromeDriver（已匹配版本）：驱动和浏览器版本已自动匹配
- ✅ 所有必要的依赖：包括系统库、字体等

**优势：**  
使用这个镜像，我们不需要在宿主机安装任何浏览器相关组件，完全隔离系统依赖，避免版本冲突。

### 前置条件检查

在开始之前，先确认以下条件：

```
# 1. 检查 Docker 是否已安装  
docker --version  
# 应该显示：Docker version 20.10.x 或更高  
  
# 2. 检查 Docker 服务是否运行  
systemctl status docker  
# 应该显示：Active: active (running)  
  
# 3. 检查端口 4444 是否被占用  
netstat -tuln | grep 4444  
# 如果已经有输出，说明端口被占用，需要先停止占用该端口的服务
```

### 完整部署步骤

#### 步骤 1：拉取镜像

由于网络限制，我们使用国内镜像源（DaoCloud）：

```
# 拉取镜像（使用国内镜像源）  
docker pull docker.m.daocloud.io/selenium/standalone-chrome:latest  
  
# 重命名为标准名称（便于后续使用）  
docker tag docker.m.daocloud.io/selenium/standalone-chrome:latest selenium/standalone-chrome:latest  
  
# 验证镜像是否拉取成功  
docker images | grep selenium  
# 应该能看到 selenium/standalone-chrome 镜像
```

**如果网络正常，可以直接拉取官方镜像：**

```
docker pull selenium/standalone-chrome:latest
```

#### 步骤 2：启动容器

**关键参数说明：**

- `-p 4444:4444`：将容器内的 4444 端口映射到宿主机的 4444 端口
- `--shm-size=2g`：设置共享内存为 2GB，Chrome 需要较大的共享内存
- `SE_NODE_MAX_SESSIONS=1`：限制并发会话数为 1，避免资源耗尽
- `--restart unless-stopped`：容器自动重启策略，提高可用性

**启动命令：**

```
docker run -d --name selenium \  
  -p 4444:4444 \  
  --shm-size=2g \  
  -e SE_NODE_MAX_SESSIONS=1 \  
  -e SE_NODE_OVERRIDE_MAX_SESSIONS=true \  
  --restart unless-stopped \  
  selenium/standalone-chrome:latest
```

**验证容器是否启动：**

```
# 查看容器状态  
docker ps | grep selenium  
# 应该看到容器状态为 Up  
  
# 查看容器日志（确认启动过程）  
docker logs selenium  
# 应该能看到 Selenium Grid 启动的相关日志
```

#### 步骤 3：健康检查

**检查 Selenium Grid 是否就绪：**

```
# 方法1：使用 curl 检查状态接口  
curl -s http://127.0.0.1:4444/status | python -m json.tool  
# 或者  
curl -s http://127.0.0.1:4444/status  
  
# 期望返回：  
# {"value":{"ready":true,"message":"Selenium Grid ready."}}
```

**如果返回 `ready: true`，说明 Selenium Grid 已就绪，可以接收连接。**

**如果返回错误，检查：**

```
# 查看容器日志  
docker logs --tail=100 selenium  
  
# 查看容器资源使用情况  
docker stats selenium --no-stream  
  
# 检查端口是否正常监听  
netstat -tuln | grep 4444
```

#### 步骤 4：测试连接（可选）

在 Java 代码部署前，可以先手动测试连接：

```
# 使用 curl 测试创建会话（会返回 sessionId）  
curl -X POST http://127.0.0.1:4444/wd/hub/session \  
  -H "Content-Type: application/json" \  
  -d '{"capabilities":{"browserName":"chrome"}}'
```

如果返回包含 `sessionId` 的 JSON，说明连接正常。

---

## 问题四：Java 代码改造

现在容器已经运行起来了，接下来需要修改 Java 代码，从本地 ChromeDriver 改为远程 RemoteWebDriver。

### 关键变化

**重要提示：** 使用 RemoteWebDriver 后，不再需要设置 `webdriver.chrome.driver` 系统属性，因为浏览器和驱动都在容器中，由 Selenium Grid 统一管理。

### 代码改造步骤

#### 步骤 1：添加依赖（如果还没有）

确保你的 `pom.xml` 中包含了 Selenium 依赖：

```
<dependency>  
    <groupId>org.seleniumhq.selenium</groupId>  
    <artifactId>selenium-java</artifactId>  
    <version>4.31.0</version> <!-- 或更新版本 -->  
</dependency>
```

#### 步骤 2：修改代码

**完整的代码示例：**

```
import org.openqa.selenium.*;  
import org.openqa.selenium.PageLoadStrategy;  
import org.openqa.selenium.chrome.ChromeOptions;  
import org.openqa.selenium.remote.RemoteWebDriver;  
import java.net.URL;  
import java.time.Duration;  
  
// 关闭追踪功能（避免 OpenTelemetry 依赖问题）  
System.setProperty("webdriver.remote.enableTracing", "false");  
  
// 配置 Chrome 选项  
ChromeOptions options = new ChromeOptions();  
options.setPageLoadStrategy(PageLoadStrategy.NORMAL);  
  
// 添加 Chrome 启动参数  
options.addArguments(  
    "--headless=new",           // 新的无头模式  
    "--no-sandbox",             // 禁用沙盒（容器环境必需）  
    "--disable-dev-shm-usage", // 使用临时文件替代共享内存  
    "--disable-gpu",           // 禁用GPU加速  
    "--disable-software-rasterizer", // 禁用软件光栅化  
    "--disable-extensions",    // 禁用扩展  
    "--disable-background-networking", // 禁用后台网络  
    "--disable-sync",          // 禁用同步  
    "--disable-translate",     // 禁用翻译  
    "--window-size=1280,720"   // 窗口尺寸（1280x720 比 1600x900 更省内存）  
);  
  
// 创建远程 WebDriver，连接到 Docker 容器  
String seleniumUrl = System.getenv().getOrDefault("SELENIUM_URL", "http://127.0.0.1:4444/wd/hub");  
WebDriver driver = new RemoteWebDriver(new URL(seleniumUrl), options);  
  
// 设置超时时间  
driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(60));  
driver.manage().timeouts().scriptTimeout(Duration.ofSeconds(30));  
driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
```

#### 步骤 3：配置 Selenium URL（可选）

如果需要灵活配置 Selenium 服务地址，可以设置环境变量：

```
# Linux/Mac  
export SELENIUM_URL=http://127.0.0.1:4444/wd/hub  
  
# Windows  
set SELENIUM_URL=http://127.0.0.1:4444/wd/hub
```

或者在 `application.yml` 中配置：

```
screenshot:  
  selenium:  
    url: http://127.0.0.1:4444/wd/hub
```

然后在代码中读取配置：

```
@Value("${screenshot.selenium.url:http://127.0.0.1:4444/wd/hub}")  
private String seleniumUrl;
```

#### 步骤 4：测试代码

创建一个简单的测试方法验证连接：

```
public void testSeleniumConnection() {  
    try {  
        System.setProperty("webdriver.remote.enableTracing", "false");  
  
ChromeOptions options = new ChromeOptions();  
options.addArguments("--headless=new", "--no-sandbox", "--disable-dev-shm-usage");  
          
        RemoteWebDriver driver = new RemoteWebDriver(  
            new URL("http://127.0.0.1:4444/wd/hub"),   
            options  
        );  
          
        // 测试访问一个网页  
        driver.get("https://www.baidu.com");  
        System.out.println("页面标题: " + driver.getTitle());  
          
        // 测试截图  
        byte[] screenshot = ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES);  
        System.out.println("截图大小: " + screenshot.length + " bytes");  
          
        driver.quit();  
        System.out.println("测试成功！");  
    } catch (Exception e) {  
        System.err.println("测试失败: " + e.getMessage());  
        e.printStackTrace();  
    }  
}
```

运行这个测试，如果成功输出页面标题和截图大小，说明配置正确。

---

## 问题五：OpenTelemetry 依赖缺失

### 症状

```
NoClassDefFoundError: io/opentelemetry/sdk/autoconfigure/AutoConfiguredOpenTelemetrySdk
```

### 问题分析

**什么是 OpenTelemetry？**  
OpenTelemetry 是一个**分布式追踪**框架，用于监控和追踪分布式系统中的请求流转。Selenium 4 默认启用了这个功能，以便进行性能监控。

**为什么会出现这个错误？**  
Selenium 4 的服务端（容器中）已经集成了 OpenTelemetry，但我们的 Java 客户端没有引入相关的依赖包。当服务端尝试启用追踪时，客户端无法找到相应的类，导致 `NoClassDefFoundError`。

### 解决方案

**方案一：关闭追踪功能（推荐）**

如果不需要详细的性能追踪，最简单的方式是关闭这个功能。

**JVM 启动参数：**

```
-Dwebdriver.remote.enableTracing=false
```

**或在代码中设置：**

```
System.setProperty("webdriver.remote.enableTracing", "false");
```

**方案二：引入依赖（如果确实需要追踪）**

如果需要完整的 APM（应用性能监控）功能，可以引入 OpenTelemetry 相关依赖，但会增加项目的复杂度。

对于我们的截图功能，**关闭追踪即可**，这样既简单又高效。

---

## 问题六：Chrome 无法连接（资源不足）

### 症状

```
session not created  
from chrome not reachable
```

这个错误通常出现在容器启动后，尝试创建浏览器会话时。从错误信息来看，Chrome 浏览器无法正常启动或连接。

### 根因分析与解决方案

#### 1. 内存/共享内存不足（最常见）

**问题表现：**

- 宿主机内存较小（如 1.7GB）
- Chrome 启动时容易 OOM（Out of Memory）
- 日志中可能出现 `Crashpad`、`zygote` 等错误信息

**解决方案：**

- ✅ 增加共享内存：`--shm-size=2g`（启动容器时设置）
- ✅ 限制并发：`SE_NODE_MAX_SESSIONS=1`（只允许一个会话）
- ✅ 缩小窗口尺寸：`--window-size=1280,720`（减少内存占用）

**为什么需要共享内存？**  
Chrome 使用共享内存（`/dev/shm`）来存储进程间通信数据。默认的 64MB 对于现代 Chrome 来说太小，容易导致崩溃。

#### 2. Chrome 启动参数过重

**优化方案：**  
添加轻量级启动参数，减少资源消耗：

```
options.addArguments(  
    "--disable-software-rasterizer",  // 禁用软件光栅化  
    "--disable-features=VizDisplayCompositor"  // 禁用某些显示特性  
);
```

同时，将窗口尺寸从 `1600×900` 调整为 `1280×720`，可以显著减少内存占用。

#### 3. 网络连通性问题

**检查方法：**  
目标网页必须在**容器内部**可以访问，不能只在宿主机测试：

```
docker exec -it selenium curl -I http://你的URL
```

如果容器内无法访问，需要检查：

- 网络配置（Docker 网络模式）
- 防火墙规则
- 目标 URL 是否对容器内网络可见

#### 4. 镜像选择优化

如果服务器资源非常有限，可以考虑使用更轻量的镜像：

```
seleniarm/standalone-chromium  # ARM 架构或资源受限环境
```

这个镜像通常占用更少的内存和 CPU。

---

## 最终成果：稳定出图

经过一系列的问题排查和优化，我们最终实现了稳定可靠的自动化截图功能。

### 验证清单

✅ **Selenium Grid 就绪**：`curl http://127.0.0.1:4444/status` 返回 `ready: true`

✅ **Java 代码改造完成**：使用 RemoteWebDriver，关闭 tracing，参数优化

✅ **功能验证**：触发截图流程后，日志显示"截图上传成功"或"封面更新成功"

✅ **结果确认**：在 OSS 存储中可以看到新生成的截图文件，数据库中的封面 URL 已更新

### 性能表现

- **截图成功率**：接近 100%（排除网络问题）
- **平均响应时间**：3-5 秒（包含页面加载和截图）
- **资源占用**：容器内存约 1.5GB，CPU 使用率低

### 生产环境建议

1. 1. **监控告警**：设置 Selenium Grid 健康检查，异常时自动告警
2. 2. **日志记录**：记录每次截图的关键信息（URL、耗时、结果）
3. 3. **重试机制**：对于偶发的网络问题，实现自动重试
4. 4. **资源限制**：为容器设置合理的资源上限，避免影响其他服务

---

## 经验总结：网页截图生产化最佳实践

经过这次完整的排障过程，我们总结出了一套通用的解决方案和最佳实践。

### 排障思路（按优先级）

当遇到网页截图相关问题时，可以按照以下顺序排查：

1. 1. **基础检查**：能否手动执行二进制文件？（`chromedriver --version`）
2. 2. **路径验证**：路径指向的是文件还是目录？父目录是否有执行权限？文件系统是否挂载为 `noexec`？
3. 3. **版本匹配**：Chrome 浏览器与 ChromeDriver 的主版本号是否一致？
4. 4. **系统兼容性**：宿主机的 glibc 版本是否满足 Chrome 要求？**如果不满足，直接考虑容器化**。
5. 5. **Docker 环境**：Docker 是否正常安装？镜像是否成功拉取？（注意国内网络问题）
6. 6. **服务就绪**：Selenium Standalone 容器是否正常运行？`/status` 接口是否返回 `ready: true`？
7. 7. **代码配置**：Java 代码是否切换到 RemoteWebDriver？是否关闭了 tracing？
8. 8. **资源问题**：如果出现 `chrome not reachable`，优先检查内存和共享内存，然后调整启动参数和窗口尺寸。

### 最佳实践建议

以下是我们总结的**生产环境最佳实践**，建议在项目初期就采用这些方案：

1. 1. **容器化优先**：从一开始就使用容器运行浏览器和驱动，避免宿主机依赖问题
2. 2. **资源限制**：单会话 + `--shm-size=1g~2g`，小机型更稳定
3. 3. **启动参数优化**：Java 端默认添加必要的 Chrome 参数：

- `--headless=new`：新的无头模式
- `--no-sandbox`：禁用沙盒（容器环境必需）
- `--disable-dev-shm-usage`：使用临时文件替代共享内存
- `--window-size=1280,720`：适中的窗口尺寸

4. 4. **关闭追踪**：默认关闭客户端 tracing：`-Dwebdriver.remote.enableTracing=false`
5. 5. **网络验证**：网络连通性检查必须在**容器内部**进行，不能只在宿主机测试
6. 6. **健康检查**：实现自动健康检查：`/status` ready + pageLoadTimeout 60s
7. 7. **完善日志**：记录关键信息便于问题追踪：

- Selenium URL
- 目标页面 URL
- 截图大小和存储 URL
- 失败原因和堆栈信息

---

## 快速上手指南：从零到一

为了让没有相关经验的开发者也能快速上手，这里提供一个完整的、从零开始的部署指南。

### 前置条件检查

在开始之前，请先检查你的服务器是否满足以下条件：

**1. 操作系统检查**

```
# 查看操作系统版本  
cat /etc/os-release  
# CentOS 7/8 或 Ubuntu 18.04+ 都可以  
  
# 查看内核版本  
uname -r  
# 应该显示 3.10+（CentOS 7）或 4.15+（Ubuntu）
```

**2. Docker 检查（如果已安装）**

```
# 检查 Docker 是否已安装  
docker --version  
# 期望输出：Docker version 20.10.x 或更高  
  
# 检查 Docker 服务是否运行  
systemctl status docker  
# 期望看到：Active: active (running)  
  
# 如果未安装 Docker，继续看下面的安装步骤
```

**3. 资源检查**

```
# 检查可用内存（至少需要 2GB）  
free -h  
# 查看 Mem 行的 available 列  
  
# 检查磁盘空间（至少需要 500MB）  
df -h  
# 查看根目录 / 的可用空间  
  
# 检查 CPU（至少 1 核）  
nproc
```

**4. 网络检查**

```
# 测试网络连接（访问国内镜像）  
curl -I https://registry.aliyuncs.com  
# 应该返回 HTTP 200  
  
# 或测试官方镜像（如果网络正常）  
curl -I https://hub.docker.com
```

**5. Java 环境检查（如果需要运行 Java 应用）**

```
# 检查 Java 版本  
java -version  
# 期望：Java 8 或更高版本  
  
# 检查 JAVA_HOME  
echo $JAVA_HOME  
# 应该显示 Java 安装路径
```

**如果以上检查都通过，可以开始部署了！**

### 完整部署流程（新手友好）

#### 阶段一：安装 Docker（如果还没有）

**如果你的系统已经安装了 Docker，可以跳过这一步。**

**CentOS 7 系统：**

```
# 步骤 1：安装必要工具  
yum install -y yum-utils device-mapper-persistent-data lvm2  
  
# 执行后，应该看到 "Complete!" 表示安装成功  
  
# 步骤 2：添加 Docker 仓库（使用阿里云镜像，适合国内网络）  
yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo  
  
# 执行后，应该看到 "adding repo from: https://mirrors.aliyun.com/..."  
  
# 步骤 3：安装 Docker  
yum install -y docker-ce docker-ce-cli containerd.io  
  
# 执行后，应该看到 "Complete!" 和 Docker 版本信息  
  
# 步骤 4：启动 Docker 服务  
systemctl start docker  
systemctl enable docker  
  
# 步骤 5：验证安装  
docker --version  
# 期望输出：Docker version 20.10.x 或更高  
  
# 步骤 6：测试 Docker（运行一个测试容器）  
docker run hello-world  
# 期望输出：Hello from Docker! 等成功信息  
  
# 如果看到 "Hello from Docker!"，说明 Docker 安装成功！
```

**Ubuntu 系统：**

```
# 步骤 1：更新包索引  
apt-get update  
# 执行后，应该看到 "Reading package lists..." 和 "Done"  
  
# 步骤 2：安装依赖  
apt-get install -y \  
    apt-transport-https \  
    ca-certificates \  
    curl \  
    gnupg \  
    lsb-release  
  
# 执行后，应该看到 "Setting up..." 和 "Done"  
  
# 步骤 3：添加 Docker 官方 GPG 密钥  
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg  
  
# 如果网络有问题，可以跳过这一步，使用国内镜像源  
  
# 步骤 4：添加 Docker 仓库  
echo \  
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \  
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null  
  
# 步骤 5：更新包索引并安装 Docker  
apt-get update  
apt-get install -y docker-ce docker-ce-cli containerd.io  
  
# 执行后，应该看到 "Setting up docker-ce..." 和 "Done"  
  
# 步骤 6：启动 Docker 服务  
systemctl start docker  
systemctl enable docker  
  
# 步骤 7：验证安装  
docker --version  
# 期望输出：Docker version 20.10.x 或更高  
  
# 步骤 8：测试 Docker  
docker run hello-world  
# 期望输出：Hello from Docker! 等成功信息  
  
# 如果看到 "Hello from Docker!"，说明 Docker 安装成功！
```

**如果安装过程中遇到问题：**

- **网络连接失败**：使用国内镜像源（见上面的 CentOS 示例）
- **权限错误**：确保使用 root 用户或具有 sudo 权限的用户
- **包冲突**：先卸载旧版本的 Docker，然后重新安装

#### 阶段二：部署 Selenium Standalone

**步骤 1：拉取镜像**

这一步会下载 Selenium Standalone 镜像，大小约 1-2GB，根据网络速度可能需要几分钟。

```
# 方法1：使用国内镜像（推荐，速度快，适合国内网络）  
docker pull docker.m.daocloud.io/selenium/standalone-chrome:latest  
  
# 执行后，会显示下载进度，类似：  
# latest: Pulling from selenium/standalone-chrome  
# a1b2c3d4e5f6: Pull complete  
# ...  
  
# 重命名为标准名称（便于后续使用）  
docker tag docker.m.daocloud.io/selenium/standalone-chrome:latest selenium/standalone-chrome:latest  
  
# 方法2：使用官方镜像（如果网络正常，可以访问 Docker Hub）  
# docker pull selenium/standalone-chrome:latest  
  
# 验证镜像是否拉取成功  
docker images | grep selenium  
  
# 期望输出类似：  
# selenium/standalone-chrome   latest   abc123def456   2 hours ago   1.2GB  
  
# 如果能看到镜像，说明拉取成功！
```

**如果拉取失败：**

- **网络超时**：检查网络连接，或使用国内镜像源
- **磁盘空间不足**：清理旧的 Docker 镜像：`docker system prune -a`
- **权限错误**：确保使用 root 用户或具有 Docker 权限的用户

**步骤 2：启动容器**

这一步会启动 Selenium 容器，首次启动可能需要 30-60 秒。

```
# 启动 Selenium 容器  
docker run -d --name selenium \  
  -p 4444:4444 \  
  --shm-size=2g \  
  -e SE_NODE_MAX_SESSIONS=1 \  
  -e SE_NODE_OVERRIDE_MAX_SESSIONS=true \  
  --restart unless-stopped \  
  selenium/standalone-chrome:latest  
  
# 执行后，会返回一个容器 ID，类似：abc123def456789...  
  
# 立即查看容器状态  
docker ps | grep selenium  
  
# 期望输出类似：  
# abc123def456   selenium/standalone-chrome:latest   "/opt/bin/entry_po..."   10 seconds ago   Up 9 seconds   0.0.0.0:4444->4444/tcp   selenium  
  
# 如果看到容器状态为 "Up"，说明容器已启动  
  
# 查看启动日志（确认没有错误）  
docker logs selenium  
  
# 期望看到：  
# Selenium Grid Hub is ready to receive connections  
# 或  
# Selenium Grid is ready to receive connections  
  
# 如果看到错误信息，继续查看日志：  
docker logs --tail=50 selenium
```

**如果容器启动失败：**

- **端口被占用**：检查端口 4444 是否被占用：`netstat -tuln | grep 4444`
- **内存不足**：检查可用内存：`free -h`，确保至少 2GB 可用
- **镜像不存在**：确认镜像已拉取：`docker images | grep selenium`

**步骤 3：验证服务**

容器启动后，需要等待一段时间让 Selenium Grid 完全初始化（通常 15-30 秒）。

```
# 等待 15 秒让容器完全启动  
echo "等待容器启动..."  
sleep 15  
  
# 检查 Selenium Grid 状态  
curl -s http://127.0.0.1:4444/status  
  
# 期望返回：  
# {"value":{"ready":true,"message":"Selenium Grid ready."}}  
  
# 如果返回包含 "ready":true，说明服务已就绪！  
  
# 更友好的查看方式（需要安装 jq 或 python）  
curl -s http://127.0.0.1:4444/status | python -m json.tool  
# 或  
curl -s http://127.0.0.1:4444/status | jq .
```

**验证清单：**

- ✅ 容器状态为 `Up`：`docker ps | grep selenium`
- ✅ 端口正常监听：`netstat -tuln | grep 4444` 显示 `0.0.0.0:4444`
- ✅ 状态接口返回 `ready: true`：`curl http://127.0.0.1:4444/status`

**如果状态检查失败：**

```
# 查看容器详细日志  
docker logs --tail=100 selenium  
  
# 查看容器资源使用  
docker stats selenium --no-stream  
  
# 检查容器是否在运行  
docker ps -a | grep selenium  
# 如果状态是 Exited，说明容器退出了，查看日志找原因  
  
# 重启容器  
docker restart selenium
```

#### 阶段三：配置 Java 应用

**步骤 1：检查并添加依赖**

首先检查项目的 `pom.xml` 文件，确保包含 Selenium 依赖：

```
<dependencies>  
    <!-- 其他依赖 -->  
      
    <!-- Selenium WebDriver -->  
    <dependency>  
        <groupId>org.seleniumhq.selenium</groupId>  
        <artifactId>selenium-java</artifactId>  
        <version>4.31.0</version> <!-- 可以使用最新版本 -->  
    </dependency>  
</dependencies>
```

**如果没有这个依赖，添加后需要：**

```
# Maven 项目：刷新依赖  
mvn clean install  
  
# 或者使用 IDE 的依赖刷新功能
```

**步骤 2：修改代码**

按照前面"问题四：Java 代码改造"部分的完整代码示例进行修改。

**关键步骤：**

1. 1. 找到你的截图工具类（如 `WebScreenshotUtils.java`）
2. 2. 将 `new ChromeDriver(options)` 改为 `new RemoteWebDriver(new URL(SELENIUM_URL), options)`
3. 3. 添加 `System.setProperty("webdriver.remote.enableTracing", "false")`
4. 4. 确保 Selenium URL 配置正确

**步骤 3：编译和测试**

```
# 编译项目  
mvn clean compile  
  
# 如果编译成功，运行测试  
mvn test  
  
# 或直接启动应用  
mvn spring-boot:run
```

**步骤 4：测试连接**

启动应用后，可以通过以下方式测试连接：

**方法 1：查看应用日志**

```
# 查看应用日志（实时）  
tail -f logs/edu-page-gen-backend.log | grep -i selenium  
  
# 应该能看到：  
# 初始化远程Chrome驱动，连接Selenium Grid: http://127.0.0.1:4444/wd/hub  
# 远程Chrome驱动初始化成功
```

**方法 2：触发截图功能**

在应用中触发一次截图功能（比如创建或更新应用），然后查看日志：

```
# 查看截图相关日志  
tail -f logs/edu-page-gen-backend.log | grep -i screenshot  
  
# 应该能看到：  
# 开始生成应用截图: appId=xxx, deployUrl=xxx  
# 网页截图成功: xxx  
# 应用截图生成并上传成功: appId=xxx, screenshotUrl=xxx
```

**方法 3：使用测试接口**

如果项目中有测试接口，可以直接调用：

```
# 使用 curl 测试截图接口（需要替换为实际的接口地址）  
curl -X POST "http://localhost:8090/api/test/screenshot/generate?appId=123&deployUrl=https://example.com"
```

**如果测试失败，检查：**

1. 1. **容器是否运行**：`docker ps | grep selenium`
2. 2. **Selenium 是否就绪**：`curl http://127.0.0.1:4444/status`
3. 3. **应用日志中的错误信息**：查看完整的错误堆栈

### 常见问题排查

#### 问题 1：容器启动失败

```
# 查看详细日志  
docker logs selenium  
  
# 检查端口是否被占用  
netstat -tuln | grep 4444  
  
# 如果端口被占用，停止占用端口的服务或使用其他端口
```

#### 问题 2：无法连接 Selenium

```
# 检查容器是否运行  
docker ps | grep selenium  
  
# 检查端口映射  
docker port selenium  
  
# 测试连接（在宿主机上）  
curl -v http://127.0.0.1:4444/status  
  
# 检查防火墙  
firewall-cmd --list-ports  # CentOS  
# 或  
ufw status  # Ubuntu
```

#### 问题 3：截图失败

```
# 查看容器日志  
docker logs --tail=100 selenium  
  
# 查看应用日志  
tail -100 logs/your-app.log  
  
# 检查容器资源使用  
docker stats selenium
```

---

## 快速参考：一键部署清单

为了方便快速部署和问题排查，我们整理了以下速查清单，可以直接复制使用。

### Docker 容器启动命令

```
# 1. 拉取镜像（国内镜像）  
docker pull docker.m.daocloud.io/selenium/standalone-chrome:latest  
docker tag docker.m.daocloud.io/selenium/standalone-chrome:latest selenium/standalone-chrome:latest  
  
# 2. 启动容器  
docker run -d --name selenium \  
  -p 4444:4444 \  
  --shm-size=2g \  
  -e SE_NODE_MAX_SESSIONS=1 \  
  -e SE_NODE_OVERRIDE_MAX_SESSIONS=true \  
  --restart unless-stopped \  
  selenium/standalone-chrome:latest  
  
# 3. 健康检查（等待 15 秒后执行）  
sleep 15  
curl -s http://127.0.0.1:4444/status  
  
# 4. 查看容器状态  
docker ps | grep selenium  
  
# 5. 查看日志（如果出现问题）  
docker logs selenium
```

### Java 代码示例

**完整的代码示例（可直接使用）：**

```
import org.openqa.selenium.*;  
import org.openqa.selenium.PageLoadStrategy;  
import org.openqa.selenium.chrome.ChromeOptions;  
import org.openqa.selenium.remote.RemoteWebDriver;  
import java.net.URL;  
import java.time.Duration;  
  
public class WebScreenshotUtils {  
    // Selenium Grid URL（可通过环境变量配置）  
    private static final String SELENIUM_URL =  
        System.getenv().getOrDefault("SELENIUM_URL", "http://127.0.0.1:4444/wd/hub");  
      
    public static WebDriver initRemoteChrome() throws Exception {  
        // 关闭追踪功能（避免 OpenTelemetry 依赖问题）  
        System.setProperty("webdriver.remote.enableTracing", "false");  
          
        // 配置 Chrome 选项  
        ChromeOptions options = new ChromeOptions();  
        options.setPageLoadStrategy(PageLoadStrategy.NORMAL);  
          
        // 添加启动参数  
        options.addArguments(  
            "--headless=new",  
            "--no-sandbox",  
            "--disable-dev-shm-usage",  
            "--disable-gpu",  
            "--disable-software-rasterizer",  
            "--disable-extensions",  
            "--disable-background-networking",  
            "--window-size=1280,720"  
        );  
          
        // 创建远程 WebDriver  
        RemoteWebDriver driver = new RemoteWebDriver(new URL(SELENIUM_URL), options);  
          
        // 设置超时  
        driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(60));  
        driver.manage().timeouts().scriptTimeout(Duration.ofSeconds(30));  
          
        return driver;  
    }  
      
    // 测试方法  
    public static void testConnection() throws Exception {  
        WebDriver driver = initRemoteChrome();  
        try {  
            driver.get("https://www.baidu.com");  
            System.out.println("页面标题: " + driver.getTitle());  
            byte[] screenshot = ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES);  
            System.out.println("截图成功，大小: " + screenshot.length + " bytes");  
        } finally {  
            driver.quit();  
        }  
    }  
}
```

**使用步骤：**

1. 1. 将上述代码添加到你的项目中
2. 2. 确保 Selenium 依赖已添加到 `pom.xml`
3. 3. 确保 Docker 容器已启动并运行
4. 4. 调用 `testConnection()` 方法测试连接
5. 5. 如果测试成功，就可以在业务代码中使用 `initRemoteChrome()` 方法

### 常见错误快速修复

| 错误信息 | 可能原因 | 解决方案 |
| --- | --- | --- |
| `Permission denied` | 路径指向了目录而非文件，或父目录/分区缺少执行权限 | 检查路径是否正确，确保指向可执行文件；检查文件权限：`chmod +x chromedriver` |
| `cannot find Chrome binary` | 未安装 Chrome 浏览器，或版本与 ChromeDriver 不匹配 | 使用容器化方案，或安装匹配版本的 Chrome 浏览器 |
| `GLIBC_x.y not found` | 宿主机 glibc 版本太老，无法运行现代 Chrome | **使用 Docker 容器化** （推荐），或安装旧版 Chrome（不推荐） |
| `NoClassDefFoundError ... OpenTelemetry` | Selenium 4 默认启用追踪，但客户端缺少依赖 | 添加 `System.setProperty("webdriver.remote.enableTracing", "false")` |
| `chrome not reachable` | 资源不足（内存/共享内存），Chrome 启动失败 | 增加 `--shm-size=2g`，限制并发 `SE_NODE_MAX_SESSIONS=1`，缩小窗口尺寸 |
| `Connection refused` | Docker 容器未启动，或端口未映射 | 检查容器状态：`docker ps`，检查端口映射：`docker port selenium` |
| `timeout` | 页面加载超时 | 增加 `pageLoadTimeout`，或检查目标 URL 是否可访问 |

### 验证清单（部署后必做）

完成部署后，请按以下清单逐项验证：

- Docker 容器正常运行：`docker ps | grep selenium` 显示容器状态为 `Up`
- Selenium Grid 就绪：`curl http://127.0.0.1:4444/status` 返回 `ready: true`
- Java 应用启动成功：查看应用日志，无 Selenium 相关错误
- 测试截图功能：触发一次截图，查看日志确认成功
- 检查截图结果：在 OSS 或数据库中查看生成的截图文件
- 监控资源使用：`docker stats selenium` 查看容器资源占用是否正常

---

## 写在最后

这次从**权限错误 → 版本/依赖冲突 → 容器化改造 → 线上调优**的完整排障过程，让我们深刻体会到了**容器化方案**的优势。

### 核心经验

> **浏览器自动化在生产环境应该优先考虑容器化，这样可以一次性屏蔽系统依赖和版本兼容性问题；对于资源受限的小型服务器，务必关注共享内存（`/dev/shm`）和并发会话数。**

### 技术选型建议

- ✅ **生产环境**：Docker + Selenium Standalone（稳定、可控）
- ✅ **开发环境**：本地 ChromeDriver（快速、灵活）
- ❌ **避免**：在旧系统上强行安装新版本浏览器（兼容性差）

### 适用场景

这套方案不仅适用于网页截图，还可以用于：

- 自动化测试
- 内容预览生成
- 页面监控
- 性能分析

### 期望

希望这篇完整的排障实录能帮助你在生产环境中快速、稳定地实现自动化截图功能。如果你也在做类似的自动化任务，欢迎按照本文的清单逐条落地，基本可以**一次到位，避免踩坑**。

#### 引用链接

`[1]` 快速上手指南：从零到一: *#快速上手指南从零到一*
