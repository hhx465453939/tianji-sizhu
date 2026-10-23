---
change_id: CHG-004
version: 1
status: approved
gate: 已满足（CHG-001 DoD 达成于 2026-10-22；用户于 2026-10-23 授权执行）
prd_ref: CHANGE.md
health_ref: docs/SPEC.md
supersedes: null
approved_by: user ("chg004的工作你这里也顺手接在后面做了吧")
approved_at: 2026-10-23
---

# SPEC · 桌面端四架构发布工程（安装包 + 免安装版）

> 本文是可执行契约，不是想法清单。每一条 ADR 都给出「核验出处」或「验收断言」，不写"应该""尽量"。
> 视觉部分一律为**变量**：颜色/字体/图标内容由 CHG-001 决定，本 SPEC 只约定资源如何被嵌入、签名、校验。

## 1. Context

### 1.1 现状（截至 v1.1.4 tag）

| 维度 | 现状 | 问题 |
|------|------|------|
| 产物 | Windows `*-installer.exe`（NSIS, amd64）、macOS `*-darwin-universal.dmg`、Linux `*-linux-amd64.tar.gz` | 缺 Windows arm64、缺 macOS 分架构、无免安装版 |
| 版本源 | `frontend/package.json=1.1.2`、`docs/SPEC.md=v1.1.2`、tag=`v1.1.4`、`wails.json` **无 `info` 段** | 三处已漂移；安装器 `DisplayVersion` / `CFBundleShortVersionString` 实际为 `1.0.0` |
| 前端依赖 | `pnpm-lock.yaml` 已入库，但 `wails.json` 里 `frontend:install = npm install` | CI 走 npm、无 lockfile → 依赖不可复现 |
| 安装布局 | NSIS 默认 `$PROGRAMFILES64\${COMPANY}\${PRODUCT}`（per-machine，需管理员） | 与 `getDataDir()` 的"exe 同级 data/"冲突（见 B2） |
| N 安装器 | 未安装 `makensis` 时 Wails **打印 warn 后 `return nil`**（`nsis_installer.go:54`） | 构建"成功"但无安装包 → CI 静默发残缺版本 |
| 发布闸门 | `publish-release` 为 `if: always() && !cancelled()` | 任一架构失败仍发布 |
| `build/` | 被 `.gitignore` 整体忽略，仓库内无任何 `build/` 文件 | NSIS 脚本、`Info.plist`、`info.json`、图标全部不可审计、不可复现；`CFBundleIdentifier` 恒为 `com.wails.tianji-sizhu` |
| 测试 | `go test ./...`、`pnpm test`（vitest）、`scripts/ui-screenshot.mjs` | 无产物级/安装级验证，测试结束后无人断言环境是否干净 |
| 环境隔离 | `GOPATH=C:\Users\<user>\go`（实测），`GOCACHE/GOMODCACHE/GOBIN` 未纳入治理表；`.android/.cache/.tmp` 已纳入 | 「删掉项目目录主机零残留」对 Go 不成立 |

### 1.2 阻断点（按严重度）

| # | 阻断 | 证据 | 影响 | 处置 |
|---|------|------|------|------|
| B1 | 安装版数据目录不可写 | `app.go:99-108` `getDataDir()` = `filepath.Dir(os.Executable())/data`；NSIS `InstallDir $PROGRAMFILES64` | 安装到 Program Files 后普通用户无法建 `data/`，`database.Open` 失败，`startup` 只 `Fprintf(os.Stderr)` → UI 空白无提示 | ADR-003 |
| B2 | macOS 写 bundle 内 `data/` | 同上，exe 在 `TianJi.app/Contents/MacOS/` | 破坏 `.app` 签名；`/Applications` 非管理员不可写 | ADR-003 |
| B3 | arm64 元数据缺失 | `wails.json` 无 `info` | 安装包"属性/关于"显示 1.0.0、公司名空、`CFBundleIdentifier` 为 `com.wails.*` | ADR-002 + ADR-011 |
| B4 | 依赖不可复现 | `wails.json` `frontend:install=npm install`，无 `package-lock.json` | 两次构建依赖树可能不同 | ADR-009（改 pnpm + frozen lockfile） |
| B5 | 安装器可静默缺失 | `nsis_installer.go:54` 缺 makensis 返回 nil | CI 出"成功但无 exe" | ADR-005（产物存在性硬断言） |
| B6 | 缺架构分之失败无人拦 | `publish-release` `if: always()` | 发布残缺 Release | ADR-009 |
| B7 | Windows arm64 从未构建 | 现有 CI 只 `windows/amd64` | Win on ARM 用户跑 x64 模拟 | ADR-004/005 |
| B8 | Go 缓存越界 | 实测 `GOPATH=C:\Users\DamnCheater\go` | 违反 AGENTS.md 隔离红线 | ADR-008（GOCACHE/GOMODCACHE/GOBIN 重定向） |
| B9 | 免安装版与安装版未区分数据策略 | 无 portable 产物 | 解压即用无从谈起 | ADR-003 + ADR-007 |

### 1.3 约束

- 硬件：i3-2130 / 8GB / 无 GPU。构建串行，禁止 Wails 与 Gradle 同时跑；Go 编译不加 `-race`。
- 宿主：Windows x64（优先）、macOS（CI runner）。**macOS 包只能在 macOS 上构建**（F3）。
- 无签名证书（F8）→ 产物为 `unsigned`（Windows）/ `adhoc`（macOS）。
- Wails 锁 `v2.12.0`；升级需重跑本 SPEC 的 F1/F3 核验并追加 ADR。

## 2. 设计决策（ADR）

### ADR-001 产物矩阵与命名契约

8 个产物 + 1 清单，命名一律 `<app>-<version>-<os>-<arch>[-<kind>].<ext>`：

```
tianji-sizhu-1.2.0-windows-amd64-setup.exe      ← NSIS 安装包
tianji-sizhu-1.2.0-windows-arm64-setup.exe
tianji-sizhu-1.2.0-windows-amd64-portable.zip   ← 解压即用
tianji-sizhu-1.2.0-windows-arm64-portable.zip
tianji-sizhu-1.2.0-macos-amd64-app.zip          ← 签名 .app 包（ditto）
tianji-sizhu-1.2.0-macos-arm64-app.zip
SHA256SUMS-1.2.0.txt
```

> **已废除 DMG**：`hdiutil` 在 macOS 14 CI runner 上挂死在内核态（SIGKILL 无效，实测 25 分钟不返回）。
> macOS 统一交付 `ditto -c -k --keepParent` 出的签名 `.app.zip`，解压后拖入 `/Applications`。

规则：
- `version` 来自 `VERSION` 文件（无 `v` 前缀）；文件名、安装元数据、tag 三处必须一致。
- 中间产物一律 `build/bin/` 或 `.tmp/release/`，**不进** `dist/`（`dist/` 属前端构建）。
- Linux `tar.gz` 保留现状，命名不改，标注 `legacy`，不参与本 CHG 验收。

### ADR-002 版本单一源

新增根 `VERSION`（内容如 `1.2.0\n`）。`scripts/release/version.sh` 是唯一写入者：

| 目标 | 字段 | 模式 |
|------|------|------|
| `frontend/package.json` | `version` | 重写 |
| `wails.json` | `info.productVersion` | 写入 |
| `wails.json` | `info.productName` | 固定 `天机四柱` |
| `wails.json` | `info.companyName` | 固定 `TianJi-SiZhu`（ASCII，用于注册表键与安装路径） |
| `wails.json` | `info.copyright` | 固定，年份不自动滚动 |
| `docs/SPEC.md` | 头部 `**版本**` 行 | 写入（`--docs` 时执行） |

```
version.sh sync     # VERSION → 所有下游
version.sh check    # 只校验不写；不一致 exit 1
version.sh tag      # echo "v$(cat VERSION)"，供 CI 比对 GITHUB_REF_NAME
```

CI 硬门（任一不满足即 fail）：`v$(cat VERSION) == $GITHUB_REF_NAME`、`package.json.version == VERSION`、`wails.json.info.productVersion == VERSION`。

### ADR-003 数据目录解析（阻断修复，必须先做）

现状把用户数据绑在 exe 旁边，安装版不可用。改为**三级解析**，并对失败可诊断：

```
1) TJS_DATA_DIR            环境变量显式覆盖（测试/企业重定向）
2) <exe_dir>/data          仅当可写（探测：create+delete .probe）→ 便携语义
3) 平台用户目录
   Windows : %LOCALAPPDATA%\TianJi-SiZhu\data
   macOS   : ~/Library/Application Support/TianJi-Sizhu/data
   Linux   : ${XDG_DATA_HOME:-~/.local/share}/tianji-sizhu
```

附加要求：
- 解析结果写 `startup.log`（与 data 同级），记录选定路径与失败原因。
- `App` 增加 `StartupError() string` 绑定；前端（CHG-001 之后）以非阻塞提示呈现，**禁止**静默空白窗口。
- 旧便携用户已有 `data/` 且可写 → 第 2 级命中，行为不变（零迁移成本）。
- 安装版首次启动落到第 3 级；卸载**不删**用户数据（NSIS uninstall 段只删 `$INSTDIR` 与快捷方式）。

验收断言（Go 单测，`TJS_DATA_DIR` 注入 + `t.TempDir()`）：三级优先级、只读目录降级、错误可读。

### ADR-004 构建宿主与交叉编译矩阵

| 产物 | 宿主 | 命令要点 | 依据 |
|------|------|----------|------|
| Windows amd64 | `windows-2022`（amd64） | `CGO_ENABLED=0 wails build -platform windows/amd64 -nsis` | Windows 后端无 CGO（F2） |
| Windows arm64 | `windows-2022`（amd64，**交叉**） | `CGO_ENABLED=0 GOARCH=arm64 wails build -platform windows/arm64 -nsis` | F1+F2；`-nsis` 分流 `-DARG_WAILS_ARM64_BINARY` |
| macOS arm64 | `macos-14`（arm64，native） | `wails build -platform darwin/arm64` | F3 |
| macOS amd64 | `macos-14`（arm64，**交叉**） | `wails build -platform darwin/amd64`（clang 自动 `-arch x86_64`） | 与 `darwin/universal` 内部路径一致（F3） |

- 禁止在 Linux 构建 macOS 产物（无 SDK/WebKit）。CNB 的 Linux 容器只出 Windows。
- 交叉编译的可行性由 **M1 spike** 实测，结论回写本节；失败则走降级：
  - 降级 A（macOS）：先出 `darwin/universal`，`lipo -thin x86_64|arm64` 拆两份，拆分后**重新 `codesign --force --deep --sign -`**（签名绑定切片）。
  - 降级 B（Windows arm64）：改用 `windows-11-arm` runner 原生构建；若不可用，发布说明标注"arm64 暂缺"，且**不得**用 x64 包冒充。

### ADR-005 NSIS 定制与"安装器必须存在"硬断言

- 把定制后的 `build/windows/installer/project.nsi` 入库（`build/` 忽略规则改为只忽略 `build/bin/`，见 ADR-011）。
- 定制点（最小集）：
  - 固定 `UNINST_KEY_NAME "TianJi-SiZhu"`（ASCII，注册表可断言；默认值含中文不利于测试）
  - 固定 `InstallDir "$PROGRAMFILES64\TianJi-SiZhu"`
  - `!define PRODUCT_EXECUTABLE "tianji-sizhu.exe"`
  - 保留 WebView2 bootstrapper 调用（离线安装必需）
  - 不启用 `signtool`（无证书，禁止留半开配置）
- `wails_tools.nsh` **不入库**（含解析后的版本号，每次构建重新生成，天然杜绝版本漂移）。
- 硬断言：构建脚本在 `wails build` 之后必须找到 `build/bin/tianji-sizhu-<arch>-installer.exe`，否则 `exit 3`。**不接受** Wails 静默跳过（B5）。
- 每条安装包在 CI 里断言：文件名含 `-<arch>-setup.exe`、`FileVersion` 资源 = `VERSION.0`。
  **注意**：NSIS 安装器本体是 **32 位 stub**（PE Machine = `0x014C`），不要对它断言目标架构；
  架构断言的对象是应用本体 `build/bin/tianji-sizhu.exe`（`0x8664` / `0xAA64`）。

### ADR-012 Windows 版本资源的语言 key（实测新增）

Wails 默认模板 `info.json` 使用语言 key `"0000"`（LANG_NEUTRAL）。实测结果：

```
资源树:  16(VERSION) / 1 / 0        ← 语言 ID = 0
PowerShell: FileVersion=[] ProductVersion=[] Company=[]      ← 全部为空
```

Windows 的 `GetFileVersionInfo` 需要具体语言才能定位字符串表，neutral 资源读不出。
因此本项目固定：

```jsonc
"fixed": { "file_version": "{{.Info.ProductVersion}}.0" },  // 必须 4 段
"info":  { "0409": { FileVersion: "{{.Info.ProductVersion}}.0", ... } }
```

修复后：`16(VERSION) / 1 / 1033`，`FileVersion=1.2.0.0`、`ProductVersion=1.2.0` 可读。
验收断言：`verify-artifacts.sh` 在 Windows 宿主上对 `app` / `setup` 两类产物检查
`FileVersion` 非空且以 `VERSION` 开头；非 Windows 宿主标记 `skip` 而非伪造通过。

### ADR-006 macOS 包、签名与分发

- 应用包名保持 ASCII `tianji-sizhu.app`（工具链安全），显示名由 `Info.plist` 的 `CFBundleName` = `天机四柱` 提供。
- 定制 `build/darwin/Info.plist` 入库，替换模板值：
  - `CFBundleIdentifier` → `com.tianjisizhu.desktop`（默认模板是 `com.wails.tianji-sizhu`，不可接受）
  - `CFBundleShortVersionString` / `CFBundleVersion` → `{{.Info.ProductVersion}}`（保持占位符，由 Wails 解析）
  - `LSMinimumSystemVersion` 保持 `10.13.0`；`NSHighResolutionCapable true`；补 `LSApplicationCategoryType public.app-category.lifestyle`
- **安装包（`.pkg`）**：`pkgbuild --root <stage> --identifier com.tianjisizhu.desktop --version <ver> --install-location /Applications --ownership recommended <out>`；stage 内只放 `tianji-sizhu.app`。
  **DMG 禁用**：`hdiutil` 在 macOS 14 CI runner 上进内核不可中断态（实测 25min+，SIGKILL 无效）；`pkgbuild` 是纯文件打包，不挂载镜像，不会 hang。
- **免安装包（`.app.zip`）**：`ditto -c -k --keepParent`（保留 ad-hoc 签名与符号链接）。
- 签名：接受 ad-hoc（`codesign --force --deep --sign -`，Wails 自动执行）。CI 断言：
  - `codesign --verify --deep --strict` 返回 0
  - `codesign -dv --verbose=4` 输出含 `Signature=adhoc`
  - `spctl -a -vv` **允许失败**，但必须把输出写入证据（如实记录 Gatekeeper 会拦）
- 用户指引（Release Notes 固定段落）：右键 → 打开；或 `xattr -dr com.apple.quarantine /Applications/tianji-sizhu.app`。**禁止**建议全局关闭 Gatekeeper。

### ADR-007 免安装版封装

| 平台 | 内容 | 封装方式 | 关键点 |
|------|------|----------|--------|
| Windows | 顶层目录 `tianji-sizhu-<ver>-windows-<arch>/`，内含 `tianji-sizhu.exe` + `使用说明.txt` | `zip -r -9`（或 PowerShell `Compress-Archive`） | 首次运行在可写目录内自动建 `data/`（ADR-003 第 2 级） |
| macOS | `tianji-sizhu.app`（zip 根） + `安装说明.txt` | **`ditto -c -k --keepParent --sequesterRsrc`** | 必须保签名与符号链接；**禁止**用 `zip` CLI（破坏 bundle 签名） |

- Windows 免安装版**无 WebView2 bootstrapper** → 说明文件必须写明"Windows 10 需已安装 WebView2 Runtime，否则请用安装版"。构建脚本附 `--check-webview2` 提示（不自动安装）。
- 体积 Gate 见 §6。

### ADR-008 测试分层与清洁环境

| 层 | 内容 | 执行者 | 通过判据 |
|----|------|--------|----------|
| L1 单元/静态 | `go test ./...`、`pnpm test`、`tsc --noEmit`、`go vet ./...` | 本地 + CI | 0 fail / 0 error |
| L2 产物结构 | PE Machine、Mach-O `lipo -archs`、版本串、文件清单、体积 | CI（每 job） | 断言全绿（见 §3.2） |
| L3 Windows 生命周期 | 静默安装 → 文件/注册表断言 → 启动存活 5s → 静默卸载 → 目录与注册表回基线 → 无残留进程 | `windows-2022` | 全绿；arm64 安装包标记 `not-executed`（不能执行） |
| L4 macOS 生命周期 | `hdiutil attach -nobrowse -readonly` → `codesign --verify` → `lipo -archs` → 复制到临时目录 → 启动存活 5s → kill → `hdiutil detach` → 临时目录清空 | `macos-14` | 全绿；amd64 包若无法执行则降级为静态校验并记录原因 |
| L5 清洁室构建 | `git archive` 导出到 `.tmp/cleanroom` → 全量构建 → 与 CI 产物比对"结构等价"（架构/清单/版本/体积区间） | 本地（发布前） | 无未提交依赖；结构等价 |

**清洁环境硬规则（本地与 CI 通用）**

1. 安装测试必须装到临时目录：`installer.exe /S /D=<tmp>`（`/D` 必须最后且不加引号），不得污染 `%ProgramFiles%`。
2. 安装/卸载前后对 `HKLM\...\Uninstall\TianJi-SiZhu` 做存在性快照，卸载后必须消失；卸载器自删有延迟 → 轮询最多 30s。
3. macOS 挂载点固定在 `.tmp/mnt-<arch>`，结束 `hdiutil detach -force`；断言 `mount | grep` 无残留。
4. 测试进程收尾：Windows 断言 `Get-Process tianji-sizhu -EA SilentlyContinue` 为空。
5. 用户数据目录（`%LOCALAPPDATA%\TianJi-SiZhu`）**允许保留**（卸载不删数据），但必须显式记录到证据，且 CI 结束删除。
6. `scripts/release/clean.sh` 的白名单：可删 `build/bin`、`frontend/dist`、`.tmp/release`、`.tmp/cleanroom`、`*.syso`；`--all` 追加 `frontend/node_modules`、`.cache/pnpm`、`.cache/go-build`、`.cache/go-mod`；**永不删** `.git/`、`data/`、`tasks/`、`docs/`、`src/`。
7. `--dry-run` 先打印清单，不执行。
8. Go 缓存重定向（B8）：`GOCACHE=<root>/.cache/go-build`、`GOMODCACHE=<root>/.cache/go-mod`、`GOBIN=<root>/.toolchain/bin`、`TMPDIR=<root>/.tmp`；`scripts/env-check.sh` 增加对应断言。

### ADR-009 CI/CD 编排（GitHub Actions）

- 触发：`push tags v*` + `workflow_dispatch`（输入 `publish: boolean`，默认 false = 只产 artifact 不发 Release）。
- 并发：`concurrency: {group: release-${{ github.ref }}, cancel-in-progress: true}`。
- Job 图：`preflight`（版本/锁文件校验）→ 4 个构建 job（`win-amd64`、`win-arm64`、`mac-amd64`、`mac-arm64`）→ `checksums` → `publish`。
- `preflight` 必查：`v$(cat VERSION) == GITHUB_REF_NAME`、`wails.json.info.productVersion`、`pnpm-lock.yaml` 存在、`frontend:install` 使用 pnpm 且 `--frozen-lockfile`。
- 依赖安装：`pnpm/action-setup` + `pnpm install --frozen-lockfile`；禁止 `npm install` 参与产物构建。
- 缓存：只缓存 `~/.pnpm-store` 与 `go mod download` 缓存，key 含 lockfile hash；**不缓存** `build/bin`、`dist`。
- 失败传播：`publish` 依赖全部构建 job 且**无 `if: always()`**；任一失败 → 不建 Release（修 B6），并把 `artifacts-manifest.json` 作为 artifact 上传以便定位。
- 幂等：重复执行 tag 时，若 Release 已存在则更新资产（`softprops/action-gh-release` 覆盖），不重复创建。
- 权限：`permissions: {contents: write}` 仅授予 `publish` job；其余 job `contents: read`。
- 供应链：release 相关 action 全部固定到 major（`@v4`/`@v5`），并在 §6 记录"升级需人工 review"。

### ADR-010 CNB 流水线分工

- CNB（Linux 容器）负责：Windows amd64/arm64 的 4 个产物（setup×2 + portable×2）。
- CNB 不负责 macOS：容器内无 macOS SDK/WebKit，无法产出合法 `.app`。CNB Release 说明里给出 GitHub Release 链接，**不得**在 CNB 侧伪造 macOS 包。
- CNB 与 GitHub 产物一致性要求：同一 tag、同一 `VERSION`、文件名规则相同；`SHA256SUMS` 各自生成，允许哈希不同（编译器/工具链差异），但**版本与清单必须相同**。

### ADR-011 `build/` 资源入库与"美术变量"边界

- `.gitignore` 由 `/build/` 改为 `/build/bin/`，入库：
  - `build/appicon.png`（Wails 由此生成 `.ico`/`.icns`）
  - `build/windows/installer/project.nsi`（定制）
  - `build/windows/info.json`（版本占位符，不写死）
  - `build/darwin/Info.plist`（定制 bundle id）
- 不入库：`build/windows/installer/wails_tools.nsh`、`build/windows/installer/tmp/`、`build/bin/`（构建产物）。
- 升级 Wails 后必须 `diff` 上游模板（`pkg/buildassets/build/**`）确认无新增字段被漏掉；结论写入 TRACEABILITY。
- **美术变量声明**：`appicon.png` 的图形/配色、`Info.plist` 的显示名文案等字符串均可随品牌演进替换，**不触发**本 CHG 的验收重跑；仅当尺寸、格式、路径、签名对象变化时才需重跑 L2–L4。

## 3. 接口契约

### 3.1 脚本族（`scripts/release/`，注释用英文）

| 脚本 | 用途 | 关键参数 | 退出码 |
|------|------|----------|--------|
| `lib.sh` | 公共函数：日志、版本、host guard、断言 | 被 source | — |
| `version.sh` | 版本单一源 | `sync` / `check` / `tag` | 0/1 |
| `build-windows.sh` | 单架构构建 + NSIS | `--arch {amd64,arm64}` | 0/1/2/3 |
| `build-macos.sh` | 单架构构建 + .pkg + app.zip | `--arch {amd64,arm64}` | 0/1/2/3 |
| `package-portable.sh` | 免安装 ZIP | `--os {windows,macos} --arch {amd64,arm64}` | 0/1/3 |
| `verify-artifacts.sh` | L2 校验 + 生成 manifest | `--dist <dir>` | 0/1 |
| `checksums.sh` | 生成 `SHA256SUMS-<ver>.txt` | `--dist <dir>` | 0/1 |
| `smoke-windows.ps1` | L3 安装/卸载生命周期 | `-Installer <path> -ExpectArch` | 0/1 |
| `smoke-macos.sh` | L4 pkg 展开 / zip 解压 + 启动 + 清理 | `--pkg <path>` 或 `--zip <path>` + `--expect-arch` | 0/1 |
| `clean.sh` | 清洁室 | `--dry-run`、`--all` | 0/1 |
| `release.sh` | 本地编排（= CI 同序） | `--dry-run`、`--cleanroom`、`--skip-tests` | 0/1/2/3 |

退出码语义：`0` 成功；`1` 校验失败；`2` 前置条件不满足（宿主/工具/版本不符，不应重试）；`3` 构建失败。CI 依此区分"重试"与"人干预"。

### 3.2 产物清单 `artifacts-manifest.json`

```jsonc
{
  "version": "1.2.0",
  "git_sha": "<40 hex>",
  "generated_at": "2026-10-22T12:00:00Z",
  "artifacts": [
    {
      "id": "windows-amd64-setup",
      "platform": "windows", "arch": "amd64", "kind": "installer",
      "file": "tianji-sizhu-1.2.0-windows-amd64-setup.exe",
      "bytes": 0, "sha256": "<64 hex>",
      "checks": {
        "arch": "pe:0x8664", "version": "1.2.0", "bits": "exe",
        "smoke": "pass|skip:<reason>|not-executed"
      }
    }
  ],
  "summary": { "all_checks_pass": true, "failures": [] }
}
```

`verify-artifacts.sh` 为唯一写者；`publish` job 读它决定是否发布。

### 3.3 目录布局

```
VERSION                                  ← 唯一版本源
build/                                   ← 入库（除 bin/ 与生成物）
  appicon.png
  windows/{info.json,installer/project.nsi}
  darwin/Info.plist
build/bin/                               ← 构建产物（忽略）
.tmp/release/<version>/                  ← 打包暂存 + manifest
.tmp/cleanroom/                          ← L5 清洁室
.tmp/mnt-<arch>/                         ← macOS 挂载点
scripts/release/*                        ← 本 CHG 新增
```

### 3.4 版本同步矩阵（`version.sh check` 的断言集）

| 位置 | 读取方式 | 期望 |
|------|----------|------|
| `VERSION` | 文本 | `^\d+\.\d+\.\d+$` |
| `frontend/package.json` | JSON `version` | == VERSION |
| `wails.json` | JSON `info.productVersion` | == VERSION |
| git tag（CI） | `GITHUB_REF_NAME` | == `v$(cat VERSION)` |
| 产物文件名 | 文件名解析 | 含 `-$(cat VERSION)-` |
| NSIS 注册表 `DisplayVersion` | L3 断言 | == VERSION |
| `CFBundleShortVersionString` | L4 `plutil -extract` | == VERSION |

## 4. 里程碑

| # | 里程碑 | 依赖 | 产出文件 | 验收 | 回滚 |
|---|--------|------|----------|------|------|
| M0 | 立项（本文件） | — | `tasks/CHG-004-desktop-release/*`、`AGENTS.md`/`CLAUDE.md` 治理章节 | 三件套齐备、治理条款可执行 | 删除目录 |
| M1 | 可行性 spike | M0 | `.tmp/spike/*`、本 SPEC §2 ADR-004 结论 | 四组合各产出一个可执行二进制；记录命令与耗时 | 丢弃 spike，按降级 A/B |
| M2 | 阻断修复（B1/B2/B3/B8） | M1 | `app.go`、`wails.json`、`VERSION`、`scripts/release/version.sh`、`env-check.sh` | Go 单测覆盖三级目录；`version.sh check` 绿；`env-check.sh` PASS 且含 Go 缓存 | 还原 `getDataDir()` 旧实现 |
| M3 | 打包脚本 | M2 | `scripts/release/{lib,build-windows,build-macos,package-portable,checksums}.sh` | 本机/CI 各出 4 产物；脚本 `--help` 完整 | 删除新增脚本 |
| M4 | 产物校验 + 生命周期测试 | M3 | `verify-artifacts.sh`、`smoke-windows.ps1`、`smoke-macos.sh` | L2 全绿；L3 在本机通过；L4 在 CI 通过 | 降级为 L2 静态校验并记录 |
| M5 | CI 矩阵改造 | M4 | `.github/workflows/release.yml` | `workflow_dispatch` dry-run 全绿；8 产物 artifact 齐 | 回滚 workflow 到上个 commit |
| M6 | CNB 同步 | M5 | `.cnb.yml` | CNB 出 Windows 4 产物；说明含 GitHub 链接 | 回滚 `.cnb.yml` |
| M7 | 清洁室 + 文档 | M5 | `clean.sh`、`docs/RELEASE.md`、README 下载表、`docs/SPEC.md` 平台矩阵 | L5 通过；文档含 8 产物表与故障排查 | 保留文档，撤销 clean.sh |
| M8 | 首次实发 v1.2.0 | M5–M7、CHG-001 | Release + `SHA256SUMS` | 8 产物可下载且校验通过；TRACEABILITY 全绿 | 删除 Release 与 tag |

## 5. Definition of Ready / Done

**DoR（进 M1 前必须满足）**
- CHG-001 DoD 达成（视觉与响应式稳定，图标资源定稿）。
- 本 SPEC 状态由 `draft` 改 `approved`，`approved_by` 记录。
- `VERSION` 与 `wails.json.info` 的改动方向获认可（会改变安装元数据与注册表键名）。

**DoD（M8 完成判据）**
- 8 个产物 + `SHA256SUMS-<ver>.txt` 全部存在于 Release，且 `sha256sum -c` 通过。
- 每个产物 `bytes > 0` 且落在 §6 体积区间。
- 架构断言全绿：PE `0x8664`/`0xAA64`；Mach-O `x86_64`/`arm64`（单一，非 universal）。
- 版本断言全绿：文件名、注册表 `DisplayVersion`、`plutil` 版本串、`VERSION`、tag 五处一致。
- L3 安装/卸载生命周期在 CI 绿；L4 macOS 生命周期绿（不可执行时按 ADR-008 降级并记录）。
- `scripts/env-check.sh` PASS；`git status` 无构建产物；`.tmp`、`build/bin` 清理后仓库干净。
- `AGENTS.md` 与 `CLAUDE.md` 逐字一致（`diff` 空），发布章节内容与实际脚本行为一致。
- TRACEABILITY 每条需求都有证据（命令 + 关键输出 + 日期）。

## 6. Review Gate

| Gate | 判据 | 违规处置 |
|------|------|----------|
| 安全 | 仓库内无证书/私钥；`gh-release` 只读 `GITHUB_TOKEN`；不引导用户全局关闭 Gatekeeper | 阻止合并 |
| 体积 | setup.exe ≤ 28 MB；portable.zip ≤ 22 MB；installer.pkg ≤ 30 MB；app.zip ≤ 30 MB（M1 记录真实基线后允许 ±20%，超区间需在本 SPEC 追加说明） | 阻断发布 |
| 兼容 | `minSdk` 无意义；桌面端最低系统：Windows 10 1809+（WebView2）、macOS 10.13+ | 文档标注 |
| 隔离 | `env-check.sh` PASS；`GOCACHE/GOMODCACHE/GOBIN/TMPDIR` 全在项目内 | 阻断发布 |
| 供应链 | release action 固定版本；`pnpm --frozen-lockfile`；`go mod verify` 通过 | 阻断发布 |
| 证据 | TRACEABILITY 无空行、无"应该"、每条含可复现命令 | 阻断 M8 |

## 7. 未决问题

| # | 问题 | 倾向 | 决策时点 |
|---|------|------|----------|
| Q1 | 是否保留 Linux 产物？ | 保留 legacy，不投入 | M7 |
| Q2 | 是否引入代码签名（Windows EV / Apple Developer ID）？ | 暂不；先用 SHA256 + 便携版缓解 | 独立 CHG |
| Q3 | 是否提供 per-user 安装（无需管理员）？ | 暂不；NSIS 保持 per-machine，文档标注 | M5 后评估 |
| Q4 | macOS amd64 在 arm64 runner 交叉编译是否稳定？ | 由 M1 实测决定；不稳走 `lipo -thin` 降级 | M1 |
| Q5 | Windows arm64 是否需要真机/runner 验证？ | 无硬件 → 静态校验 + `not-executed` 记录 | M4 |
| Q6 | 自动更新（Sparkle/wails updater）？ | 不做，独立 CHG | — |
| Q7 | 免安装版是否内置 WebView2 离线包？ | 不内置（+130MB），改为说明 + 安装版兜底 | M3 |
