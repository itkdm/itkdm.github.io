---
name: "示例应用 - 仅 GitHub Release"
nameEn: "Example App - GitHub Only"
description: "这是一个仅使用 GitHub Release 作为下载源的示例"
descriptionEn: "This is an example that only uses GitHub Release as download source"
icon: "🚀"
platform: "Cross Platform"
lang: "zh"
order: 2
sources:
  - type: github
    repo: "example/example-repo"
    channel: stable
    preferAssetsRegex: ".*\\.(zip|tar\\.gz)$"
    showSha256: true
---

这是一个仅使用 GitHub Release 作为下载源的示例应用。

## 特点

- ✅ 自动从 GitHub 获取最新版本
- ✅ 支持显示 SHA256 校验值
- ✅ 可以指定优先显示的资产文件类型

## 使用场景

适用于开源项目，所有发布都通过 GitHub Releases 管理。
