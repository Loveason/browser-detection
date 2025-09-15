package models

import (
	"time"
)

// Fingerprint 表示浏览器指纹数据
type Fingerprint struct {
	ID               int       `json:"id" db:"id"`
	FingerprintHash  string    `json:"fingerprint_hash" db:"fingerprint_hash"`
	UserAgent        string    `json:"user_agent" db:"user_agent"`
	ScreenResolution string    `json:"screen_resolution" db:"screen_resolution"`
	Timezone         string    `json:"timezone" db:"timezone"`
	Language         string    `json:"language" db:"language"`
	Platform         string    `json:"platform" db:"platform"`
	Canvas           string    `json:"canvas" db:"canvas"`
	CanvasHash       string    `json:"canvas_hash" db:"canvas_hash"`
	WebGL            string    `json:"webgl" db:"webgl"`
	WebGLHash        string    `json:"webgl_hash" db:"webgl_hash"`
	Audio            string    `json:"audio" db:"audio"`
	AudioHash        string    `json:"audio_hash" db:"audio_hash"`
	Fonts            string    `json:"fonts" db:"fonts"` // JSON数组字符串
	Plugins          string    `json:"plugins" db:"plugins"` // JSON数组字符串
	TouchSupport     bool      `json:"touch_support" db:"touch_support"`
	CookieEnabled    bool      `json:"cookie_enabled" db:"cookie_enabled"`
	DoNotTrack       string    `json:"do_not_track" db:"do_not_track"`
	IPAddress        string    `json:"ip_address" db:"ip_address"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time `json:"updated_at" db:"updated_at"`
}

// Analysis 表示指纹分析结果
type Analysis struct {
	ID              int       `json:"id" db:"id"`
	FingerprintHash string    `json:"fingerprint_hash" db:"fingerprint_hash"`
	UniquenessScore float64   `json:"uniqueness_score" db:"uniqueness_score"` // 唯一性评分 0-1
	BotScore        float64   `json:"bot_score" db:"bot_score"`        // 爬虫评分 0-1
	RiskLevel       string    `json:"risk_level" db:"risk_level"`      // LOW, MEDIUM, HIGH
	IsBot           bool      `json:"is_bot" db:"is_bot"`
	Reasons         string    `json:"reasons" db:"reasons"`            // JSON数组字符串，检测原因
	VisitCount      int       `json:"visit_count" db:"visit_count"`
	LastSeen        time.Time `json:"last_seen" db:"last_seen"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`
}

// NoiseDetection 表示噪点检测结果
type NoiseDetection struct {
	HasNoise   bool    `json:"hasNoise"`
	Type       string  `json:"type"`
	Confidence float64 `json:"confidence"`
	Details    string  `json:"details,omitempty"`
}

// FingerprintRequest 接收前端提交的指纹数据
type FingerprintRequest struct {
	FingerprintHash         string           `json:"fingerprint_hash,omitempty"` // 前端预计算的指纹哈希（可选）
	UserAgent               string           `json:"user_agent" binding:"required"`
	ScreenResolution        string           `json:"screen_resolution" binding:"required"`
	Timezone                string           `json:"timezone" binding:"required"`
	Language                string           `json:"language" binding:"required"`
	Platform                string           `json:"platform" binding:"required"`
	Canvas                  string           `json:"canvas" binding:"required"`
	WebGL                   string           `json:"webgl" binding:"required"`
	Audio                   string           `json:"audio" binding:"required"`
	Fonts                   []string         `json:"fonts" binding:"required"`
	Plugins                 []string         `json:"plugins" binding:"required"`
	TouchSupport            bool             `json:"touch_support"`
	CookieEnabled           bool             `json:"cookie_enabled"`
	DoNotTrack              string           `json:"do_not_track"`
	CanvasNoiseDetection    *NoiseDetection  `json:"canvasNoiseDetection,omitempty"`
	WebGLNoiseDetection     *NoiseDetection  `json:"webglNoiseDetection,omitempty"`
	AudioNoiseDetection     *NoiseDetection  `json:"audioNoiseDetection,omitempty"`
}

// FingerprintResponse 返回给前端的响应
type FingerprintResponse struct {
	FingerprintHash string    `json:"fingerprint_hash"`
	Analysis        *Analysis `json:"analysis,omitempty"`
	Success         bool      `json:"success"`
	Message         string    `json:"message,omitempty"`
}

// AnalysisResponse 分析结果响应
type AnalysisResponse struct {
	Analysis *Analysis `json:"analysis"`
	Success  bool      `json:"success"`
	Message  string    `json:"message,omitempty"`
}
