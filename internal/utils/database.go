package utils

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"sort"
	"strings"

	_ "github.com/mattn/go-sqlite3"
)

// Database 数据库连接管理
type Database struct {
	DB *sql.DB
}

// NewDatabase 创建新的数据库连接
func NewDatabase(dbPath string) (*Database, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	database := &Database{DB: db}
	if err := database.CreateTables(); err != nil {
		return nil, fmt.Errorf("failed to create tables: %w", err)
	}

	return database, nil
}

// CreateTables 创建数据库表
func (d *Database) CreateTables() error {
	fingerprintTable := `
	CREATE TABLE IF NOT EXISTS fingerprints (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		fingerprint_hash TEXT UNIQUE NOT NULL,
		user_agent TEXT NOT NULL,
		screen_resolution TEXT NOT NULL,
		timezone TEXT NOT NULL,
		language TEXT NOT NULL,
		platform TEXT NOT NULL,
		canvas TEXT NOT NULL,
		canvas_hash TEXT NOT NULL,
		webgl TEXT NOT NULL,
		webgl_hash TEXT NOT NULL,
		audio TEXT NOT NULL,
		audio_hash TEXT NOT NULL,
		fonts TEXT NOT NULL,
		plugins TEXT NOT NULL,
		touch_support BOOLEAN NOT NULL,
		cookie_enabled BOOLEAN NOT NULL,
		do_not_track TEXT NOT NULL,
		ip_address TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	analysisTable := `
	CREATE TABLE IF NOT EXISTS analysis (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		fingerprint_hash TEXT UNIQUE NOT NULL,
		uniqueness_score REAL NOT NULL,
		bot_score REAL NOT NULL,
		risk_level TEXT NOT NULL,
		is_bot BOOLEAN NOT NULL,
		reasons TEXT NOT NULL,
		visit_count INTEGER DEFAULT 1,
		last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (fingerprint_hash) REFERENCES fingerprints (fingerprint_hash)
	);`

	if _, err := d.DB.Exec(fingerprintTable); err != nil {
		return fmt.Errorf("failed to create fingerprints table: %w", err)
	}

	if _, err := d.DB.Exec(analysisTable); err != nil {
		return fmt.Errorf("failed to create analysis table: %w", err)
	}

	log.Println("Database tables created successfully")
	return nil
}

// Close 关闭数据库连接
func (d *Database) Close() error {
	return d.DB.Close()
}

// GenerateFingerprintHash 生成指纹哈希
func GenerateFingerprintHash(data map[string]interface{}) string {
	// 按键名排序以确保一致性
	keys := make([]string, 0, len(data))
	for k := range data {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var parts []string
	for _, k := range keys {
		value := fmt.Sprintf("%v", data[k])
		parts = append(parts, fmt.Sprintf("%s:%s", k, value))
	}

	combined := strings.Join(parts, "|")
	hash := sha256.Sum256([]byte(combined))
	return hex.EncodeToString(hash[:])
}

// GenerateCanvasHash 生成Canvas指纹哈希（去噪处理）
func GenerateCanvasHash(canvasData string) string {
	// 这里可以添加去噪逻辑
	// 例如：移除随机噪点、标准化固定噪点等
	processedData := processCanvasData(canvasData)
	hash := sha256.Sum256([]byte(processedData))
	return hex.EncodeToString(hash[:])
}

// processCanvasData 处理Canvas数据去除噪点
func processCanvasData(data string) string {
	// 简单的去噪处理示例
	// 实际应用中可能需要更复杂的算法
	
	// 1. 移除可能的随机噪点（假设噪点会导致数据长度异常）
	if len(data) > 10000 { // 异常长的数据可能包含噪点
		data = data[:10000]
	}
	
	// 2. 标准化处理
	data = strings.TrimSpace(data)
	data = strings.ToLower(data)
	
	return data
}

// StringSliceToJSON 将字符串切片转换为JSON
func StringSliceToJSON(slice []string) string {
	jsonData, err := json.Marshal(slice)
	if err != nil {
		log.Printf("Error marshaling slice to JSON: %v", err)
		return "[]"
	}
	return string(jsonData)
}

// JSONToStringSlice 将JSON转换为字符串切片
func JSONToStringSlice(jsonStr string) []string {
	var slice []string
	err := json.Unmarshal([]byte(jsonStr), &slice)
	if err != nil {
		log.Printf("Error unmarshaling JSON to slice: %v", err)
		return []string{}
	}
	return slice
}

// GetClientIP 获取客户端IP地址
func GetClientIP(xff, realIP, remoteAddr string) string {
	if xff != "" {
		// X-Forwarded-For可能包含多个IP，取第一个
		ips := strings.Split(xff, ",")
		if len(ips) > 0 {
			return strings.TrimSpace(ips[0])
		}
	}
	
	if realIP != "" {
		return realIP
	}
	
	// 从RemoteAddr中提取IP
	if idx := strings.LastIndex(remoteAddr, ":"); idx != -1 {
		return remoteAddr[:idx]
	}
	
	return remoteAddr
}
