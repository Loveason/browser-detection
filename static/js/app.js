// 主应用逻辑
class BrowserFingerprintApp {
    constructor() {
        this.collector = new FingerprintCollector();
        this.fingerprintData = null;
        this.analysisData = null;
        this.init();
    }

    // 初始化应用
    init() {
        this.bindEvents();
        this.startDetection();
    }

    // 绑定事件
    bindEvents() {
        const refreshBtn = document.getElementById('refresh-btn');
        const exportBtn = document.getElementById('export-btn');
        const retryBtn = document.getElementById('retry-btn');
        const copyBtn = document.getElementById('copy-hash');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.startDetection());
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.startDetection());
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyFingerprint());
        }
    }

    // 开始检测
    async startDetection() {
        try {
            this.showStatus('正在收集指纹信息...');
            this.hideResults();
            this.hideError();

            // 收集指纹数据
            this.fingerprintData = await this.collector.collectAll();

            // 显示指纹信息
            this.displayFingerprintData();

            // 提交到服务器进行分析
            await this.submitFingerprint();

        } catch (error) {
            console.error('Detection error:', error);
            this.showError('检测过程中发生错误: ' + error.message);
        }
    }

    // 显示状态
    showStatus(message) {
        const statusElement = document.getElementById('detection-status');
        const loadingElement = statusElement.querySelector('.loading span');
        
        if (loadingElement) {
            loadingElement.textContent = message;
        }
        
        statusElement.style.display = 'block';
    }

    // 隐藏状态
    hideStatus() {
        const statusElement = document.getElementById('detection-status');
        statusElement.style.display = 'none';
    }

    // 显示结果
    showResults() {
        const resultsElement = document.getElementById('fingerprint-results');
        resultsElement.style.display = 'block';
        this.hideStatus();
    }

    // 隐藏结果
    hideResults() {
        const resultsElement = document.getElementById('fingerprint-results');
        resultsElement.style.display = 'none';
    }

    // 显示错误
    showError(message) {
        const errorElement = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        
        if (errorText) {
            errorText.textContent = message;
        }
        
        errorElement.style.display = 'block';
        this.hideStatus();
    }

    // 隐藏错误
    hideError() {
        const errorElement = document.getElementById('error-message');
        errorElement.style.display = 'none';
    }

    // 显示指纹数据
    displayFingerprintData() {
        if (!this.fingerprintData) return;

        // 基础信息
        this.setElementText('user-agent', this.fingerprintData.user_agent);
        this.setElementText('screen-resolution', this.fingerprintData.screen_resolution);
        this.setElementText('timezone', this.fingerprintData.timezone);
        this.setElementText('language', this.fingerprintData.language);
        this.setElementText('platform', this.fingerprintData.platform);
        this.setElementText('touch-support', this.fingerprintData.touch_support ? '是' : '否');
        this.setElementText('cookie-enabled', this.fingerprintData.cookie_enabled ? '是' : '否');
        this.setElementText('do-not-track', this.fingerprintData.do_not_track);

        // Canvas数据 - 显示完整数据
        this.displayCanvasData(this.fingerprintData.canvas);
        
        // 显示Canvas噪点检测结果
        this.displayNoiseDetection('canvas', this.fingerprintData.canvasNoiseDetection);

        // WebGL信息 - 增强版本
        console.log('显示WebGL信息...', this.fingerprintData);
        try {
            // 基础WebGL信息
            const webglData = JSON.parse(this.fingerprintData.webgl);
            console.log('WebGL基础数据:', webglData);
            this.setElementText('webgl-renderer', webglData.renderer || 'Unknown');
            this.setElementText('webgl-vendor', webglData.vendorUnmasked || 'Unknown');
            this.setElementText('webgl-version', webglData.version || 'Unknown');
            
            // WebGL支持信息
            if (this.fingerprintData.webglSupportInfo) {
                const supportInfo = this.fingerprintData.webglSupportInfo;
                console.log('WebGL支持信息:', supportInfo);
                this.setElementText('webgl-basic-support', supportInfo.basicSupport ? '支持' : '不支持');
                this.setElementText('webgl-experimental-support', supportInfo.experimentalSupport ? '支持' : '不支持');
                this.setElementText('webgl-readpixels-support', supportInfo.readPixelsSupport ? '支持' : '不支持');
            }
            
        } catch (e) {
            console.error('解析WebGL数据时出错:', e);
            this.setElementText('webgl-renderer', this.fingerprintData.webgl);
            this.setElementText('webgl-vendor', 'N/A');
            this.setElementText('webgl-version', 'N/A');
        }
        
        // 显示WebGL欺骗检测结果
        console.log('WebGL噪点检测数据:', this.fingerprintData.webglNoiseDetection);
        console.log('WebGL指纹数据:', this.fingerprintData.webglFingerprintData);
        this.displayWebGLSpoofingDetection(this.fingerprintData.webglNoiseDetection, this.fingerprintData.webglFingerprintData);
        
        // 显示WebGL Canvas渲染结果
        this.displayWebGLCanvases(this.fingerprintData.webglFingerprintData);

        // 音频指纹
        this.displayAudioFingerprint(this.fingerprintData);

        // 字体信息
        this.setElementText('font-count', this.fingerprintData.fonts.length);
        this.displayFontList(this.fingerprintData.fonts);

        // 插件信息
        this.setElementText('plugin-count', this.fingerprintData.plugins.length);
        this.displayPluginList(this.fingerprintData.plugins);

        this.showResults();
    }

    // 显示字体列表
    displayFontList(fonts) {
        const fontList = document.getElementById('font-list');
        if (!fontList) return;

        fontList.innerHTML = '';
        
        // 显示所有字体，使用CSS滚动
        fonts.forEach(font => {
            const fontElement = document.createElement('span');
            fontElement.className = 'font-item';
            fontElement.textContent = font;
            fontList.appendChild(fontElement);
        });
    }

    // 显示Canvas数据
    displayCanvasData(canvasData) {
        const canvasElement = document.getElementById('canvas-data');
        if (canvasElement && canvasData) {
            // 使用textarea显示完整的Canvas数据
            canvasElement.value = canvasData;
        }
    }

    // 显示插件列表
    displayPluginList(plugins) {
        const pluginList = document.getElementById('plugin-list');
        if (!pluginList) return;

        pluginList.innerHTML = '';
        if (plugins.length === 0) {
            const noPlugins = document.createElement('div');
            noPlugins.textContent = '未检测到插件';
            noPlugins.style.fontStyle = 'italic';
            noPlugins.style.opacity = '0.7';
            pluginList.appendChild(noPlugins);
        } else {
            plugins.forEach(plugin => {
                const pluginElement = document.createElement('div');
                pluginElement.textContent = plugin;
                pluginList.appendChild(pluginElement);
            });
        }
    }

    // 提交指纹到服务器
    async submitFingerprint() {
        try {
            this.showStatus('正在分析指纹数据...');

            const response = await fetch('/api/fingerprint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.fingerprintData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.displayFingerprintHash(result.fingerprint_hash);
                if (result.analysis) {
                    this.analysisData = result.analysis;
                    this.displayAnalysisResults();
                }
                // 成功后隐藏加载状态
                this.hideStatus();
            } else {
                throw new Error(result.message || '提交失败');
            }

        } catch (error) {
            console.error('Submit error:', error);
            this.hideStatus(); // 错误时也要隐藏加载状态
            this.showNotification('提交指纹数据失败: ' + error.message, 'error');
        }
    }

    // 显示指纹哈希
    displayFingerprintHash(hash) {
        this.setElementText('fingerprint-hash', hash);
    }

    // 显示分析结果
    displayAnalysisResults() {
        if (!this.analysisData) return;

        const analysisElement = document.getElementById('analysis-results');
        
        // 风险等级
        const riskLevelElement = document.getElementById('risk-level');
        if (riskLevelElement) {
            riskLevelElement.textContent = this.analysisData.risk_level;
            riskLevelElement.className = `risk-badge ${this.analysisData.risk_level}`;
        }

        // 评分
        this.setElementText('uniqueness-score', (this.analysisData.uniqueness_score * 100).toFixed(1) + '%');
        this.setElementText('bot-score', (this.analysisData.bot_score * 100).toFixed(1) + '%');

        // 是否为爬虫
        const isBotElement = document.getElementById('is-bot');
        if (isBotElement) {
            isBotElement.textContent = this.analysisData.is_bot ? '是' : '否';
            isBotElement.className = `bot-status ${this.analysisData.is_bot}`;
        }

        // 访问次数
        this.setElementText('visit-count', this.analysisData.visit_count);

        // 检测原因
        this.displayReasons(this.analysisData.reasons);

        analysisElement.style.display = 'block';
    }

    // 显示检测原因
    displayReasons(reasonsJson) {
        const reasonsList = document.getElementById('detection-reasons');
        if (!reasonsList) return;

        reasonsList.innerHTML = '';

        try {
            const reasons = JSON.parse(reasonsJson);
            if (reasons.length === 0) {
                const noReasons = document.createElement('li');
                noReasons.textContent = '无特殊检测原因';
                noReasons.style.borderLeftColor = '#28a745';
                reasonsList.appendChild(noReasons);
            } else {
                reasons.forEach(reason => {
                    const reasonElement = document.createElement('li');
                    reasonElement.textContent = reason;
                    reasonsList.appendChild(reasonElement);
                });
            }
        } catch (e) {
            const errorReason = document.createElement('li');
            errorReason.textContent = '解析检测原因失败';
            reasonsList.appendChild(errorReason);
        }
    }

    // 复制指纹哈希
    copyFingerprint() {
        const hashElement = document.getElementById('fingerprint-hash');
        if (!hashElement) return;

        const hash = hashElement.textContent;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(hash).then(() => {
                this.showNotification('指纹哈希已复制到剪贴板');
            }).catch(() => {
                this.fallbackCopy(hash);
            });
        } else {
            this.fallbackCopy(hash);
        }
    }

    // 备用复制方法
    fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = '0';
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showNotification('指纹哈希已复制到剪贴板');
        } catch (err) {
            this.showNotification('复制失败，请手动复制', 'error');
        }
        
        document.body.removeChild(textArea);
    }

    // 导出数据
    exportData() {
        const data = {
            fingerprint: this.fingerprintData,
            analysis: this.analysisData,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `fingerprint-${new Date().getTime()}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        this.showNotification('数据导出成功');
    }

    // 显示通知
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        
        if (!notification || !notificationText) return;

        notificationText.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';

        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    // 显示音频指纹详细信息
    displayAudioFingerprint(data) {
        try {
            const audioDetails = data.audioDetails;
            
            if (!audioDetails) {
                this.setElementText('audio-final-fingerprint', data.audio || 'N/A');
                return;
            }

            // AudioContext支持检测
            const supportInfo = audioDetails.supportInfo || {};
            this.setElementText('audio-basic-support', supportInfo.basicSupport ? '支持' : '不支持');
            this.setElementText('audio-offline-support', supportInfo.offlineSupport ? '支持' : '不支持');
            this.setElementText('audio-create-analyser', supportInfo.createAnalyser ? '支持' : '不支持');
            this.setElementText('audio-create-oscillator', supportInfo.createOscillator ? '支持' : '不支持');
            this.setElementText('audio-create-gain', supportInfo.createGain ? '支持' : '不支持');
            this.setElementText('audio-create-compressor', supportInfo.createDynamicsCompressor ? '支持' : '不支持');

            // AudioContext属性
            const properties = audioDetails.properties;
            if (properties && typeof properties === 'object') {
                const propertiesTextarea = document.getElementById('audio-properties');
                if (propertiesTextarea) {
                    const propertiesText = Object.entries(properties)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join('\n');
                    propertiesTextarea.value = propertiesText;
                }
            }

            // 音频格式支持
            const formats = audioDetails.formats || {};
            this.setElementText('audio-format-ogg', formats.ogg ? '支持' : '不支持');
            this.setElementText('audio-format-mp3', formats.mp3 ? '支持' : '不支持');
            this.setElementText('audio-format-wav', formats.wav ? '支持' : '不支持');
            this.setElementText('audio-format-m4a', formats.m4a ? '支持' : '不支持');
            this.setElementText('audio-format-aac', formats.aac ? '支持' : '不支持');
            this.setElementText('audio-format-webm', formats.webm ? '支持' : '不支持');

            // 音频设备信息
            const devices = audioDetails.devices || {};
            this.setElementText('audio-input-count', devices.audioInputCount || 0);
            this.setElementText('audio-output-count', devices.audioOutputCount || 0);

            // 各种指纹结果
            const fingerprints = audioDetails.fingerprints || {};
            this.setElementText('audio-properties-fingerprint', this.truncateText(fingerprints.properties, 32));
            this.setElementText('audio-compressor-fingerprint', this.truncateText(fingerprints.compressor, 32));
            this.setElementText('audio-device-fingerprint', this.truncateText(fingerprints.device, 32));
            
            // 最终音频指纹
            this.setElementText('audio-final-fingerprint', this.truncateText(data.audio, 32));

            // 显示音频噪点检测结果
            this.displayNoiseDetection('audio', data.audioNoiseDetection);

        } catch (error) {
            console.error('显示音频指纹时出错:', error);
            this.setElementText('audio-final-fingerprint', data.audio || 'N/A');
        }
    }

    // 显示噪点检测结果
    displayNoiseDetection(type, noiseDetection) {
        try {
            if (!noiseDetection) {
                // 没有噪点检测数据
                if (type === 'audio') {
                    this.setTamperingIndicator('audio-dynamic-noise', false, '未知');
                } else {
                    this.setNoiseIndicator(`${type}-dynamic-noise`, false, '未知');
                    this.setNoiseIndicator(`${type}-static-noise`, false, '未知');
                }
                return;
            }

            // 根据类型显示不同的噪点检测结果
            if (type === 'audio' && noiseDetection.compressor) {
                // 音频类型有特殊的篡改检测显示
                this.displayAudioNoiseDetection(noiseDetection);
            } else {
                // Canvas和WebGL类型的标准显示
                this.setNoiseIndicator(`${type}-dynamic-noise`, noiseDetection.hasDynamicNoise);
                this.setNoiseIndicator(`${type}-static-noise`, noiseDetection.hasStaticNoise);
            }

        } catch (error) {
            console.error(`显示${type}噪点检测结果时出错:`, error);
            if (type === 'audio') {
                this.setTamperingIndicator('audio-dynamic-noise', false, '错误');
            } else {
                this.setNoiseIndicator(`${type}-dynamic-noise`, false, '错误');
                this.setNoiseIndicator(`${type}-static-noise`, false, '错误');
            }
        }
    }

    // 显示音频噪点检测结果（重新命名为篡改检测）
    displayAudioNoiseDetection(noiseDetection) {
        try {
            // 显示压缩器篡改检测结果
            const compressorDetection = noiseDetection.compressor;
            if (compressorDetection) {
                // 使用新的文本描述
                this.setTamperingIndicator('audio-dynamic-noise', compressorDetection.hasDynamicNoise);
                
                // 显示压缩器检测详情
                this.setElementText('audio-compressor-details', compressorDetection.details || '无详情');
                this.setElementText('audio-compressor-confidence', 
                    `${(compressorDetection.confidence * 100).toFixed(1)}%`);
                
                // 显示测试次数和分析时间（如果有）
                if (compressorDetection.testCount) {
                    this.setElementText('audio-compressor-tests', compressorDetection.testCount);
                }
                if (compressorDetection.analysisTime) {
                    this.setElementText('audio-compressor-time', `${compressorDetection.analysisTime}ms`);
                }
                
                // 显示主要指纹匹配状态
                if (compressorDetection.mainFingerprintMatch !== undefined) {
                    this.setElementText('audio-fingerprint-match', 
                        compressorDetection.mainFingerprintMatch ? '一致' : '不一致');
                }
            } else {
                this.setTamperingIndicator('audio-dynamic-noise', false, '未检测');
                this.setElementText('audio-compressor-details', '未执行压缩器检测');
            }

            // 显示综合摘要
            if (noiseDetection.summary) {
                this.setElementText('audio-noise-summary', noiseDetection.summary);
            }

            // 显示整体置信度
            if (noiseDetection.overallConfidence !== undefined) {
                this.setElementText('audio-overall-confidence', 
                    `${(noiseDetection.overallConfidence * 100).toFixed(1)}%`);
            }

        } catch (error) {
            console.error('显示音频篡改检测详情时出错:', error);
            this.setTamperingIndicator('audio-dynamic-noise', false, '错误');
            this.setElementText('audio-compressor-details', '显示错误');
        }
    }

    // 设置篡改指示器（替代噪点指示器）
    setTamperingIndicator(elementId, isTampered, defaultText = null) {
        const element = document.getElementById(elementId);
        if (element) {
            let text, className;
            
            if (defaultText) {
                text = defaultText;
                className = 'unknown';
            } else if (isTampered) {
                text = '是';
                className = 'yes';
            } else {
                text = '否';
                className = 'no';
            }
            
            element.innerHTML = `<span class="noise-indicator ${className}">${text}</span>`;
        }
    }

    // 设置噪点指示器
    setNoiseIndicator(elementId, hasNoise, defaultText = null) {
        const element = document.getElementById(elementId);
        if (element) {
            let text, className;
            
            if (defaultText) {
                text = defaultText;
                className = 'unknown';
            } else if (hasNoise) {
                text = '是';
                className = 'yes';
            } else {
                text = '否';
                className = 'no';
            }
            
            element.innerHTML = `<span class="noise-indicator ${className}">${text}</span>`;
        }
    }

    // 格式化噪点类型显示文本
    formatNoiseType(type) {
        const typeMap = {
            'clean': '无噪点',
            'random_noise': '随机噪点',
            'pixel_noise': '像素噪点',
            'high_entropy': '高熵噪点',
            'webgl_random_noise': 'WebGL随机噪点',
            'webgl_parameter_anomaly': 'WebGL参数异常',
            'audio_anomaly': '音频异常',
            'not_supported': '不支持',
            'error': '检测错误',
            'detection_error': '检测错误'
        };
        
        return typeMap[type] || type;
    }

    // 获取置信度样式类
    getConfidenceClass(confidence) {
        if (confidence >= 0.8) {
            return 'confidence-high';
        } else if (confidence >= 0.5) {
            return 'confidence-medium';
        } else {
            return 'confidence-low';
        }
    }

    // 显示WebGL欺骗检测结果（参考网站风格）
    displayWebGLSpoofingDetection(noiseDetection, fingerprintData) {
        console.log('开始显示WebGL欺骗检测结果...', noiseDetection, fingerprintData);
        try {
            if (!noiseDetection) {
                console.log('没有WebGL噪点检测数据');
                // 没有检测数据
                this.setWebGLIndicator('webgl-fingerprint-spoofed', false, '未知');
                this.setWebGLIndicator('webgl-persistent-noise', false, '未知');
                this.setWebGLIndicator('webgl-random-noise', false, '未知');
                return;
            }

            console.log('设置WebGL指示器...');
            // 综合欺骗状态
            this.setWebGLIndicator('webgl-fingerprint-spoofed', noiseDetection.isSpoofed);
            
            // 固定噪点检测（红色矩形方法）
            this.setWebGLIndicator('webgl-persistent-noise', noiseDetection.hasPersistentNoise);
            
            // 动态噪点检测（随机图像方法）
            this.setWebGLIndicator('webgl-random-noise', noiseDetection.hasRandomNoise);

            // 显示指纹结果
            if (fingerprintData && fingerprintData.persistentNoise) {
                console.log('设置固定噪点指纹:', fingerprintData.persistentNoise.fingerprint);
                this.setElementText('webgl-red-fingerprint', 
                    fingerprintData.persistentNoise.fingerprint);
            } else {
                this.setElementText('webgl-red-fingerprint', '未检测');
            }
            
            if (fingerprintData && fingerprintData.randomNoise) {
                console.log('设置动态噪点指纹:', fingerprintData.randomNoise);
                this.setElementText('webgl-before-fingerprint', 
                    fingerprintData.randomNoise.beforeDOMLoad);
                this.setElementText('webgl-after-fingerprint', 
                    fingerprintData.randomNoise.afterDOMLoad);
            } else {
                this.setElementText('webgl-before-fingerprint', '未检测');
                this.setElementText('webgl-after-fingerprint', '未检测');
            }

            // 显示检测详情
            if (noiseDetection.details && noiseDetection.details.length > 0) {
                const detailsElement = document.getElementById('webgl-detection-details');
                if (detailsElement) {
                    detailsElement.innerHTML = noiseDetection.details.map(detail => 
                        `<div class="detection-detail">${detail}</div>`
                    ).join('');
                }
            }

            console.log('WebGL欺骗检测结果显示完成');

        } catch (error) {
            console.error('显示WebGL欺骗检测结果时出错:', error);
            this.setWebGLIndicator('webgl-fingerprint-spoofed', false, '错误');
            this.setWebGLIndicator('webgl-persistent-noise', false, '错误');
            this.setWebGLIndicator('webgl-random-noise', false, '错误');
        }
    }

    // 显示WebGL Canvas渲染结果
    displayWebGLCanvases(fingerprintData) {
        try {
            if (!fingerprintData) return;

            // 显示红色矩形Canvas
            if (fingerprintData.persistentNoise && fingerprintData.persistentNoise.canvas) {
                const redBoxContainer = document.getElementById('webgl-red-box-canvas');
                if (redBoxContainer) {
                    redBoxContainer.innerHTML = '';
                    redBoxContainer.appendChild(fingerprintData.persistentNoise.canvas);
                }
            }

            // 显示随机图像Canvas（DOM加载前）
            if (fingerprintData.randomNoise && fingerprintData.randomNoise.canvasBefore) {
                const beforeContainer = document.getElementById('webgl-before-canvas');
                if (beforeContainer) {
                    beforeContainer.innerHTML = '';
                    
                    // 缩放Canvas以适合显示
                    const scaledCanvas = this.scaleCanvas(fingerprintData.randomNoise.canvasBefore, 150, 150);
                    beforeContainer.appendChild(scaledCanvas);
                }
            }

            // 显示随机图像Canvas（DOM加载后）
            if (fingerprintData.randomNoise && fingerprintData.randomNoise.canvasAfter) {
                const afterContainer = document.getElementById('webgl-after-canvas');
                if (afterContainer) {
                    afterContainer.innerHTML = '';
                    
                    // 缩放Canvas以适合显示
                    const scaledCanvas = this.scaleCanvas(fingerprintData.randomNoise.canvasAfter, 150, 150);
                    afterContainer.appendChild(scaledCanvas);
                }
            }

        } catch (error) {
            console.error('显示WebGL Canvas时出错:', error);
        }
    }

    // 缩放Canvas以适合显示
    scaleCanvas(originalCanvas, maxWidth, maxHeight) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 计算缩放比例
            const scaleX = maxWidth / originalCanvas.width;
            const scaleY = maxHeight / originalCanvas.height;
            const scale = Math.min(scaleX, scaleY);
            
            canvas.width = originalCanvas.width * scale;
            canvas.height = originalCanvas.height * scale;
            
            // 绘制缩放后的图像
            ctx.drawImage(originalCanvas, 0, 0, canvas.width, canvas.height);
            
            // 添加样式
            canvas.style.border = '1px solid #ddd';
            canvas.style.borderRadius = '4px';
            
            return canvas;
            
        } catch (error) {
            console.error('缩放Canvas时出错:', error);
            return originalCanvas;
        }
    }

    // 设置WebGL指示器
    setWebGLIndicator(elementId, isPositive, defaultText = null) {
        const element = document.getElementById(elementId);
        if (element) {
            let text, className;
            
            if (defaultText) {
                text = defaultText;
                className = 'unknown';
            } else if (isPositive) {
                // 对于WebGL欺骗检测，"是"表示被篡改
                text = '是';
                className = 'yes';
            } else {
                text = '否';
                className = 'no';
            }
            
            element.innerHTML = `<span class="webgl-indicator ${className}">${text}</span>`;
        }
    }

    // 设置元素文本
    setElementText(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text || 'N/A';
        }
    }

    // 截断文本
    truncateText(text, maxLength) {
        if (!text) return 'N/A';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
}

// 应用启动
document.addEventListener('DOMContentLoaded', () => {
    new BrowserFingerprintApp();
});
