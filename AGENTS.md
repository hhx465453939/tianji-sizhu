# TianJi-SiZhu 项目指南

> 本文件与 `CLAUDE.md` 内容逐字一致（同一份治理约定，两个入口）。
> 修改规则：只改本文件，然后执行 `cp AGENTS.md CLAUDE.md` 保持对齐，禁止单边修改。

## 项目简介

天机四柱 — 开源八字排盘客户端（Wails 桌面端 + Capacitor 安卓端 + React + Go）

## 技术栈

- **桌面框架**: Wails v2 (Go + WebView2)
- **安卓框架**: Capacitor 6 (WebView 壳 + 前端资源打包)
- **前端**: React 18 + TypeScript + Vite + TailwindCSS
- **排盘算法**: mystilight-8char (前端 JS 直接调用)
- **可视化**: ECharts
- **后端**: Go (SQLite + 系统交互)，仅桌面端
- **目标平台**: Windows x64/arm64 · macOS x64/arm64（桌面四架构，见「桌面端发布与构建治理」）· Android (arm64-v8a, armeabi-v7a, x86_64, universal)

## 开发节奏

- Phase 1 完成 → commit + push
- Phase 2 完成 → commit + push
- Phase 3 完成 → commit + push
- Phase 4 完成 → commit + push
- 全量测试通过 (0 bug) → commit + push

## Commit 规范

使用 Conventional Commits:
- `feat:` 新功能
- `fix:` 修复
- `docs:` 文档
- `refactor:` 重构
- `test:` 测试
- `chore:` 构建/工具
- `style:` 纯视觉/样式调整

## 虚拟化与隔离部署治理（强制）

**核心原则：无论在哪台主机、哪种操作系统、哪种开发环境（含 Android / 模拟器 / 容器 / Python / Node / Rust 工具链），所有工具链、SDK、依赖缓存、虚拟环境、模拟器数据一律虚拟部署在项目根目录内部，禁止外溢到任何主机的全局环境。**

### 允许的落点（全部在项目根内）

| 用途 | 强制路径 | 对应环境变量 |
|------|---------|-------------|
| Android SDK / NDK / build-tools | `<root>/.android/sdk` | `ANDROID_HOME`、`ANDROID_SDK_ROOT` |
| Gradle 依赖与缓存 | `<root>/.android/gradle-home` | `GRADLE_USER_HOME` |
| AVD 模拟器镜像与数据 | `<root>/.android/avd` | `ANDROID_AVD_HOME`、`ANDROID_EMULATOR_HOME` |
| Android 用户配置（adb key 等） | `<root>/.android/home` | `ANDROID_USER_HOME`、`ANDROID_SDK_HOME`、`USERPROFILE` |
| 项目专用 JDK（**仅在需要特定版本时**） | `<root>/.toolchain/jdk` | `JAVA_HOME` |
| Python 虚拟环境 | `<root>/.venv` | `VIRTUAL_ENV`、`PYTHONUSERBASE` |
| Node 依赖 | `<root>/frontend/node_modules` | pnpm 默认，禁用全局安装 |
| pnpm / npm 缓存 | `<root>/.cache/pnpm` | `PNPM_HOME`、`npm_config_cache` |
| Go 构建缓存 | `<root>/.cache/go-build` | `GOCACHE` |
| Go 模块缓存 | `<root>/.cache/go-mod` | `GOMODCACHE` |
| Go 工具二进制（wails 等） | `<root>/.toolchain/bin` | `GOBIN` |
| NSIS（makensis） | `<root>/.toolchain/nsis` | 加入 `PATH` |
| 通用 XDG 缓存 | `<root>/.cache` | `XDG_CACHE_HOME`、`XDG_CONFIG_HOME`、`XDG_DATA_HOME` |
| 临时构建物 | `<root>/.tmp` | `TMPDIR`、`TEMP`、`TMP` |
| 本地虚拟运行环境（WSL/容器卷/虚拟机盘） | `<root>/.virtual` | 由脚本显式挂载 |

### 允许复用宿主机的情况（机器级运行时）

**通用运行时**（JDK、Python 解释器、系统 C 编译器）属于“一台主机装一次”的机器级软件，
**允许直接复用已安装版本**，但不得由本项目写入或修改：

- ✅ `JAVA_HOME` 指向宿主机已装 JDK（如 `C:\Program Files\Eclipse Adoptium\jdk-21...`）
- ✅ 用系统 `python3` 在项目内创建 venv
- ❌ 不得用本项目脚本去安装/升级这些运行时（那属于主机维护，不属项目）
- ❌ 不得让它们把**项目专属**产物写到项目外（如 `~/.m2`、`~/.gradle`、AVD、签名密钥）

> Go 缓存（`GOCACHE` / `GOMODCACHE` / `GOBIN`）**不属于**可复用项：
> 必须 `source scripts/go-env.sh` 重定向进 `.cache/go-build`、`.cache/go-mod`、`.toolchain/bin`；
> 未 source 时 `env-check.sh` 会按 `go env` 实际值判 `OUTSIDE PROJECT` 并失败。

> 判定口径：`scripts/env-check.sh` 对项目专属 SDK/缓存判 `OUTSIDE PROJECT` = 失败；
> 对机器级运行时打印 `host runtime (allowed)`，不计入失败。

### 禁止事项（硬红线）

1. ❌ 禁止把 SDK 装到 `~/Android/Sdk`、`/opt/android-sdk`、`/usr/local/...` 等主机全局路径
2. ❌ 禁止在 `~/.gradle`、`~/.android`、`~/.cache`、`~/.npm`、`~/.m2`、`~/go/pkg/mod`、`%LOCALAPPDATA%\go-build` 写入本项目依赖
3. ❌ 禁止 `npm i -g` / `pnpm add -g` / `pip install`（不带 `--target` 或 venv）安装本项目工具链
4. ❌ 禁止修改主机级 `PATH`、注册表、`/etc/profile.d`、系统服务来服务本项目
5. ❌ 禁止把上述目录提交到 git（必须写入 `.gitignore`）

### 执行要求

- 所有构建脚本（`scripts/*.sh`、`scripts/*.ps1`、CI）在开头**显式导出**上表环境变量，不依赖主机既有配置
- 新增任何工具链前，先回答：它的安装目录与缓存目录是否已被重定向进项目根？否则不得安装
- 卸载即删除：`rm -rf .android .venv .cache .tmp .virtual .toolchain` 后，主机应无任何残留
- 迁移即复制：拷走项目目录到另一台机器，脚本重新引导即可复现，不依赖原主机状态
- Go 缓存三条（`GOCACHE` / `GOMODCACHE` / `GOBIN`）自 CHG-004 M2 起强制重定向并由 `scripts/env-check.sh` 断言；在那之前构建脚本也必须显式导出，禁止依赖主机 `go env` 默认值

### 自检命令

```bash
bash scripts/env-check.sh      # 打印所有相关变量并判定是否越界（含 Go 缓存家族）
```

## 硬件与环境基线（以实测为准）

**不要照抄数字，先实测。** 构建/测试前运行：

```bash
powershell -NoProfile -Command 'Get-CimInstance Win32_OperatingSystem | ForEach-Object { "FreeMB=" + [int]($_.FreePhysicalMemory/1KB) }'
```

最近一次实测：**Xeon E5-2696 v3（18 核 36 线程）/ 128GB 内存 / E 盘 813GB 可用 / 虚拟化已启用**。
该配置可并行构建、可运行 Android 模拟器。

### 低配机降级规则（≤ 8GB 内存或双核，或检测不到 Hypervisor 时）

1. **测试串行执行**，不并行跑多个 vitest
2. **Gradle 必须 `--no-daemon --max-workers=2`**（`scripts/android-env.sh` 已默认设置）
3. **不启动模拟器**，降级为 `aapt2` 静态校验 + 浏览器移动视口渲染截图
4. **Go 编译不加 `-race`**（内存翻倍）
5. **不要同时启动多个 dev server**
6. **pnpm install 加 `--prefer-offline`**

## 设计系统与主题约定

- 主题机制：CSS 变量 + `data-theme="light|dark"`，Tailwind 颜色 token 直连变量
- **明亮为默认**，暗色为可选项；两套主题必须同时通过视觉验收
- 新写样式一律使用语义 token（`--surface-*` / `--text-*` / `--border-*` / `--accent-*`），禁止硬编码十六进制色值
- 五行配色、神煞配色、关系配色必须成套双主题定义，不得只改一处
- 响应式断点：`sm 640` / `md 768` / `lg 1024`，所有多列布局必须给出移动端降级（列数减半或横滚）
- 视觉改动必须附带截图证据（桌面 1280×800 + 移动 390×844 两种视口）

## 注意事项

1. 不要自行发起 git 操作，除非用户明确要求
2. 前端代码注释用英文（与社区一致）
3. Go 代码注释用英文
4. 优先使用 pnpm 管理前端依赖
5. SQLite 使用 modernc.org/sqlite（纯 Go，无 CGO 依赖）
6. 每次修改前先读后写，理解现有代码再改
7. 构建产物不提交到 git（**例外**：`build/` 下的打包资源必须入库，见「桌面端发布与构建治理」）
8. 前端必须通过 `lib/platform/` 适配层访问后端能力，禁止在页面里直接 `import('../../wailsjs/...')`（Android 无 Go 运行时）

## 关键路径

- 规格文档: `docs/SPEC.md`
- 变更契约: `tasks/<change-id>/{CHANGE.md,SPEC.md,TRACEABILITY.md}`
- 版本单一源: `VERSION`（唯一人工编辑点）
- 发布脚本: `scripts/release/`
- 打包资源（入库）: `build/`，其中 `build/bin/` 不入库
- 桌面发布立项: `tasks/CHG-004-desktop-release/`
- 前端入口: `frontend/src/main.tsx`
- 主题 token: `frontend/src/style.css`
- 平台适配层: `frontend/src/lib/platform/`
- Go 入口: `main.go`
- Wails 配置: `wails.json`
- 数据库逻辑: `internal/database/`
- Android 工程: `frontend/android/`（Capacitor 生成，源码入库）
- Android 虚拟环境: `.android/`（SDK / Gradle / AVD / keystore，不入库）

## 构建命令

```bash
# 开发模式
wails dev

# 生产构建
wails build -platform windows/amd64

# Web 构建（Android / 浏览器）
cd frontend && pnpm build

# 安卓 APK（虚拟环境自动引导）
./scripts/android-build.sh            # 全 ABI（arm64-v8a / armeabi-v7a / x86_64 / universal）
./scripts/android-build.sh arm64-v8a  # 单 ABI

# 桌面端发布（CHG-004 落地后，命令契约见 tasks/CHG-004-desktop-release/SPEC.md §3.1）
bash scripts/release/version.sh check
bash scripts/release/release.sh --dry-run
bash scripts/release/clean.sh --dry-run
```

## 桌面端发布与构建治理（强制）

> 变更契约：`tasks/CHG-004-desktop-release/`（CHANGE / SPEC / TRACEABILITY）。
> 本节是长期条款；SPEC 是本次实现的细节。冲突时以 SPEC 的实现细则为准，但**不得放宽本节红线**。

### 1. 发布矩阵（唯一口径）

| # | 平台 | 架构 | 形态 | 文件名 |
|---|------|------|------|--------|
| 1 | Windows | amd64 | 安装包（NSIS） | `tianji-sizhu-<ver>-windows-amd64-setup.exe` |
| 2 | Windows | arm64 | 安装包（NSIS） | `tianji-sizhu-<ver>-windows-arm64-setup.exe` |
| 3 | Windows | amd64 | 免安装 ZIP | `tianji-sizhu-<ver>-windows-amd64-portable.zip` |
| 4 | Windows | arm64 | 免安装 ZIP | `tianji-sizhu-<ver>-windows-arm64-portable.zip` |
| 5 | macOS | amd64 | 签名 app 包 | `tianji-sizhu-<ver>-macos-amd64-app.zip` |
| 6 | macOS | arm64 | 签名 app 包 | `tianji-sizhu-<ver>-macos-arm64-app.zip` |
| 7 | — | — | 校验清单 | `SHA256SUMS-<ver>.txt` |

- **6 个产物 + 1 个清单**，缺一不发
- macOS 交付 `.app.zip`（`ditto` 保留 ad-hoc 签名与符号链接）；**不使用 DMG**：
  `hdiutil` 在 macOS 14 CI runner 上会挂死在内核态（SIGKILL 无效，实测卡死 25 分钟以上）
- 缺某个架构就**如实缺**并在 Release Notes 声明，严禁用 x64 包冒充 arm64
- 无 `SHA256SUMS` 不得发布

### 2. 版本单一源

- 根 `VERSION`（无 `v` 前缀）是**唯一人工编辑点**
- 下发与校验只走 `scripts/release/version.sh sync|check`；禁止手改 `frontend/package.json`、`wails.json`、`docs/SPEC.md` 的版本号
- tag 必须等于 `v$(cat VERSION)`
- 五处一致断言：产物文件名 / NSIS 注册表 `DisplayVersion` / `CFBundleShortVersionString` / `wails.json.info.productVersion` / git tag
- `version.sh check` 不绿 → CI 直接 fail，不进入构建

### 3. 构建宿主矩阵（不可混用）

| 产物 | 宿主 | CGO | 说明 |
|------|------|-----|------|
| Windows amd64 | Windows x64 | `0` | Wails Windows 后端无 CGO |
| Windows arm64 | Windows x64（交叉） | `0` | NSIS 模板已支持 arm64 分流 |
| macOS arm64 | macOS arm64 | `1`（Wails 强制） | native |
| macOS amd64 | macOS arm64（交叉） | `1`（Wails 强制） | 与 `darwin/universal` 内部路径一致 |

- 禁止在 Linux 容器构建 macOS 产物（无 macOS SDK / WebKit；CNB 只能出 Windows）
- 桌面构建与 Android 构建**不得并发**（本机 2C4T / 8GB）
- 构建脚本开头显式导出 `GOCACHE` / `GOMODCACHE` / `GOBIN` / `TMPDIR`，不读取主机默认值

### 4. 打包硬规则

1. **NSIS 静默降级是陷阱**：`makensis` 缺失时 Wails 打印 warn 后返回成功（不产安装包）。构建脚本必须在 `wails build` 之后断言 `*-<arch>-installer.exe` 存在，缺失 `exit 3`。
2. **macOS 签名**：必须保留 Wails 的 ad-hoc 签名，并额外断言 `codesign --verify --deep --strict` 通过；`spctl` 失败属已知情形，需写入证据而非当作构建失败。
3. **macOS 交付 `.app.zip`**：`ditto -c -k --keepParent`，保留 ad-hoc 签名与符号链接；
   `hdiutil`/DMG **禁用**（macOS 14 CI 上挂死在内核态）。安装引导写在 Release Notes。
4. **免安装版**：Windows 用 zip；macOS **必须** `ditto -c -k --keepParent --sequesterRsrc`，禁止 `zip` CLI（会破坏 bundle 签名与符号链接）。
5. **打包资源入库**：`build/appicon.png`、`build/windows/info.json`、`build/windows/installer/project.nsi`、`build/darwin/Info.plist`。`build/bin/`、`build/windows/installer/wails_tools.nsh`、`build/windows/installer/tmp/` 不入库。`.gitignore` 只忽略 `/build/bin/`，不再整体忽略 `build/`。
6. **视觉是变量**：图标图形、配色、显示名文案可随品牌演进替换，此类变更**不触发**打包/签名/生命周期用例重跑；只有尺寸、格式、路径、签名对象变化才需重跑 L2–L4。
7. **Info.plist 定制**：`CFBundleIdentifier` 必须是 `com.tianjisizhu.desktop`，禁止保留 Wails 默认的 `com.wails.*`；`CFBundleShortVersionString` 保持 `{{.Info.ProductVersion}}` 占位符。
8. **安装后数据目录**：应用自身数据目录解析必须支持「可写探测 → 平台用户目录」降级（见 `SPEC.md` ADR-003）；禁止把 SQLite 固定放在 exe 同级且不做可写判断。

### 5. 测试分层（缺层不得发布）

| 层 | 内容 | 命令/工具 | 通过判据 |
|----|------|-----------|----------|
| L1 单元/静态 | Go 单测、vitest、tsc、go vet | `go test ./...`；`pnpm test`；`pnpm exec tsc --noEmit`；`go vet ./...` | 0 fail / 0 error |
| L2 产物结构 | 架构位、版本串、文件清单、体积、SHA256 | `scripts/release/verify-artifacts.sh` | manifest 全绿 |
| L3 Windows 生命周期 | 静默安装 → 文件/注册表断言 → 启动存活 → 静默卸载 → 残留检查 | `scripts/release/smoke-windows.ps1` | 无残留 |
| L4 macOS 生命周期 | 挂载 → `codesign --verify` → 架构 → 启动存活 → 卸载/清空 | `scripts/release/smoke-macos.sh` | 无残留 |
| L5 清洁室 | `git archive` 导出 → 全量构建 → 结构等价比对 | `scripts/release/release.sh --cleanroom` | 等价 |

- L3 无法覆盖 Windows arm64 安装包（不能在 x64 宿主执行 arm64 二进制）→ 静态校验 + `not-executed` 记录，不得伪造「已冒烟」。
- L4 若 runner 无法启动 GUI 应用，降级为静态校验并在 TRACEABILITY 写明原因。
- 测试必须串行；桌面测试不得与 Android 模拟器/构建同时跑。

### 6. 测试环境清洁（硬红线）

1. Windows 安装测试必须装到临时目录：`installer.exe /S /D=<tmp>`（`/D` 最后且不加引号），禁止污染 `%ProgramFiles%`。
2. 安装/卸载前后对 `HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\TianJi-SiZhu` 取存在性快照，卸载后必须消失（NSIS 自删有延迟，轮询 ≤30s）。
3. macOS 挂载点固定在 `.tmp/mnt-<arch>`，结束必须 `hdiutil detach -force` 并断言无残留挂载。
4. 测试收尾断言无残留进程（Windows `Get-Process tianji-sizhu`；macOS `pgrep -f tianji-sizhu`）。
5. 用户数据目录（`%LOCALAPPDATA%\TianJi-SiZhu`、`~/Library/Application Support/TianJi-Sizhu`）卸载时**保留**（用户数据不删），但 CI 结束必须清理并记录在证据里。
6. `scripts/release/clean.sh` 白名单：可删 `build/bin`、`frontend/dist`、`.tmp/release`、`.tmp/cleanroom`、`.tmp/mnt-*`、`*.syso`；`--all` 追加 `frontend/node_modules`、`.cache/pnpm`、`.cache/go-build`、`.cache/go-mod`；**永不删** `.git/`、`data/`、`tasks/`、`docs/`、`frontend/src/`。
7. `clean.sh --dry-run` 必须先打印清单再执行；无 `--dry-run` 时遇到未知路径应拒绝而非猜测。
8. 测试结束 `git status --porcelain` 必须只含预期改动；出现构建产物即视为清洁失败。

### 7. CI/CD 契约

- 触发：`push tags v*` + `workflow_dispatch`（`publish` 输入默认 `false`，只产 artifact）。
- Job 图：`preflight` → `win-amd64` / `win-arm64` / `mac-amd64` / `mac-arm64` → `checksums` → `publish`。
- **禁止** `publish` 使用 `if: always()`：任一构建 job 失败即中止，不得发残缺 Release（现存缺陷，CHG-004 M5 修）。
- `preflight` 必查：版本三处一致、`pnpm-lock.yaml` 存在、`wails.json` 的 `frontend:install` 使用 pnpm 且 `--frozen-lockfile`。
- 依赖安装统一 `pnpm install --frozen-lockfile`；`npm install` 不得参与产物构建（无 lockfile，不可复现）。
- 缓存只放 pnpm store 与 Go module 下载缓存（key 含 lockfile hash）；禁止缓存 `build/bin`、`frontend/dist`。
- 权限最小化：`publish` 才拿 `contents: write`；其余 job 只读。
- 并发：同一 ref 只跑一条发布流水线，新 run 取消旧 run。
- CNB：只负责 Windows 4 个产物（Linux 容器无法产出合法 macOS 包）；Release 说明中给出 GitHub Release 链接，禁止伪造 macOS 产物。

### 8. 发布验收与禁止事项

**DoD（缺一不发）**：6 产物 + `SHA256SUMS` 全部可下载且 `sha256sum -c` 通过；架构断言（PE `0x8664`/`0xAA64`、Mach-O `x86_64`/`arm64` 单一）全绿；五处版本一致；L3/L4 通过（或按规则降级并记录）；`scripts/env-check.sh` PASS；`diff AGENTS.md CLAUDE.md` 为空。

**禁止**：
- ❌ 用 universal 包改名为 amd64/arm64 包
- ❌ 无 `SHA256SUMS` 发布
- ❌ Release Notes 引导用户全局关闭 Gatekeeper / SmartScreen
- ❌ 把签名密钥、证书、Token 写入仓库或产物
- ❌ 在 CI 里用 `if: always()` 兜底发布
- ❌ 把 `build/bin`、`dist`、`node_modules` 提交进 git

## 变更管理

- 架构或跨层改动必须先产出 `tasks/<change-id>/` 三件套（CHANGE / SPEC / TRACEABILITY），状态为 `draft` 时不进入实现
- SPEC 需覆盖：现状、方案对比、接口与数据、迁移、里程碑、验收、回滚
- 验收证据（测试输出、截图、APK 校验日志）记录在 TRACEABILITY

## 未来发布新版本的流程

> CHG-004 落地后（M2 起）版本号只走 `VERSION` + `version.sh`，不再手改任何下游文件。
> 在那之前，仍按旧方式手改，但**必须**同时对齐 `package.json` / `wails.json.info.productVersion` / tag，否则安装包元数据会错。

### 1. 改代码、提交
```bash
git add . && git commit -m "feat: xxx"
```

### 2. 改版本号（单一源）
```bash
echo "1.2.0" > VERSION
bash scripts/release/version.sh sync     # 下发到 package.json / wails.json / docs
git add VERSION frontend/package.json wails.json docs/SPEC.md
git commit -m "chore: bump version to 1.2.0"
```

### 3. 本地全量验证（串行）
```bash
bash scripts/release/version.sh check
go test ./... && (cd frontend && pnpm test && pnpm exec tsc --noEmit)
bash scripts/release/release.sh --dry-run   # 出 8 产物 + manifest，不发 Release
```

### 4. 打 tag + push
```bash
git tag -a "v$(cat VERSION)" -m "Release v$(cat VERSION)"
git push origin main --tags
```

### → GitHub Actions 自动构建 + 发布 Releases

产出固定为 **8 个桌面产物 + SHA256SUMS**（Windows x64/arm64 安装包 + macOS x64/arm64 DMG + 四个免安装 ZIP），
外加 Android 全架构 APK（CHG-002）。Linux 桌面端已从流水线移除（legacy，且反复在 runner 上挂死）。
发布前必须确认：`publish` 未使用 `if: always()`，且任一架构失败时 Release **未创建**。
