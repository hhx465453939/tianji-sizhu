package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/user/tianji-sizhu/internal/database"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx context.Context
	db  *database.DB
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	dbPath := getDBPath()
	db, err := database.Open(dbPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to open database: %v\n", err)
		return
	}
	a.db = db
}

func (a *App) shutdown(ctx context.Context) {
	if a.db != nil {
		a.db.Close()
	}
}

// SaveChart saves a bazi chart record to the database
func (a *App) SaveChart(name string, gender int, birthYear, birthMonth, birthDay, birthHour int, calendar int, chartDataJSON string, notes string) (int64, error) {
	now := time.Now().Format(time.RFC3339)
	return a.db.SaveChart(name, gender, birthYear, birthMonth, birthDay, birthHour, calendar, chartDataJSON, notes, now)
}

// GetChart retrieves a chart by ID
func (a *App) GetChart(id int64) (*database.Chart, error) {
	return a.db.GetChart(id)
}

// ListCharts returns all saved charts
func (a *App) ListCharts() ([]database.ChartSummary, error) {
	return a.db.ListCharts()
}

// DeleteChart removes a chart by ID
func (a *App) DeleteChart(id int64) error {
	return a.db.DeleteChart(id)
}

// ExportChartsJSON exports all charts as JSON string
func (a *App) ExportChartsJSON() (string, error) {
	charts, err := a.db.ExportAll()
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

// getDataDir returns the data directory next to the executable.
// e.g. exe at "E:\software\tianji\tianji-sizhu.exe" → "E:\software\tianji\data\"
func getDataDir() string {
	exe, err := os.Executable()
	if err != nil {
		// fallback to current working directory
		exe, _ = filepath.Abs(".")
	}
	dir := filepath.Join(filepath.Dir(exe), "data")
	os.MkdirAll(dir, 0755)
	return dir
}

func getDBPath() string {
	return filepath.Join(getDataDir(), "charts.db")
}
