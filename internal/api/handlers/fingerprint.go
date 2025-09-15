package handlers

import (
	"browser-detection/internal/models"
	"browser-detection/internal/services"
	"browser-detection/internal/utils"
	"bytes"
	"database/sql"
	"io"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// FingerprintHandler 指纹处理器
type FingerprintHandler struct {
	service *services.FingerprintService
}

// NewFingerprintHandler 创建新的指纹处理器
func NewFingerprintHandler(service *services.FingerprintService) *FingerprintHandler {
	return &FingerprintHandler{service: service}
}

// SubmitFingerprint 提交指纹数据
func (h *FingerprintHandler) SubmitFingerprint(c *gin.Context) {
	// 先读取原始请求体用于调试
	bodyBytes, err := c.GetRawData()
	if err != nil {
		log.Printf("Failed to read request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Failed to read request body",
		})
		return
	}

	// 重新设置请求体，以便后续绑定
	c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	var req models.FingerprintRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// 记录详细的错误信息
		log.Printf("Failed to bind JSON request: %v", err)
		log.Printf("Raw request body: %s", string(bodyBytes))
		
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request data: " + err.Error(),
		})
		return
	}

	log.Printf("Successfully parsed fingerprint request from %s", req.UserAgent)

	// 获取客户端IP
	ipAddress := utils.GetClientIP(
		c.GetHeader("X-Forwarded-For"),
		c.GetHeader("X-Real-IP"),
		c.Request.RemoteAddr,
	)

	// 处理指纹
	response, err := h.service.ProcessFingerprint(&req, ipAddress)
	if err != nil {
		log.Printf("Failed to process fingerprint: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to process fingerprint: " + err.Error(),
		})
		return
	}

	log.Printf("Successfully processed fingerprint: %s", response.FingerprintHash)
	c.JSON(http.StatusOK, response)
}

// GetAnalysis 获取分析结果
func (h *FingerprintHandler) GetAnalysis(c *gin.Context) {
	fingerprintHash := c.Param("hash")
	if fingerprintHash == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Fingerprint hash is required",
		})
		return
	}

	analysis, err := h.service.GetAnalysis(fingerprintHash)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Analysis not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to get analysis: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.AnalysisResponse{
		Analysis: analysis,
		Success:  true,
	})
}

// HealthCheck 健康检查
func (h *FingerprintHandler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "browser-fingerprint-detection",
	})
}
