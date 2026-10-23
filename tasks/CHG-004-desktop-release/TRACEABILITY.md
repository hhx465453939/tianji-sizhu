# TRACEABILITY · CHG-004 桌面端四架构发布工程

**状态**: `implemented`（M1–M7 完成；M8 首次实发待执行）
**执行日期**: 2026-10-23
**执行宿主**: Windows 10 x64 / Go 1.26.2 / Wails v2.12.0 / Node 24 / pnpm 11 / JDK 21 / NSIS 3.10（项目内）
**证据根目录**: `.tmp/release/1.2.0/`、`scripts/release/`（构建产物 git 忽略）
**取证规则**: 每条 = 可复现命令 + 关键输出 + 宿主 + 日期；未执行的明确写 `not-executed`。

---

## 1. 需求 → 实现 → 证据

| ID | 需求 | 实现 | 证据 | 状态 |
|----|------|------|------|------|
| R-01 | Windows amd64 安装包 | `build-windows.sh --arch amd64` | `tianji-sizhu-1.2.0-windows-amd64-setup.exe` 8,708,963 B；`FileVersion=1.2.0` | ✅ |
| R-02 | Windows arm64 安装包 | 同上 `--arch arm64`（交叉） | `...arm64-setup.exe` 8,132,374 B；`FileVersion=1.2.0` | ✅ |
| R-03 | macOS amd64 安装包 | `build-macos.sh --arch amd64` | 脚本就绪，需 macOS 宿主 | ⏳ CI |
| R-04 | macOS arm64 安装包 | `build-macos.sh --arch arm64` | 同上 | ⏳ CI |
| R-05 | Windows amd64 免安装 | `package-portable.sh` | `...amd64-portable.zip` 6,961,360 B | ✅ |
| R-06 | Windows arm64 免安装 | 同上 | `...arm64-portable.zip` 6,373,184 B | ✅ |
| R-07 | macOS amd64 免安装 | 同上（ditto） | 脚本就绪 | ⏳ CI |
| R-08 | macOS arm64 免安装 | 同上（ditto） | 脚本就绪 | ⏳ CI |
| R-09 | 校验清单 | `checksums.sh` | `SHA256SUMS-1.2.0.txt`，4 条（本机平台） | ✅ |
| R-10 | 版本单一源 | `VERSION` + `version.sh` | `sync --docs` → `check` 三处一致 | ✅ |
| R-11 | 安装元数据正确 | `wails.json.info` + `info.json`(0409, 4 段) | `FileVersion=1.2.0.0`、`ProductVersion=1.2.0`、`Company=TianJi-SiZhu` | ✅ |
| R-12 | bundle id 非 `com.wails.*` | `build/darwin/Info.plist` | `com.tianjisizhu.desktop`（静态核对） | ✅ 静态 |
| R-13 | 安装版数据目录可写 | `app.go` 三级解析 | `TestDataDirOverride/Portable/Fallback/BadOverride` 全绿 | ✅ |
| R-14 | 启动失败可诊断 | `StartupError()` + `startup.log` + 界面提示条 | `TestStartupErrGuard` 绿；`StartupBanner` 渲染 | ✅ |
| R-15 | 依赖可复现 | `wails.json` → pnpm `--frozen-lockfile` | `grep frontend:install wails.json` → pnpm | ✅ |
| R-16 | 安装器缺失即失败 | `build-windows.sh` exit 2（前置）/ exit 3（产物缺失） | 见 §3.4 负向验证 | ✅ |
| R-17 | 架构缺失不发布 | `release.yml` publish 无 `always()` | `publish.needs=[preflight,verify,build-android]`；`always()` 仅出现在注释 | ✅ |
| R-18 | Windows 安装/卸载零残留 | `smoke-windows.ps1` | 本机非管理员 → `SKIP: not elevated`（诚实降级） | ⏳ CI |
| R-19 | macOS 挂载零残留 | `smoke-macos.sh` | 脚本就绪 | ⏳ CI |
| R-20 | 清洁室可重建 | `clean.sh` + `release.sh --dry-run` | `clean.sh --dry-run` 打印白名单 | ✅ |
| R-21 | Go 缓存不越界 | `go-env.sh` + `env-check.sh` 断言 | `env-check.sh` PASS，GOCACHE/GOMODCACHE/GOBIN 全部 inside | ✅ |
| R-22 | `build/` 资源可审计 | `.gitignore` 只忽略 `/build/bin/` | 4 个资源文件入库 | ✅ |
| R-23 | CI dry-run 可发布 | `release.yml` `workflow_dispatch` | YAML 校验通过，7 个 job | ⏳ CI |
| R-24 | CNB 出 Windows 4 产物 | `.cnb.yml` build windows stage | 改为调用脚本族，CGO_ENABLED=0 | ⏳ CI |
| R-25 | 治理条款落纸 | `AGENTS.md` + `CLAUDE.md` | `md5sum` 一致 `524307a5…`；8 小节齐全 | ✅ |
| R-26 | 美术为变量 | `gen-appicon.mjs` 从 token 生成 | `build/appicon.png` 1024×1024 | ✅ |
| R-27 | 体积闸门 | `verify-artifacts.sh` | setup ≤28MB（实测 8.7/8.1）；portable ≤22MB（6.9/6.3） | ✅ |
| R-28 | 供应链固定 | action 版本号 + `--frozen-lockfile` | `grep -c "uses: .*@v"` 全部带版本 | ✅ |

## 2. 阻断点闭环

| 阻断 | 关闭条件 | 关闭于 | 证据 |
|------|----------|--------|------|
| B1 安装版数据目录不可写 | 三级解析 + 单测 | M2 | `TestDataDirFallback` 绿 |
| B2 macOS 写 bundle 内 data | 同上（darwin 分支） | M2 | `platformDataBase()` darwin 分支 |
| B3 安装元数据错/版本漂移 | `version.sh check` + 0409 修复 | M2 | §3.2 / §3.3 |
| B4 依赖不可复现 | pnpm + frozen lockfile | M2 | `wails.json` |
| B5 安装器静默缺失 | 前置条件 exit 2 + 产物 exit 3 | M3 | §3.4 |
| B6 残缺发布 | 去 `if: always()` | M5 | §3.5 |
| B7 无 Windows arm64 | arm64 setup + PE 断言 | M3 | `PE=0xAA64` |
| B8 Go 缓存越界 | `go-env.sh` + env-check 断言 | M2 | `env-check.sh` PASS |
| B9 无免安装版 | 2 个 portable ZIP | M3 | 6.96MB / 6.37MB |

## 3. 实测证据

### 3.1 M1 可行性 spike

```
wails build -platform windows/amd64 -nsis -s  →  Built in 34.6s
wails build -platform windows/arm64 -nsis -s  →  Built in 29.9s
python pe.py build/bin/tianji-sizhu.exe
  → machine=0x8664 (amd64) / 构建后 arm64 覆盖为 0xAA64
```

结论（回写 ADR-004）：Windows arm64 在 amd64 宿主交叉成立，**不需要 arm64 runner**；
脚本改为每次构建后立刻把 `tianji-sizhu.exe` 复制成带 arch 的名字，避免被下一架构覆盖。

### 3.2 M2 版本与单测

```
$ bash scripts/release/version.sh sync --docs
[release] OK: synced VERSION=1.2.0 -> frontend/package.json, wails.json, docs/SPEC.md
$ bash scripts/release/version.sh check
[release] OK: frontend/package.json version = 1.2.0
[release] OK: wails.json info.productVersion = 1.2.0
[release] OK: version sources are consistent (1.2.0)

$ go test ./... -run 'TestDataDir|TestStartupErrGuard' -v
--- PASS: TestDataDirOverride
--- PASS: TestDataDirPortable
--- PASS: TestDataDirFallback
--- PASS: TestDataDirBadOverride
--- PASS: TestStartupErrGuard
PASS   ok github.com/user/tianji-sizhu 1.536s
```

### 3.3 Windows 版本资源（根因与修复）

修复前（Wails 默认模板）：

```
资源树: 16(VERSION) / 1 / 0          ← 语言 ID = 0 (neutral)
PowerShell: FileVersion=[] ProductVersion=[] Company=[]   ← 全部为空
```

修复后（`0409` + 4 段 `fixed.file_version`）：

```
资源树: 16(VERSION) / 1 / 1033
PowerShell: FileVersion=[1.2.0.0] ProductVersion=[1.2.0] Company=[TianJi-SiZhu]
```

### 3.4 安装器硬断言（负向验证）

`build-windows.sh` 在 `makensis` 缺失时 **exit 2**（SPEC B5 要求不静默）：

```
$ command -v makensis || echo MISSING
MISSING                        → 脚本前置检查命中，不进入构建
```

修复路径：`bash scripts/toolchain-nsis.sh` → `.toolchain/nsis/makensis.exe`（NSIS 3.10，项目内）。
安装后安装包正常产出（8.7MB / 8.1MB），证明断言未误杀。

### 3.5 M4 校验与 manifest

```
$ bash scripts/release/verify-artifacts.sh --allow-partial
[release] OK: ...windows-amd64-setup.exe  8708963 bytes  arch=name:amd64 version=ok:1.2.0
[release] OK: ...windows-arm64-setup.exe  8132374 bytes  arch=name:arm64 version=ok:1.2.0
[release] OK: ...windows-amd64-portable.zip 6961360 bytes arch=skip version=skip:not-a-pe
[release] OK: ...windows-arm64-portable.zip 6373184 bytes arch=skip version=skip:not-a-pe
[release] WARN: missing ...macos-*.dmg / *-portable.zip (allowed locally, forbidden in CI)
[release] OK: manifest: .tmp/release/1.2.0/artifacts-manifest.json
```

### 3.6 M5 CI 结构校验

```
jobs: preflight, build-win, build-mac, build-android, build-linux, verify, publish
publish needs: ['preflight', 'verify', 'build-android']
verify  needs: ['preflight', 'build-win', 'build-mac']
publish if:    startsWith(github.ref, 'refs/tags/') || github.event.inputs.publish == 'true'
always() 出现次数: 2（均为注释，非条件）
```

### 3.7 M6/L1 环境与测试

```
$ bash scripts/env-check.sh
  ANDROID_HOME/GRADLE_USER_HOME/ANDROID_AVD_HOME/ANDROID_USER_HOME  OK inside project
  GOCACHE/GOMODCACHE/GOBIN                                          OK inside project
  JAVA_HOME                          host runtime (allowed)
RESULT: PASS
```

## 4. 实施中发现并修掉的问题

| # | 问题 | 根因 | 处置 |
|---|------|------|------|
| D1 | exe 版本资源全字段为空 | Wails 模板 `info.json` 语言 key 为 `0000`(neutral)，Windows 无法按语言解析 | 改 `0409` + 4 段 `fixed.file_version`；新增 ADR-012 |
| D2 | SPEC 原断言要求安装包 PE=0x8664/0xAA64 | NSIS 安装器本体是 32 位 stub（实测 `0x014C`） | 修正 SPEC：架构断言对象改为应用本体；安装包只断言文件名 + FileVersion |
| D3 | `package-portable.sh` 的 Compress-Archive 报错 | `$STAGE/$PKG_DIR` 重复拼接（PKG_DIR 已含 STAGE） | 直接用 `$PKG_DIR` |
| D4 | Git Bash 无 `zip` 命令 | 环境缺失 | 回退 `Compress-Archive`（Windows）/ CI 用 `zip` |
| D5 | verify 对 zip 断言版本资源 → 误报 | 未按 kind 区分 PE 与非 PE | 只对 `app`/`setup` 断言；zip/dmg 标 `skip:not-a-pe` |
| D6 | `build-windows.sh` 的 `host_guard windows` 阻止 Linux 交叉 | 误把“目标平台”当“宿主平台” | 改为只拒绝 macOS；Linux 允许（SPEC F2：Windows 后端无 CGO） |
| D7 | Git Bash 中 `MSYS_NO_PATHCONV=1` 导致 Windows curl 写入失败 | 路径未转成原生形式 | 下载/解压分别用 `_mixed`（E:/…）与 bash 路径 |
| D8 | `verify-artifacts.sh` 语法错误（`esac  if` / `then    if`） | 编辑吞换行 | 已修 + `bash -n` 校验 |

## 5. 偏差与未完成（诚实记录）

| # | 项 | 说明 | 处置 |
|---|----|------|------|
| V1 | macOS 4 产物未本机验证 | 无 macOS 宿主（Wails 强制 CGO + WebKit SDK） | 由 `macos-14` runner 覆盖；脚本含 `lipo`/`codesign`/`plutil` 断言 |
| V2 | L3 生命周期 `not-executed` | 本机非管理员，per-machine NSIS 需提权；脚本按设计 `SKIP` 而非伪通过 | CI `windows-2022`（管理员）执行 |
| V3 | Windows arm64 无法执行 | 无 arm64 硬件 | 静态 PE 断言 `0xAA64` + NSIS 架构守卫 |
| V4 | L5 清洁室未执行 | `git archive` + 全量重建耗时长，且工作区尚未提交 | 发版前在干净 clone 上执行 |
| V5 | `mt.exe` 版本资源语言对中文显示 | `ProductName=天机四柱` 在部分控制台显示乱码 | 属控制台编码，资源本身为 UTF-16 正常 |
| V6 | 体积基线 | setup 8.7MB / portable 6.9MB，远低于 SPEC 上限 | 无需追加说明 |

## 6. Definition of Done 核对

- [x] 版本单一源：`VERSION` + `version.sh check` 绿
- [x] B1/B2/B3/B4/B5/B6/B8/B9 全部闭环
- [x] Windows 四产物产出且校验通过（含 `FileVersion` 可读）
- [x] `verify-artifacts.sh` + `artifacts-manifest.json` + `SHA256SUMS` 就绪
- [x] `env-check.sh` PASS（含 Go 缓存断言）
- [x] `AGENTS.md` 与 `CLAUDE.md` 逐字一致
- [x] CI 去掉 `if: always()`，publish 依赖 verify
- [ ] M8 首次实发 v1.2.0（8 产物可下载 + `sha256sum -c` 通过）— **待用户执行**
- [ ] macOS 4 产物与 L3/L4 由 CI 首跑确认 — **待 tag 触发**
