# 超脑 Studio iOS App 打包指南

本项目已经通过 [Capacitor](https://capacitorjs.com/) 包装成 iOS App。App 启动后会直接加载线上的 `https://superbrain-studio.cn/`，所有后端逻辑、课程、讨论区仍然走你自己的 VPS 服务。

> **⚠️ App Store 审核提醒**：纯 WebView 壳包存在被拒风险（4.2 最低功能要求）。如果你只是用它来通过“微信小程序要求的 App Store 上架证明”，可以提交；但如果想长期稳定上架，建议后续加入推送、离线缓存、原生分享等能力。需要的话我可以继续帮你加。

---

## 前置条件

1. 一台 Mac（必须在 macOS 上才能运行 Xcode 打包/签名）。
2. 安装 Xcode（建议最新稳定版）和 `xcodebuild` 命令行工具。
3. 一个有效的 [Apple Developer Program](https://developer.apple.com/programs/) 账号（个人/公司/企业均可）。
4. 代码已拉到本地，并且依赖安装完成：

```bash
cd /root/chat-and-course   # 或你本地的项目路径
bun install
```

---

## 关键配置

- **Bundle ID**：`studio.superbrain.app`（在 `capacitor.config.ts` 中）。
  - 如果想改，改完必须重新运行 `bunx cap sync`。
- **App 名称**：`超脑 Studio`。
- **启动 URL**：`https://superbrain-studio.cn/`。
- **允许的导航域名**：`superbrain-studio.cn`、`*.superbrain-studio.cn`、`api.superbrain-studio.cn`、`cdn.superbrain-studio.cn`。

这些都已经配置好，通常不需要再改。

---

## 常用命令

```bash
# 1. 安装 Capacitor iOS 平台（已完成，一般不需要再执行）
# bunx cap add ios

# 2. 生成 iOS 图标和启动图（如果 assets/icon.png 有更新）
bun run mobile:icons

# 3. 同步 web 资源和配置到 iOS 工程
bun run mobile:build

# 4. 在 Xcode 中打开项目
bun run mobile:ios:open

# 5. 在已连接的真机/模拟器上运行（需要 Xcode 已配置好签名）
bun run mobile:ios
```

---

## 在 Xcode 中要做的事

打开项目后，在左侧项目导航栏选中 `App` → `Signing & Capabilities`：

1. **Team**：选择你的 Apple Developer Team。
2. **Bundle Identifier**：保留 `studio.superbrain.app` 或改成你已在 Apple Developer 后台/App Store Connect 注册的 Bundle ID。
3. 如果需要推送、iCloud、Sign in with Apple 等能力，点击 **+ Capability** 添加。

然后：

- 选择目标设备（模拟器或真机）。
- 按 `Cmd + R` 运行。
- 如果运行成功，按 `Product → Archive` 打包，然后上传 App Store Connect。

---

## 图标/启动图

图标源文件：`assets/icon.png`（来自之前生成的小程序图标 512px）。

运行 `bun run mobile:icons` 会自动生成：

- `ios/App/App/Assets.xcassets/AppIcon.appiconset` 中所有 iPhone/iPad/App Store 尺寸。
- `ios/App/App/Assets.xcassets/Splash.imageset` 中的启动图。

---

## 文件清单

- `capacitor.config.ts`：Capacitor 主配置。
- `mobile-dist/index.html`：App 本地占位页（最终启动后会切到线上网站）。
- `ios/`：完整的 Xcode 工程。
- `scripts/generate-ios-icons.py`：图标生成脚本。
- `assets/icon.png`：图标源文件。

---

## 后续建议

- 如果 App Store 审核要求“原生功能”，可以优先加：
  - 本地推送通知（课程更新提醒）。
  - 微信/Apple 登录（统一登录态）。
  - 本地缓存最近课程，离线可查看。
- 域名或证书变更后，记得同步修改 `capacitor.config.ts` 并运行 `bunx cap sync`。

---

## 常见问题

**Q：打开 Xcode 后没有 `App` target？**
A：确保运行了 `bun run mobile:build` 或 `bunx cap sync`，`ios/App/App.xcodeproj` 是自动生成的。

**Q：真机运行提示“无法验证 App”？**
A：需要一个付费的 Apple Developer 账号，并在 Signing & Capabilities 中选择正确的 Team。

**Q：提交审核后 4.2 被拒？**
A：说明是纯 WebView 壳。需要增加原生功能或重新用“已有 App”路径来注册微信小程序，而不是硬上架。需要我帮你加原生功能时再说。
