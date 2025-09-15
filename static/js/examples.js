/**
 * 工具类使用示例
 * 展示如何使用重构后的模块化工具类
 */

// ===== 加密工具类示例 =====
async function demosCryptoUtils() {
    console.log('=== CryptoUtils 示例 ===');
    
    // 计算字符串哈希
    const text = 'Hello, Browser Fingerprint!';
    const hash = await CryptoUtils.hashString(text);
    console.log('字符串哈希:', hash);
    
    // 计算简单哈希
    const simpleHash = CryptoUtils.simpleHash(text);
    console.log('简单哈希:', simpleHash);
    
    // 计算熵值
    const entropy = CryptoUtils.calculateEntropy([1, 2, 3, 4, 5, 1, 2, 3]);
    console.log('数据熵值:', entropy);
}

// ===== Canvas工具类示例 =====
function demosCanvasUtils() {
    console.log('=== CanvasUtils 示例 ===');
    
    // 创建Canvas
    const canvas = CanvasUtils.createCanvas(200, 100);
    console.log('Canvas创建成功:', canvas.width, 'x', canvas.height);
    
    // 绘制测试图案
    const pattern = CanvasUtils.drawTestPattern(canvas);
    console.log('测试图案:', pattern);
    
    // 分析像素
    const pixelAnalysis = CanvasUtils.analyzePixels(canvas);
    console.log('像素分析:', pixelAnalysis);
    
    // 检测渲染一致性
    const consistency = CanvasUtils.detectRenderingConsistency();
    console.log('渲染一致性:', consistency);
    
    // 将Canvas添加到页面用于查看
    document.body.appendChild(canvas);
}

// ===== WebGL工具类示例 =====
async function demosWebGLUtils() {
    console.log('=== WebGLUtils 示例 ===');
    
    // 检测WebGL支持
    const support = WebGLUtils.detectSupport();
    console.log('WebGL支持:', support);
    
    if (!support.basic) {
        console.log('WebGL不支持，跳过演示');
        return;
    }
    
    // 创建Canvas并获取WebGL上下文
    const canvas = CanvasUtils.createCanvas(300, 300);
    const gl = WebGLUtils.getContext(canvas);
    
    if (!gl) {
        console.log('WebGL上下文获取失败');
        return;
    }
    
    // 收集基础信息
    const basicInfo = WebGLUtils.collectBasicInfo(gl);
    console.log('WebGL基础信息:', basicInfo);
    
    // 绘制红色矩形
    const redRectResult = await WebGLUtils.drawRedRectangle(canvas);
    console.log('红色矩形指纹:', redRectResult.fingerprint);
    
    // 绘制彩色立方体
    const cubeResult = await WebGLUtils.drawColoredCube(canvas);
    console.log('彩色立方体指纹:', cubeResult.fingerprint);
    
    // 将Canvas添加到页面
    document.body.appendChild(canvas);
}

// ===== 音频工具类示例 =====
async function demosAudioUtils() {
    console.log('=== AudioUtils 示例 ===');
    
    // 检测音频支持
    const support = AudioUtils.detectSupport();
    console.log('音频支持:', support);
    
    if (!support.basicSupport) {
        console.log('AudioContext不支持，跳过演示');
        return;
    }
    
    // 获取格式支持
    const formats = AudioUtils.getFormatSupport();
    console.log('音频格式支持:', formats);
    
    // 获取上下文属性
    const contextProps = await AudioUtils.getContextProperties();
    console.log('音频上下文属性指纹:', contextProps.fingerprint);
    
    // 获取设备信息
    const deviceInfo = await AudioUtils.getDeviceInfo();
    console.log('音频设备信息:', deviceInfo);
    
    // 执行压缩器测试
    console.log('正在执行音频压缩器测试...');
    const compressorTest = await AudioUtils.runDualCompressorTest();
    console.log('压缩器测试结果:', compressorTest);
}

// ===== 浏览器工具类示例 =====
async function demosBrowserUtils() {
    console.log('=== BrowserUtils 示例 ===');
    
    // 获取用户代理信息
    const userAgent = BrowserUtils.getUserAgentInfo();
    console.log('用户代理信息:', userAgent);
    
    // 获取屏幕信息
    const screenInfo = BrowserUtils.getScreenInfo();
    console.log('屏幕信息:', screenInfo);
    
    // 获取时区信息
    const timezoneInfo = BrowserUtils.getTimezoneInfo();
    console.log('时区信息:', timezoneInfo);
    
    // 检测浏览器类型
    const browserType = BrowserUtils.detectBrowserType();
    console.log('浏览器类型:', browserType);
    
    // 检测操作系统
    const os = BrowserUtils.detectOperatingSystem();
    console.log('操作系统:', os);
    
    // 获取字体信息
    const fontInfo = BrowserUtils.getFontInfo();
    console.log('字体信息:', fontInfo);
    
    // 获取存储信息
    const storageInfo = BrowserUtils.getStorageInfo();
    console.log('存储信息:', storageInfo);
    
    // 获取硬件信息
    const hardwareInfo = BrowserUtils.getHardwareInfo();
    console.log('硬件信息:', hardwareInfo);
    
    // 检测广告拦截器
    const adBlocker = await BrowserUtils.detectAdBlocker();
    console.log('广告拦截器检测:', adBlocker);
    
    // 生成综合浏览器指纹
    const browserFingerprint = await BrowserUtils.generateBrowserFingerprint();
    console.log('浏览器指纹:', browserFingerprint.fingerprint);
}

// ===== 现代指纹收集器示例 =====
async function demosModernCollector() {
    console.log('=== ModernFingerprintCollector 示例 ===');
    
    // 创建收集器
    const collector = new ModernFingerprintCollector();
    
    // 检查收集状态
    console.log('收集状态:', collector.isCollectingFingerprint());
    
    // 收集所有指纹
    console.log('开始收集指纹...');
    const startTime = performance.now();
    
    const fingerprint = await collector.collectAll();
    
    const endTime = performance.now();
    console.log(`指纹收集完成，耗时: ${(endTime - startTime).toFixed(2)}ms`);
    
    // 显示收集结果
    console.log('主指纹:', fingerprint.mainFingerprint);
    console.log('基础信息指纹:', fingerprint.basic?.fingerprint);
    console.log('Canvas指纹:', fingerprint.canvas?.fingerprint);
    console.log('WebGL指纹:', fingerprint.webgl?.fingerprint);
    console.log('音频指纹:', fingerprint.audio?.fingerprint);
    console.log('字体指纹:', fingerprint.fonts?.fingerprint);
    
    return fingerprint;
}

// ===== 组合示例：自定义指纹收集 =====
async function demosCustomFingerprint() {
    console.log('=== 自定义指纹收集示例 ===');
    
    // 并行收集特定指纹
    const [canvasFingerprint, webglFingerprint, audioFingerprint] = await Promise.all([
        // Canvas指纹
        (async () => {
            const canvas = CanvasUtils.createCanvas(100, 50);
            CanvasUtils.drawTestPattern(canvas);
            return await CryptoUtils.hashString(canvas.toDataURL());
        })(),
        
        // WebGL指纹 
        (async () => {
            const canvas = CanvasUtils.createCanvas(256, 256);
            const result = await WebGLUtils.drawRedRectangle(canvas);
            return result.fingerprint;
        })(),
        
        // 音频指纹
        (async () => {
            const contextProps = await AudioUtils.getContextProperties();
            return contextProps.fingerprint;
        })()
    ]);
    
    // 生成组合指纹
    const combinedData = `${canvasFingerprint}|${webglFingerprint}|${audioFingerprint}`;
    const finalFingerprint = await CryptoUtils.hashString(combinedData);
    
    console.log('自定义指纹结果:');
    console.log('- Canvas:', canvasFingerprint);
    console.log('- WebGL:', webglFingerprint);
    console.log('- Audio:', audioFingerprint);
    console.log('- 最终指纹:', finalFingerprint);
    
    return finalFingerprint;
}

// ===== 错误处理示例 =====
async function demosErrorHandling() {
    console.log('=== 错误处理示例 ===');
    
    try {
        // 模拟错误情况
        const fakeCanvas = document.createElement('canvas');
        fakeCanvas.getContext = () => null; // 强制返回null
        
        const gl = WebGLUtils.getContext(fakeCanvas);
        console.log('WebGL上下文:', gl); // 应该是null
        
        if (!gl) {
            console.log('正确处理了WebGL上下文获取失败的情况');
        }
        
    } catch (error) {
        console.log('捕获到错误:', error.message);
    }
    
    // 测试不支持的功能
    try {
        const originalAudioContext = window.AudioContext;
        window.AudioContext = undefined; // 临时禁用
        
        const support = AudioUtils.detectSupport();
        console.log('音频支持检测（禁用后）:', support);
        
        window.AudioContext = originalAudioContext; // 恢复
        
    } catch (error) {
        console.log('音频检测错误处理:', error.message);
    }
}

// ===== 性能测试示例 =====
async function demosPerformance() {
    console.log('=== 性能测试示例 ===');
    
    const iterations = 100;
    
    // 测试哈希计算性能
    console.log(`测试哈希计算性能（${iterations}次）...`);
    const hashStartTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
        await CryptoUtils.hashString(`test-${i}`);
    }
    
    const hashEndTime = performance.now();
    const avgHashTime = (hashEndTime - hashStartTime) / iterations;
    console.log(`平均哈希计算时间: ${avgHashTime.toFixed(2)}ms`);
    
    // 测试Canvas创建性能
    console.log(`测试Canvas创建性能（${iterations}次）...`);
    const canvasStartTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
        const canvas = CanvasUtils.createCanvas(50, 50);
        CanvasUtils.drawTestPattern(canvas);
    }
    
    const canvasEndTime = performance.now();
    const avgCanvasTime = (canvasEndTime - canvasStartTime) / iterations;
    console.log(`平均Canvas操作时间: ${avgCanvasTime.toFixed(2)}ms`);
}

// ===== 主执行函数 =====
async function runAllDemos() {
    console.log('🚀 开始运行工具类演示...');
    
    try {
        // 基础工具类演示
        await demosCryptoUtils();
        demosCanvasUtils();
        await demosWebGLUtils();
        await demosAudioUtils();
        await demosBrowserUtils();
        
        console.log('\n📊 高级功能演示...');
        
        // 高级功能演示
        await demosModernCollector();
        await demosCustomFingerprint();
        await demosErrorHandling();
        await demosPerformance();
        
        console.log('\n✅ 所有演示完成！');
        
    } catch (error) {
        console.error('❌ 演示过程中发生错误:', error);
    }
}

// 导出演示函数
window.demos = {
    runAll: runAllDemos,
    crypto: demosCryptoUtils,
    canvas: demosCanvasUtils,
    webgl: demosWebGLUtils,
    audio: demosAudioUtils,
    browser: demosBrowserUtils,
    collector: demosModernCollector,
    custom: demosCustomFingerprint,
    errorHandling: demosErrorHandling,
    performance: demosPerformance
};

// 在控制台提示可用命令
console.log(`
🔧 工具类演示已加载！

可用命令:
- demos.runAll() - 运行所有演示
- demos.crypto() - 加密工具演示
- demos.canvas() - Canvas工具演示
- demos.webgl() - WebGL工具演示
- demos.audio() - 音频工具演示
- demos.browser() - 浏览器工具演示
- demos.collector() - 现代收集器演示
- demos.custom() - 自定义指纹演示
- demos.errorHandling() - 错误处理演示
- demos.performance() - 性能测试演示

示例: demos.crypto()
`);
