---
title: "Rust 语言入门（一）"
date: 2025-09-15T08:50:00+08:00
tags: ["Rust", "编程语言", "Cargo", "开发环境", "入门"]
summary: "这篇文章从语言定位、使用场景、环境配置到 Cargo 与调试方式，系统整理了 Rust 的入门知识，适合作为 Rust 学习的第一篇文章。"
lang: "zh"
slug: "rust-language-getting-started-part-1"
draft: false
---

# 入门Rust语言

* 入门Rust语言

+ 介绍
+ 使用场景
+ 环境配置
+ 什么是cargo呢？
+ 如何调试？

## 介绍

Rust 是一门 **系统级编程语言**，由 Mozilla 于 2010 年左右主导开发，现由 Rust 基金会维护。它的设计目标是：

- **性能高**：和 C、C++ 一样，Rust 直接编译为机器码，几乎没有运行时开销。
- **内存安全**：Rust 引入了“所有权（Ownership）+ 借用（Borrowing）+ 生命周期（Lifetimes）”机制，在编译时就能发现内存越界、悬垂指针、数据竞争等问题，而不用依赖垃圾回收（GC）。
- **并发友好**：通过编译器的严格检查，保证多线程并发时不会发生常见的数据竞争错误。
- **跨平台**：支持 Linux、Windows、macOS 以及嵌入式设备，广泛应用于后端服务、操作系统内核、区块链、WebAssembly 等领域。

简单理解：Rust 想结合 **C/C++ 的性能** 和 **Java/Python 等现代语言的安全性**，做到既快又安全。

👉 举个小例子，Rust 的“Hello, World!” 程序：

```
fn main() {  
    println!("Hello, world!");  
}
```

相比 C/C++，Rust 编译时会帮你抓住很多潜在 bug；相比 Java/Python，它运行速度非常接近 C++。

## 使用场景

🔧 1. 系统级开发

- **操作系统内核 / 驱动**  
   Rust 的无 GC、零成本抽象、内存安全，使它成为 C/C++ 的替代者。

+ • 例子：Linux 内核已经在逐步引入 Rust 模块。
+ • 例子：Redox OS（一个用 Rust 写的操作系统）。

- **嵌入式开发 / IoT**  
   嵌入式设备资源有限（内存、CPU），Rust 的性能优势和安全性非常适合。

+ • 例子：用 Rust 写 STM32 微控制器程序。

---

🌐 2. 网络与后端服务

- **高性能 Web 服务**  
   Rust 的异步运行时（Tokio、Actix）能处理百万级并发，且内存占用比 Java、Go 更小。

+ • 例子：Discord 的部分后端模块用 Rust 重写，显著降低了内存消耗。

- **分布式系统**  
   数据库、缓存系统、消息队列这些要求高性能和稳定性的核心模块，Rust 非常适合。

+ • 例子：TiKV（分布式数据库）用 Rust 开发。
+ • 例子：Vector（日志采集系统，Rust 开发）。

---

🔒 3. 安全相关

- **浏览器引擎**  
   Mozilla 最初开发 Rust 就是为了重写 Firefox 的浏览器引擎，避免 C++ 内存漏洞。

+ • 例子：Firefox 的渲染引擎 Servo 用 Rust 开发。

- **区块链 / 加密系统**  
   Rust 的内存安全+速度，非常适合开发智能合约平台和钱包。

+ • 例子：Solana 区块链主要用 Rust 写的。

---

🎮 4. 游戏和图形引擎

- **游戏引擎**  
   Rust 的性能可媲美 C++，但开发体验更安全。

+ • 例子：Bevy（Rust 的 ECS 游戏引擎）。

- **图形渲染**  
   Vulkan / OpenGL 封装层，Rust 有不少高性能库。

---

📦 5. 前端与 WebAssembly

- **WebAssembly (Wasm)**  
   Rust 编译到 Wasm，可以让浏览器直接运行高性能模块。

+ • 例子：Figma（在线设计工具）用 Rust + Wasm 加速图形处理。

## 环境配置

🖥 Windows 安装 Rust

1️⃣ 下载官方安装器

- 打开官网安装 Rust - Rust 程序设计语言： Rust 安装页面
- 点击 **“Download rustup-init.exe”**（这是官方安装器）。

---

2️⃣ 运行安装器

- 双击运行下载的 `rustup-init.exe`
- 安装界面会出现命令行窗口，提示你选择：

1. 1. **默认安装（推荐）** → 输入 `1` 回车（注意：如果没有C语言的编译环境会提示你，此时也可以输入1，自动安装Visual Studio）
2. 2. 自定义安装（不建议新手用）

- 默认安装会自动配置好 Rust 编译器和 Cargo（包管理器）。

---

3️⃣ 验证安装

安装完成后，打开 **PowerShell 或 CMD**，输入：

```
rustc --version  
cargo --version
```

如果能看到版本号，说明安装成功。

---

4️⃣ 配置开发工具（推荐）

- **安装 VS Code**（如果还没装的话）
- 在扩展市场搜索并安装：

+ • `rust-analyzer`（智能提示、补全、语法检查）
+ • `CodeLLDB`（调试 Rust 程序）或者`native debug`

---

5️⃣ 创建并运行第一个项目

在 PowerShell 输入：

```
cargo new hello_rust   # 新建项目，hello_rust是项目名称  
cd hello_rust          # 进入项目目录  
# cargo build   # 编译项目（可选，run命令会自动编译）  
cargo run              # 自动编译并运行
```

你会看到输出：

```
Hello, world!
```

这就是 Rust 的第一个程序。🎉

## 什么是cargo呢？

它是 Rust 的 **官方构建工具和包管理器**，有点类似：

- **Java 世界的 Maven/Gradle**
- **Node.js 的 npm/yarn**
- **Python 的 pip + setuptools**

🚀 Cargo 的主要作用

1. 1. **项目管理**

- 一条命令创建项目：

  ```
  cargo new hello_rust
  ```

  它会自动生成目录结构：

  ```
  hello_rust/  
  ├── Cargo.toml    # 项目配置文件（类似 package.json）  
  └── src/  
      └── main.rs   # 入口文件
  ```

2. 2. **编译与运行**

- 编译：`cargo build`
- 运行：`cargo run`
- 只检查语法和依赖是否正确（不生成文件）：`cargo check`

3. 3. **依赖管理**

- 在 `Cargo.toml` 中添加依赖：

  ```
  [dependencies]  
  rand = "0.8"
  ```
- 然后运行：

  ```
  cargo build
  ```

  Cargo 会自动下载并管理依赖库（类似 npm install）。

4. 4. **测试与工具**

- 运行测试：`cargo test`
- 格式化代码：`cargo fmt`
- 静态检查：`cargo clippy`

5. 5. **发布与分享**

- 打包并上传到 crates.io（Rust 的包管理平台）：

  ```
  cargo publish
  ```

---

📦 Cargo 的核心文件

- **Cargo.toml** → 项目配置文件，写项目名、版本、依赖。
- **Cargo.lock** → 锁定依赖版本，保证多人协作时环境一致。

---

📌 总结一句话：

**Cargo 就是 Rust 的项目管理和构建工具，帮你完成从建项目、装依赖、编译、运行、测试到发布的整个流程。**

## 如何调试？

打开项目文件夹，在里面新建一个新的文件夹 **.vscode** （注意 vscode 前面的点，如果有这个文件夹就不需要新建了）。在新建的 .vscode 文件夹里新建两个文件 tasks.json 和 launch.json，文件内容如下：

tasks.json

当你在 VSCode 里执行这个任务（或者调试时设置 `"preLaunchTask": "build"`），VSCode 会自动运行 `cargo build`，把你的 Rust 工程编译好。

这样就能保证在调试前，项目总是最新编译版本。

```
{   
    "version": "2.0.0",   
    "tasks": [        
        {   
            "label": "build",   
            "type": "shell",   
            "command": "cargo",   
            "args": ["build"]   
        }   
    ]   
}
```

launch.json(windows系统)

告诉 VSCode 在调试 Rust 程序时该用什么方式启动，

```
{  
  "version": "0.2.0",  
  "configurations": [  
    {  
      "name": "(Windows) 启动",  
      "preLaunchTask": "build",  
      "type": "cppvsdbg",  
      "request": "launch",  
      "program": "${workspaceFolder}/target/debug/${workspaceFolderBasename}.exe",  
      "args": [],  
      "stopAtEntry": false,  
      "cwd": "${workspaceFolder}",  
      "environment": [],  
      "externalConsole": false  
    },  
    {  
      "name": "(gdb) 启动",  
      "type": "cppdbg",  
      "request": "launch",  
      "program": "${workspaceFolder}/target/debug/${workspaceFolderBasename}.exe",  
      "args": [],  
      "stopAtEntry": false,  
      "cwd": "${workspaceFolder}",  
      "environment": [],  
      "externalConsole": false,  
      "MIMode": "gdb",  
      "miDebuggerPath": "这里填GDB所在的目录",  
      "setupCommands": [  
        {  
          "description": "为 gdb 启用整齐打印",  
          "text": "-enable-pretty-printing",  
          "ignoreFailures": true  
        }  
      ]  
    }  
  ]  
}
```

这个 `launch.json` 文件一共定义了 **两种调试方式**：

1. 1. **(Windows) 启动** → 用 MSVC 调试器（推荐，新手安装 Rust 默认就是这个）。
2. 2. **(gdb) 启动** → 用 GDB 调试器（只在你用 MinGW 工具链时才需要）。

调试时，在 VSCode 左侧「运行和调试」面板，选择对应的配置，再点击启动就可以。

注意：如果点击 左侧「运行和调试」面板没有找到对应配置，更换vscode工作区目录的根目录为项目名称目录，比如项目名称目录为rust\_hello,直接打开这个文件夹。

调试过程和其他编辑器类似，点击代码行号左侧设置断点，调试查看变量等信息，后续再详细介绍如何进行调试！

关注后续合集！
