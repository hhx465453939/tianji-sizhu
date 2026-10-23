package main

import (
	"os"
	"path/filepath"
	goruntime "runtime"
	"strings"
	"testing"
)

// baseEnvVar returns the env var that platformDataBase() reads first.
func baseEnvVar() string {
	switch goruntime.GOOS {
	case "windows":
		return "LOCALAPPDATA"
	case "darwin":
		return "" // macOS derives from $HOME; covered indirectly
	default:
		return "XDG_DATA_HOME"
	}
}

// Override must take precedence over everything else.
func TestDataDirOverride(t *testing.T) {
	custom := filepath.Join(t.TempDir(), "custom-data")
	got, err := resolveDataDirFor(filepath.Join(t.TempDir(), "app.exe"), custom)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != custom {
		t.Fatalf("override not honoured: got %q want %q", got, custom)
	}
	if _, statErr := os.Stat(custom); statErr != nil {
		t.Fatalf("override dir was not created: %v", statErr)
	}
}

// With no override, a writable dir next to the exe keeps portable semantics
// (zero migration for existing portable users).
func TestDataDirPortable(t *testing.T) {
	exeDir := t.TempDir()
	exe := filepath.Join(exeDir, "tianji-sizhu.exe")
	got, err := resolveDataDirFor(exe, "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := filepath.Join(exeDir, "data")
	if got != want {
		t.Fatalf("portable dir not selected: got %q want %q", got, want)
	}
}

// Installed-build case (Program Files / signed .app): a file blocking the
// path makes MkdirAll fail on every OS, so the resolver must fall back to the
// platform user directory.
func TestDataDirFallback(t *testing.T) {
	tmp := t.TempDir()
	blocker := filepath.Join(tmp, "ProgramFiles")
	if err := os.WriteFile(blocker, []byte("not a directory"), 0o644); err != nil {
		t.Fatalf("setup: %v", err)
	}
	exe := filepath.Join(blocker, "tianji-sizhu.exe")

	if envVar := baseEnvVar(); envVar != "" {
		t.Setenv(envVar, t.TempDir())
	}

	got, err := resolveDataDirFor(exe, "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if strings.HasPrefix(got, blocker) {
		t.Fatalf("resolver stayed inside the unwritable location: %q", got)
	}
	if !strings.HasSuffix(filepath.ToSlash(got), "/data") {
		t.Fatalf("fallback should end with /data, got %q", got)
	}
}

// An explicit override that cannot be created must produce a readable error,
// never a silent success.
func TestDataDirBadOverride(t *testing.T) {
	tmp := t.TempDir()
	blocker := filepath.Join(tmp, "blocker")
	if err := os.WriteFile(blocker, []byte("x"), 0o644); err != nil {
		t.Fatalf("setup: %v", err)
	}
	override := filepath.Join(blocker, "data")

	got, err := resolveDataDirFor(filepath.Join(tmp, "app.exe"), override)
	if err == nil {
		t.Fatalf("expected error for unwritable override, got dir %q", got)
	}
	if !strings.Contains(err.Error(), "TJS_DATA_DIR") {
		t.Fatalf("error should name the variable, got: %v", err)
	}
}

// With no database the App must report the reason instead of panicking on a
// nil dereference (the "installed but unusable" failure mode).
func TestStartupErrGuard(t *testing.T) {
	app := NewApp()
	app.startupErr = "boom: data dir unavailable"

	if got := app.StartupError(); got != "boom: data dir unavailable" {
		t.Fatalf("StartupError not surfaced: %q", got)
	}
	if _, err := app.SaveChart("x", 0, 1990, 1, 1, 0, 0, "{}", ""); err == nil {
		t.Fatal("SaveChart should fail when the database is unavailable")
	}
	if _, err := app.ListCharts(); err == nil {
		t.Fatal("ListCharts should fail when the database is unavailable")
	}
	if _, err := app.ExportChartsJSON(); err == nil {
		t.Fatal("ExportChartsJSON should fail when the database is unavailable")
	}
	if err := app.DeleteChart(1); err == nil {
		t.Fatal("DeleteChart should fail when the database is unavailable")
	}
}
