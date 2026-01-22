---
name: "Example App - Beta Version"
nameEn: "Example App - Beta Version"
description: "This is an example showing Beta and Alpha version configurations"
descriptionEn: "This is an example showing Beta and Alpha version configurations"
icon: "🧪"
platform: "Android"
lang: "en"
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

This is an example showing how to configure different release channels (Stable, Beta, Alpha).

## Version Information

- **Stable**: Fully tested, recommended for daily use
- **Beta**: Preview of new features, may have minor issues
- **Alpha**: Early version, for development and testing only

## Download Recommendations

- Regular users: Use Stable version
- Early adopters: Can try Beta version
- Developers: Can use Alpha version for testing

## Notes

- Beta and Alpha versions may be unstable
- Recommend backing up data before installing test versions
- Please report issues promptly
