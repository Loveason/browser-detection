package main

import (
	"browser-detection/internal/api/handlers"
	"browser-detection/internal/api/routes"
	"browser-detection/internal/services"
	"browser-detection/internal/utils"
	"log"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	// 初始化数据库
	db, err := utils.NewDatabase("fingerprints.db")
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// 初始化服务
	fingerprintService := services.NewFingerprintService(db)

	// 初始化处理器
	fingerprintHandler := handlers.NewFingerprintHandler(fingerprintService)

	// 设置路由
	router := routes.SetupRoutes(fingerprintHandler)

	// 启动服务器
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting server on port %s", port)
	log.Printf("Access the application at http://localhost:%s", port)

	// 创建一个通道来接收系统信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// 在goroutine中启动服务器
	go func() {
		if err := router.Run(":" + port); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// 等待信号
	<-quit
	log.Println("Shutting down server...")
}
