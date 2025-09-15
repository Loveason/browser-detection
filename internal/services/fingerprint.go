package services

import (
	"browser-detection/internal/models"
	"browser-detection/internal/utils"
	"database/sql"
	"fmt"
	"log"
	"strings"
	"time"
)

// FingerprintService 指纹服务
type FingerprintService struct {
	db *utils.Database
}

// NewFingerprintService 创建新的指纹服务
func NewFingerprintService(db *utils.Database) *FingerprintService {
	return &FingerprintService{db: db}
}

// ProcessFingerprint 处理指纹数据
func (fs *FingerprintService) ProcessFingerprint(req *models.FingerprintRequest, ipAddress string) (*models.FingerprintResponse, error) {
	// 使用前端提交的指纹哈希，如果没有则生成
	var fingerprintHash string
	if req.FingerprintHash != "" {
		// 使用前端预计算的指纹哈希
		fingerprintHash = req.FingerprintHash
		log.Printf("使用前端预计算的指纹哈希: %s", fingerprintHash)
	} else {
		// 后端计算指纹哈希（兼容旧版本）
		fingerprintData := map[string]interface{}{
			"user_agent":        req.UserAgent,
			"screen_resolution": req.ScreenResolution,
			"timezone":          req.Timezone,
			"language":          req.Language,
			"platform":          req.Platform,
			"canvas":            req.Canvas,
			"webgl":             req.WebGL,
			"audio":             req.Audio,
			"fonts":             req.Fonts,
			"plugins":           req.Plugins,
			"touch_support":     req.TouchSupport,
			"cookie_enabled":    req.CookieEnabled,
			"do_not_track":      req.DoNotTrack,
		}
		fingerprintHash = utils.GenerateFingerprintHash(fingerprintData)
		log.Printf("后端计算的指纹哈希: %s", fingerprintHash)
	}

	// 计算其他哈希值
	canvasHash := utils.GenerateCanvasHash(req.Canvas)
	webglHash := utils.GenerateFingerprintHash(map[string]interface{}{"webgl": req.WebGL})
	audioHash := utils.GenerateFingerprintHash(map[string]interface{}{"audio": req.Audio})

	// 创建指纹记录
	fingerprint := &models.Fingerprint{
		FingerprintHash:  fingerprintHash,
		UserAgent:        req.UserAgent,
		ScreenResolution: req.ScreenResolution,
		Timezone:         req.Timezone,
		Language:         req.Language,
		Platform:         req.Platform,
		Canvas:           req.Canvas,
		CanvasHash:       canvasHash,
		WebGL:            req.WebGL,
		WebGLHash:        webglHash,
		Audio:            req.Audio,
		AudioHash:        audioHash,
		Fonts:            utils.StringSliceToJSON(req.Fonts),
		Plugins:          utils.StringSliceToJSON(req.Plugins),
		TouchSupport:     req.TouchSupport,
		CookieEnabled:    req.CookieEnabled,
		DoNotTrack:       req.DoNotTrack,
		IPAddress:        ipAddress,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	// 保存或更新指纹
	if err := fs.saveFingerprint(fingerprint); err != nil {
		return nil, fmt.Errorf("failed to save fingerprint: %w", err)
	}

	// 进行分析（传入原始请求以获取噪点检测信息）
	analysis, err := fs.analyzeFingerprintWithNoise(fingerprint, req)
	if err != nil {
		log.Printf("Failed to analyze fingerprint: %v", err)
	}

	return &models.FingerprintResponse{
		FingerprintHash: fingerprintHash,
		Analysis:        analysis,
		Success:         true,
	}, nil
}

// saveFingerprint 保存指纹到数据库
func (fs *FingerprintService) saveFingerprint(fp *models.Fingerprint) error {
	query := `
		INSERT OR REPLACE INTO fingerprints (
			fingerprint_hash, user_agent, screen_resolution, timezone, language, platform,
			canvas, canvas_hash, webgl, webgl_hash, audio, audio_hash, fonts, plugins,
			touch_support, cookie_enabled, do_not_track, ip_address, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := fs.db.DB.Exec(query,
		fp.FingerprintHash, fp.UserAgent, fp.ScreenResolution, fp.Timezone, fp.Language, fp.Platform,
		fp.Canvas, fp.CanvasHash, fp.WebGL, fp.WebGLHash, fp.Audio, fp.AudioHash, fp.Fonts, fp.Plugins,
		fp.TouchSupport, fp.CookieEnabled, fp.DoNotTrack, fp.IPAddress, fp.CreatedAt, fp.UpdatedAt,
	)

	return err
}

// analyzeFingerprintWithNoise 分析指纹并生成分析结果（包含噪点检测）
func (fs *FingerprintService) analyzeFingerprintWithNoise(fp *models.Fingerprint, req *models.FingerprintRequest) (*models.Analysis, error) {
	// 计算唯一性评分
	uniquenessScore := fs.calculateUniquenessScore(fp)

	// 计算爬虫评分（包含噪点检测）
	botScore := fs.calculateBotScoreWithNoise(fp, req)

	// 确定风险等级
	riskLevel := fs.calculateRiskLevel(uniquenessScore, botScore)

	// 判断是否为爬虫
	isBot := botScore > 0.7

	// 生成检测原因（包含噪点检测）
	reasons := fs.generateReasonsWithNoise(fp, req, botScore, uniquenessScore)

	// 检查是否已存在分析记录
	var visitCount int
	var lastSeen time.Time
	err := fs.db.DB.QueryRow("SELECT visit_count, last_seen FROM analysis WHERE fingerprint_hash = ?", fp.FingerprintHash).Scan(&visitCount, &lastSeen)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	if err == sql.ErrNoRows {
		// 新记录
		visitCount = 1
		lastSeen = time.Now()
	} else {
		// 更新访问次数
		visitCount++
		lastSeen = time.Now()
	}

	analysis := &models.Analysis{
		FingerprintHash: fp.FingerprintHash,
		UniquenessScore: uniquenessScore,
		BotScore:        botScore,
		RiskLevel:       riskLevel,
		IsBot:           isBot,
		Reasons:         utils.StringSliceToJSON(reasons),
		VisitCount:      visitCount,
		LastSeen:        lastSeen,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	// 保存分析结果
	if err := fs.saveAnalysis(analysis); err != nil {
		return nil, err
	}

	return analysis, nil
}

// analyzeFingerprint 分析指纹并生成分析结果
func (fs *FingerprintService) analyzeFingerprint(fp *models.Fingerprint) (*models.Analysis, error) {
	// 计算唯一性评分
	uniquenessScore := fs.calculateUniquenessScore(fp)

	// 计算爬虫评分
	botScore := fs.calculateBotScore(fp)

	// 确定风险等级
	riskLevel := fs.calculateRiskLevel(uniquenessScore, botScore)

	// 判断是否为爬虫
	isBot := botScore > 0.7

	// 生成检测原因
	reasons := fs.generateReasons(fp, botScore, uniquenessScore)

	// 检查是否已存在分析记录
	var visitCount int
	var lastSeen time.Time
	err := fs.db.DB.QueryRow("SELECT visit_count, last_seen FROM analysis WHERE fingerprint_hash = ?", fp.FingerprintHash).Scan(&visitCount, &lastSeen)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}

	if err == sql.ErrNoRows {
		// 新记录
		visitCount = 1
		lastSeen = time.Now()
	} else {
		// 更新访问次数
		visitCount++
		lastSeen = time.Now()
	}

	analysis := &models.Analysis{
		FingerprintHash: fp.FingerprintHash,
		UniquenessScore: uniquenessScore,
		BotScore:        botScore,
		RiskLevel:       riskLevel,
		IsBot:           isBot,
		Reasons:         utils.StringSliceToJSON(reasons),
		VisitCount:      visitCount,
		LastSeen:        lastSeen,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	// 保存分析结果
	if err := fs.saveAnalysis(analysis); err != nil {
		return nil, err
	}

	return analysis, nil
}

// calculateUniquenessScore 计算唯一性评分
func (fs *FingerprintService) calculateUniquenessScore(fp *models.Fingerprint) float64 {
	score := 0.0

	// 基于各个指纹特征计算唯一性
	// User Agent 权重 0.1
	if fp.UserAgent != "" {
		score += 0.1
	}

	// Canvas 权重 0.3
	if fp.Canvas != "" {
		score += 0.3
	}

	// WebGL 权重 0.2
	if fp.WebGL != "" {
		score += 0.2
	}

	// Audio 权重 0.15
	if fp.Audio != "" {
		score += 0.15
	}

	// 字体列表 权重 0.15
	fonts := utils.JSONToStringSlice(fp.Fonts)
	if len(fonts) > 0 {
		score += 0.15
	}

	// 插件列表 权重 0.1
	plugins := utils.JSONToStringSlice(fp.Plugins)
	if len(plugins) > 0 {
		score += 0.1
	}

	return score
}

// calculateBotScore 计算爬虫评分
func (fs *FingerprintService) calculateBotScore(fp *models.Fingerprint) float64 {
	score := 0.0

	// 检查 User Agent
	ua := strings.ToLower(fp.UserAgent)
	botKeywords := []string{"bot", "crawler", "spider", "scraper", "headless", "phantom", "selenium"}
	for _, keyword := range botKeywords {
		if strings.Contains(ua, keyword) {
			score += 0.3
			break
		}
	}

	// 检查是否支持触摸
	if !fp.TouchSupport && strings.Contains(ua, "mobile") {
		score += 0.1
	}

	// 检查Canvas指纹异常
	if len(fp.Canvas) < 100 || len(fp.Canvas) > 10000 {
		score += 0.2
	}

	// 检查WebGL支持
	if fp.WebGL == "" || fp.WebGL == "undefined" {
		score += 0.15
	}

	// 检查字体数量异常
	fonts := utils.JSONToStringSlice(fp.Fonts)
	if len(fonts) < 5 || len(fonts) > 200 {
		score += 0.1
	}

	// 检查插件数量异常
	plugins := utils.JSONToStringSlice(fp.Plugins)
	if len(plugins) == 0 || len(plugins) > 50 {
		score += 0.1
	}

	// 检查屏幕分辨率异常
	if fp.ScreenResolution == "0x0" || fp.ScreenResolution == "" {
		score += 0.15
	}

	// 限制评分范围
	if score > 1.0 {
		score = 1.0
	}

	return score
}

// calculateBotScoreWithNoise 计算爬虫评分（包含噪点检测）
func (fs *FingerprintService) calculateBotScoreWithNoise(fp *models.Fingerprint, req *models.FingerprintRequest) float64 {
	score := fs.calculateBotScore(fp)

	// 检查Canvas噪点
	if req.CanvasNoiseDetection != nil && req.CanvasNoiseDetection.HasNoise {
		switch req.CanvasNoiseDetection.Type {
		case "random_noise":
			score += 0.4 * req.CanvasNoiseDetection.Confidence
		case "pixel_noise":
			score += 0.3 * req.CanvasNoiseDetection.Confidence
		case "high_entropy":
			score += 0.2 * req.CanvasNoiseDetection.Confidence
		}
	}

	// 检查WebGL噪点
	if req.WebGLNoiseDetection != nil && req.WebGLNoiseDetection.HasNoise {
		switch req.WebGLNoiseDetection.Type {
		case "webgl_random_noise":
			score += 0.4 * req.WebGLNoiseDetection.Confidence
		case "webgl_parameter_anomaly":
			score += 0.3 * req.WebGLNoiseDetection.Confidence
		}
	}

	// 检查Audio噪点
	if req.AudioNoiseDetection != nil && req.AudioNoiseDetection.HasNoise {
		switch req.AudioNoiseDetection.Type {
		case "audio_anomaly":
			score += 0.2 * req.AudioNoiseDetection.Confidence
		}
	}

	// 限制评分范围
	if score > 1.0 {
		score = 1.0
	}

	return score
}

// calculateRiskLevel 计算风险等级
func (fs *FingerprintService) calculateRiskLevel(uniquenessScore, botScore float64) string {
	if botScore > 0.7 {
		return "HIGH"
	} else if botScore > 0.4 {
		return "MEDIUM"
	} else {
		return "LOW"
	}
}

// generateReasonsWithNoise 生成检测原因（包含噪点检测）
func (fs *FingerprintService) generateReasonsWithNoise(fp *models.Fingerprint, req *models.FingerprintRequest, botScore, uniquenessScore float64) []string {
	reasons := fs.generateReasons(fp, botScore, uniquenessScore)

	// 添加噪点检测相关的原因
	if req.CanvasNoiseDetection != nil && req.CanvasNoiseDetection.HasNoise {
		switch req.CanvasNoiseDetection.Type {
		case "random_noise":
			reasons = append(reasons, "Canvas random noise detected")
		case "pixel_noise":
			reasons = append(reasons, "Canvas pixel-level noise detected")
		case "high_entropy":
			reasons = append(reasons, "Canvas high entropy indicating possible noise injection")
		default:
			reasons = append(reasons, fmt.Sprintf("Canvas noise detected: %s", req.CanvasNoiseDetection.Type))
		}
	}

	if req.WebGLNoiseDetection != nil && req.WebGLNoiseDetection.HasNoise {
		switch req.WebGLNoiseDetection.Type {
		case "webgl_random_noise":
			reasons = append(reasons, "WebGL rendering inconsistency detected")
		case "webgl_parameter_anomaly":
			reasons = append(reasons, "WebGL parameter anomaly detected")
		default:
			reasons = append(reasons, fmt.Sprintf("WebGL noise detected: %s", req.WebGLNoiseDetection.Type))
		}
	}

	if req.AudioNoiseDetection != nil && req.AudioNoiseDetection.HasNoise {
		switch req.AudioNoiseDetection.Type {
		case "audio_anomaly":
			reasons = append(reasons, "Audio fingerprint anomaly detected")
		default:
			reasons = append(reasons, fmt.Sprintf("Audio noise detected: %s", req.AudioNoiseDetection.Type))
		}
	}

	return reasons
}

// generateReasons 生成检测原因
func (fs *FingerprintService) generateReasons(fp *models.Fingerprint, botScore, uniquenessScore float64) []string {
	var reasons []string

	ua := strings.ToLower(fp.UserAgent)
	botKeywords := []string{"bot", "crawler", "spider", "scraper", "headless", "phantom", "selenium"}
	for _, keyword := range botKeywords {
		if strings.Contains(ua, keyword) {
			reasons = append(reasons, fmt.Sprintf("User Agent contains bot keyword: %s", keyword))
			break
		}
	}

	if len(fp.Canvas) < 100 {
		reasons = append(reasons, "Canvas fingerprint too short")
	}

	if len(fp.Canvas) > 10000 {
		reasons = append(reasons, "Canvas fingerprint too long (possible noise injection)")
	}

	if fp.WebGL == "" || fp.WebGL == "undefined" {
		reasons = append(reasons, "WebGL not supported or disabled")
	}

	fonts := utils.JSONToStringSlice(fp.Fonts)
	if len(fonts) < 5 {
		reasons = append(reasons, "Too few fonts detected")
	}

	if len(fonts) > 200 {
		reasons = append(reasons, "Too many fonts detected")
	}

	plugins := utils.JSONToStringSlice(fp.Plugins)
	if len(plugins) == 0 {
		reasons = append(reasons, "No plugins detected")
	}

	if fp.ScreenResolution == "0x0" || fp.ScreenResolution == "" {
		reasons = append(reasons, "Invalid screen resolution")
	}

	if botScore < 0.3 && uniquenessScore > 0.8 {
		reasons = append(reasons, "High uniqueness score - likely legitimate user")
	}

	return reasons
}

// saveAnalysis 保存分析结果
func (fs *FingerprintService) saveAnalysis(analysis *models.Analysis) error {
	query := `
		INSERT OR REPLACE INTO analysis (
			fingerprint_hash, uniqueness_score, bot_score, risk_level, is_bot, reasons,
			visit_count, last_seen, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := fs.db.DB.Exec(query,
		analysis.FingerprintHash, analysis.UniquenessScore, analysis.BotScore, analysis.RiskLevel,
		analysis.IsBot, analysis.Reasons, analysis.VisitCount, analysis.LastSeen,
		analysis.CreatedAt, analysis.UpdatedAt,
	)

	return err
}

// GetAnalysis 获取分析结果
func (fs *FingerprintService) GetAnalysis(fingerprintHash string) (*models.Analysis, error) {
	query := `
		SELECT fingerprint_hash, uniqueness_score, bot_score, risk_level, is_bot, reasons,
		       visit_count, last_seen, created_at, updated_at
		FROM analysis WHERE fingerprint_hash = ?`

	analysis := &models.Analysis{}
	err := fs.db.DB.QueryRow(query, fingerprintHash).Scan(
		&analysis.FingerprintHash, &analysis.UniquenessScore, &analysis.BotScore,
		&analysis.RiskLevel, &analysis.IsBot, &analysis.Reasons,
		&analysis.VisitCount, &analysis.LastSeen, &analysis.CreatedAt, &analysis.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return analysis, nil
}
