# 发布手册（桌面 + Android）

> 契约来源：`tasks/CHG-004-desktop-release/SPEC.md`、`tasks/CHG-002-android-apk/SPEC.md`。
> 本文只写「怎么做」和「坏了怎么查」，规则条款见 `AGENTS.md`。

---

## 1. 产物矩阵

| # | 平台 | 架构 | 形态 | 文件名 |
|---|------|------|------|--------|
| 1 | Windows | amd64 | 安装包 | `tianji-sizhu-<ver>-windows-amd64-setup.exe` |
| 2 | Windows | arm64 | 安装包 | `tianji-sizhu-<ver>-windows-arm64-setup.exe` |
| 3 | Windows | amd64 | 免安装 | `tianji-sizhu-<ver>-windows-amd64-portable.zip` |
| 4 | Windows | arm64 | 免安装 | `tianji-sizhu-<ver>-windows-arm64-portable.zip` |
| 5 | macOS | arm64 | 签名 app 包 | `tianji-sizhu-<ver>-macos-arm64-app.zip` |
| 6 | macOS | amd64 | 签名 app 包 | `tianji-sizhu-<ver>-macos-amd64-app.zip` |
| 7 | — | — | 校验清单 | `SHA256SUMS-<ver>.txt` |
| 8 | — | — | 断言清单 | `artifacts-manifest.json` |

另有 Android APK（`arm64-v8a` / `armeabi-v7a` / `x86_64` / `universal`）与 Linux `legacy` 包。
**缺一不发**；缺某架构就如实缺并在 Release Notes 声明，严禁用 x64 包冒充 arm64。

> macOS 不再提供 DMG：`hdiutil` 在 macOS 14 CI runner 上会挂死在内核态（SIGKILL 无效）。
> `.app.zip` 由 `ditto -c -k --keepParent` 生成，保留 ad-hoc 签名与符号链接，解压后拖入 `/Applications` 即可。

---

## 2. 版本发布流程

```bash
# 1) 改版本（唯一人工编辑点）
echo "1.2.0" > VERSION
bash scripts/release/version.sh sync --docs

# 2) 本地全量验证（串行）
bash scripts/release/version.sh check
source scripts/go-env.sh
go test ./... && go vet ./...
(cd frontend && pnpm test && pnpm exec tsc --noEmit)

# 3) 出产物（本机宿主能出的那部分）
bash scripts/release/release.sh --auto --skip-smoke

# 4) 提交 + 打 tag + push（tag 触发 CI）
git add VERSION frontend/package.json wails.json docs/SPEC.md
git commit -m "chore(release): v1.2.0"
git tag -a "v$(cat VERSION)" -m "Release v$(cat VERSION)"
git push origin main --tags
```

CI 契约：

- `push tags v*` → 全矩阵构建 → `verify`（严格 8 产物）→ `publish`（无 `if: always()`）
- `workflow_dispatch` + `publish=false` → 只产 artifact，不发 Release（用于 dry-run）
- tag 必须等于 `v$(cat VERSION)`，否则 `preflight` 直接失败

---

## 3. 本地构建命令

```bash
source scripts/go-env.sh          # Go 缓存 + 项目内 NSIS 进 PATH

# Windows 单架构（Windows 原生或 Linux 交叉，CGO_ENABLED=0）
bash scripts/release/build-windows.sh --arch amd64
bash scripts/release/build-windows.sh --arch arm64

# macOS 单架构（只能 macOS 宿主）
bash scripts/release/build-macos.sh --arch arm64
bash scripts/release/build-macos.sh --arch amd64

# 免安装包
bash scripts/release/package-portable.sh --os windows --arch amd64
bash scripts/release/package-portable.sh --os macos --arch arm64

# 校验 + 清单（本机只有部分平台时加 --allow-partial）
bash scripts/release/verify-artifacts.sh --allow-partial
bash scripts/release/checksums.sh

# 生命周期冒烟
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/release/smoke-windows.ps1 \
  -Installer ".tmp/release/1.2.0/tianji-sizhu-1.2.0-windows-amd64-setup.exe" \
  -ExpectVersion 1.2.0 -ExpectArch amd64
bash scripts/release/smoke-macos.sh --dmg .tmp/release/1.2.0/xxx.dmg --expect-arch arm64
```

产物落点：`.tmp/release/<version>/`（git 忽略）。

---

## 4. 前置工具

| 工具 | 落点 | 引导命令 |
|------|------|---------|
| Go 缓存 | `.cache/go-*` | `source scripts/go-env.sh` |
| NSIS | `.toolchain/nsis` | `bash scripts/toolchain-nsis.sh` |
| Android SDK | `.android/sdk` | `bash scripts/android-sdk.sh 36 36.0.0` |
| Gradle 缓存 | `.android/gradle-home` | `source scripts/android-env.sh` |
| 截图工具 | `frontend/node_modules/puppeteer-core` | 随 `pnpm install` |

环境自检：

```bash
source scripts/go-env.sh && bash scripts/env-check.sh   # 必须 PASS
```

---

## 5. 故障排查

### 5.1 安装包属性里版本是空 / 显示 1.0.0

**根因**：`build/windows/info.json` 的语言 key 是 `0000`（neutral），Windows 无法按语言解析版本资源，`FileVersionInfo` 全字段返回空。

**核对**：

```powershell
[System.Diagnostics.FileVersionInfo]::GetVersionInfo("build\bin\tianji-sizhu.exe").FileVersion
```

**修复**：必须是具体语言 + 4 段版本：

```jsonc
"fixed": { "file_version": "{{.Info.ProductVersion}}.0" },
"info":  { "0409": { ... } }
```

改完重新构建并用上面的命令确认非空。

### 5.2 构建成功但没有安装包

**根因**：`makensis` 不在 PATH，Wails 打印 warn 后返回 nil。

**核对**：`command -v makensis`、`ls build/bin/*-installer.exe`

**修复**：`bash scripts/toolchain-nsis.sh`（或 Linux `apt-get install nsis`）。`build-windows.sh` 已把它设为前置条件（exit 2）。

### 5.3 装到 Program Files 后无法保存记录

**根因**：老版本把 SQLite 固定放 exe 同级，per-machine 安装目录对普通用户不可写。

**现状**：已改为三级解析（`TJS_DATA_DIR` → `<exe>/data`（可写探测）→ 平台用户目录），失败会写 `data/startup.log` 并在界面顶部显示红色提示条。

**核对**：看 `%LOCALAPPDATA%\TianJi-SiZhu\data\startup.log`；或设置 `TJS_DATA_DIR` 强制重定向。

### 5.4 macOS 提示「无法验证开发者」

这是**预期行为**（ad-hoc 签名，无 Apple Developer ID）。

- 正确做法：右键 App →「打开」→「打开」
- 或：`xattr -dr com.apple.quarantine /Applications/tianji-sizhu.app`
- **禁止**建议用户全局关闭 Gatekeeper

### 5.5 `env-check.sh` 报 Go 缓存越界

未加载 `scripts/go-env.sh`。`go env GOCACHE` 默认指向 `%LOCALAPPDATA%\go-build`。

**修复**：`source scripts/go-env.sh` 后重跑；CI 里每个 Go 相关 step 都要先 source。

### 5.6 macOS amd64 在 arm64 runner 上失败

先看 `lipo -archs build/bin/tianji-sizhu.app/Contents/MacOS/tianji-sizhu`。

若交叉失败，降级路径：先 `wails build -platform darwin/universal`，再 `lipo -thin x86_64` / `-thin arm64` 拆两份，**拆分后必须重新 ad-hoc 签名**。

---

## 6. 清洁与回滚

```bash
bash scripts/release/clean.sh --dry-run   # 先看清单
bash scripts/release/clean.sh             # 清构建产物
bash scripts/release/clean.sh --all       # 连依赖缓存一起清
```

白名单外的东西一律不删（`.git`、`data`、`tasks`、`docs`、`frontend/src`）。

回滚发布：删除对应 Release 与 tag，重新打 tag 触发流水线；产物本身不覆盖旧版本。

---

## 7. 用户侧说明（Release Notes 固定段落）

- **Windows**：未做代码签名，SmartScreen 可能拦截 →「更多信息」→「仍要运行」。
  免安装版需系统已有 WebView2 Runtime（Win10 建议用安装包）。
- **macOS**：ad-hoc 签名，首次打开右键 →「打开」，或 `xattr -dr com.apple.quarantine`。
  **请勿全局关闭 Gatekeeper。**
- **Android**：调试签名，侧载需允许「未知来源」。
- **完整性**：`sha256sum -c SHA256SUMS-<ver>.txt`；架构与版本断言见 `artifacts-manifest.json`。
