# CHG-004 · 桌面端四架构发布工程（安装包 + 免安装版）

**变更编号**: CHG-004（CHG-003 依 CHG-002 Q3 预留给 iOS，不复用）
**提出日期**: 2026-10-22
**类型**: 发布工程 + 构建体系 + CI/CD + 测试环境治理（无业务逻辑变更）
**影响面**: `.github/workflows/release.yml`、`.cnb.yml`、`scripts/release/**`（新增）、`VERSION`（新增）、`wails.json`、`.gitignore`、`build/`（部分入库）、`app.go`（数据目录解析）、`AGENTS.md` + `CLAUDE.md`、`docs/SPEC.md`
**状态**: `implemented` — M1–M7 已完成（2026-10-23）；M8 首次实发待执行

---

## 1. 动机

桌面端是当前唯一"完整能力"载体：Go 后端（SQLite、原生对话框、剪贴板）只有桌面端有，Android 端（CHG-002）只能提供降级能力。但桌面端的分发工程目前是**半成品**，存在四个会直接伤到真实用户的问题：

1. **架构覆盖不完整**：只出 `windows/amd64` 与 `darwin/universal`。Apple Silicon 用户拿到的是通用包（体积翻倍），Intel Mac 用户拿到的是通用包，Windows on ARM 用户**根本没有原生包**（只能跑 x64 模拟，性能与稳定性都打折）。
2. **无免安装版**：只有安装器。用户的现实需求是「解压即用、U 盘带走、不写注册表、不落 Program Files」——尤其在企业/受控环境里，安装器是阻力不是助力。
3. **版本源头已漂移，安装包元数据是错的**：`frontend/package.json` 是 `1.1.2`、`docs/SPEC.md` 写 `v1.1.2`、最新 tag 是 `v1.1.4`；而 `wails.json` **没有 `info` 段** → Wails 回落默认值，安装器写进注册表的 `DisplayVersion` 与 macOS `CFBundleShortVersionString` 都会是 `1.0.0`。已核验：`internal/project/project.go:196` 默认 `"1.0.0"`，`pkg/buildassets/build/windows/info.json` 与 `build/darwin/Info.plist` 全部消费 `{{.Info.ProductVersion}}`。
4. **安装后数据目录不可写（阻断级）**：`app.go getDataDir()` 把 SQLite 放在 `os.Executable()` 同级 `data/`。安装版落到 `$PROGRAMFILES64\...`（per-machine、管理员写权限），普通用户启动后 `database.Open` 失败，而 `startup` 只把错误打到 stderr、UI 无提示 → **安装版"能装不能用"**；macOS 更糟：写入 `.app/Contents/MacOS/data` 会破坏 bundle 签名。

补充：本项目 CLAUDE.md/AGENTS.md 规定了"一切工具链虚拟在项目内"，但 **Go 的模块缓存实际在 `C:\Users\<user>\go\pkg\mod`**（已实测 `GOPATH` 越界），`GOCACHE`/`GOMODCACHE`/`GOBIN` 未在治理表内 → 「删掉项目目录，主机应零残留」这条自检当前对 Go 不成立。发布工程是最适合一并收口的地方。

## 2. 硬约束（决定方案的事实，均已在本机核验）

| # | 事实 | 出处 | 对方案的影响 |
|---|------|------|-------------|
| F1 | Wails v2.12.0 支持 `windows/arm64`：`packager.go` 有 `winres.ArchARM64`，`wails_tools.nsh` 支持 `-DARG_WAILS_ARM64_BINARY`，NSIS 模板按 `ARCH` 分流出 `*-arm64-installer.exe` | `wails/v2@v2.12.0/pkg/commands/build/{packager.go,nsis_installer.go}`、`pkg/buildassets/build/windows/installer/{project.nsi,wails_tools.nsh}` | Windows arm64 安装包在 amd64 宿主机即可交叉产出，不需要 arm64 runner |
| F2 | Wails 的 Windows 后端**无 CGO**（`internal/frontend/desktop/windows/**` 无 `import "C"`；cgo 只出现在 darwin 与 linux） | 全仓 `grep 'import "C"'` | `CGO_ENABLED=0 GOARCH=arm64` 交叉编译成立；反过来说，`.cnb.yml` 里 Windows 用 mingw + `CGO_ENABLED=1` 是历史包袱，会在交叉时变成风险 |
| F3 | Wails 的 darwin 构建**强制** `CGO_ENABLED=1`，并注入 `-mmacosx-version-min=10.13`；`darwin/universal` 内部就是分别编译 amd64/arm64 再 `lipo` | `pkg/commands/build/base.go:305-370`、`build.go:278-320` | 说明「arm64 宿主机上编 amd64」是上游已在用的路径，可复用；但 macOS 包**只能在 macOS 宿主构建**（Linux 容器无 WebKit/SDK），CNB 出不了 macOS 产物 |
| F4 | `build/` 被 `.gitignore` 整体忽略，仓库内**不存在 `build/`** | `.gitignore` `/build/`；`ls build/` → 不存在 | NSIS 脚本、`Info.plist`、图标、`info.json` 全部是"构建时自动生成、不可审计、不可复现"的。`CFBundleIdentifier` 因此恒为 `com.wails.tianji-sizhu` |
| F5 | Wails 只在文件**缺失**时才写模板，项目内有同名文件则直接使用 | `pkg/buildassets/buildassets.go:48-70` | 把定制后的 `project.nsi`/`Info.plist`/`info.json` 入库即可持久化定制，且不会每次构建被覆盖 |
| F6 | 现有 `release.yml` 的汇总 job 是 `if: always() && !cancelled()`，任一平台构建失败仍会发布残缺 Release | `.github/workflows/release.yml` L? `publish-release` | 必须改为"全绿才发布"，否则架构缺口会被静默发出去 |
| F7 | macOS arm64 二进制**必须**有有效签名（ad-hoc 即可），否则内核拒绝执行；Wails 已自动 `codesign --force --deep --sign -` | `build.go:361-368` | 无证书也必须保留 ad-hoc 签名，并在 CI 加 `codesign --verify` 断言 |
| F8 | 本项目无代码签名证书、无 Apple Developer ID、无公证账号 | 仓库内无密钥/环境变量契约 | 产物必然 `unsigned`/`adhoc` → 必须在 Release Notes 明示 SmartScreen/Gatekeeper 行为，且只给"单应用放行"指引 |

## 3. 目标

**交付口径（8 个构建产物 + 1 个校验清单，版本号统一取自 `VERSION`）**

| # | 平台 | 架构 | 形态 | 文件名 |
|---|------|------|------|--------|
| 1 | Windows | amd64 | 安装包（NSIS） | `tianji-sizhu-<ver>-windows-amd64-setup.exe` |
| 2 | Windows | arm64 | 安装包（NSIS） | `tianji-sizhu-<ver>-windows-arm64-setup.exe` |
| 3 | macOS | amd64 | 安装包（DMG） | `tianji-sizhu-<ver>-macos-amd64.dmg` |
| 4 | macOS | arm64 | 安装包（DMG） | `tianji-sizhu-<ver>-macos-arm64.dmg` |
| 5 | Windows | amd64 | 免安装 ZIP | `tianji-sizhu-<ver>-windows-amd64-portable.zip` |
| 6 | Windows | arm64 | 免安装 ZIP | `tianji-sizhu-<ver>-windows-arm64-portable.zip` |
| 7 | macOS | amd64 | 免安装 ZIP | `tianji-sizhu-<ver>-macos-amd64-portable.zip` |
| 8 | macOS | arm64 | 免安装 ZIP | `tianji-sizhu-<ver>-macos-arm64-portable.zip` |
| 9 | — | — | 校验清单 | `SHA256SUMS-<ver>.txt` |

**工程目标**

- G1 **可复现**：任意一台干净机器 `git clone` → 一条命令 → 同样 8 个产物（同架构、同版本、同文件清单），不依赖任何主机全局状态。
- G2 **可验证**：每个产物都有机器可判定的验收断言（架构位、版本串、文件清单、体积区间、安装/卸载残留基线），不是"看起来没报错"。
- G3 **可清洁**：本地测试全程隔离（临时安装目录、临时挂载点、临时 HOME），测试结束断言"无残留进程 / 无残留目录 / 注册表回基线"；`scripts/release/clean.sh` 之后项目目录可重建。
- G4 **架构与版本真实**：安装包注册表 `DisplayVersion`、PE `FileVersion`、`CFBundleShortVersionString`、CI 产物名、git tag **五处一致**。
- G5 **失败即阻断**：任一平台/架构失败 → 不发 Release（修 F6），并以机器可读的 `artifacts-manifest.json` 说明缺哪个。
- G6 **治理落纸**：打包/测试/CI/清洁规则写入本 CHG + `AGENTS.md` + `CLAUDE.md`，任何人（或 AI）接手都能照着做，不靠口口相传。

## 4. 非目标

- 不改业务逻辑、排盘算法、SQLite schema、Prompt 模板。
- 不做代码签名采购、不做 macOS 公证（notarization）、不上架 Microsoft Store / Mac App Store。
- 不做自动更新（Squirrel/Sparkle/wails updater）——留待独立 CHG。
- 不做 Linux 桌面端重新设计；现有 Linux `tar.gz` job 原样保留并标注 legacy，不在本 CHG 验收范围。
- 不定义视觉风格。**美术是变量**：图标、配色、字体、启动画面一律以 CHG-001 token 体系与既有 `build/appicon.png` 为准，本 CHG 只约定"资源如何被正确嵌入与签名"，不约定"长什么样"。
- 不做 ARM Windows 真机运行验收（无对应硬件/runner），降级为静态 PE 校验 + NSIS 架构守卫，如实记录在 TRACEABILITY。

## 5. 依赖与排期

| 依赖 | 说明 | 阻塞点 |
|------|------|--------|
| CHG-001（明暗主题） | 视觉验收口径、截图基线、图标资源定稿 | **本 CHG 的实现闸门** |
| CHG-002（Android） | 无直接代码依赖；但两者都会跑重构建，需串行（本机 2C4T/8G） | 不阻塞，禁止并行构建 |
| Wails 2.12.0 | 已锁 `go.mod`；升级需重跑 F1/F3 核验 | 版本变更需在本 SPEC 追加 ADR |

排期建议：CHG-001 收尾 → CHG-004 M1（可行性 spike，1 天）→ M2（阻断修复）→ M3–M6（脚本与 CI）→ M7（清洁室/文档）→ M8（首个 v1.2.0 实发）。

## 6. 交付物

见 `SPEC.md`（工程契约：ADR、脚本接口、里程碑、DoR/DoD、Review Gate）与 `TRACEABILITY.md`（需求 → 实现 → 证据）。

## 7. 风险摘要

| 风险 | 等级 | 处置 |
|------|------|------|
| macOS amd64 在 arm64 runner 交叉编译失败（clang/SDK 差异） | 中 | M1 先验证；降级 = 产出 universal 后 `lipo -thin` 拆两份（签名需重做） |
| Windows arm64 安装包无法在 amd64 runner 真机验证 | 中 | 静态 PE + NSIS 架构守卫；文档标注"未执行安装冒烟" |
| 安装版数据目录不可写（F4 同类阻断） | **高** | M2 必须修（三级目录解析），否则 8 个产物里 4 个安装包全部不可用 |
| 无签名导致用户放弃安装 | 中 | Release Notes 明示 + 提供便携版 + 给出 SHA256 自校验步骤 |
| 体积超预算（WebView2/资源重复） | 低 | 体积 Gate + M1 基线校准 |
| 重写 workflow 打破现有发布 | 中 | 保留旧 job 直到 M5 全绿；用 `workflow_dispatch` dry-run 先跑通再切 tag 触发 |
