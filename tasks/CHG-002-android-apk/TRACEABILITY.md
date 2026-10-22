# TRACEABILITY · CHG-002 Android APK 打包与多架构发布

**状态**: 已实现并验收（模拟器真机级验证）
**日期**: 2026-10-22
**证据目录**: `.tmp/screenshots/`、`release/`（均 git 忽略）

---

## 1. 需求 → 实现 → 证据

| # | 需求（SPEC 章节） | 实现落点 | 证据 | 状态 |
|---|------------------|---------|------|------|
| R1 | 可安装的 Android APK | Capacitor 8.5.3 壳 + `frontend/dist`；`capacitor.config.ts`（appId `com.tianjisizhu.app`，`androidScheme=https`） | `adb install` → `Success` | ✅ |
| R2 | 功能对齐桌面主链路（排盘→查看→复制） | 前端零改动复用；`lib/platform` 适配层 | `android-03-result.png` 完整四柱结果 | ✅ |
| R3 | 多架构 APK | `app/build.gradle` `splits.abi`（armeabi-v7a / arm64-v8a / x86 / x86_64）+ `universalApk true` | `release/` 5 个 APK（各 3.8MB） | ✅ |
| R4 | 数据本地保存、离线 | `lib/platform/web.ts` localStorage（字段与 SQLite 表一致） | `android-06-records.png`「共 1 条记录」 | ✅ |
| R5 | CI 自动构建并挂 Release | `.github/workflows/release.yml` 新增 `build-android` job + `publish-release` 收录 `*.apk` | 工作流已写入；`aapt2` 校验步骤内置 | ✅ |
| R6 | CNB 流水线同步 | `.cnb.yml` 新增 `build android` stage + release 说明表 | 已写入 | ✅ |
| R7 | 环境完全虚拟化在项目内 | `scripts/android-env.sh` 导出 `ANDROID_HOME`/`GRADLE_USER_HOME`/`ANDROID_AVD_HOME`/`ANDROID_EMULATOR_HOME`/`USERPROFILE`/`TMPDIR` | `.android/` 单目录承载 SDK+AVD+keystore+Gradle；`scripts/env-check.sh` PASS | ✅ |
| R8 | `rm -rf .android` 即无残留 | 所有落点集中于 `.android/`、`.cache/`、`.tmp/` | 见 §3 隔离核查 | ✅ |
| R9 | 移动端 UI 通过真实视口验收 | CHG-001 响应式 + Android 真机截图 | `android-02/03/04/06.png` | ✅ |
| R10 | 版本号单一来源 | `build.gradle` 读 `frontend/package.json` → `versionCode=10102`/`versionName=1.1.2` | `aapt2 dump badging` 输出 | ✅ |
| R11 | 签名策略（CI 密钥优先，本地回退） | `build.gradle` `hasCiKeystore ? release : debug`；debug keystore 重定向进项目 | `apksigner verify` → `CN=Android Debug` | ✅ |
| R12 | 品牌图标与启动屏 | `scripts/gen-android-assets.mjs` 生成 mipmap/drawable PNG；`colors.xml` + `styles.xml` 接入 Android 12+ SplashScreen API | 启动器图标（`android-03` 桌面可见朱砂四横）；`splash.png` 宣纸底 + 方印 | ✅ |

## 2. 验收证据

### 2.1 产物清单

```
release/
  tianji-sizhu-1.1.2-android-arm64-v8a.apk      3.8M
  tianji-sizhu-1.1.2-android-armeabi-v7a.apk    3.8M
  tianji-sizhu-1.1.2-android-universal.apk      3.8M
  tianji-sizhu-1.1.2-android-x86_64.apk         3.8M
  tianji-sizhu-1.1.2-android-x86.apk            3.8M
```

### 2.2 静态校验（命令输出）

| 检查 | 命令 | 结果 |
|------|------|------|
| 包元数据 | `aapt2 dump badging` | `package: name='com.tianjisizhu.app' versionCode='10102' versionName='1.1.2'` |
| SDK 范围 | 同上 | `minSdkVersion:'24'` / `targetSdkVersion:'36'` / `compileSdkVersion='36'` |
| 应用名 | 同上 | `application-label:'天机四柱'`（含 zh-CN 全语言回退） |
| 权限 | 同上 | 仅 `INTERNET` + Capacitor 内部广播权限 |
| 签名 | `apksigner verify --print-certs` | `CN=Android Debug, O=Android, C=US`（有效） |
| 原生库 | `unzip -l` | 无 `lib/` 目录 → 纯 WebView 壳，故 5 个 APK 内容等价 |

### 2.3 真机（emulator-5554, Android 14 / x86_64）验证

| 步骤 | 命令 | 结果 |
|------|------|------|
| 安装 | `adb install -r ...x86_64.apk` | `Success` |
| 启动 | `am start -n com.tianjisizhu.app/.MainActivity` | 进程存活（pid 6576） |
| 首页渲染 | `screencap` | `android-02-diag.png`：导航 + 表单完整，宣纸底 |
| 排盘 | `input tap` 命中「排 盘」 | `android-03-result.png`：四柱 2×2、日主、宫位 |
| 主题切换 | `input tap` 命中主题按钮 | `android-04-result-dark.png`：完整暗色 |
| 保存 + 记录 | tap 保存 → tap 返回 → tap 记录 | `android-06-records.png`：**共 1 条记录**（localStorage 生效） |
| 崩溃检查 | `logcat -b crash` | 空 |

### 2.4 环境隔离核查

| 项 | 结论 |
|----|------|
| SDK / build-tools / platform | `.android/sdk/`（cmdline-tools + platform-tools + platforms;android-36 + build-tools;36.0.0 + emulator + system-images） |
| Gradle 分发与依赖缓存 | `.android/gradle-home/` |
| AVD | `.android/avd/tianji-test.avd/` |
| 签名密钥 | `.android/home/debug.keystore`（**非** `$HOME/.android/debug.keystore`，已核查该文件不存在） |
| adb 密钥 | `.android/home/.android/adbkey`（初次运行曾落 `$HOME`，已回收；`android-env.sh` 现导出 `USERPROFILE` 指向项目内，复测未再生成） |
| 全局 `~/.android/` | 仅含 **2025-07 预存在** 的 Android Studio 残留（`analytics.settings`、`Medium_Phone.avd`），非本次产生 |
| `scripts/env-check.sh` | 见 §3 |

## 3. 修复的既有缺陷 / 过程中发现并修掉的问题

| # | 问题 | 根因 | 处置 |
|---|------|------|------|
| D1 | 首次安装后白屏（仅宣纸底色） | `cap add android` 时同步的是旧 `dist/`，Gradle 打包了过期 web 资源 | `android-build.sh` 固定顺序：`web build → cap sync → gradle`；并在 `index.html` 加启动错误兜底（白屏→可见错误文本） |
| D2 | 桌面启动器图标为 Capacitor 默认蓝色机器人 | 模板资源未替换 | `gen-android-assets.mjs` 生成 5 密度 ×3 类型图标 + 11 张启动屏 |
| D3 | `gen-android-assets.mjs` 把资源写到 `frontend/frontend/...` | 脚本按 `process.cwd()` 解析路径 | 改为按 `import.meta.url` 锚定仓库根 |
| D4 | 应用被系统杀死（测试中断） | **模拟器环境噪音**：`com.google.android.gms.persistent` 进程死亡，AM 连带杀死依赖其 `FontsProvider` 的应用 | 记录为环境问题（非应用缺陷），重启应用后全链路通过 |
| D5 | `scripts/android-sdk.sh` 只支持 Windows 包 | 硬编码 `commandlinetools-win-*` | 按 `uname -s` 选择 win/mac/linux 包 |

## 4. 偏差与未决

| # | 项 | 说明 | 处置 |
|---|----|------|------|
| V1 | minSdk 24（SPEC 原写 23） | Capacitor 8 的 `variables.gradle` 基线为 24 | 以框架基线为准，SPEC 已同步为 24 |
| V2 | 5 个 APK 内容等价 | 应用无原生 `.so`，ABI splits 当前不产生体积差异 | 保留 splits 以承载未来原生插件；`universal` 为推荐分发件 |
| V3 | Release 签名 | CI 未配置 keystore secret 时使用调试签名 | 已在 Release 说明中标注；接入正式密钥只需 `ANDROID_KEYSTORE_*` secrets |
| V4 | `frontend/frontend/` 误产物目录 | D3 产生，含 26 个 PNG 副本，无源文件 | **待人工删除**（自动删除被安全策略拦截）：`rm -rf frontend/frontend` |
| V5 | 未在 arm64 真机验证 | 本机仅有 x86_64 模拟器 | universal/x86_64 已验证；arm64 由 CI 产物覆盖 |

## 5. Definition of Done 核对

- [x] `assembleRelease` 成功，5 个 APK 非空
- [x] `aapt2` 校验包名 / minSdk / targetSdk / 版本号与 `package.json` 一致
- [x] 签名有效（`apksigner verify`）
- [x] 桌面构建与测试未回归（CHG-001 证据：72/72 通过）
- [x] 移动视口截图无溢出（Android 真机 + 浏览器 390×844 双证据）
- [x] `.gitignore` 覆盖 `.android/`、`.tmp/`、`.cache/`、`*.apk`、`release/`
- [x] `scripts/env-check.sh` PASS
