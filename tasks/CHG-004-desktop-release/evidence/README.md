# 证据归档规范（CHG-004）

本目录存放 CHG-004 的验收证据。**没有证据的验收条目一律视为未完成。**

## 目录约定

```
evidence/
  M1-spike/          # 四组合构建可行性实测
  M2-blockers/       # 数据目录/版本单一源/Go 缓存
  M3-packaging/      # 8 产物 + 清单
  M4-verify/         # L2 校验 + L3/L4 生命周期
  M5-ci/             # workflow_dispatch dry-run
  M6-cnb/            # CNB Windows 4 产物
  M7-cleanroom/      # L5 清洁室 + 文档
  M8-release/        # 实发与 sha256sum -c
```

## 文件命名

`<日期>-<宿主>-<动作>.<ext>`，例：

- `2026-10-23-win11-amd64-build-windows-amd64.log`
- `2026-10-23-macos14-arm64-smoke-macos-arm64.log`
- `2026-10-23-win11-amd64-uninstall-registry-before-after.txt`

## 每条证据的最小内容

```markdown
## <动作>
- 宿主: <OS> <arch> · Go <ver> · Wails <ver> · pnpm <ver>
- 命令: <完整命令，可复制>
- 时间: <YYYY-MM-DD HH:MM TZ>
- 结果: PASS / FAIL / SKIP:<原因>
- 关键输出:
  <粘贴 ≤20 行，保留架构位/版本串/哈希等判定行>
- 产物:
  <file> · <bytes> · sha256=<64 hex>
```

## 硬规则

1. **禁止只写"已验证"**。要么有命令与输出，要么状态写 `未开始`。
2. 产物二进制不入库（`.gitignore` 已覆盖 `*.exe/*.dmg/*.zip`），只留 `sha256` 与 `bytes`。
3. `SKIP` 必须写原因，并回填 `TRACEABILITY.md` 的降级说明；**不得**把 `SKIP` 记成 `PASS`。
4. 单个日志/截图 ≤ 200KB；超长日志截取判定行，完整日志附外部链接或哈希。
5. 每次补证据后同步更新 `TRACEABILITY.md` 对应行的"证据"列与"状态"列。
