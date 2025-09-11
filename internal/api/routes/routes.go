package routes

import (
	"browser-detection/internal/api/handlers"
	"browser-detection/internal/api/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRoutes 设置路由
func SetupRoutes(handler *handlers.FingerprintHandler) *gin.Engine {
	// 设置Gin模式
	gin.SetMode(gin.ReleaseMode)

	// 创建路由器
	r := gin.New()

	// 应用中间件
	r.Use(middleware.Logger())
	r.Use(middleware.CORS())
	r.Use(middleware.Security())
	r.Use(middleware.ErrorHandler())
	r.Use(gin.Recovery())

	// 静态文件服务
	r.Static("/static", "./static")
	r.StaticFile("/", "./static/index.html")
	r.StaticFile("/favicon.ico", "./static/favicon.ico")

	// API路由组
	api := r.Group("/api")
	{
		// 健康检查
		api.GET("/health", handler.HealthCheck)

		// 指纹相关API
		api.POST("/fingerprint", handler.SubmitFingerprint)
		api.GET("/analysis/:hash", handler.GetAnalysis)
	}

	return r
}
