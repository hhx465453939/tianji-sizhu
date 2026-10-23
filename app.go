package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	goruntime "runtime"
	"strings"
	"time"

	"github.com/user/tianji-sizhu/internal/database"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx context.Context
	db  *database.DB

	// startupErr carries the reason persistence is unavailable so the UI can
	// surface it instead of showing a blank window (CHG-004 ADR-003).
	startupErr string
	dataDir    string
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	dir, err := resolveDataDir()
	if err != nil {
		a.startupErr = fmt.Sprintf("无法准备数据目录：%v", err)
		writeStartupLog(dir, a.startupErr)
		return
	}
	a.dataDir = dir

	db, err := database.Open(filepath.Join(dir, "charts.db"))
	if err != nil {
		a.startupErr = fmt.Sprintf("无法打开数据库：%v", err)
		writeStartupLog(dir, a.startupErr)
		return
	}
	a.db = db
	writeStartupLog(dir, "startup ok")
}

func (a *App) shutdown(ctx context.Context) {
	if a.db != nil {
		a.db.Close()
	}
}

// StartupError reports why local persistence is unavailable. Empty means healthy.
// Bound to the frontend so a read-only install directory is visible, not silent.
func (a *App) StartupError() string {
	return a.startupErr
}

// DataDir exposes the resolved data directory (diagnostics / settings display).
func (a *App) DataDir() string {
	return a.dataDir
}

func (a *App) dbOrErr() (*database.DB, error) {
	if a.db != nil {
		return a.db, nil
	}
	if a.startupErr != "" {
		return nil, errors.New(a.startupErr)
	}
	return nil, errors.New("数据库未初始化")
}

// SaveChart saves a bazi chart record to the database
func (a *App) SaveChart(name string, gender int, birthYear, birthMonth, birthDay, birthHour int, calendar int, chartDataJSON string, notes string) (int64, error) {
	db, err := a.dbOrErr()
	if err != nil {
		return 0, err
	}
	now := time.Now().Format(time.RFC3339)
	return db.SaveChart(name, gender, birthYear, birthMonth, birthDay, birthHour, calendar, chartDataJSON, notes, now)
}

// GetChart retrieves a chart by ID
func (a *App) GetChart(id int64) (*database.Chart, error) {
	db, err := a.dbOrErr()
	if err != nil {
		return nil, err
	}
	return db.GetChart(id)
}

// ListCharts returns all saved charts
func (a *App) ListCharts() ([]database.ChartSummary, error) {
	db, err := a.dbOrErr()
	if err != nil {
		return nil, err
	}
	return db.ListCharts()
}

// DeleteChart removes a chart by ID
func (a *App) DeleteChart(id int64) error {
	db, err := a.dbOrErr()
	if err != nil {
		return err
	}
	return db.DeleteChart(id)
}

// ExportChartsJSON exports all charts as JSON string
func (a *App) ExportChartsJSON() (string, error) {
	db, err := a.dbOrErr()
	if err != nil {
		return "", err
	}
	charts, err := db.ExportAll()
	if err != nil {
		return "", err
	}
	data, err := json.MarshalIndent(charts, "", "  ")
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// SaveFileDialog opens a native save file dialog and returns the selected path
func (a *App) SaveFileDialog(defaultFilename string) (string, error) {
	return runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		DefaultFilename: defaultFilename,
		Filters: []runtime.FileFilter{
			{DisplayName: "JSON Files", Pattern: "*.json"},
		},
	})
}

// WriteFile writes content to a file path
func (a *App) WriteFile(path string, content string) error {
	return os.WriteFile(path, []byte(content), 0644)
}

// CopyToClipboard copies text to system clipboard
func (a *App) CopyToClipboard(text string) error {
	runtime.ClipboardSetText(a.ctx, text)
	return nil
}

// --- data directory resolution (CHG-004 ADR-003) -------------------------
//
// Order:
//  1. TJS_DATA_DIR              explicit override (tests / enterprise redirect)
//  2. <exe_dir>/data            only when writable -> keeps portable semantics
//  3. platform user data dir    installed builds live under Program Files
//                               (per-machine, admin-only) or inside a signed
//                               macOS bundle, so neither can host user data.
func resolveDataDir() (string, error) {
	exe, err := os.Executable()
	if err != nil {
		exe = ""
	}
	return resolveDataDirFor(exe, strings.TrimSpace(os.Getenv("TJS_DATA_DIR")))
}

// resolveDataDirFor is the testable core: both the executable path and the
// environment override are injected so unit tests can exercise every branch.
func resolveDataDirFor(exePath, override string) (string, error) {
	if override != "" {
		if err := ensureWritableDir(override); err != nil {
			return override, fmt.Errorf("TJS_DATA_DIR %q: %w", override, err)
		}
		return override, nil
	}

	if exePath != "" {
		portable := filepath.Join(filepath.Dir(exePath), "data")
		if err := ensureWritableDir(portable); err == nil {
			return portable, nil
		}
	}

	base, err := platformDataBase()
	if err != nil {
		return "", err
	}
	fallback := filepath.Join(base, appDataDirName(), "data")
	if err := ensureWritableDir(fallback); err != nil {
		return fallback, fmt.Errorf("platform data dir %q: %w", fallback, err)
	}
	return fallback, nil
}

func appDataDirName() string {
	if goruntime.GOOS == "linux" {
		return "tianji-sizhu"
	}
	return "TianJi-SiZhu"
}

func platformDataBase() (string, error) {
	switch goruntime.GOOS {
	case "windows":
		if v := strings.TrimSpace(os.Getenv("LOCALAPPDATA")); v != "" {
			return v, nil
		}
		return os.UserCacheDir()
	case "darwin":
		home, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		return filepath.Join(home, "Library", "Application Support"), nil
	default:
		if v := strings.TrimSpace(os.Getenv("XDG_DATA_HOME")); v != "" {
			return v, nil
		}
		home, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		return filepath.Join(home, ".local", "share"), nil
	}
}

// ensureWritableDir creates dir and proves it accepts writes by round-tripping
// a probe file. Existence alone is not enough: Program Files is readable but
// not writable for standard users.
func ensureWritableDir(dir string) error {
	if dir == "" {
		return errors.New("empty directory")
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}
	probe, err := os.CreateTemp(dir, ".probe-*")
	if err != nil {
		return err
	}
	name := probe.Name()
	_ = probe.Close()
	_ = os.Remove(name)
	return nil
}

func writeStartupLog(dir, msg string) {
	if dir == "" {
		return
	}
	path := filepath.Join(dir, "startup.log")
	f, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644)
	if err != nil {
		return
	}
	defer f.Close()
	fmt.Fprintf(f, "%s %s\n", time.Now().Format(time.RFC3339), msg)
}
