---
title: "WSL 安装中的代理与镜像配置指南"
date: 2025-10-11T11:35:38+08:00
tags: ["WSL", "Windows", "代理", "镜像加速", "开发环境"]
summary: "这篇文章围绕 WSL 的安装与网络配置展开，重点解决下载卡顿、镜像源切换以及 WSL 与 Windows 主机之间的代理联通问题。"
lang: "zh"
slug: "wsl-install-proxy-mirror-guide"
draft: false
---

# 超详细 WSL 安装避坑指南：代理 + 镜像加速全攻略

Windows Subsystem for Linux（简称 **WSL**）已经成为开发者在 Windows 上使用 Linux 工具链的最方便方式。

但安装过程中，**网络问题、镜像下载失败、代理配置等坑点层出不穷**。

这篇文章结合实际经验，手把手带你搞定 WSL！

---

## 一、前提条件

在开始安装之前，请确保以下条件满足：

- ✅ Windows 10 版本 ≥ 2004（内部版本 ≥ 19041）
- ✅ 已开启 Windows 更新
- ✅ 具有管理员权限的 PowerShell

👉 检查 Windows 版本：  
按下 `Win + R`，输入 `winver`，查看版本号即可。

---

## 二、一键安装 WSL

Windows 现在已经支持 **一条命令安装 WSL**，无需手动开启组件：

```
wsl --install
```

运行后，它会自动完成以下步骤：

1. 1. 启用 WSL 功能
2. 2. 启用虚拟机平台
3. 3. 下载 Linux 内核
4. 4. 安装默认的 Ubuntu 发行版

> ⚠️ 如果你的系统提示“找不到 `wsl` 命令”，请先通过「可选功能」启用：  
> 控制面板 → 程序 → 启用或关闭 Windows 功能 → 勾选 “适用于 Linux 的 Windows 子系统” 和 “虚拟机平台” → 重启。

---

## 三、遇到网络下载卡死？代理来救命！

在中国大陆网络环境下，WSL 安装时**最容易卡在“正在下载 Linux 内核”或“安装发行版”这一步**，这是因为访问微软或 Ubuntu 官方服务器时速度很慢甚至被阻断。

### 解决方式一：设置系统代理（推荐）

如果你本地有科学上网工具，可以把 Windows 的代理指向它：

1. 1. 打开「设置」 → 网络和 Internet → 代理
2. 2. 手动设置 HTTP、HTTPS 代理，如：

   ```
   HTTP: 127.0.0.1:7890  
   HTTPS: 127.0.0.1:7890
   ```
3. 3. 再次执行：

   ```
   wsl --install
   ```

> 💡 有些代理工具不默认允许系统访问，需要勾选「允许局域网连接」或打开对应端口。

---

### 解决方式二：手动下载发行版

如果你始终下不动，也可以直接下载 `.appx` 或 `.msixbundle` 安装包：

👉 WSL 官方发行版列表

下载对应版本后，**直接双击安装即可**，或使用命令行注册：

```
Add-AppxPackage .\Ubuntu_2004.2021.825.0_x64.appx
```

---

## 四、安装完成后的基础配置

进入 WSL 后，建议立即更新系统：

```
sudo apt update && sudo apt upgrade -y
```

⚠️ 但很多朋友会在这一步遇到：

```
0% [Connecting to archive.ubuntu.com] [Connecting to security.ubuntu.com]
```

然后就卡死不动。

### ✅ 换国内源（阿里云 / 清华）

例如 Ubuntu 20.04，可以编辑 `/etc/apt/sources.list`：

```
sudo cp /etc/apt/sources.list /etc/apt/sources.list.bak  
sudo nano /etc/apt/sources.list
```

替换为：

```
deb https://mirrors.aliyun.com/ubuntu/ focal main restricted universe multiverse  
deb https://mirrors.aliyun.com/ubuntu/ focal-updates main restricted universe multiverse  
deb https://mirrors.aliyun.com/ubuntu/ focal-security main restricted universe multiverse  
deb https://mirrors.aliyun.com/ubuntu/ focal-backports main restricted universe multiverse
```

保存后：

```
sudo apt update
```

👉 立刻飞起

---

## 五、🌐 正确配置 WSL 代理

很多人在 WSL 里配置代理时，第一反应是：

```
export http_proxy=http://127.0.0.1:7890
```

结果依然各种 `apt update` 卡死、curl 报错、git clone 慢如蜗牛……  
这是因为 WSL 的网络结构和我们直觉中并不一样👇

> ⚠️ 在 WSL 里，`127.0.0.1` 代表的是 **WSL 虚拟机自身**，并不是 Windows 主机。  
> 这意味着你在 Windows 上开的代理（Clash、V2RayN 等）监听的是 Windows 的 127.0.0.1，而 WSL 根本访问不到！

所以，正确的方式是：  
👉 **让 Windows 的代理监听 0.0.0.0** →  
👉 **放行防火墙端口** →  
👉 **在 WSL 中配置 Windows 的局域网 IP 地址** →  
👉 （可选）**添加动态脚本自动更新 IP**

下面我们一步步来👇

(下面步骤以你实际代理端口为主，7890不是固定的)

---

### ✅ 第一步：让代理工具监听 0.0.0.0

在 Windows 上打开你使用的代理工具（例如 Clash for Windows），找到「允许局域网连接」或类似选项，并将其打开。

- **Clash for Windows**  
  设置 → General → 打开 `Allow LAN` ✅  
  开启后，软件会显示一个「LAN 地址」，例如：

  ```
  192.168.1.88:7890
  ```

这就意味着你的代理现在不仅仅监听本地回环，还允许同一局域网（包括 WSL）访问。

> 💡 如果工具没有 UI 选项，也可以手动修改配置文件，将 `127.0.0.1` 改为 `0.0.0.0`，然后重启代理软件即可。总之就是对应代理端口一定要有0.0.0.0.

---

### ✅ 第二步：放行 Windows 防火墙

默认情况下，Windows 防火墙会拦截来自 WSL 的流量（虽然它们在同一台机器上，但网络上是“虚拟邻居”）。

在 PowerShell（管理员）中执行以下命令，放行代理端口（假设是 7890）：

```
netsh advfirewall firewall add rule name="WSL Proxy" dir=in action=allow protocol=TCP localport=7890
```

执行完后，WSL 才能顺利访问你的 Windows 代理端口。

---

### ✅ 第三步：找到 Windows 的局域网 IP 地址

在 PowerShell 中执行：

```
ipconfig
```

找到你的「无线局域网适配器」或「以太网适配器」，记下 IPv4 地址，例如：

```
IPv4 地址 . . . . . . . . . . . . : 192.168.1.88
```

这就是 WSL 内访问 Windows 的“网关”。

---

### ✅ 第四步：在 WSL 内部配置代理

打开 WSL 终端，执行以下命令（将 IP 和端口替换成你自己的）：

```
export http_proxy=http://192.168.1.88:7890  
export https_proxy=http://192.168.1.88:7890
```

测试一下是否生效：

```
curl -I https://www.google.com
```

如果返回 HTTP 响应头，就说明代理配置成功 ✅

> 💡 为了每次启动 WSL 自动生效，可以把上面的 export 写入 `~/.bashrc` 或 `~/.zshrc`：
>
> ```
> echo 'export http_proxy=http://192.168.1.88:7890' >> ~/.bashrc  
> echo 'export https_proxy=http://192.168.1.88:7890' >> ~/.bashrc  
> source ~/.bashrc
> ```

---

### 🧪 验证：apt / curl / git 是否正常

配置好代理后，执行以下命令验证网络：

```
sudo apt update  
curl -I https://www.google.com  
git clone https://github.com/git/git.git
```

如果一切顺利，这些命令都应该能顺畅跑完，不再出现卡死、超时、连接拒绝的情况

---

## 结语

别被“坑”吓退，WSL 是神器

上面整个流程挺简单的，对应也给出了不同问题的解决方案，但是可能细微处不同电脑不一样（比如代理工具不同），对应流程如何解决可以询问AI，AI生成命令行也可以快速解决。

WSL 真的是 Windows 开发者的福音：

- ✅ 原生 Linux 环境
- ✅ 超快的文件访问速度
- ✅ 与 VSCode、Docker 无缝联动

只要处理好网络代理问题，一次顺利安装，就能让你在 Windows 上像在 Linux 下一样丝滑开发。
