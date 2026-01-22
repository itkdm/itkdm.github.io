---
name: "示例应用 - Beta 版本"
nameEn: "Example App - Beta Version"
description: "这是一个展示 Beta 和 Alpha 版本配置的示例"
descriptionEn: "This is an example showing Beta and Alpha version configurations"
icon: "🧪"
platform: "Android"
lang: "zh"
order: 6
sources:
  - type: github
    repo: "example/beta-app"
    channel: stable
    preferAssetsRegex: ".*-stable.*\\.apk$"
    showSha256: true
  - type: github
    repo: "example/beta-app"
    channel: beta
    preferAssetsRegex: ".*-beta.*\\.apk$"
    showSha256: true
  - type: github
    repo: "example/beta-app"
    channel: alpha
    preferAssetsRegex: ".*-alpha.*\\.apk$"
    showSha256: false
---

这是一个展示如何配置不同发布渠道（Stable、Beta、Alpha）的示例。

## 版本说明

- **Stable（稳定版）**：经过充分测试，推荐日常使用
- **Beta（测试版）**：新功能预览，可能存在小问题
- **Alpha（内测版）**：早期版本，仅供开发测试

## 下载建议

- 普通用户：使用 Stable 版本
- 尝鲜用户：可以尝试 Beta 版本
- 开发者：可以使用 Alpha 版本进行测试

## 注意事项

- Beta 和 Alpha 版本可能不稳定
- 建议备份数据后再安装测试版本
- 遇到问题请及时反馈
