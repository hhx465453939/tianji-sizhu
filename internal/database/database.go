package database

import (
	"database/sql"
	"fmt"

	_ "modernc.org/sqlite"
)

type DB struct {
	conn *sql.DB
}

type Chart struct {
	ID         int64  `json:"id"`
	Name       string `json:"name"`
	Gender     int    `json:"gender"`
	BirthYear  int    `json:"birthYear"`
	BirthMonth int    `json:"birthMonth"`
	BirthDay   int    `json:"birthDay"`
	BirthHour  int    `json:"birthHour"`
	Calendar   int    `json:"calendar"`
	ChartData  string `json:"chartData"`
	Notes      string `json:"notes"`
	CreatedAt  string `json:"createdAt"`
	UpdatedAt  string `json:"updatedAt"`
}

type ChartSummary struct {
	ID         int64  `json:"id"`
	Name       string `json:"name"`
	Gender     int    `json:"gender"`
	BirthYear  int    `json:"birthYear"`
	BirthMonth int    `json:"birthMonth"`
	BirthDay   int    `json:"birthDay"`
	BirthHour  int    `json:"birthHour"`
	Calendar   int    `json:"calendar"`
	CreatedAt  string `json:"createdAt"`
}

func Open(path string) (*DB, error) {
	conn, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	if err := conn.Ping(); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}

	db := &DB{conn: conn}
	if err := db.migrate(); err != nil {
		return nil, fmt.Errorf("migrate: %w", err)
	}

	return db, nil
}

func (db *DB) Close() error {
	return db.conn.Close()
}

func (db *DB) migrate() error {
	schema := `
	CREATE TABLE IF NOT EXISTS charts (
		id          INTEGER PRIMARY KEY AUTOINCREMENT,
		name        TEXT NOT NULL,
		gender      INTEGER NOT NULL,
		birth_year  INTEGER NOT NULL,
		birth_month INTEGER NOT NULL,
		birth_day   INTEGER NOT NULL,
		birth_hour  INTEGER NOT NULL,
		calendar    INTEGER DEFAULT 0,
		chart_data  TEXT NOT NULL,
		notes       TEXT DEFAULT '',
		created_at  TEXT NOT NULL,
		updated_at  TEXT NOT NULL
	);
	CREATE INDEX IF NOT EXISTS idx_charts_name ON charts(name);
	CREATE INDEX IF NOT EXISTS idx_charts_created ON charts(created_at);
	`
	_, err := db.conn.Exec(schema)
	return err
}

func (db *DB) SaveChart(name string, gender int, birthYear, birthMonth, birthDay, birthHour int, calendar int, chartData string, notes string, now string) (int64, error) {
	res, err := db.conn.Exec(
		`INSERT INTO charts (name, gender, birth_year, birth_month, birth_day, birth_hour, calendar, chart_data, notes, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		name, gender, birthYear, birthMonth, birthDay, birthHour, calendar, chartData, notes, now, now,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (db *DB) GetChart(id int64) (*Chart, error) {
	row := db.conn.QueryRow(
		`SELECT id, name, gender, birth_year, birth_month, birth_day, birth_hour, calendar, chart_data, notes, created_at, updated_at
		 FROM charts WHERE id = ?`, id,
	)
	var c Chart
	err := row.Scan(&c.ID, &c.Name, &c.Gender, &c.BirthYear, &c.BirthMonth, &c.BirthDay, &c.BirthHour, &c.Calendar, &c.ChartData, &c.Notes, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (db *DB) ListCharts() ([]ChartSummary, error) {
	rows, err := db.conn.Query(`SELECT id, name, gender, birth_year, birth_month, birth_day, birth_hour, calendar, created_at FROM charts ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var charts []ChartSummary
	for rows.Next() {
		var c ChartSummary
		if err := rows.Scan(&c.ID, &c.Name, &c.Gender, &c.BirthYear, &c.BirthMonth, &c.BirthDay, &c.BirthHour, &c.Calendar, &c.CreatedAt); err != nil {
			return nil, err
		}
		charts = append(charts, c)
	}
	return charts, nil
}

func (db *DB) DeleteChart(id int64) error {
	_, err := db.conn.Exec(`DELETE FROM charts WHERE id = ?`, id)
	return err
}

func (db *DB) ExportAll() ([]Chart, error) {
	rows, err := db.conn.Query(
		`SELECT id, name, gender, birth_year, birth_month, birth_day, birth_hour, calendar, chart_data, notes, created_at, updated_at
		 FROM charts ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var charts []Chart
	for rows.Next() {
		var c Chart
		if err := rows.Scan(&c.ID, &c.Name, &c.Gender, &c.BirthYear, &c.BirthMonth, &c.BirthDay, &c.BirthHour, &c.Calendar, &c.ChartData, &c.Notes, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		charts = append(charts, c)
	}
	return charts, nil
}
