package database

import (
	"os"
	"path/filepath"
	"testing"
)

func setupTestDB(t *testing.T) (*DB, func()) {
	t.Helper()
	dir := t.TempDir()
	dbPath := filepath.Join(dir, "test.db")
	db, err := Open(dbPath)
	if err != nil {
		t.Fatalf("failed to open test db: %v", err)
	}
	return db, func() {
		db.Close()
		os.Remove(dbPath)
	}
}

func TestOpenAndMigrate(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	if db == nil {
		t.Fatal("db should not be nil")
	}
}

func TestSaveAndGetChart(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	id, err := db.SaveChart("test-user", 0, 1990, 6, 15, 3, 0, `{"test":"data"}`, "notes here", "2026-06-04T12:00:00Z")
	if err != nil {
		t.Fatalf("SaveChart failed: %v", err)
	}
	if id <= 0 {
		t.Fatalf("expected positive id, got %d", id)
	}

	chart, err := db.GetChart(id)
	if err != nil {
		t.Fatalf("GetChart failed: %v", err)
	}
	if chart.Name != "test-user" {
		t.Errorf("expected name 'test-user', got '%s'", chart.Name)
	}
	if chart.Gender != 0 {
		t.Errorf("expected gender 0, got %d", chart.Gender)
	}
	if chart.BirthYear != 1990 {
		t.Errorf("expected birth year 1990, got %d", chart.BirthYear)
	}
	if chart.ChartData != `{"test":"data"}` {
		t.Errorf("unexpected chart data: %s", chart.ChartData)
	}
	if chart.Notes != "notes here" {
		t.Errorf("expected notes 'notes here', got '%s'", chart.Notes)
	}
}

func TestListCharts(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	// empty list
	list, err := db.ListCharts()
	if err != nil {
		t.Fatalf("ListCharts failed: %v", err)
	}
	if len(list) != 0 {
		t.Errorf("expected empty list, got %d", len(list))
	}

	// add two records
	db.SaveChart("user-a", 0, 1990, 1, 1, 0, 0, "{}", "", "2026-01-01T00:00:00Z")
	db.SaveChart("user-b", 1, 2000, 12, 31, 11, 0, "{}", "", "2026-01-02T00:00:00Z")

	list, err = db.ListCharts()
	if err != nil {
		t.Fatalf("ListCharts failed: %v", err)
	}
	if len(list) != 2 {
		t.Errorf("expected 2 records, got %d", len(list))
	}
	// should be ordered by created_at DESC
	if list[0].Name != "user-b" {
		t.Errorf("expected first record 'user-b', got '%s'", list[0].Name)
	}
}

func TestDeleteChart(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	id, _ := db.SaveChart("to-delete", 0, 1990, 1, 1, 0, 0, "{}", "", "2026-01-01T00:00:00Z")

	err := db.DeleteChart(id)
	if err != nil {
		t.Fatalf("DeleteChart failed: %v", err)
	}

	_, err = db.GetChart(id)
	if err == nil {
		t.Error("expected error after deletion, got nil")
	}
}

func TestExportAll(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	db.SaveChart("export-a", 0, 1990, 1, 1, 0, 0, `{"a":1}`, "", "2026-01-01T00:00:00Z")
	db.SaveChart("export-b", 1, 2000, 6, 15, 5, 0, `{"b":2}`, "note", "2026-01-02T00:00:00Z")

	all, err := db.ExportAll()
	if err != nil {
		t.Fatalf("ExportAll failed: %v", err)
	}
	if len(all) != 2 {
		t.Errorf("expected 2 records, got %d", len(all))
	}
	if all[0].ChartData != `{"b":2}` {
		t.Errorf("unexpected first export chart data: %s", all[0].ChartData)
	}
}
