# TianJi-SiZhu 项目指南

## 项目简介

天机四柱 — 开源八字排盘桌面客户端（Wails + React + Go）

## 技术栈

- **桌面框架**: Wails v2 (Go + WebView2)
- **前端**: React 18 + TypeScript + Vite + TailwindCSS
- **排盘算法**: mystilight-8char (前端 JS 直接调用)
- **可视化**: ECharts
- **后端**: Go (SQLite + 系统交互)
- **目标平台**: Windows x64 (优先)

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

## 硬件限制（重要）

本机为低配开发机，开发过程必须注意资源占用：

- **CPU**: i3-2130 (2核4线程) — 避免并行重型编译
- **内存**: 8GB，常驻进程多，可用通常仅 1-2GB
- **无 GPU 加速**
- **Swap 经常打满** — 内存溢出会导致系统严重卡顿

### 开发约束

1. **测试必须串行执行**，绝对不能并行跑多个测试进程
2. **构建使用增量模式**，避免全量 rebuild
3. **不要同时启动多个 dev server**
4. **pnpm install 加 --prefer-offline** 减少网络+内存开销
5. **Go 编译不加 -race**（race detector 内存翻倍）
6. **单次 wails dev 即可**，不要额外起 vite dev server

## 注意事项

1. 不要自行发起 git 操作，除非用户明确要求
2. 前端代码注释用英文（与社区一致）
3. Go 代码注释用英文
4. 优先使用 pnpm 管理前端依赖
5. SQLite 使用 modernc.org/sqlite（纯 Go，无 CGO 依赖）
6. 每次修改前先读后写，理解现有代码再改
7. 构建产物不提交到 git

## 关键路径

- 规格文档: `docs/SPEC.md`
- 前端入口: `frontend/src/main.tsx`
- Go 入口: `main.go`
- Wails 配置: `wails.json`
- 数据库逻辑: `internal/database/`

## 构建命令

```bash
# 开发模式
wails dev

# 生产构建
wails build -platform windows/amd64
```
## 未来发布新版本的流程

### 1. 改代码、提交
git add . && git commit -m "feat: xxx"

### 2. 更新版本号（手动改 package.json 和 SPEC.md）
### 3. 提交版本号 + 打 tag + push
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin main --tags

### → GitHub Actions 自动构建 + 发布到 Releases