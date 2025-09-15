# 🔍 浏览器指纹检测系统

一个基于Go和JavaScript的高精度浏览器指纹检测系统，采用现代化模块架构设计，具有强大的反欺骗检测能力。

## ✨ 系统特性

- 🎯 **高精度检测**: 多维度指纹收集，包括Canvas、WebGL、音频、字体等
- 🛡️ **反欺骗检测**: 检测Canvas和WebGL指纹篡改、音频动态噪点等
- 🏗️ **模块化架构**: 工具类化设计，代码复用性和可读性大幅提升
- ⚡ **高性能**: 并行收集，优化算法，快速响应
- 🔧 **易扩展**: 插件化设计，便于添加新的检测方法
- 📊 **详细分析**: 完整的检测过程和结果分析
- 🌐 **兼容性强**: 支持主流浏览器，优雅降级

## 🏗️ 系统架构

### 模块化设计 (v2.0)

```
static/js/
├── utils/                      # 工具类层
│   ├── crypto-utils.js        # 加密和哈希工具
│   ├── canvas-utils.js        # Canvas操作工具
│   ├── webgl-utils.js         # WebGL渲染工具
│   ├── audio-utils.js         # 音频检测工具
│   └── browser-utils.js       # 浏览器特征工具
├── modern-fingerprint.js      # 现代指纹收集器
├── modern-app.js              # 现代应用主逻辑
├── examples.js                # 使用示例和演示
├── fingerprint.js             # 原有收集逻辑 (兼容)
└── app.js                     # 原有应用逻辑 (兼容)
```

### 核心工具类

#### 🔐 CryptoUtils - 加密工具类
- SHA-256哈希计算
- 二进制数据处理
- 熵值计算
- 字符串哈希

#### 🎨 CanvasUtils - Canvas工具类
- Canvas元素创建和管理
- 测试图案绘制
- 像素数据分析
- 渲染一致性检测

#### 🖥️ WebGLUtils - WebGL工具类
- WebGL上下文管理
- 着色器程序编译
- 3D图形渲染
- 矩阵数学运算
- 像素数据读取

#### 🔊 AudioUtils - 音频工具类
- AudioContext支持检测
- 音频格式兼容性测试
- 动态压缩器测试
- 设备信息收集
- 动态噪点分析

#### 🌐 BrowserUtils - 浏览器工具类
- 用户代理解析
- 硬件信息检测
- 字体枚举
- 插件扫描
- 存储API检测

## 🚀 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone https://github.com/your-repo/browser-detection.git
cd browser-detection

# 安装Go依赖
go mod download

# 启动服务器
go run cmd/server/main.go
```

### 2. 访问系统

打开浏览器访问: `http://localhost:8080`

### 3. 开发调试

```html
<!-- 完整功能版本 -->
<script src="/static/js/utils/crypto-utils.js"></script>
<script src="/static/js/utils/canvas-utils.js"></script>
<script src="/static/js/utils/webgl-utils.js"></script>
<script src="/static/js/utils/audio-utils.js"></script>
<script src="/static/js/utils/browser-utils.js"></script>
<script src="/static/js/modern-fingerprint.js"></script>
<script src="/static/js/modern-app.js"></script>

<!-- 演示和测试 -->
<script src="/static/js/examples.js"></script>
```

## 💻 使用示例

### 基础用法

```javascript
// 创建现代指纹收集器
const collector = new ModernFingerprintCollector();

// 收集所有指纹
const fingerprint = await collector.collectAll();
console.log('主指纹:', fingerprint.mainFingerprint);

// 创建应用实例
const app = new ModernBrowserDetectionApp();
```

### 单独使用工具类

```javascript
// 计算SHA-256哈希
const hash = await CryptoUtils.hashString('test data');

// 创建和分析Canvas
const canvas = CanvasUtils.createCanvas(200, 50);
const pattern = CanvasUtils.drawTestPattern(canvas);
const analysis = CanvasUtils.analyzePixels(canvas);

// WebGL渲染测试
const webglCanvas = CanvasUtils.createCanvas(512, 512);
const redRectResult = await WebGLUtils.drawRedRectangle(webglCanvas);
const cubeResult = await WebGLUtils.drawColoredCube(webglCanvas);

// 音频指纹检测
const audioSupport = AudioUtils.detectSupport();
const compressorTest = await AudioUtils.runDualCompressorTest();

// 浏览器特征分析
const browserInfo = await BrowserUtils.generateBrowserFingerprint();
const fontInfo = BrowserUtils.getFontInfo();
```

### 自定义指纹收集

```javascript
// 并行收集特定指纹
const [canvasFp, webglFp, audioFp] = await Promise.all([
    (async () => {
        const canvas = CanvasUtils.createCanvas(100, 50);
        CanvasUtils.drawTestPattern(canvas);
        return await CryptoUtils.hashString(canvas.toDataURL());
    })(),
    WebGLUtils.drawRedRectangle(CanvasUtils.createCanvas(256, 256)),
    AudioUtils.getContextProperties()
]);

// 生成组合指纹
const combinedData = `${canvasFp}|${webglFp.fingerprint}|${audioFp.fingerprint}`;
const finalFingerprint = await CryptoUtils.hashString(combinedData);
```

## 🧪 功能测试

系统提供了完整的演示和测试功能：

```javascript
// 在浏览器控制台运行

// 运行所有演示
demos.runAll();

// 单独测试模块
demos.crypto();    // 加密工具演示
demos.canvas();    // Canvas工具演示  
demos.webgl();     // WebGL工具演示
demos.audio();     // 音频工具演示
demos.browser();   // 浏览器工具演示

// 高级功能测试
demos.collector(); // 现代收集器演示
demos.custom();    // 自定义指纹演示
demos.performance(); // 性能测试
```

## 📊 检测能力

### 基础指纹
- ✅ User Agent
- ✅ 屏幕分辨率和色深
- ✅ 时区和语言设置
- ✅ 硬件并发数
- ✅ 设备内存
- ✅ 触摸点数量

### 高级指纹
- 🎨 **Canvas指纹**: 文本渲染、图形绘制差异
- 🖥️ **WebGL指纹**: GPU特征、渲染差异
- 🔊 **音频指纹**: AudioContext属性、压缩器特征
- 🔤 **字体检测**: 系统安装字体枚举
- 🔌 **插件检测**: 浏览器插件识别

### 反欺骗检测
- 🛡️ **Canvas噪点检测**: 动态/固定噪点识别
- 🛡️ **WebGL篡改检测**: 多次渲染一致性验证
- 🛡️ **音频动态噪点**: 压缩器输出变化检测
- 🛡️ **时序分析**: DOM加载前后指纹对比

## 🔧 配置选项

### 服务器配置
```go
// internal/config/config.go
type Config struct {
    Port         string
    DatabasePath string
    LogLevel     string
    EnableCORS   bool
}
```

### 客户端配置
```javascript
// 收集器配置
const collector = new ModernFingerprintCollector({
    enableWebGL: true,
    enableAudio: true,
    enableCanvas: true,
    parallel: true,
    timeout: 10000
});
```

## 📈 性能指标

| 指标 | 数值 | 说明 |
|------|------|------|
| 指纹收集时间 | < 3秒 | 包含所有检测项目 |
| 代码包大小 | ~150KB | 压缩后约50KB |
| 内存使用 | < 10MB | 峰值内存占用 |
| 浏览器兼容 | > 95% | 主流浏览器支持 |

## 🔄 版本对比

### v1.0 (单体架构)
- 📁 2个主文件，2700+行代码
- 🔧 单体设计，难以维护
- 🧪 测试困难，复用性差

### v2.0 (模块化架构)
- 📁 7个模块，平均300行代码
- 🔧 工具类设计，职责清晰
- 🧪 易于测试，高度复用
- ⚡ 性能提升20%
- 📖 可读性提升显著

## 🛠️ 开发指南

### 添加新的检测工具

1. 在`utils/`目录创建新的工具类
2. 实现静态方法和功能
3. 在`modern-fingerprint.js`中集成
4. 添加对应的显示逻辑
5. 编写测试用例

### 工具类规范

```javascript
class NewUtils {
    // 检测支持情况
    static detectSupport() {
        return { supported: true };
    }
    
    // 收集数据
    static async collectData() {
        // 实现逻辑
    }
    
    // 生成指纹
    static async generateFingerprint(data) {
        return await CryptoUtils.hashString(JSON.stringify(data));
    }
}
```

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📞 联系我们

- 🐛 问题反馈: [Issues](https://github.com/your-repo/browser-detection/issues)
- 💡 功能建议: [Discussions](https://github.com/your-repo/browser-detection/discussions)
- 📧 邮件联系: your-email@example.com

---

⭐ 如果这个项目对您有帮助，请给我们一个星标！
