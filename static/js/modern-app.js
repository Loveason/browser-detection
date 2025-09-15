/**
 * 重构后的应用主文件 - 使用模块化架构提高可读性
 */
class ModernBrowserDetectionApp {
    constructor() {
        this.collector = new ModernFingerprintCollector();
        this.fingerprintData = null;
        this.analysisResults = null;
        this.displayManager = new DisplayManager();
        this.serverFingerprintHash = null; // 存储服务器返回的指纹哈希
        this.init();
    }

    /**
     * 初始化应用
     */
    init() {
        this.bindEvents();
        this.initializeUI();
        console.log('浏览器检测应用已初始化');
    }

    /**
     * 绑定事件处理器
     */
    bindEvents() {
        // 主要按钮事件
        this.bindButton('start-detection', () => this.startDetection());
        this.bindButton('refresh-btn', () => this.startDetection());
        this.bindButton('export-btn', () => this.exportData());
        this.bindButton('copy-hash', () => this.copyMainFingerprint());
        
        // WebGL按钮事件
        this.bindButton('webgl-refresh', () => this.refreshWebGLTest());
        this.bindButton('webgl-copy', () => this.copyWebGLFingerprint());
        
        // 音频按钮事件
        this.bindButton('audio-refresh', () => this.refreshAudioTest());
        this.bindButton('audio-copy', () => this.copyAudioFingerprint());
    }

    /**
     * 绑定单个按钮事件
     * @param {string} id 按钮ID
     * @param {Function} handler 事件处理器
     */
    bindButton(id, handler) {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', handler);
        }
    }

    /**
     * 初始化UI
     */
    initializeUI() {
        // 测试基本的DOM操作
        this.setElementText('user-agent', '测试用户代理');
        
        // 自动开始检测（延迟500毫秒确保页面完全加载）
        setTimeout(() => {
            this.startDetection();
        }, 500);
    }

    /**
     * 开始检测
     */
    async startDetection() {
        if (this.collector.isCollectingFingerprint()) {
            this.displayManager.showStatus('检测正在进行中，请稍候...');
            return;
        }

        try {
            this.displayManager.showStatus('正在收集指纹信息...');
            this.displayManager.hideError();

            // 开始收集指纹
            const startTime = performance.now();
            this.fingerprintData = await this.collector.collectAll();
            const collectionTime = performance.now() - startTime;

            console.log(`指纹收集完成，耗时: ${collectionTime.toFixed(2)}ms`);

            // 确保数据存在才显示结果
            if (this.fingerprintData) {
                this.displayFingerprints();
                
                // 隐藏loading并显示结果
                this.displayManager.hideStatus();
                this.displayManager.showResults();
                
                // 提交到服务器
                await this.submitToServer();
            } else {
                throw new Error('指纹数据收集失败');
            }

        } catch (error) {
            console.error('指纹检测错误:', error);
            // 确保在异常情况下也隐藏loading状态并显示结果区域
            this.displayManager.hideStatus();
            this.displayManager.showResults();
            this.displayManager.showError(`检测过程中发生错误: ${error.message}`);
        }
    }

    /**
     * 显示指纹信息
     */
    displayFingerprints() {
        if (!this.fingerprintData) {
            console.error('fingerprintData 为空，无法显示指纹信息');
            return;
        }

        // 显示主指纹
        this.displayMainFingerprint();
        
        // 显示各模块指纹
        this.displayBasicInfo();
        this.displayCanvasFingerprint();
        this.displayWebGLFingerprint();
        this.displayAudioFingerprint();
        this.displayFontInfo();
        this.displayOtherInfo();
    }

    /**
     * 显示主指纹
     */
    displayMainFingerprint() {
        // main-fingerprint显示原始主指纹
        const element = document.getElementById('main-fingerprint');
        if (element) {
            element.textContent = this.fingerprintData.mainFingerprint || '计算中...';
        }

        // 显示收集时间
        const timeElement = document.getElementById('collection-time');
        if (timeElement) {
            const date = new Date(this.fingerprintData.timestamp);
            timeElement.textContent = date.toLocaleString();
        }
    }

    /**
     * 显示基础信息
     */
    displayBasicInfo() {
        const basicInfo = this.fingerprintData.basic;
        
        if (!basicInfo) {
            console.warn('basicInfo 为空');
            return;
        }

        // 用户代理
        this.setElementText('user-agent', basicInfo.userAgent?.full || navigator.userAgent);
        
        // 浏览器类型 - 修正访问路径
        this.setElementText('browser-type', basicInfo.browserType?.name || basicInfo.browserType?.detected || '未知');
        
        // 操作系统 - 修正访问路径
        this.setElementText('operating-system', basicInfo.operatingSystem?.name || basicInfo.operatingSystem?.detected || '未知');
        
        // 语言 (修复缺失)
        this.setElementText('language', basicInfo.userAgent?.language || navigator.language);
        
        // 平台 (修复缺失)
        this.setElementText('platform', basicInfo.userAgent?.platform || navigator.platform);
        
        // 触摸支持 (修复缺失) - 修正逻辑
        const touchSupport = basicInfo.userAgent?.touchSupport || basicInfo.touchSupport;
        this.setElementText('touch-support', touchSupport ? '支持' : '不支持');
        
        // Cookie 启用 (修复缺失) - 修正逻辑
        const cookieEnabled = basicInfo.userAgent?.cookieEnabled !== undefined ? 
            basicInfo.userAgent.cookieEnabled : navigator.cookieEnabled;
        this.setElementText('cookie-enabled', cookieEnabled ? '启用' : '禁用');
        
        // Do Not Track (修复缺失) - 修正逻辑
        const doNotTrack = basicInfo.userAgent?.doNotTrack || navigator.doNotTrack;
        this.setElementText('do-not-track', doNotTrack === '1' || doNotTrack === 'yes' ? '启用' : '禁用');
        
        // 屏幕信息
        const screenInfo = this.fingerprintData.screen;
        if (screenInfo) {
            this.setElementText('screen-resolution', `${screenInfo.width}x${screenInfo.height}`);
            this.setElementText('screen-color-depth', screenInfo.colorDepth);
            this.setElementText('device-pixel-ratio', screenInfo.devicePixelRatio);
        }

        // 时区信息
        const timezoneInfo = this.fingerprintData.timezone;
        if (timezoneInfo) {
            this.setElementText('timezone', timezoneInfo.timezone);
            this.setElementText('timezone-offset', timezoneInfo.timezoneOffset);
        }

        // 硬件信息
        const hardwareInfo = this.fingerprintData.hardware;
        if (hardwareInfo && hardwareInfo.hardware) {
            this.setElementText('cpu-cores', hardwareInfo.hardware.hardwareConcurrency || '未知');
            this.setElementText('memory', hardwareInfo.hardware.deviceMemory ? `${hardwareInfo.hardware.deviceMemory}GB` : '未知');
            this.setElementText('touch-points', hardwareInfo.hardware.maxTouchPoints || 0);
        }
    }

    /**
     * 显示Canvas指纹
     */
    displayCanvasFingerprint() {
        const canvasInfo = this.fingerprintData.canvas;
        
        if (!canvasInfo) {
            console.warn('canvasInfo 为空');
            return;
        }

        // Canvas指纹
        this.setElementText('canvas-fingerprint', canvasInfo.fingerprint);
        
        // Canvas数据 (修复缺失)
        const canvasDataElement = document.getElementById('canvas-data');
        if (canvasDataElement && canvasInfo.dataURL) {
            canvasDataElement.value = canvasInfo.dataURL;
        }
        
        // 强制绘制Canvas图像 - 无论是否有dataURL都尝试绘制
        const canvasDisplay = document.getElementById('fingerprint-canvas');
        
        if (canvasDisplay) {
            const ctx = canvasDisplay.getContext('2d');
            
            // 先清空Canvas
            ctx.clearRect(0, 0, canvasDisplay.width, canvasDisplay.height);
            
            if (canvasInfo.dataURL && canvasInfo.hasContent !== false) {
                const img = new Image();
                img.onload = function() {
                    ctx.drawImage(img, 0, 0, canvasDisplay.width, canvasDisplay.height);
                };
                img.onerror = function() {
                    drawDirectly();
                };
                img.src = canvasInfo.dataURL;
            } else {
                drawDirectly();
            }
            
            function drawDirectly() {
                // 绘制标准测试图案
                ctx.textBaseline = 'top';
                ctx.font = '14px Arial';
                ctx.fillStyle = '#f60';
                ctx.fillRect(125, 1, 62, 20);

                ctx.fillStyle = '#069';
                ctx.fillText('Browser Fingerprint', 2, 15);

                ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
                ctx.fillText('Canvas Test 🎨', 4, 45);

                // 添加更多复杂图形
                ctx.beginPath();
                ctx.arc(50, 25, 20, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.fill();
            }
        } else {
            console.error('找不到 fingerprint-canvas 元素');
        }

        // 像素分析
        if (canvasInfo.pixelAnalysis) {
            this.setElementText('canvas-pixels', `${canvasInfo.pixelAnalysis.totalPixels} 像素`);
            this.setElementText('canvas-entropy', canvasInfo.pixelAnalysis.entropy?.toFixed(4));
        } else {
            console.warn('pixelAnalysis 不存在');
        }

        // 一致性测试
        if (canvasInfo.consistencyTest) {
            const statusElement = document.getElementById('canvas-consistency');
            if (statusElement) {
                statusElement.textContent = canvasInfo.consistencyTest.isConsistent ? '一致' : '不一致';
                statusElement.className = canvasInfo.consistencyTest.isConsistent ? 'status-success' : 'status-warning';
            }
        }

        // Canvas噪点检测 (修复缺失)
        if (canvasInfo.noiseDetection) {
            // 动态噪点
            const dynamicNoiseElement = document.getElementById('canvas-dynamic-noise');
            if (dynamicNoiseElement) {
                const hasDynamicNoise = canvasInfo.noiseDetection.hasDynamicNoise;
                dynamicNoiseElement.textContent = hasDynamicNoise ? '检测到' : '未检测到';
                dynamicNoiseElement.className = `noise-indicator ${hasDynamicNoise ? 'noise-detected' : 'noise-not-detected'}`;
            }

            // 固定噪点
            const staticNoiseElement = document.getElementById('canvas-static-noise');
            if (staticNoiseElement) {
                const hasStaticNoise = canvasInfo.noiseDetection.hasStaticNoise;
                staticNoiseElement.textContent = hasStaticNoise ? '检测到' : '未检测到';
                staticNoiseElement.className = `noise-indicator ${hasStaticNoise ? 'noise-detected' : 'noise-not-detected'}`;
            }

            // 噪点检测详情
            const detailsElement = document.getElementById('canvas-noise-details');
            const detailsContainer = document.getElementById('canvas-noise-details-container');
            if (detailsElement && canvasInfo.noiseDetection.details) {
                detailsElement.textContent = canvasInfo.noiseDetection.details;
                if (detailsContainer) {
                    detailsContainer.style.display = 'block';
                }
            }
        } else {
            console.warn('noiseDetection 不存在');
        }
    }

    /**
     * 显示WebGL指纹
     */
    displayWebGLFingerprint() {
        const webglInfo = this.fingerprintData.webgl;
        if (!webglInfo) return;

        // WebGL支持状态
        this.displayWebGLSupport(webglInfo.support);
        
        // WebGL基础信息
        this.displayWebGLBasicInfo(webglInfo.basicInfo);
        
        // WebGL指纹
        this.setElementText('webgl-fingerprint', webglInfo.fingerprint);
        
        // 渲染结果
        this.displayWebGLRenderResults(webglInfo);
        
        // WebGL噪点检测
        this.displayWebGLNoiseDetection(webglInfo.noiseDetection);

        // WebGL检测详情 (修复缺失)
        this.displayWebGLDetails(webglInfo);
    }

    /**
     * 显示WebGL支持状态
     * @param {Object} support 支持信息
     */
    displayWebGLSupport(support) {
        if (!support) return;

        // 基础WebGL支持 (修复缺失)
        const basicSupportElement = document.getElementById('webgl-basic-support');
        if (basicSupportElement) {
            basicSupportElement.textContent = support.basicSupport ? '支持' : '不支持';
            basicSupportElement.className = support.basicSupport ? 'status-success' : 'status-error';
        }

        // 实验性WebGL支持 (修复缺失)
        const experimentalSupportElement = document.getElementById('webgl-experimental-support');
        if (experimentalSupportElement) {
            experimentalSupportElement.textContent = support.experimentalSupport ? '支持' : '不支持';
            experimentalSupportElement.className = support.experimentalSupport ? 'status-success' : 'status-error';
        }

        // WebGL readPixels支持 (修复缺失)
        const readPixelsSupportElement = document.getElementById('webgl-readpixels-support');
        if (readPixelsSupportElement) {
            readPixelsSupportElement.textContent = support.readPixelsSupport ? '支持' : '不支持';
            readPixelsSupportElement.className = support.readPixelsSupport ? 'status-success' : 'status-error';
        }

        // 详细支持信息 (保留原有逻辑)
        const detailsElement = document.getElementById('webgl-support-details');
        if (detailsElement) {
            const details = [];
            if (support.webgl2) details.push('WebGL 2.0');
            if (support.extensions && support.extensions.length > 0) {
                details.push(`${support.extensions.length} 个扩展`);
            }
            detailsElement.textContent = details.join(', ') || '基础支持';
        }
    }

    /**
     * 显示WebGL基础信息
     * @param {Object} basicInfo 基础信息
     */
    displayWebGLBasicInfo(basicInfo) {
        if (!basicInfo) return;

        this.setElementText('webgl-vendor', basicInfo.vendor);
        this.setElementText('webgl-renderer', basicInfo.renderer);
        this.setElementText('webgl-version', basicInfo.version);
        this.setElementText('webgl-glsl-version', basicInfo.shadingLanguageVersion);
    }

    /**
     * 显示WebGL渲染结果
     * @param {Object} webglInfo WebGL信息
     */
    displayWebGLRenderResults(webglInfo) {
        // 红色矩形结果
        if (webglInfo.redRectangle && typeof webglInfo.redRectangle === 'object') {
            this.setElementText('webgl-rectangle-hash', webglInfo.redRectangle.fingerprint);

            const rectCanvas = document.getElementById('webgl-rectangle-canvas');
            if (rectCanvas && webglInfo.redRectangle.canvas) {
                const ctx = rectCanvas.getContext('2d');
                ctx.drawImage(webglInfo.redRectangle.canvas, 0, 0, rectCanvas.width, rectCanvas.height);
            }
        } else {
            this.setElementText('webgl-rectangle-hash', webglInfo.redRectangle === true ? '成功' : '失败');
        }

        // 彩色立方体结果
        if (webglInfo.coloredCube && typeof webglInfo.coloredCube === 'object') {
            this.setElementText('webgl-cube-hash', webglInfo.coloredCube.fingerprint);

            const cubeCanvas = document.getElementById('webgl-cube-canvas');
            if (cubeCanvas && webglInfo.coloredCube.canvas) {
                const ctx = cubeCanvas.getContext('2d');
                ctx.drawImage(webglInfo.coloredCube.canvas, 0, 0, cubeCanvas.width, cubeCanvas.height);
            }
        } else {
            this.setElementText('webgl-cube-hash', webglInfo.coloredCube === true ? '成功' : '失败');
        }
    }

    /**
     * 显示WebGL噪点检测结果
     * @param {Object} noiseDetection 噪点检测结果
     */
    displayWebGLNoiseDetection(noiseDetection) {
        if (!noiseDetection) return;

        // 固定噪点检测
        const persistentNoiseElement = document.getElementById('webgl-persistent-noise');
        if (persistentNoiseElement) {
            const hasPersistentNoise = noiseDetection.hasPersistentNoise;
            persistentNoiseElement.textContent = hasPersistentNoise ? '是' : '否';
            persistentNoiseElement.className = `webgl-indicator ${hasPersistentNoise ? 'noise-detected' : 'noise-not-detected'}`;
        }

        // 动态噪点检测
        const randomNoiseElement = document.getElementById('webgl-random-noise');
        if (randomNoiseElement) {
            const hasRandomNoise = noiseDetection.hasRandomNoise;
            randomNoiseElement.textContent = hasRandomNoise ? '是' : '否';
            randomNoiseElement.className = `webgl-indicator ${hasRandomNoise ? 'noise-detected' : 'noise-not-detected'}`;
        }

        // DOM加载前指纹
        if (noiseDetection.beforeDOMFingerprint) {
            this.setElementText('webgl-before-fingerprint', noiseDetection.beforeDOMFingerprint);
        }

        // DOM加载后指纹
        if (noiseDetection.afterDOMFingerprint) {
            this.setElementText('webgl-after-fingerprint', noiseDetection.afterDOMFingerprint);
        }

        // 红色矩形指纹
        if (noiseDetection.redBoxFingerprint) {
            this.setElementText('webgl-red-fingerprint', noiseDetection.redBoxFingerprint);
        }
        
        // 红色矩形Canvas显示 - 使用实际的Canvas数据
        const redBoxCanvas = document.getElementById('webgl-red-box-canvas');
        if (redBoxCanvas) {
            try {
                redBoxCanvas.innerHTML = '';
                
                // 尝试使用实际的Canvas数据
                if (noiseDetection.canvasData && noiseDetection.canvasData.redBox) {
                    const actualCanvas = noiseDetection.canvasData.redBox;
                    actualCanvas.style.border = '1px solid #ddd';
                    actualCanvas.style.borderRadius = '4px';
                    actualCanvas.style.maxWidth = '100%';
                    actualCanvas.style.height = 'auto';
                    redBoxCanvas.appendChild(actualCanvas);
                    console.log('红色矩形实际Canvas已显示');
                } else {
                    redBoxCanvas.innerHTML = '<div style="color: #666; padding: 10px;">Canvas数据不可用</div>';
                }
            } catch (error) {
                console.error('显示红色矩形Canvas失败:', error);
                redBoxCanvas.innerHTML = '<div style="color: #666; padding: 10px;">显示错误</div>';
            }
        }
        
        // DOM加载前Canvas显示 - 使用实际的Canvas数据
        const beforeCanvas = document.getElementById('webgl-before-canvas');
        if (beforeCanvas) {
            try {
                beforeCanvas.innerHTML = '';
                
                // 尝试使用实际的Canvas数据
                if (noiseDetection.canvasData && noiseDetection.canvasData.before) {
                    const actualCanvas = noiseDetection.canvasData.before;
                    actualCanvas.style.border = '1px solid #ddd';
                    actualCanvas.style.borderRadius = '4px';
                    actualCanvas.style.maxWidth = '100%';
                    actualCanvas.style.height = 'auto';
                    beforeCanvas.appendChild(actualCanvas);
                    console.log('DOM加载前实际Canvas已显示');
                } else {
                    beforeCanvas.innerHTML = '<div style="color: #666; padding: 10px;">Canvas数据不可用</div>';
                }
            } catch (error) {
                console.error('显示DOM加载前Canvas失败:', error);
                beforeCanvas.innerHTML = '<div style="color: #666; padding: 10px;">显示错误</div>';
            }
        }
        
        // DOM加载后Canvas显示 - 使用实际的Canvas数据
        const afterCanvas = document.getElementById('webgl-after-canvas');
        if (afterCanvas) {
            try {
                afterCanvas.innerHTML = '';
                
                // 尝试使用实际的Canvas数据
                if (noiseDetection.canvasData && noiseDetection.canvasData.after) {
                    const actualCanvas = noiseDetection.canvasData.after;
                    actualCanvas.style.border = '1px solid #ddd';
                    actualCanvas.style.borderRadius = '4px';
                    actualCanvas.style.maxWidth = '100%';
                    actualCanvas.style.height = 'auto';
                    afterCanvas.appendChild(actualCanvas);
                    console.log('DOM加载后实际Canvas已显示');
                } else {
                    afterCanvas.innerHTML = '<div style="color: #666; padding: 10px;">Canvas数据不可用</div>';
                }
            } catch (error) {
                console.error('显示DOM加载后Canvas失败:', error);
                afterCanvas.innerHTML = '<div style="color: #666; padding: 10px;">显示错误</div>';
            }
        }
    }

    /**
     * 显示WebGL详细信息 (新增)
     * @param {Object} webglInfo WebGL信息
     */
    displayWebGLDetails(webglInfo) {
        const detailsElement = document.getElementById('webgl-detection-details');
        if (!detailsElement) return;

        const details = [];
        
        if (webglInfo.basicInfo) {
            details.push(`渲染器: ${webglInfo.basicInfo.renderer}`);
            details.push(`供应商: ${webglInfo.basicInfo.vendor}`);
            details.push(`版本: ${webglInfo.basicInfo.version}`);
        }

        if (webglInfo.support) {
            details.push(`基础支持: ${webglInfo.support.basicSupport ? '是' : '否'}`);
            details.push(`WebGL2支持: ${webglInfo.support.webgl2 ? '是' : '否'}`);
        }

        if (webglInfo.spoofingDetection) {
            details.push(`欺骗检测: ${webglInfo.spoofingDetection.spoofingDetected ? '检测到异常' : '正常'}`);
        }

        detailsElement.innerHTML = details.map(detail => `<div class="detail-item">${detail}</div>`).join('');
    }

    /**
     * 显示音频指纹
     */
    displayAudioFingerprint() {
        const audioInfo = this.fingerprintData.audio;
        if (!audioInfo) return;

        // 音频支持状态
        this.displayAudioSupport(audioInfo.support);
        
        // 音频指纹
        this.setElementText('audio-fingerprint', audioInfo.fingerprint);
        
        // 格式支持
        this.displayAudioFormats(audioInfo.formats);
        
        // 压缩器测试
        this.displayAudioCompressorTest(audioInfo.compressor);

        // 音频属性 (修复缺失)
        this.displayAudioProperties(audioInfo.properties);

        // 音频设备信息 (修复缺失)
        this.displayAudioDevices(audioInfo.devices ? audioInfo.devices.info : null);

        // 音频指纹哈希 (修复缺失)
        this.displayAudioFingerprints(audioInfo);

        // 音频噪点检测 (修复字段名称)
        this.displayAudioNoiseDetection(this.fingerprintData.audioNoiseDetection);
    }

    /**
     * 显示音频支持状态
     * @param {Object} support 支持信息
     */
    displayAudioSupport(support) {
        if (!support) return;

        // 基础音频支持 (修复缺失)
        const basicSupportElement = document.getElementById('audio-basic-support');
        if (basicSupportElement) {
            basicSupportElement.textContent = support.basicSupport ? '支持' : '不支持';
            basicSupportElement.className = support.basicSupport ? 'status-success' : 'status-error';
        }

        // 离线AudioContext支持 (修复缺失)
        const offlineSupportElement = document.getElementById('audio-offline-support');
        if (offlineSupportElement) {
            offlineSupportElement.textContent = support.offlineSupport ? '支持' : '不支持';
            offlineSupportElement.className = support.offlineSupport ? 'status-success' : 'status-error';
        }

        // createAnalyser支持 (修复缺失)
        const analyserElement = document.getElementById('audio-create-analyser');
        if (analyserElement) {
            analyserElement.textContent = support.createAnalyser ? '支持' : '不支持';
            analyserElement.className = support.createAnalyser ? 'status-success' : 'status-error';
        }

        // createOscillator支持 (修复缺失)
        const oscillatorElement = document.getElementById('audio-create-oscillator');
        if (oscillatorElement) {
            oscillatorElement.textContent = support.createOscillator ? '支持' : '不支持';
            oscillatorElement.className = support.createOscillator ? 'status-success' : 'status-error';
        }

        // createGain支持 (修复缺失)
        const gainElement = document.getElementById('audio-create-gain');
        if (gainElement) {
            gainElement.textContent = support.createGain ? '支持' : '不支持';
            gainElement.className = support.createGain ? 'status-success' : 'status-error';
        }

        // createDynamicsCompressor支持 (修复缺失)
        const compressorElement = document.getElementById('audio-create-compressor');
        if (compressorElement) {
            compressorElement.textContent = support.createDynamicsCompressor ? '支持' : '不支持';
            compressorElement.className = support.createDynamicsCompressor ? 'status-success' : 'status-error';
        }

        // 详细支持信息 (保留原有逻辑)
        const detailsElement = document.getElementById('audio-support-details');
        if (detailsElement) {
            const details = [];
            if (support.offlineSupport) details.push('离线上下文');
            if (support.createAnalyser) details.push('分析器');
            if (support.createOscillator) details.push('振荡器');
            if (support.createDynamicsCompressor) details.push('压缩器');
            detailsElement.textContent = details.join(', ') || '基础支持';
        }
    }

    /**
     * 显示音频格式支持
     * @param {Object} formats 格式支持信息
     */
    displayAudioFormats(formats) {
        if (!formats) return;

        // 各种音频格式支持 (修复缺失)
        const formatMapping = {
            'ogg': 'audio-format-ogg',
            'mp3': 'audio-format-mp3',
            'wav': 'audio-format-wav',
            'm4a': 'audio-format-m4a',
            'aac': 'audio-format-aac',
            'webm': 'audio-format-webm'
        };

        Object.keys(formatMapping).forEach(format => {
            const elementId = formatMapping[format];
            const element = document.getElementById(elementId);
            if (element) {
                const isSupported = formats[format];
                element.textContent = isSupported ? '支持' : '不支持';
                element.className = isSupported ? 'status-success' : 'status-error';
            }
        });

        // 保留原有的综合显示
        const formatsElement = document.getElementById('audio-formats');
        if (formatsElement) {
            const supportedFormats = Object.keys(formats).filter(format => formats[format]);
            formatsElement.textContent = supportedFormats.join(', ') || '无';
        }
    }

    /**
     * 显示音频压缩器测试结果
     * @param {Object} compressorTest 压缩器测试结果
     */
    displayAudioCompressorTest(compressorTest) {
        if (!compressorTest || !compressorTest.analysis) return;

        const analysis = compressorTest.analysis;

        // 动态噪点检测状态
        const noiseElement = document.getElementById('audio-dynamic-noise');
        if (noiseElement) {
            const status = analysis.hasDynamicNoise ? '检测到' : '未检测到';
            noiseElement.textContent = status;
            noiseElement.className = analysis.hasDynamicNoise ? 'status-warning' : 'status-success';
        }

        // 检测详情
        const detailsElement = document.getElementById('audio-noise-details');
        if (detailsElement) {
            detailsElement.textContent = analysis.simpleDetails || '无详细信息';
        }

        // 置信度
        const confidenceElement = document.getElementById('audio-noise-confidence');
        if (confidenceElement) {
            const confidence = Math.round(analysis.confidence * 100);
            confidenceElement.textContent = `${confidence}%`;
        }

        // 压缩器详细检测 (修复缺失)
        this.setElementText('audio-compressor-details', analysis.details || '未检测');
        this.setElementText('audio-compressor-confidence', analysis.confidence ? `${Math.round(analysis.confidence * 100)}%` : 'N/A');
        this.setElementText('audio-compressor-tests', analysis.testCount || 'N/A');
        this.setElementText('audio-fingerprint-match', analysis.mainFingerprintMatch ? '匹配' : '不匹配');
    }

    /**
     * 显示音频属性 (新增)
     * @param {Object} properties 音频属性
     */
    displayAudioProperties(properties) {
        if (!properties) return;

        const propertiesElement = document.getElementById('audio-properties');
        if (propertiesElement) {
            const propertiesText = JSON.stringify(properties, null, 2);
            propertiesElement.value = propertiesText;
        }
    }

    /**
     * 显示音频设备信息 (新增)
     * @param {Object} devices 设备信息
     */
    displayAudioDevices(devices) {
        if (!devices) return;

        // 修正字段名称：从audioInputCount/audioOutputCount获取数据
        this.setElementText('audio-input-count', devices.audioInputCount || 0);
        this.setElementText('audio-output-count', devices.audioOutputCount || 0);
    }

    /**
     * 显示音频指纹哈希 (新增)
     * @param {Object} audioInfo 音频信息
     */
    displayAudioFingerprints(audioInfo) {
        if (!audioInfo) return;

        // 各种音频指纹 - 修正字段名称
        this.setElementText('audio-properties-fingerprint', audioInfo.properties?.fingerprint);
        this.setElementText('audio-fingerprint', audioInfo.fingerprint);
        this.setElementText('audio-compressor-fingerprint', audioInfo.compressor?.fingerprint);
        this.setElementText('audio-device-fingerprint', audioInfo.devices?.fingerprint);
        this.setElementText('audio-final-fingerprint', audioInfo.fingerprint);
    }

    /**
     * 显示音频噪点检测 (新增)
     * @param {Object} noiseDetection 噪点检测结果
     */
    displayAudioNoiseDetection(noiseDetection) {
        if (!noiseDetection) return;

        // 综合检测摘要 - 只显示摘要信息，具体检测结果由压缩器测试显示
        const summaryText = noiseDetection.hasNoise ? 
            `检测到音频指纹篡改 (${noiseDetection.type})` : 
            '未检测到音频指纹篡改';
        this.setElementText('audio-noise-summary', summaryText);
        
        // 整体置信度
        this.setElementText('audio-overall-confidence', noiseDetection.confidence ? `${Math.round(noiseDetection.confidence * 100)}%` : 'N/A');
    }

    /**
     * 显示字体信息
     */
    displayFontInfo() {
        const fontInfo = this.fingerprintData.fonts;
        if (!fontInfo) return;

        this.setElementText('font-count', fontInfo.count);
        this.setElementText('font-fingerprint', fontInfo.fingerprint);
        
        const fontListElement = document.getElementById('font-list');
        if (fontListElement && fontInfo.available) {
            // 显示所有字体，而不是只显示前10个
            fontListElement.textContent = fontInfo.available.join(', ');
        }
    }

    /**
     * 显示插件信息 (新增)
     */
    displayPluginInfo() {
        const pluginInfo = this.fingerprintData.plugins;
        if (!pluginInfo) return;

        // 插件数量
        this.setElementText('plugin-count', pluginInfo.count || 0);

        // 插件列表
        const pluginListElement = document.getElementById('plugin-list');
        if (pluginListElement && pluginInfo.list) {
            if (pluginInfo.list.length === 0) {
                pluginListElement.textContent = '未检测到插件';
            } else {
                const pluginNames = pluginInfo.list.map(plugin => plugin.name || plugin).slice(0, 5);
                pluginListElement.textContent = pluginNames.join(', ');
                if (pluginInfo.list.length > 5) {
                    pluginListElement.textContent += ` 等 ${pluginInfo.list.length} 个插件`;
                }
            }
        }
    }

    /**
     * 显示其他信息
     */
    displayOtherInfo() {
        const storageInfo = this.fingerprintData.storage;
        if (storageInfo) {
            const storageElement = document.getElementById('storage-support');
            if (storageElement) {
                const supportedStorage = [];
                if (storageInfo.localStorage) supportedStorage.push('localStorage');
                if (storageInfo.sessionStorage) supportedStorage.push('sessionStorage');
                if (storageInfo.indexedDB) supportedStorage.push('IndexedDB');
                if (storageInfo.webSQL) supportedStorage.push('WebSQL');
                storageElement.textContent = supportedStorage.join(', ') || '无';
            }
        }

        // 显示插件信息
        this.displayPluginInfo();

        // 显示主指纹哈希 (修复缺失)
        this.displayMainFingerprintHash();
    }

    /**
     * 显示主指纹哈希 (区分本地计算和服务器返回)
     */
    displayMainFingerprintHash() {
        const hashElement = document.getElementById('fingerprint-hash');
        if (hashElement) {
            // 如果有服务器返回的哈希值，优先显示
            if (this.serverFingerprintHash) {
                hashElement.innerHTML = `<h3>服务器确认的指纹哈希:</h3>${this.serverFingerprintHash}`;
            } else {
                // 否则显示前端计算的指纹哈希
                const submissionData = this.collector.generateBackendSubmissionData();
                const fingerprintHash = submissionData.fingerprint_hash;
                hashElement.innerHTML = `<h3>计算的指纹哈希:</h3>${fingerprintHash}`;
            }
        }
    }

    /**
     * 设置元素文本内容
     * @param {string} id 元素ID
     * @param {string} text 文本内容
     */
    setElementText(id, text) {
        const element = document.getElementById(id);
        if (element) {
            const finalText = text || '未知';
            element.textContent = finalText;
        } else {
            console.error(`找不到ID为 ${id} 的元素`);
        }
    }

    /**
     * 刷新WebGL测试
     */
    async refreshWebGLTest() {
        try {
            this.displayManager.showStatus('正在重新测试WebGL...');
            
            const webglData = await this.collector.collectWebGLFingerprint();
            this.fingerprintData.webgl = webglData;
            
            this.displayWebGLFingerprint();
            this.displayManager.hideStatus();
            
        } catch (error) {
            console.error('WebGL重新测试失败:', error);
            this.displayManager.showError('WebGL重新测试失败: ' + error.message);
        }
    }

    /**
     * 刷新音频测试
     */
    async refreshAudioTest() {
        try {
            this.displayManager.showStatus('正在重新测试音频...');
            
            const audioData = await this.collector.collectAudioFingerprint();
            this.fingerprintData.audio = audioData;
            
            this.displayAudioFingerprint();
            this.displayManager.hideStatus();
            
        } catch (error) {
            console.error('音频重新测试失败:', error);
            this.displayManager.showError('音频重新测试失败: ' + error.message);
        }
    }

    /**
     * 复制主指纹
     */
    copyMainFingerprint() {
        if (this.fingerprintData && this.fingerprintData.mainFingerprint) {
            this.copyToClipboard(this.fingerprintData.mainFingerprint, '主指纹');
        }
    }

    /**
     * 复制WebGL指纹
     */
    copyWebGLFingerprint() {
        if (this.fingerprintData && this.fingerprintData.webgl && this.fingerprintData.webgl.fingerprint) {
            this.copyToClipboard(this.fingerprintData.webgl.fingerprint, 'WebGL指纹');
        }
    }

    /**
     * 复制音频指纹
     */
    copyAudioFingerprint() {
        if (this.fingerprintData && this.fingerprintData.audio && this.fingerprintData.audio.fingerprint) {
            this.copyToClipboard(this.fingerprintData.audio.fingerprint, '音频指纹');
        }
    }

    /**
     * 复制到剪贴板
     * @param {string} text 要复制的文本
     * @param {string} type 类型描述
     */
    async copyToClipboard(text, type = '内容') {
        try {
            await navigator.clipboard.writeText(text);
            this.displayManager.showStatus(`${type}已复制到剪贴板`);
            setTimeout(() => this.displayManager.hideStatus(), 2000);
        } catch (error) {
            console.error('复制失败:', error);
            this.displayManager.showError('复制失败，请手动选择文本');
        }
    }

    /**
     * 导出数据
     */
    exportData() {
        if (!this.fingerprintData) {
            this.displayManager.showError('没有可导出的数据');
            return;
        }

        try {
            const exportData = {
                timestamp: this.fingerprintData.timestamp,
                mainFingerprint: this.fingerprintData.mainFingerprint,
                version: this.fingerprintData.version,
                data: this.fingerprintData
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `browser-fingerprint-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            this.displayManager.showStatus('数据导出成功');
            setTimeout(() => this.displayManager.hideStatus(), 2000);
            
        } catch (error) {
            console.error('导出失败:', error);
            this.displayManager.showError('导出失败: ' + error.message);
        }
    }

    /**
     * 提交到服务器
     */
    async submitToServer() {
        try {
            // 生成后端提交数据格式
            const submissionData = this.collector.generateBackendSubmissionData();
            
            console.log('提交指纹数据到服务器');
            
            // 调试：检查 webglNoiseDetection 字段
            console.log('webglNoiseDetection 数据:', submissionData.webglNoiseDetection);

            const response = await fetch('/api/fingerprint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submissionData)
            });

            if (response.ok) {
                const result = await response.json();
                this.analysisResults = result;
                
                // 保存服务器返回的指纹哈希
                if (result.analysis && result.analysis.fingerprint_hash) {
                    this.serverFingerprintHash = result.analysis.fingerprint_hash;
                    // 更新显示
                    this.displayMainFingerprintHash();
                }
                
                // 显示分析结果
                if (result.success && result.analysis) {
                    this.displayAnalysisResults(result.analysis);
                }
                
                // 显示成功提示
                this.displayManager.showStatus('指纹数据已提交到服务器');
                setTimeout(() => this.displayManager.hideStatus(), 2000);
                
            } else {
                const errorData = await response.json().catch(() => ({ message: '服务器响应格式错误' }));
                console.warn('服务器响应异常:', response.status, errorData);
                this.displayManager.showStatus(`服务器响应异常: ${errorData.message || '未知错误'}`);
                // 失败情况不自动隐藏，让用户看到错误信息
            }
        } catch (error) {
            console.warn('提交到服务器失败:', error.message);
            // 提交失败不影响正常显示，只记录日志
            this.displayManager.showStatus('服务器连接失败，数据已在本地计算完成');
            // 连接失败情况不自动隐藏，让用户知道服务器状态
        }
    }

    /**
     * 显示分析结果
     * @param {Object} analysis 分析结果
     */
    displayAnalysisResults(analysis) {
        if (!analysis) return;

        // 显示分析结果卡片
        const analysisCard = document.getElementById('analysis-results');
        if (analysisCard) {
            analysisCard.style.display = 'block';
        }

        // 风险等级
        const riskElement = document.getElementById('risk-level');
        if (riskElement) {
            riskElement.textContent = analysis.risk_level || '未知';
            riskElement.className = `risk-badge risk-${(analysis.risk_level || 'unknown').toLowerCase()}`;
        }

        // 唯一性评分
        this.setElementText('uniqueness-score', 
            analysis.uniqueness_score ? (analysis.uniqueness_score * 100).toFixed(1) + '%' : '未知');

        // 爬虫评分
        this.setElementText('bot-score', 
            analysis.bot_score ? (analysis.bot_score * 100).toFixed(1) + '%' : '未知');

        // 是否为爬虫
        const isBotElement = document.getElementById('is-bot');
        if (isBotElement) {
            isBotElement.textContent = analysis.is_bot ? '是' : '否';
            isBotElement.className = `bot-status ${analysis.is_bot ? 'bot-detected' : 'bot-not-detected'}`;
        }

        // 访问次数
        this.setElementText('visit-count', analysis.visit_count || 1);

        // 检测原因
        const reasonsElement = document.getElementById('detection-reasons');
        if (reasonsElement && analysis.reasons) {
            const reasons = Array.isArray(analysis.reasons) ? analysis.reasons : 
                           (typeof analysis.reasons === 'string' ? JSON.parse(analysis.reasons) : []);
            
            reasonsElement.innerHTML = '';
            reasons.forEach(reason => {
                const li = document.createElement('li');
                li.textContent = reason;
                reasonsElement.appendChild(li);
            });
        }
    }
}

/**
 * 显示管理器 - 统一管理UI显示状态
 */
class DisplayManager {
    /**
     * 显示状态信息
     * @param {string} message 状态消息
     */
    showStatus(message) {
        const statusElement = document.getElementById('detection-status');
        if (statusElement) {
            const loadingElement = statusElement.querySelector('.loading span');
            if (loadingElement) {
                loadingElement.textContent = message;
            }
            statusElement.style.display = 'block';
        }
    }

    /**
     * 隐藏状态信息
     */
    hideStatus() {
        const statusElement = document.getElementById('detection-status');
        if (statusElement) {
            statusElement.style.display = 'none';
        } else {
            console.error('找不到 detection-status 元素');
        }
    }

    /**
     * 显示结果
     */
    showResults() {
        const resultsElement = document.getElementById('fingerprint-results');
        if (resultsElement) {
            resultsElement.style.display = 'block';
        } else {
            console.error('找不到 fingerprint-results 元素');
        }
        
        // 确保隐藏loading状态
        this.hideStatus();
    }

    /**
     * 隐藏结果
     */
    hideResults() {
        const resultsElement = document.getElementById('fingerprint-results');
        if (resultsElement) {
            resultsElement.style.display = 'none';
        }
    }

    /**
     * 显示错误信息
     * @param {string} message 错误消息
     */
    showError(message) {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            const errorText = document.getElementById('error-text');
            if (errorText) {
                errorText.textContent = message;
            }
            errorElement.style.display = 'block';
        }
        this.hideStatus();
    }

    /**
     * 隐藏错误信息
     */
    hideError() {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }
}

// 导出应用类
window.ModernBrowserDetectionApp = ModernBrowserDetectionApp;
window.DisplayManager = DisplayManager;
