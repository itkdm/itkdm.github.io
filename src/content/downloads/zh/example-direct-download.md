---
name: "示例应用 - 直接下载"
nameEn: "Example App - Direct Download"
description: "这是一个仅使用直接下载链接的示例，适用于 CDN、OSS 等场景"
descriptionEn: "This is an example that only uses direct download links, suitable for CDN, OSS scenarios"
icon: "💾"
platform: "Windows"
lang: "zh"
order: 3
sources:
  - type: direct
    name: "Windows 64位"
    url: "https://example.com/releases/app-windows-x64.exe"
    size: 52428800
    platform: windows
    arch: x86_64
  - type: direct
    name: "Windows 32位"
    url: "https://example.com/releases/app-windows-x86.exe"
    size: 41943040
    platform: windows
    arch: x86
  - type: direct
    name: "macOS Intel"
    url: "https://example.com/releases/app-macos-intel.dmg"
    size: 62914560
    platform: mac
    arch: x86_64
  - type: direct
    name: "macOS Apple Silicon"
    url: "https://example.com/releases/app-macos-arm64.dmg"
    size: 57671680
    platform: mac
    arch: arm64
  - type: direct
    name: "Linux 通用版本"
    url: "https://example.com/releases/app-linux.tar.gz"
    size: 36700160
    platform: linux
    arch: universal
---

这是一个仅使用直接下载链接的示例应用，适用于使用 CDN、OSS 等存储服务的场景。

## 特点

- ✅ 支持多个平台和架构
- ✅ 显示文件大小
- ✅ 直接下载，无需跳转

## 使用场景

适用于：
- 使用阿里云 OSS、腾讯云 COS 等对象存储
- 使用 CDN 加速下载
- 自建文件服务器
