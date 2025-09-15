/**
 * 重构后的指纹收集器 - 使用工具类提高代码复用性和可读性
 */
class ModernFingerprintCollector {
    constructor() {
        this.fingerprint = {};
        this.isCollecting = false;
    }

    /**
     * 收集所有指纹信息
     * @returns {Promise<Object>} 完整的指纹数据
     */
    async collectAll() {
        if (this.isCollecting) {
            throw new Error('指纹收集正在进行中');
        }

        this.isCollecting = true;
        try {
            // 并行收集基础信息
            const basicTasks = [
                this.collectBasicBrowserInfo(),
                this.collectScreenInfo(),
                this.collectTimezoneInfo(),
                this.collectHardwareInfo()
            ];

            // 收集基础信息
            const [basicInfo, screenInfo, timezoneInfo, hardwareInfo] = await Promise.all(basicTasks);
            
            // 收集高级指纹信息
            const advancedTasks = [
                this.collectCanvasFingerprint(),
                this.collectWebGLFingerprint(),
                this.collectAudioFingerprint(),
                this.collectFontInfo(),
                this.collectStorageInfo()
            ];

            const [canvasInfo, webglInfo, audioInfo, fontInfo, storageInfo] = await Promise.all(advancedTasks);

            // 合并所有信息
            this.fingerprint = {
                basic: basicInfo,
                screen: screenInfo,
                timezone: timezoneInfo,
                hardware: hardwareInfo,
                canvas: canvasInfo,
                webgl: webglInfo,
                audio: audioInfo,
                fonts: fontInfo,
                plugins: {
                    list: basicInfo.plugins || [],
                    count: (basicInfo.plugins || []).length,
                    fingerprint: CryptoUtils.simpleHash(JSON.stringify(basicInfo.plugins || []))
                },
                storage: storageInfo,
                timestamp: Date.now(),
                version: '2.0'
            };

            // 生成主指纹
            this.fingerprint.mainFingerprint = await this.generateMainFingerprint();

            // 添加噪声检测数据
            this.fingerprint.canvasNoiseDetection = this.generateNoiseDetectionData('canvas');
            this.fingerprint.webglNoiseDetection = this.generateNoiseDetectionData('webgl');
            this.fingerprint.audioNoiseDetection = this.generateNoiseDetectionData('audio');

            return this.fingerprint;

        } finally {
            this.isCollecting = false;
        }
    }

    /**
     * 收集基础浏览器信息
     * @returns {Promise<Object>} 基础信息
     */
    async collectBasicBrowserInfo() {
        try {
            const browserInfo = await BrowserUtils.generateBrowserFingerprint();
            return {
                userAgent: browserInfo.features.userAgent,
                browserType: BrowserUtils.detectBrowserType(),
                operatingSystem: BrowserUtils.detectOperatingSystem(),
                plugins: browserInfo.features.plugins || [],
                fingerprint: browserInfo.fingerprint,
                error: browserInfo.error
            };
        } catch (e) {
            return {
                error: e.message,
                fingerprint: 'error'
            };
        }
    }

    /**
     * 收集屏幕信息
     * @returns {Object} 屏幕信息
     */
    collectScreenInfo() {
        try {
            const screenInfo = BrowserUtils.getScreenInfo();
            return {
                ...screenInfo,
                fingerprint: CryptoUtils.simpleHash(JSON.stringify(screenInfo))
            };
        } catch (e) {
            return {
                error: e.message,
                fingerprint: 'error'
            };
        }
    }

    /**
     * 收集时区信息
     * @returns {Object} 时区信息
     */
    collectTimezoneInfo() {
        try {
            const timezoneInfo = BrowserUtils.getTimezoneInfo();
            return {
                ...timezoneInfo,
                fingerprint: CryptoUtils.simpleHash(JSON.stringify(timezoneInfo))
            };
        } catch (e) {
            return {
                error: e.message,
                fingerprint: 'error'
            };
        }
    }

    /**
     * 收集硬件信息
     * @returns {Object} 硬件信息
     */
    collectHardwareInfo() {
        try {
            const hardwareInfo = BrowserUtils.getHardwareInfo();
            const connectionInfo = BrowserUtils.getConnectionInfo();
            
            const combined = {
                hardware: hardwareInfo,
                connection: connectionInfo
            };

            return {
                ...combined,
                fingerprint: CryptoUtils.simpleHash(JSON.stringify(combined))
            };
        } catch (e) {
            return {
                error: e.message,
                fingerprint: 'error'
            };
        }
    }

    /**
     * 收集Canvas指纹
     * @returns {Promise<Object>} Canvas指纹信息
     */
    async collectCanvasFingerprint() {
        try {
            console.log('开始收集Canvas指纹');
            
            // 创建测试Canvas
            const canvas = CanvasUtils.createCanvas(200, 50);
            console.log('Canvas创建完成，尺寸:', canvas.width, 'x', canvas.height);
            
            // 绘制测试图案
            const testPattern = CanvasUtils.drawTestPattern(canvas);
            console.log('测试图案绘制完成，返回值:', testPattern);
            
            // 获取Canvas数据
            const canvasData = canvas.toDataURL();
            console.log('Canvas数据获取完成，数据长度:', canvasData.length);
            console.log('Canvas数据前缀:', canvasData.substring(0, 50));
            
            // 验证Canvas是否真的有内容
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let hasContent = false;
            for (let i = 3; i < imageData.data.length; i += 4) {
                if (imageData.data[i] > 0) { // 检查alpha通道
                    hasContent = true;
                    break;
                }
            }
            console.log('Canvas是否有可见内容:', hasContent);
            
            // 分析像素数据
            const pixelAnalysis = CanvasUtils.analyzePixels(imageData.data);
            
            // 检测Canvas噪点
            const noiseDetection = this.detectCanvasNoise(canvas, ctx, imageData);
            
            // 检测渲染一致性（添加错误处理）
            let consistencyTest;
            try {
                consistencyTest = CanvasUtils.detectRenderingConsistency(
                    canvas, 
                    (canvas, ctx) => CanvasUtils.drawTestPattern(canvas), 
                    3
                );
            } catch (e) {
                console.warn('Canvas一致性检测失败:', e.message);
                consistencyTest = {
                    isConsistent: true,
                    spoofingDetected: false,
                    error: e.message
                };
            }
            
            // 生成指纹
            const fingerprint = await CryptoUtils.hashString(canvasData);

            const result = {
                dataURL: canvasData,
                pixelAnalysis,
                noiseDetection,
                consistencyTest,
                testPattern,
                fingerprint,
                hasContent: hasContent,
                error: null
            };
            
            console.log('Canvas指纹收集完成:', result);
            return result;

        } catch (e) {
            console.error('Canvas指纹收集失败:', e.message);
            return {
                error: e.message,
                fingerprint: 'error',
                dataURL: null,
                hasContent: false
            };
        }
    }

    /**
     * 收集WebGL指纹
     * @returns {Promise<Object>} WebGL指纹信息
     */
    async collectWebGLFingerprint() {
        try {
            // 创建测试Canvas
            const canvas = CanvasUtils.createCanvas(512, 512);
            
            // 检测WebGL支持
            const support = WebGLUtils.detectSupport(canvas);
            if (!support.basicSupport) {
                return {
                    error: 'WebGL不支持',
                    fingerprint: 'not_supported',
                    support
                };
            }
            const gl = WebGLUtils.getContext(canvas);

            if (!gl) {
                return {
                    error: 'WebGL上下文创建失败',
                    fingerprint: 'context_error',
                    support
                };
            }

            // 收集WebGL基础信息
            const basicInfo = WebGLUtils.collectBasicInfo(gl);

            // 执行绘制测试
            const redRectangleSuccess = WebGLUtils.drawRedRectangle(canvas);
            const redRectangleResult = {
                success: redRectangleSuccess,
                fingerprint: redRectangleSuccess ? await CryptoUtils.hashString(canvas.toDataURL()) : 'error',
                canvas: redRectangleSuccess ? canvas : null
            };
            
            // 清除Canvas并绘制立方体
            const gl2 = WebGLUtils.getContext(canvas);
            if (gl2) {
                gl2.clear(gl2.COLOR_BUFFER_BIT | gl2.DEPTH_BUFFER_BIT);
            }
            
            const coloredCubeSuccess = WebGLUtils.drawColoredCube(canvas);
            const coloredCubeResult = {
                success: coloredCubeSuccess,
                fingerprint: coloredCubeSuccess ? await CryptoUtils.hashString(canvas.toDataURL()) : 'error',
                canvas: coloredCubeSuccess ? canvas : null
            };

            // 执行反欺骗检测
            const spoofingDetection = await this.detectWebGLSpoofing();
            
            // 执行WebGL噪点检测
            const noiseDetection = await this.detectWebGLNoise(canvas, gl);

            return {
                support,
                basicInfo,
                redRectangle: redRectangleResult,
                coloredCube: coloredCubeResult,
                spoofingDetection,
                noiseDetection,
                fingerprint: coloredCubeResult.fingerprint || 'error',
                error: null
            };

        } catch (e) {
            return {
                error: e.message,
                fingerprint: 'error',
                support: WebGLUtils.detectSupport()
            };
        }
    }

    /**
     * 检测Canvas噪点
     * @param {HTMLCanvasElement} canvas Canvas元素
     * @param {CanvasRenderingContext2D} ctx Canvas上下文
     * @param {ImageData} imageData 图像数据
     * @returns {Object} 噪点检测结果
     */
    detectCanvasNoise(canvas, ctx, imageData) {
        try {
            // 检测动态噪点 - 重复绘制检测
            const originalDataURL = canvas.toDataURL();
            
            // 清除并重新绘制
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            CanvasUtils.drawTestPattern(canvas);
            const secondDataURL = canvas.toDataURL();
            
            // 再次清除并重新绘制
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            CanvasUtils.drawTestPattern(canvas);
            const thirdDataURL = canvas.toDataURL();
            
            const hasDynamicNoise = originalDataURL !== secondDataURL || secondDataURL !== thirdDataURL;
            
            // 检测静态噪点 - 基于像素分析
            const pixelAnalysis = CanvasUtils.analyzePixels(imageData.data);
            const hasStaticNoise = pixelAnalysis.hasNoise || false;
            
            // 生成详细信息
            let details = [];
            if (hasDynamicNoise) {
                details.push('检测到动态渲染差异');
            }
            if (hasStaticNoise) {
                details.push('检测到静态像素噪点');
            }
            if (!hasDynamicNoise && !hasStaticNoise) {
                details.push('未检测到明显噪点');
            }
            
            return {
                hasDynamicNoise,
                hasStaticNoise,
                details: details.join(', '),
                pixelAnalysis: pixelAnalysis,
                testResults: {
                    firstRender: originalDataURL.substring(0, 100),
                    secondRender: secondDataURL.substring(0, 100),
                    thirdRender: thirdDataURL.substring(0, 100),
                    consistent: !hasDynamicNoise
                }
            };
            
        } catch (error) {
            console.error('Canvas噪点检测失败:', error);
            return {
                hasDynamicNoise: false,
                hasStaticNoise: false,
                details: '噪点检测失败: ' + error.message,
                error: error.message
            };
        }
    }

    /**
     * 检测WebGL欺骗 - 检测DOM加载前后的渲染一致性
     * @returns {Promise<Object>} 欺骗检测结果
     */
    async detectWebGLSpoofing() {
        try {
            // 获取DOM加载前的指纹（立即执行）
            const beforeDOMTest = await this.getWebGLFingerprint();
            
            // 获取DOM加载后的指纹
            const afterDOMTest = await new Promise((resolve) => {
                if (document.readyState === 'complete') {
                    // 如果DOM已经加载完成，立即执行
                    this.getWebGLFingerprint().then(resolve);
                } else {
                    // 否则等待load事件
                    window.addEventListener("load", () => {
                        this.getWebGLFingerprint().then(resolve);
                    });
                }
            });

            // 分析一致性
            const isConsistent = beforeDOMTest.fingerprint === afterDOMTest.fingerprint;
            
            return {
                beforeDOM: beforeDOMTest,
                afterDOM: afterDOMTest,
                isConsistent,
                spoofingDetected: !isConsistent,
                confidence: isConsistent ? 0.9 : 0.1,
                details: isConsistent ? 'DOM加载前后渲染结果一致' : '检测到DOM加载前后渲染不一致，可能存在欺骗'
            };

        } catch (e) {
            return {
                error: e.message,
                spoofingDetected: false,
                confidence: 0
            };
        }
    }

    /**
     * 获取WebGL指纹
     * @returns {Promise<Object>} WebGL指纹数据
     */
    async getWebGLFingerprint() {
        return new Promise((resolve, reject) => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = 512;
                canvas.height = 512;
                
                // 使用cube绘制方法
                webgl.draw.cube(canvas);
                
                setTimeout(() => {
                    try {
                        const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
                        const buffer = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
                        gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
                        
                        setTimeout(() => {
                            CryptoUtils.hash(buffer.buffer)
                                .then(CryptoUtils.buf2hex)
                                .then(fingerprint => {
                                    resolve({
                                        fingerprint: fingerprint,
                                        canvas: canvas,
                                        timestamp: Date.now()
                                    });
                                })
                                .catch(reject);
                        }, 500);
                    } catch (error) {
                        reject(error);
                    }
                }, 500);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 检测WebGL噪点
     * @param {HTMLCanvasElement} canvas Canvas元素
     * @param {WebGLRenderingContext} gl WebGL上下文
     * @returns {Promise<Object>} 噪点检测结果
     */
    async detectWebGLNoise(canvas, gl) {
        try {
            console.log('开始WebGL噪点检测');
            
            // 固定噪点检测 - 红色矩形方法 (参考老代码)
            const persistentResult = await this.detectWebGLPersistentNoise();
            console.log('固定噪点检测结果:', persistentResult);

            // 动态噪点检测 - 随机图像与颜色混合方法 (参考老代码)  
            const randomResult = await this.detectWebGLRandomNoise();
            console.log('动态噪点检测结果:', randomResult);
            
            // 提取指纹数据
            const redBoxFingerprint = persistentResult.fingerprint || 'error';
            const beforeDOMFingerprint = randomResult.beforeDOMLoad || 'error';
            const afterDOMFingerprint = randomResult.afterDOMLoad || 'error';
            
            // 检测结果
            const hasPersistentNoise = persistentResult.isSpoofed || false;
            const hasRandomNoise = randomResult.isSpoofed || false;
            
            console.log('WebGL噪点检测结果:', {
                redBoxFingerprint,
                beforeDOMFingerprint,
                afterDOMFingerprint,
                hasPersistentNoise,
                hasRandomNoise
            });

            return {
                beforeDOMFingerprint,
                afterDOMFingerprint,
                redBoxFingerprint,
                hasPersistentNoise,
                hasRandomNoise,
                persistentTests: [redBoxFingerprint, redBoxFingerprint, redBoxFingerprint],
                testResults: {
                    beforeDOM: beforeDOMFingerprint,
                    afterDOM: afterDOMFingerprint,
                    redBox: redBoxFingerprint,
                    consistent: !hasRandomNoise && !hasPersistentNoise
                },
                // 保存Canvas用于显示
                canvasData: {
                    redBox: persistentResult.canvas,
                    before: randomResult.canvasBefore,
                    after: randomResult.canvasAfter
                }
            };

        } catch (error) {
            console.error('WebGL噪点检测失败:', error);
            return {
                beforeDOMFingerprint: 'error',
                afterDOMFingerprint: 'error',
                redBoxFingerprint: 'error',
                hasPersistentNoise: false,
                hasRandomNoise: false,
                persistentTests: ['error', 'error', 'error'],
                testResults: {
                    beforeDOM: 'error',
                    afterDOM: 'error',
                    redBox: 'error',
                    consistent: false
                },
                canvasData: null,
                error: error.message
            };
        }
    }

    /**
     * 固定噪点检测 - 红色矩形方法 (参考老代码实现)
     */
    async detectWebGLPersistentNoise() {
        return new Promise((resolve) => {
            try {
                console.log('开始固定噪点检测...');

                // 创建用于固定噪点检测的Canvas - 使用老代码的尺寸
                const canvas = document.createElement('canvas');
                canvas.width = 256;
                canvas.height = 24;
                const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true }) ||
                    canvas.getContext('experimental-webgl', { preserveDrawingBuffer: true });

                if (!gl) {
                    resolve({
                        fingerprint: 'no_webgl',
                        canvas: null,
                        isSpoofed: false
                    });
                    return;
                }

                // 使用老代码的红色矩形绘制逻辑
                var indices = [3, 2, 1, 3, 1, 0];
                var vertex_buffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-.75, .75, 0, -.75, -.75, 0, .75, -.75, 0, .75, .75, 0]), gl.STATIC_DRAW);
                gl.bindBuffer(gl.ARRAY_BUFFER, null);

                var index_buffer = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

                var vertShader = gl.createShader(gl.VERTEX_SHADER);
                gl.shaderSource(vertShader, 'attribute vec3 coordinates;void main(void) { gl_Position = vec4(coordinates, 1.0);}');
                gl.compileShader(vertShader);

                var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
                gl.shaderSource(fragShader, 'void main(void) { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);}');
                gl.compileShader(fragShader);

                var shaderProgram = gl.createProgram();
                gl.attachShader(shaderProgram, vertShader);
                gl.attachShader(shaderProgram, fragShader);
                gl.linkProgram(shaderProgram);
                gl.useProgram(shaderProgram);

                gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);

                var coord = gl.getAttribLocation(shaderProgram, 'coordinates');
                gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
                gl.enableVertexAttribArray(coord);

                gl.clearColor(0, 0, 0, 0);
                gl.enable(gl.DEPTH_TEST);
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.viewport(0, 0, canvas.width, canvas.height);
                gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

                setTimeout(() => {
                    try {
                        // 使用老代码的指纹生成方法
                        const buffer = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
                        gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight,
                            gl.RGBA, gl.UNSIGNED_BYTE, buffer);

                        // 使用与原始代码相同的方法: CryptoUtils.hash(buffer).then(CryptoUtils.buf2hex)
                        CryptoUtils.hash(buffer.buffer)
                            .then(CryptoUtils.buf2hex)
                            .then(fingerprint => {
                                console.log('生成的固定噪点指纹:', fingerprint);

                                // 已知的未被篡改的哈希值
                                const knownHashes = [
                                    'bf9da7959d914298f9ce9e41a480fd66f76fac5c6f5e0a9b5a99b18cfc6fd997'
                                ];

                                const isSpoofed = !knownHashes.includes(fingerprint);

                                resolve({
                                    fingerprint: fingerprint,
                                    canvas: canvas,
                                    isSpoofed: isSpoofed,
                                    method: 'red_solid_box'
                                });
                            })
                            .catch(error => {
                                console.error('哈希计算失败:', error);
                                resolve({
                                    fingerprint: 'hash_error',
                                    canvas: null,
                                    isSpoofed: false,
                                    error: error.message
                                });
                            });

                    } catch (readError) {
                        console.error('读取像素数据时出错:', readError);
                        resolve({
                            fingerprint: 'read_error',
                            canvas: null,
                            isSpoofed: false,
                            error: readError.message
                        });
                    }
                }, 500);

            } catch (error) {
                console.error('固定噪点检测出错:', error);
                resolve({
                    fingerprint: 'error',
                    canvas: null,
                    isSpoofed: false,
                    error: error.message
                });
            }
        });
    }

    /**
     * 动态噪点检测 - 随机图像与颜色混合方法 (参考老代码实现)
     */
    async detectWebGLRandomNoise() {
        return new Promise((resolve) => {
            try {
                console.log('开始动态噪点检测...');
                
                const results = {
                    beforeDOMLoad: null,
                    afterDOMLoad: null,
                    canvasBefore: null,
                    canvasAfter: null
                };

                // 参考老代码的getBrowserFingerPrint函数
                const getBrowserFingerPrint = () => {
                    const c = document.createElement("canvas");
                    c.width = 512;
                    c.height = 512;
                    
                    return new Promise((resolve, reject) => {
                        // 使用参考网站的cube绘制方法
                        webgl.draw.cube(c);
                        
                        window.setTimeout(function() {
                            try {
                                var gl = c.getContext("webgl", { preserveDrawingBuffer: true });
                                var buffer = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
                                gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
                                
                                window.setTimeout(function() {
                                    CryptoUtils.hash(buffer.buffer).then(CryptoUtils.buf2hex).then(fingerprint => {
                                        resolve({
                                            fingerprint: fingerprint,
                                            canvas: c
                                        });
                                    }, reject);
                                }, 500);
                            } catch (error) {
                                reject(error);
                            }
                        }, 500);
                    });
                };

                // 严格按照参考网站的Promise.all实现
                Promise.all([
                    // 第一次渲染 - DOM加载前的模拟（立即执行）
                    getBrowserFingerPrint(),
                    // 第二次渲染 - DOM加载后的模拟（等待load事件）
                    new Promise((resolveLoad, rejectLoad) => {
                        if (document.readyState === 'complete') {
                            // 如果DOM已经加载完成，立即执行
                            getBrowserFingerPrint().then(resolveLoad, rejectLoad);
                        } else {
                            // 否则等待load事件
                            window.addEventListener("load", () => {
                                getBrowserFingerPrint().then(resolveLoad, rejectLoad);
                            });
                        }
                    })
                ]).then(([firstResult, secondResult]) => {
                    results.beforeDOMLoad = firstResult.fingerprint;
                    results.canvasBefore = firstResult.canvas;
                    results.afterDOMLoad = secondResult.fingerprint;
                    results.canvasAfter = secondResult.canvas;

                    // 比较两次结果
                    const isDifferent = results.beforeDOMLoad !== results.afterDOMLoad;
                    
                    console.log('动态噪点检测完成，第一次:', results.beforeDOMLoad, '第二次:', results.afterDOMLoad);
                    
                    resolve({
                        beforeDOMLoad: results.beforeDOMLoad,
                        afterDOMLoad: results.afterDOMLoad,
                        canvasBefore: results.canvasBefore,
                        canvasAfter: results.canvasAfter,
                        isDifferent: isDifferent,
                        isSpoofed: isDifferent,
                        method: 'random_image_with_color_mixing'
                    });
                }).catch(error => {
                    console.error('WebGL动态噪点检测出错:', error);
                    resolve({
                        beforeDOMLoad: 'error',
                        afterDOMLoad: 'error',
                        canvasBefore: null,
                        canvasAfter: null,
                        isDifferent: false,
                        isSpoofed: false,
                        error: error.message
                    });
                });

            } catch (error) {
                console.error('动态噪点检测出错:', error);
                resolve({
                    beforeDOMLoad: 'error',
                    afterDOMLoad: 'error',
                    canvasBefore: null,
                    canvasAfter: null,
                    isDifferent: false,
                    isSpoofed: false,
                    error: error.message
                });
            }
        });
    }

    /**
     * 收集音频指纹
     * @returns {Promise<Object>} 音频指纹信息
     */
    async collectAudioFingerprint() {
        try {
            // 检测音频支持
            const support = AudioUtils.detectSupport();
            if (!support.basicSupport) {
                return {
                    error: 'AudioContext不支持',
                    fingerprint: 'not_supported',
                    support
                };
            }

            // 获取音频上下文属性
            const contextProperties = await AudioUtils.getContextProperties();
            
            // 获取设备信息
            const deviceInfo = await AudioUtils.getDeviceInfo();
            
            // 获取格式支持
            const formatSupport = AudioUtils.getFormatSupport();

            // 执行压缩器测试
            const compressorTest = await AudioUtils.runDualCompressorTest();

            // 生成综合指纹
            const combinedData = {
                support,
                formats: formatSupport,
                properties: contextProperties.properties,
                devices: deviceInfo.info,
                compressor: compressorTest.fingerprint
            };

            const fingerprint = await CryptoUtils.hashString(JSON.stringify(combinedData));

            return {
                support,
                formats: formatSupport,
                properties: contextProperties,
                devices: deviceInfo,
                compressor: compressorTest,
                fingerprint,
                error: null
            };

        } catch (e) {
            return {
                error: e.message,
                fingerprint: 'error',
                support: AudioUtils.detectSupport()
            };
        }
    }

    /**
     * 收集字体信息
     * @returns {Object} 字体信息
     */
    collectFontInfo() {
        try {
            const fontInfo = BrowserUtils.getFontInfo();
            return {
                ...fontInfo,
                fingerprint: CryptoUtils.simpleHash(fontInfo.list)
            };
        } catch (e) {
            return {
                error: e.message,
                fingerprint: 'error',
                available: [],
                count: 0
            };
        }
    }

    /**
     * 收集存储信息
     * @returns {Object} 存储信息
     */
    collectStorageInfo() {
        try {
            const storageInfo = BrowserUtils.getStorageInfo();
            return {
                ...storageInfo,
                fingerprint: CryptoUtils.simpleHash(JSON.stringify(storageInfo))
            };
        } catch (e) {
            return {
                error: e.message,
                fingerprint: 'error'
            };
        }
    }

    /**
     * 生成主指纹
     * @returns {Promise<string>} 主指纹
     */
    async generateMainFingerprint() {
        try {
            const fingerprintComponents = [
                this.fingerprint.basic?.fingerprint || '',
                this.fingerprint.screen?.fingerprint || '',
                this.fingerprint.timezone?.fingerprint || '',
                this.fingerprint.hardware?.fingerprint || '',
                this.fingerprint.canvas?.fingerprint || '',
                this.fingerprint.webgl?.fingerprint || '',
                this.fingerprint.audio?.fingerprint || '',
                this.fingerprint.fonts?.fingerprint || '',
                this.fingerprint.storage?.fingerprint || ''
            ];

            const combinedFingerprint = fingerprintComponents.join('|');
            return await CryptoUtils.hashString(combinedFingerprint);
            
        } catch (e) {
            return 'error_generating_main_fingerprint';
        }
    }

    /**
     * 生成用于后端提交的数据格式
     * @returns {Object} 后端数据格式
     */
    generateBackendSubmissionData() {
        if (!this.fingerprint) {
            throw new Error('指纹数据未收集');
        }

        // 提取基础信息 - 修正访问路径
        const basicInfo = this.fingerprint.basic || {};
        const screenInfo = this.fingerprint.screen || {};
        const timezoneInfo = this.fingerprint.timezone || {};
        const hardwareInfo = this.fingerprint.hardware?.hardware || {};
        const canvasInfo = this.fingerprint.canvas || {};
        const webglInfo = this.fingerprint.webgl || {};
        const audioInfo = this.fingerprint.audio || {};
        const fontInfo = this.fingerprint.fonts || {};
        const pluginInfo = this.fingerprint.plugins || {};

        console.log('数据路径调试:');
        console.log('basicInfo:', basicInfo);
        console.log('basicInfo.userAgent:', basicInfo.userAgent);
        console.log('basicInfo.plugins:', basicInfo.plugins);
        console.log('pluginInfo:', pluginInfo);
        console.log('pluginInfo.list:', pluginInfo.list);

        // 处理插件数据，确保是字符串数组
        const pluginData = pluginInfo.list || basicInfo.plugins || [];
        const processedPlugins = pluginData.map(plugin => 
            typeof plugin === 'string' ? plugin : plugin.name || plugin.description || 'Unknown Plugin'
        );
        console.log('原始插件数据:', pluginData);
        console.log('处理后插件数据:', processedPlugins);

        const result = {
            // 主指纹哈希 - 前端计算
            fingerprint_hash: this.fingerprint.mainFingerprint,
            
            // 基础浏览器信息 - 必需字段，修正字段访问路径
            user_agent: basicInfo.userAgent?.full || navigator.userAgent,
            screen_resolution: `${screenInfo.width || 0}x${screenInfo.height || 0}`,
            timezone: timezoneInfo.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || '',
            language: basicInfo.userAgent?.language || navigator.language || 'en-US',
            platform: basicInfo.userAgent?.platform || navigator.platform || 'unknown',
            
            // 高级指纹 - 必需字段
            canvas: canvasInfo.dataURL || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            webgl: JSON.stringify({
                support: webglInfo.support || {},
                basicInfo: webglInfo.basicInfo || {},
                rendererInfo: webglInfo.rendererInfo || {},
                fingerprint: webglInfo.fingerprint || ''
            }),
            audio: JSON.stringify({
                support: audioInfo.support || {},
                formats: audioInfo.formats || {},
                fingerprint: audioInfo.fingerprint || '',
                oscillatorFingerprint: audioInfo.oscillatorFingerprint || ''
            }),
            
            // 字体和插件 - 必需字段，修正字段访问路径
            fonts: fontInfo.available || [],
            plugins: processedPlugins,
            
            // 设备特性
            touch_support: (hardwareInfo.maxTouchPoints || 0) > 0,
            cookie_enabled: basicInfo.userAgent?.cookieEnabled !== false,
            do_not_track: basicInfo.userAgent?.doNotTrack || 'unspecified',
            
            // 噪声检测数据（可选）
            canvasNoiseDetection: this.generateNoiseDetectionData('canvas'),
            webglNoiseDetection: this.generateNoiseDetectionData('webgl'),
            audioNoiseDetection: this.generateNoiseDetectionData('audio')
        };

        // 调试：验证canvas字段
        console.log('Canvas 字段详情:');
        console.log('canvasInfo:', canvasInfo);
        console.log('canvasInfo.dataURL:', canvasInfo.dataURL);
        console.log('result.canvas:', result.canvas);
        console.log('canvas字段长度:', result.canvas?.length);
        
        // 调试：验证所有必需字段
        const requiredFields = ['user_agent', 'screen_resolution', 'timezone', 'language', 'platform', 'canvas', 'webgl', 'audio', 'fonts', 'plugins'];
        const missingFields = requiredFields.filter(field => !result[field] || (Array.isArray(result[field]) && result[field].length === 0) || result[field] === '');
        if (missingFields.length > 0) {
            console.warn('缺失的必需字段:', missingFields);
        }

        // 调试：验证结果不包含额外字段
        console.log('generateBackendSubmissionData 返回的字段:', Object.keys(result));
        console.log('webglNoiseDetection 结果:', result.webglNoiseDetection);
        
        return result;
    }

    /**
     * 生成噪点检测数据
     * @param {string} type 检测类型
     * @returns {Object} 噪点检测数据
     */
    generateNoiseDetectionData(type) {
        const data = this.fingerprint[type];
        if (!data) return null;

        switch (type) {
            case 'canvas':
                return {
                    hasNoise: data.consistencyTest?.spoofingDetected || false,
                    type: data.consistencyTest?.spoofingDetected ? 'canvas_inconsistency' : 'none',
                    confidence: data.consistencyTest?.confidence || 0,
                    details: String(data.consistencyTest?.details || 'No anomalies detected')
                };

            case 'webgl':
                // 尝试多个可能的数据源
                const spoofingData = data.spoofingDetection || {};
                const noiseData = data.webglNoiseDetection || {};
                
                let details = spoofingData.details || noiseData.details || 'No anomalies detected';
                let hasNoise = spoofingData.spoofingDetected || noiseData.isSpoofed || false;
                let confidence = spoofingData.confidence || noiseData.confidence || 0;
                
                // 如果 details 是数组，则转换为字符串
                if (Array.isArray(details)) {
                    details = details.join(' | ');
                }
                
                return {
                    hasNoise: hasNoise,
                    type: hasNoise ? 'webgl_rendering_inconsistency' : 'none',
                    confidence: confidence,
                    details: String(details)
                };

            case 'audio':
                const analysisData = data.compressor?.analysis || {};
                return {
                    hasNoise: analysisData.hasDynamicNoise || false,
                    type: analysisData.hasDynamicNoise ? 'audio_dynamic_noise' : 'none',
                    confidence: analysisData.confidence || 0,
                    details: String(analysisData.simpleDetails || 'No anomalies detected')
                };

            default:
                return null;
        }
    }

    /**
     * 获取指纹摘要
     * @returns {Object} 指纹摘要
     */
    getFingerprint() {
        return this.fingerprint;
    }

    /**
     * 检查收集状态
     * @returns {boolean} 是否正在收集
     */
    isCollectingFingerprint() {
        return this.isCollecting;
    }
}

// 导出收集器类
window.ModernFingerprintCollector = ModernFingerprintCollector;

// webgl对象 - 完全按照原始fingerprint.js的实现
const webgl = {
    draw: {
        rectangle: function(canvas) {
            var indices = [3, 2, 1, 3, 1, 0];
            var gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
            var vertex_buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-.75, .75, 0, -.75, -.75, 0, .75, -.75, 0, .75, .75, 0]), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            var index_buffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

            var vertShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertShader, 'attribute vec3 coordinates;void main(void) { gl_Position = vec4(coordinates, 1.0);}');
            gl.compileShader(vertShader);

            var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragShader, 'void main(void) { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);}');
            gl.compileShader(fragShader);

            var shaderProgram = gl.createProgram();
            gl.attachShader(shaderProgram, vertShader);
            gl.attachShader(shaderProgram, fragShader);
            gl.linkProgram(shaderProgram);
            gl.useProgram(shaderProgram);

            gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);

            var coord = gl.getAttribLocation(shaderProgram, 'coordinates');
            gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(coord);

            gl.clearColor(0, 0, 0, 0);
            gl.enable(gl.DEPTH_TEST);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
        },
        cube: function(canvas) {
            // 完全按照参考网站的实现
            let ARRAY_TYPE = "undefined" != typeof Float32Array ? Float32Array : Array;
            
            function create() {
                let out = new ARRAY_TYPE(16);
                return ARRAY_TYPE != Float32Array && (out[1] = 0,
                out[2] = 0,
                out[3] = 0,
                out[4] = 0,
                out[6] = 0,
                out[7] = 0,
                out[8] = 0,
                out[9] = 0,
                out[11] = 0,
                out[12] = 0,
                out[13] = 0,
                out[14] = 0),
                out[0] = 1,
                out[5] = 1,
                out[10] = 1,
                out[15] = 1,
                out
            }
            
            function perspective(out, fovy, aspect, near, far) {
                let nf, f = 1 / Math.tan(fovy / 2);
                return out[0] = f / aspect,
                out[1] = 0,
                out[2] = 0,
                out[3] = 0,
                out[4] = 0,
                out[5] = f,
                out[6] = 0,
                out[7] = 0,
                out[8] = 0,
                out[9] = 0,
                out[11] = -1,
                out[12] = 0,
                out[13] = 0,
                out[15] = 0,
                null !== far && far !== 1 / 0 ? (nf = 1 / (near - far),
                out[10] = (far + near) * nf,
                out[14] = 2 * far * near * nf) : (out[10] = -1,
                out[14] = -2 * near),
                out
            }
            
            function translate(out, a, v) {
                let a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, x = v[0], y = v[1], z = v[2];
                return a === out ? (out[12] = a[0] * x + a[4] * y + a[8] * z + a[12],
                out[13] = a[1] * x + a[5] * y + a[9] * z + a[13],
                out[14] = a[2] * x + a[6] * y + a[10] * z + a[14],
                out[15] = a[3] * x + a[7] * y + a[11] * z + a[15]) : (a00 = a[0],
                a01 = a[1],
                a02 = a[2],
                a03 = a[3],
                a10 = a[4],
                a11 = a[5],
                a12 = a[6],
                a13 = a[7],
                a20 = a[8],
                a21 = a[9],
                a22 = a[10],
                a23 = a[11],
                out[0] = a00,
                out[1] = a01,
                out[2] = a02,
                out[3] = a03,
                out[4] = a10,
                out[5] = a11,
                out[6] = a12,
                out[7] = a13,
                out[8] = a20,
                out[9] = a21,
                out[10] = a22,
                out[11] = a23,
                out[12] = a00 * x + a10 * y + a20 * z + a[12],
                out[13] = a01 * x + a11 * y + a21 * z + a[13],
                out[14] = a02 * x + a12 * y + a22 * z + a[14],
                out[15] = a03 * x + a13 * y + a23 * z + a[15]),
                out
            }
            
            const shaders = {
                vertex: "\n          precision mediump float;\n          attribute vec4 avertPosition;\n          attribute vec4 avertColor;\n          varying vec4 vfragColor;\n          uniform mat4 umodelMatrix;\n          uniform mat4 uprojectionMatrix;\n          void main()\n          {\n            vfragColor = avertColor;\n            gl_Position  =  uprojectionMatrix * umodelMatrix * avertPosition;\n          }\n        ",
                fragment: "\n          precision mediump float;\n          varying vec4 vfragColor;\n          void main()\n          {\n            gl_FragColor = vfragColor;\n          }\n        "
            };
            
            class Cube {
                constructor(gl) {
                    this.gl = gl,
                    this.buffers
                }
                setUp() {
                    const positionBuffer = this.gl.createBuffer();
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1]), this.gl.STATIC_DRAW);
                    const faceColors = [[1, 1, 1, 1], [1, 0, 0, 1], [0, 1, 0, 1], [0, 0, 1, 1], [1, 1, 0, 1], [1, 0, 1, 1]];
                    for (var colors = [], j = 0; j < faceColors.length; ++j) {
                        const c = faceColors[j];
                        colors = colors.concat(c, c, c, c)
                    }
                    const colorBuffer = this.gl.createBuffer();
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer),
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
                    const indexBuffer = this.gl.createBuffer();
                    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer),
                    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23]), this.gl.STATIC_DRAW),
                    this.buffers = {
                        color: colorBuffer,
                        indices: indexBuffer,
                        position: positionBuffer
                    }
                }
            }
            
            let webglInstance = new class {
                constructor(canvas) {
                    this.gl = canvas.getContext("webgl", {
                        preserveDrawingBuffer: !0
                    }),
                    this.program,
                    this.shaders = {},
                    this.cubes = []
                }
                async setUp() {
                    if (this.gl || (console.log("WebGL not supported, falling back on experimental-webgl"),
                    this.gl = canvas.getContext("experimental-webgl", {
                        preserveDrawingBuffer: !0
                    })),
                    !this.gl)
                        return console.log("Your browser does not support WebGL"),
                        null;
                    let vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER)
                      , fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
                    if (this.gl.shaderSource(vertexShader, shaders.vertex),
                    this.gl.shaderSource(fragmentShader, shaders.fragment),
                    this.program = this.gl.createProgram(),
                    [vertexShader, fragmentShader].forEach((shader => {
                        if (this.gl.compileShader(shader),
                        !this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS))
                            return console.error("ERROR compiling a shader!", this.gl.getShaderInfoLog(shader)),
                            void this.gl.deleteShader(shader);
                        this.gl.attachShader(this.program, shader)
                    }
                    )),
                    this.gl.linkProgram(this.program),
                    this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
                        if (this.gl.validateProgram(this.program),
                        this.gl.getProgramParameter(this.program, this.gl.VALIDATE_STATUS))
                            return this.shaders.attributes = {
                                positionAttrib: this.gl.getAttribLocation(this.program, "avertPosition"),
                                colorAttrib: this.gl.getAttribLocation(this.program, "avertColor")
                            },
                            this.shaders.uniforms = {
                                modelMatrix: this.gl.getUniformLocation(this.program, "umodelMatrix"),
                                projectionMatrix: this.gl.getUniformLocation(this.program, "uprojectionMatrix")
                            },
                            "Webgl Set Up";
                        console.error("ERROR validating program!", this.gl.getProgramInfoLog(this.program))
                    } else
                        console.error("ERROR linking program!", this.gl.getProgramInfoLog(this.program))
                }
                clear(color) {
                    return this.gl.clearColor(color[0], color[1], color[2], color[3]),
                    this.gl.clearDepth(1),
                    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT),
                    "Cleared"
                }
                makeCube() {
                    let newCube = new Cube(this.gl);
                    return newCube.setUp(),
                    this.cubes.push(newCube),
                    "FillRect called"
                }
                render() {
                    for (let i = 0; i < this.cubes.length; i++) {
                        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubes[i].buffers.position),
                        this.gl.vertexAttribPointer(this.shaders.attributes.positionAttrib, 3, this.gl.FLOAT, this.gl.FALSE, 0 * Float32Array.BYTES_PER_ELEMENT, 0 * Float32Array.BYTES_PER_ELEMENT),
                        this.gl.enableVertexAttribArray(this.shaders.attributes.positionAttrib),
                        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubes[i].buffers.color),
                        this.gl.vertexAttribPointer(this.shaders.attributes.colorAttrib, 4, this.gl.FLOAT, this.gl.FALSE, 0 * Float32Array.BYTES_PER_ELEMENT, 0 * Float32Array.BYTES_PER_ELEMENT),
                        this.gl.enableVertexAttribArray(this.shaders.attributes.colorAttrib),
                        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.cubes[i].buffers.indices),
                        this.gl.useProgram(this.program);
                        const projectionMatrix = create()
                          , modelMatrix = create();
                        perspective(projectionMatrix, 45 * Math.PI / 180, this.gl.canvas.width / this.gl.canvas.height, .1, 100),
                        translate(modelMatrix, modelMatrix, [0, 0, -6]),
                        this.gl.uniformMatrix4fv(this.shaders.uniforms.projectionMatrix, !1, projectionMatrix),
                        this.gl.uniformMatrix4fv(this.shaders.uniforms.modelMatrix, !1, modelMatrix),
                        this.gl.drawElements(this.gl.TRIANGLES, 36, this.gl.UNSIGNED_SHORT, 0)
                    }
                }
            }(canvas);
            
            webglInstance.setUp().then(( () => {
                webglInstance.gl.viewport(0, 0, 500, 500),
                webglInstance.makeCube(),
                requestAnimationFrame((function() {
                    webglInstance.clear([1, 1, 0, 1]),
                    webglInstance.render()
                }))
            }))
        }
    }
};
