# Browser Fingerprinting Detection System

一个功能完整的网页指纹检测系统，包含前端指纹收集、后端API服务和爬虫检测功能。

## 功能特性

- 收集多种浏览器指纹信息
- Canvas指纹去噪处理
- 指纹聚合和唯一标识生成
- 爬虫检测分析
- RESTful API接口

## 技术栈

- **前端**: HTML5, JavaScript, CSS3
- **后端**: Go 1.21+, Gin框架
- **数据库**: SQLite (可扩展为其他数据库)

## 项目结构

```
browser-detection/
├── cmd/
│   └── server/
│       └── main.go          # 应用入口
├── internal/
│   ├── api/
│   │   ├── handlers/        # HTTP处理器
│   │   ├── middleware/      # 中间件
│   │   └── routes/          # 路由定义
│   ├── models/              # 数据模型
│   ├── services/            # 业务逻辑
│   └── utils/               # 工具函数
├── static/
│   ├── css/                 # 样式文件
│   ├── js/                  # JavaScript文件
│   └── index.html           # 主页面
├── go.mod
├── go.sum
└── README.md
```

## 快速开始

1. 安装依赖：
```bash
go mod tidy
```

2. 运行应用：
```bash
go run cmd/server/main.go
```

3. 访问应用：
打开浏览器访问 `http://localhost:8080`

## API接口

### 提交指纹数据
```
POST /api/fingerprint
Content-Type: application/json

{
  "userAgent": "...",
  "screenResolution": "...",
  "timezone": "...",
  "canvas": "...",
  "webgl": "...",
  "audio": "...",
  "fonts": [...],
  "plugins": [...],
  "fingerprintHash": "..."
}
```

### 获取分析结果
```
GET /api/analysis/{fingerprintHash}
```

## 指纹检测项目

1. **基础指纹**
   - User Agent
   - 屏幕分辨率
   - 时区
   - 语言设置
   - 平台信息

2. **Canvas指纹**
   - 文本渲染
   - 图形绘制
   - 去噪处理

3. **WebGL指纹**
   - 渲染器信息
   - 扩展列表

4. **音频指纹**
   - AudioContext特征

5. **字体检测**
   - 系统字体列表

6. **插件检测**
   - 浏览器插件

## 许可证

MIT License
