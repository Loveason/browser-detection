// 指纹收集模块
class FingerprintCollector {
    constructor() {
        this.fingerprint = {};
        // 参考代码的工具函数
        this.utils = {
            // SHA-256 哈希计算
            hash: function(buffer) {
                return crypto.subtle.digest('SHA-256', buffer);
            },
            // 将buffer转换为16进制字符串
            buf2hex: function(buffer) {
                return Array.from(new Uint8Array(buffer))
                    .map(byte => byte.toString(16).padStart(2, '0'))
                    .join('');
            }
        };
    }

    // 收集所有指纹信息
    async collectAll() {
        try {
            // 基础信息
            this.collectBasicInfo();
            
            // Canvas指纹
            await this.collectCanvasFingerprint();
            
            // WebGL指纹
            await this.collectWebGLFingerprint();
            
            // 音频指纹
            await this.collectAudioFingerprint();
            
            // 字体检测
            await this.collectFonts();
            
            // 插件检测
            this.collectPlugins();

            return this.fingerprint;
        } catch (error) {
            console.error('Error collecting fingerprint:', error);
            throw error;
        }
    }

    // 收集基础信息
    collectBasicInfo() {
        this.fingerprint.user_agent = navigator.userAgent;
        this.fingerprint.screen_resolution = `${screen.width}x${screen.height}`;
        this.fingerprint.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        this.fingerprint.language = navigator.language || navigator.userLanguage;
        this.fingerprint.platform = navigator.platform;
        this.fingerprint.touch_support = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.fingerprint.cookie_enabled = navigator.cookieEnabled;
        this.fingerprint.do_not_track = navigator.doNotTrack || 'unspecified';
    }

    // 收集Canvas指纹
    async collectCanvasFingerprint() {
        return new Promise((resolve) => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = 200;
                canvas.height = 50;

                // 绘制文本和图形以生成独特的指纹
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

                // 获取Canvas数据
                const canvasData = canvas.toDataURL();
                
                // 执行多次Canvas渲染以检测噪点
                const noiseDetection = this.detectCanvasNoise(canvas, ctx);
                
                this.fingerprint.canvas = canvasData;
                this.fingerprint.canvasNoiseDetection = noiseDetection;
                
                // 在页面上显示Canvas（用于用户查看）
                const displayCanvas = document.getElementById('fingerprint-canvas');
                if (displayCanvas) {
                    const displayCtx = displayCanvas.getContext('2d');
                    displayCtx.drawImage(canvas, 0, 0);
                }
                
                resolve();
            } catch (error) {
                console.error('Canvas fingerprint error:', error);
                this.fingerprint.canvas = 'error';
                this.fingerprint.canvasNoiseDetection = { hasNoise: false, type: 'error', confidence: 0 };
                resolve();
            }
        });
    }

    // 收集WebGL指纹 - 增强版本，基于参考网站的检测方法
    async collectWebGLFingerprint() {
        console.log('开始收集WebGL指纹...');
        try {
            const webglResults = {
                supportInfo: {},
                basicInfo: {},
                fingerprintData: {},
                noiseDetection: {}
            };

            // 1. 基础WebGL支持检测
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            webglResults.supportInfo = {
                basicSupport: !!gl,
                experimentalSupport: !!canvas.getContext('experimental-webgl'),
                readPixelsSupport: !!(gl && gl.readPixels)
            };

            console.log('WebGL支持信息:', webglResults.supportInfo);

            if (!gl) {
                console.log('WebGL不支持');
                this.fingerprint.webgl = JSON.stringify({
                    supportInfo: webglResults.supportInfo,
                    basicInfo: { message: 'WebGL not supported' }
                });
                this.fingerprint.webglSupportInfo = webglResults.supportInfo;
                this.fingerprint.webglNoiseDetection = { 
                    isSpoofed: false, 
                    hasPersistentNoise: false,
                    hasRandomNoise: false,
                    type: 'not_supported', 
                    confidence: 1.0 
                };
                return;
            }

            // 2. 收集WebGL基础信息
            console.log('收集WebGL基础信息...');
            webglResults.basicInfo = this.collectWebGLBasicInfo(gl);
            console.log('WebGL基础信息:', webglResults.basicInfo);

            // 3. 执行固定噪点检测 - 红色矩形方法
            console.log('执行固定噪点检测...');
            webglResults.fingerprintData.persistentNoise = await this.detectWebGLPersistentNoise(gl);
            console.log('固定噪点检测结果:', webglResults.fingerprintData.persistentNoise);

            // 4. 执行动态噪点检测 - 随机图像渲染方法
            console.log('执行动态噪点检测...');
            webglResults.fingerprintData.randomNoise = await this.detectWebGLRandomNoise(gl);
            console.log('动态噪点检测结果:', webglResults.fingerprintData.randomNoise);

            // 5. 综合分析WebGL指纹欺骗
            console.log('分析WebGL指纹欺骗...');
            webglResults.noiseDetection = this.analyzeWebGLSpoofing(webglResults.fingerprintData);
            console.log('WebGL分析结果:', webglResults.noiseDetection);

            // 保存所有数据
            this.fingerprint.webgl = JSON.stringify(webglResults.basicInfo);
            this.fingerprint.webglSupportInfo = webglResults.supportInfo;
            this.fingerprint.webglFingerprintData = webglResults.fingerprintData;
            this.fingerprint.webglNoiseDetection = webglResults.noiseDetection;

            console.log('WebGL指纹收集完成');

        } catch (error) {
            console.error('WebGL fingerprint error:', error);
            this.fingerprint.webgl = 'error';
            this.fingerprint.webglSupportInfo = { basicSupport: false, error: error.message };
            this.fingerprint.webglNoiseDetection = { 
                isSpoofed: false, 
                hasPersistentNoise: false,
                hasRandomNoise: false,
                type: 'error', 
                confidence: 0 
            };
        }
    }

    // 收集WebGL基础信息
    collectWebGLBasicInfo(gl) {
        try {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            return {
                version: gl.getParameter(gl.VERSION),
                vendor: gl.getParameter(gl.VENDOR),
                renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown',
                vendorUnmasked: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown',
                extensions: gl.getSupportedExtensions(),
                maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
                maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
                aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
                aliasedPointSizeRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE),
                shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
                maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS)
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    // 检测WebGL固定噪点 - 红色矩形方法（基于参考网站）
    async detectWebGLPersistentNoise(gl) {
        return new Promise((resolve) => {
            try {
                console.log('开始固定噪点检测...');
                
                // 创建用于固定噪点检测的Canvas
                const canvas = document.createElement('canvas');
                canvas.width = 256;
                canvas.height = 24;
                const testGl = canvas.getContext('webgl', { preserveDrawingBuffer: true }) || 
                              canvas.getContext('experimental-webgl', { preserveDrawingBuffer: true });

                if (!testGl) {
                    console.log('无法获取WebGL上下文');
                    resolve({
                        fingerprint: 'no_webgl',
                        canvas: null,
                        isKnownFingerprint: false,
                        isSpoofed: false
                    });
                    return;
                }

                // 使用参考网站的 drawRedRectangle 方法
                this.drawRedRectangle(testGl, canvas);

                setTimeout(() => {
                    try {
                        // 读取像素数据
                        const buffer = new Uint8Array(testGl.drawingBufferWidth * testGl.drawingBufferHeight * 4);
                        testGl.readPixels(0, 0, testGl.drawingBufferWidth, testGl.drawingBufferHeight, 
                                         testGl.RGBA, testGl.UNSIGNED_BYTE, buffer);

                        // 严格按照参考代码的计算方法: utils.hash(buffer).then(utils.buf2hex).then(resolve, reject)
                        this.utils.hash(buffer.buffer)
                            .then(this.utils.buf2hex)
                            .then(fingerprint => {
                                console.log('生成的指纹:', fingerprint);
                                
                                // 已知的未被篡改的哈希值 (从参考网站获取)
                                const knownHashes = [
                                    'bf9da7959d914298f9ce9e41a480fd66f76fac5c6f5e0a9b5a99b18cfc6fd997', // 参考网站的标准值
                                    // 可以添加更多已知的正常哈希值
                                ];

                                const isKnownFingerprint = knownHashes.includes(fingerprint);
                                const isSpoofed = !isKnownFingerprint;

                                resolve({
                                    fingerprint: fingerprint,
                                    canvas: canvas,
                                    isKnownFingerprint: isKnownFingerprint,
                                    isSpoofed: isSpoofed,
                                    method: 'red_solid_box'
                                });
                            })
                            .catch(error => {
                                console.error('哈希计算失败:', error);
                                resolve({
                                    fingerprint: 'hash_error',
                                    canvas: null,
                                    isKnownFingerprint: false,
                                    isSpoofed: false,
                                    error: error.message
                                });
                            });

                    } catch (readError) {
                        console.error('读取像素数据时出错:', readError);
                        resolve({
                            fingerprint: 'read_error',
                            canvas: null,
                            isKnownFingerprint: false,
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
                    isKnownFingerprint: false,
                    isSpoofed: false,
                    error: error.message
                });
            }
        });
    }

    // 绘制红色矩形 - 参考网站的标准方法
    drawRedRectangle(gl, canvas) {
        try {
            const vertices = [-0.75, 0.75, 0, -0.75, -0.75, 0, 0.75, -0.75, 0, 0.75, 0.75, 0];
            const indices = [3, 2, 1, 3, 1, 0];

            // 创建顶点缓冲区
            const vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            // 创建索引缓冲区
            const indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

            // 创建顶点着色器
            const vertShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertShader, 'attribute vec3 coordinates;void main(void) { gl_Position = vec4(coordinates, 1.0);}');
            gl.compileShader(vertShader);
            
            // 检查编译状态
            if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
                console.error('顶点着色器编译错误:', gl.getShaderInfoLog(vertShader));
                return;
            }

            // 创建片段着色器
            const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragShader, 'void main(void) { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);}'); // 红色
            gl.compileShader(fragShader);
            
            // 检查编译状态
            if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
                console.error('片段着色器编译错误:', gl.getShaderInfoLog(fragShader));
                return;
            }

            // 创建着色器程序
            const shaderProgram = gl.createProgram();
            gl.attachShader(shaderProgram, vertShader);
            gl.attachShader(shaderProgram, fragShader);
            gl.linkProgram(shaderProgram);
            
            // 检查链接状态
            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                console.error('着色器程序链接错误:', gl.getProgramInfoLog(shaderProgram));
                return;
            }
            
            gl.useProgram(shaderProgram);

            // 绑定缓冲区并绘制
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

            const coord = gl.getAttribLocation(shaderProgram, 'coordinates');
            gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(coord);

            gl.clearColor(0, 0, 0, 0);
            gl.enable(gl.DEPTH_TEST);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
            
            console.log('红色矩形绘制完成');
        } catch (error) {
            console.error('绘制红色矩形时出错:', error);
        }
    }

    // 检测WebGL动态噪点 - 随机图像方法（基于参考网站）
    async detectWebGLRandomNoise(gl) {
        return new Promise((resolve) => {
            try {
                console.log('开始动态噪点检测...');
                
                const results = {
                    beforeDOMLoad: null,
                    afterDOMLoad: null,
                    canvasBefore: null,
                    canvasAfter: null
                };

                // 第一次渲染 - DOM加载前的模拟
                this.renderSimpleWebGLScene('before')
                    .then(firstResult => {
                        results.beforeDOMLoad = firstResult.fingerprint;
                        results.canvasBefore = firstResult.canvas;

                        // 等待一段时间后第二次渲染 - DOM加载后的模拟
                        setTimeout(() => {
                            this.renderSimpleWebGLScene('after')
                                .then(secondResult => {
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
                                })
                                .catch(error => {
                                    console.error('第二次渲染出错:', error);
                                    resolve({
                                        beforeDOMLoad: results.beforeDOMLoad,
                                        afterDOMLoad: 'error',
                                        canvasBefore: results.canvasBefore,
                                        canvasAfter: null,
                                        isDifferent: true,
                                        isSpoofed: false,
                                        error: error.message
                                    });
                                });
                        }, 100);
                    })
                    .catch(error => {
                        console.error('第一次渲染出错:', error);
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

    // 渲染简单的WebGL场景
    async renderSimpleWebGLScene(phase) {
        return new Promise((resolve) => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 150;
                canvas.height = 150;
                const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true }) || 
                          canvas.getContext('experimental-webgl', { preserveDrawingBuffer: true });

                if (!gl) {
                    resolve({ fingerprint: 'no_webgl', canvas: null });
                    return;
                }

                // 简单的渐变背景，根据phase略微不同
                const color1 = phase === 'before' ? 1.0 : 0.95;
                const color2 = phase === 'before' ? 1.0 : 0.98;
                
                gl.clearColor(color1, color2, 0.0, 1.0); // 黄色系渐变
                gl.clear(gl.COLOR_BUFFER_BIT);

                setTimeout(() => {
                    try {
                        const buffer = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
                        gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, 
                                     gl.RGBA, gl.UNSIGNED_BYTE, buffer);

                        // 严格按照参考代码的计算方法: utils.hash(buffer).then(utils.buf2hex).then(resolve, reject)
                        this.utils.hash(buffer.buffer)
                            .then(this.utils.buf2hex)
                            .then(fingerprint => {
                                resolve({
                                    fingerprint: fingerprint + '_' + phase,
                                    canvas: canvas,
                                    phase: phase
                                });
                            })
                            .catch(error => {
                                console.error('哈希计算失败:', error);
                                resolve({
                                    fingerprint: 'hash_error_' + phase,
                                    canvas: null,
                                    error: error.message
                                });
                            });

                    } catch (readError) {
                        console.error('读取WebGL像素时出错:', readError);
                        resolve({
                            fingerprint: 'read_error',
                            canvas: null,
                            error: readError.message
                        });
                    }
                }, 100);

            } catch (error) {
                console.error('渲染WebGL场景时出错:', error);
                resolve({
                    fingerprint: 'error',
                    canvas: null,
                    error: error.message
                });
            }
        });
    }

    // 渲染随机图像与颜色混合 - 参考网站的复杂渲染方法
    async renderRandomImageWithColorMixing(width, height, phase) {
        return new Promise((resolve) => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true }) || 
                          canvas.getContext('experimental-webgl', { preserveDrawingBuffer: true });

                if (!gl) {
                    resolve({ fingerprint: 'no_webgl', canvas: null });
                    return;
                }

                // 使用复杂的WebGL渲染来创建"随机"图像
                this.drawComplexWebGLScene(gl, canvas, phase);

                setTimeout(() => {
                    try {
                        const buffer = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
                        gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, 
                                     gl.RGBA, gl.UNSIGNED_BYTE, buffer);

                        const fingerprint = this.calculateWebGLHash(buffer);
                        
                        resolve({
                            fingerprint: fingerprint,
                            canvas: canvas,
                            phase: phase
                        });

                    } catch (readError) {
                        resolve({
                            fingerprint: 'read_error',
                            canvas: null,
                            error: readError.message
                        });
                    }
                }, 500);

            } catch (error) {
                resolve({
                    fingerprint: 'error',
                    canvas: null,
                    error: error.message
                });
            }
        });
    }

    // 绘制复杂的WebGL场景
    drawComplexWebGLScene(gl, canvas, phase) {
        try {
            // 创建复杂的立方体场景，参考网站的方法
            const shaders = {
                vertex: `
                    precision mediump float;
                    attribute vec4 avertPosition;
                    attribute vec4 avertColor;
                    varying vec4 vfragColor;
                    uniform mat4 umodelMatrix;
                    uniform mat4 uprojectionMatrix;
                    void main() {
                        vfragColor = avertColor;
                        gl_Position = uprojectionMatrix * umodelMatrix * avertPosition;
                    }
                `,
                fragment: `
                    precision mediump float;
                    varying vec4 vfragColor;
                    void main() {
                        gl_FragColor = vfragColor;
                    }
                `
            };

            // 创建着色器
            const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, shaders.vertex);
            const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, shaders.fragment);
            
            if (!vertexShader || !fragmentShader) return;

            // 创建程序
            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error('Program link error:', gl.getProgramInfoLog(program));
                return;
            }

            gl.useProgram(program);

            // 创建立方体几何体
            const cubeBuffers = this.createCubeBuffers(gl);
            
            // 设置投影矩阵
            const projectionMatrix = this.createProjectionMatrix(canvas.width / canvas.height);
            const modelMatrix = this.createModelMatrix(phase);

            // 获取uniform位置
            const projectionLocation = gl.getUniformLocation(program, 'uprojectionMatrix');
            const modelLocation = gl.getUniformLocation(program, 'umodelMatrix');

            // 设置uniform
            gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
            gl.uniformMatrix4fv(modelLocation, false, modelMatrix);

            // 绑定顶点数据
            const positionLocation = gl.getAttribLocation(program, 'avertPosition');
            const colorLocation = gl.getAttribLocation(program, 'avertColor');

            gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffers.position);
            gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(positionLocation);

            gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffers.color);
            gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(colorLocation);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeBuffers.indices);

            // 设置渲染状态
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(1, 1, 0, 1); // 黄色背景
            gl.clearDepth(1.0);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // 绘制立方体
            gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

        } catch (error) {
            console.error('WebGL scene rendering error:', error);
        }
    }

    // 创建着色器
    createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    // 创建立方体缓冲区
    createCubeBuffers(gl) {
        // 立方体顶点
        const positions = [
            -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,  1,
            -1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1, -1,
            -1,  1, -1, -1,  1,  1,  1,  1,  1,  1,  1, -1,
            -1, -1, -1,  1, -1, -1,  1, -1,  1, -1, -1,  1,
             1, -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,
            -1, -1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1
        ];

        // 立方体颜色（每个面不同颜色）
        const faceColors = [
            [1.0, 1.0, 1.0, 1.0], // 白色
            [1.0, 0.0, 0.0, 1.0], // 红色
            [0.0, 1.0, 0.0, 1.0], // 绿色
            [0.0, 0.0, 1.0, 1.0], // 蓝色
            [1.0, 1.0, 0.0, 1.0], // 黄色
            [1.0, 0.0, 1.0, 1.0]  // 品红色
        ];

        let colors = [];
        for (let j = 0; j < faceColors.length; ++j) {
            const c = faceColors[j];
            colors = colors.concat(c, c, c, c);
        }

        // 索引
        const indices = [
            0,  1,  2,    0,  2,  3,
            4,  5,  6,    4,  6,  7,
            8,  9,  10,   8,  10, 11,
            12, 13, 14,   12, 14, 15,
            16, 17, 18,   16, 18, 19,
            20, 21, 22,   20, 22, 23
        ];

        // 创建缓冲区
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        return {
            position: positionBuffer,
            color: colorBuffer,
            indices: indexBuffer
        };
    }

    // 创建投影矩阵
    createProjectionMatrix(aspect) {
        const fov = 45 * Math.PI / 180;
        const near = 0.1;
        const far = 100.0;

        const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
        const rangeInv = 1.0 / (near - far);

        return [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        ];
    }

    // 创建模型矩阵
    createModelMatrix(phase) {
        // 根据phase创建略微不同的变换
        const translateZ = -6;
        const rotationOffset = phase === 'before' ? 0 : 0.1;

        return [
            Math.cos(rotationOffset), 0, Math.sin(rotationOffset), 0,
            0, 1, 0, 0,
            -Math.sin(rotationOffset), 0, Math.cos(rotationOffset), 0,
            0, 0, translateZ, 1
        ];
    }

    // 分析WebGL欺骗情况
    analyzeWebGLSpoofing(fingerprintData) {
        try {
            const analysis = {
                isSpoofed: false,
                hasPersistentNoise: false,
                hasRandomNoise: false,
                confidence: 0,
                details: [],
                fingerprintResults: {}
            };

            // 分析固定噪点检测结果
            if (fingerprintData.persistentNoise) {
                analysis.hasPersistentNoise = fingerprintData.persistentNoise.isSpoofed;
                analysis.fingerprintResults.redSolidBox = fingerprintData.persistentNoise.fingerprint;
                
                if (fingerprintData.persistentNoise.isSpoofed) {
                    analysis.details.push('固定噪点检测：红色矩形指纹不匹配已知值');
                    analysis.confidence = Math.max(analysis.confidence, 0.8);
                } else {
                    analysis.details.push('固定噪点检测：红色矩形指纹正常');
                }
            }

            // 分析动态噪点检测结果
            if (fingerprintData.randomNoise) {
                analysis.hasRandomNoise = fingerprintData.randomNoise.isSpoofed;
                analysis.fingerprintResults.beforeDOMLoad = fingerprintData.randomNoise.beforeDOMLoad;
                analysis.fingerprintResults.afterDOMLoad = fingerprintData.randomNoise.afterDOMLoad;
                
                if (fingerprintData.randomNoise.isSpoofed) {
                    analysis.details.push('动态噪点检测：DOM加载前后指纹不一致');
                    analysis.confidence = Math.max(analysis.confidence, 0.9);
                } else {
                    analysis.details.push('动态噪点检测：DOM加载前后指纹一致');
                }
            }

            // 综合判断
            analysis.isSpoofed = analysis.hasPersistentNoise || analysis.hasRandomNoise;
            
            if (analysis.isSpoofed) {
                analysis.details.unshift('⚠️ 检测到WebGL指纹被篡改');
            } else {
                analysis.details.unshift('✅ WebGL指纹未被篡改');
                analysis.confidence = Math.max(analysis.confidence, 0.7);
            }

            return analysis;

        } catch (error) {
            return {
                isSpoofed: false,
                hasPersistentNoise: false,
                hasRandomNoise: false,
                confidence: 0,
                details: [`分析错误: ${error.message}`],
                fingerprintResults: {}
            };
        }
    }

    // 计算WebGL哈希（使用SHA-256类似的方法）
    calculateWebGLHash(buffer) {
        try {
            // 使用简化的哈希算法
            let hash = '';
            const uint8Array = new Uint8Array(buffer);
            
            // 取样本点进行哈希计算
            const sampleSize = Math.min(1000, uint8Array.length);
            for (let i = 0; i < sampleSize; i++) {
                const index = Math.floor(i * uint8Array.length / sampleSize);
                hash += uint8Array[index].toString(16).padStart(2, '0');
            }
            
            // 生成固定长度的哈希
            return this.simpleHash(hash).substring(0, 64);
            
        } catch (error) {
            return 'hash_error';
        }
    }

    // 简单哈希函数
    simpleHash(str) {
        let hash = 0;
        if (str.length === 0) return hash.toString();
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        
        return Math.abs(hash).toString(16);
    }

    // 收集音频指纹
    async collectAudioFingerprint() {
        return new Promise((resolve) => {
            try {
                if (!window.AudioContext && !window.webkitAudioContext) {
                    this.fingerprint.audio = 'not supported';
                    resolve();
                    return;
                }

                // 使用多种方法生成综合音频指纹
                this.generateComprehensiveAudioFingerprint(resolve);

            } catch (error) {
                console.error('Audio fingerprint error:', error);
                this.fingerprint.audio = 'error';
                resolve();
            }
        });
    }

    // 生成综合音频指纹
    generateComprehensiveAudioFingerprint(resolve) {
        const audioResults = {
            supportInfo: {},
            properties: null,
            formats: {},
            devices: {},
            fingerprints: {}
        };
        let completedMethods = 0;
        const totalMethods = 4;

        const checkComplete = () => {
            completedMethods++;
            if (completedMethods >= totalMethods) {
                // 合并所有音频指纹结果
                const combinedFingerprint = this.combineAudioFingerprints(audioResults);
                
                // 保存详细信息到fingerprint对象以便显示
                this.fingerprint.audioDetails = audioResults;
                this.fingerprint.audio = combinedFingerprint;
                resolve();
            }
        };

        // 方法1: AudioContext支持检测
        this.getAudioSupportInfo(audioResults, checkComplete);

        // 方法2: AudioContext属性指纹
        this.getAudioContextProperties(audioResults, checkComplete);

        // 方法3: DynamicsCompressor指纹 (不需要用户交互)
        this.getDynamicsCompressorFingerprint(audioResults, checkComplete);

        // 方法4: 设备和格式信息指纹
        this.getAudioDeviceAndFormatFingerprint(audioResults, checkComplete);
    }

    // 获取AudioContext支持信息
    getAudioSupportInfo(results, callback) {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const OfflineAudioContextClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
            
            results.supportInfo = {
                basicSupport: !!AudioContextClass,
                offlineSupport: !!OfflineAudioContextClass,
                createAnalyser: this.hasAudioMethod('createAnalyser'),
                createOscillator: this.hasAudioMethod('createOscillator'),
                createGain: this.hasAudioMethod('createGain'),
                createDynamicsCompressor: this.hasAudioMethod('createDynamicsCompressor'),
                createScriptProcessor: this.hasAudioMethod('createScriptProcessor')
            };

            callback();
        } catch (e) {
            results.supportInfo = { error: e.message };
            callback();
        }
    }

    // 获取AudioContext属性指纹
    getAudioContextProperties(results, callback) {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const context = new AudioContextClass();
            const analyser = context.createAnalyser();

            const properties = {};
            
            // 复制AudioContext属性
            this.copyAudioProperties(properties, context, 'AudioContext');
            this.copyAudioProperties(properties, context.destination, 'Destination');
            this.copyAudioProperties(properties, context.listener, 'Listener');
            this.copyAudioProperties(properties, analyser, 'Analyser');

            results.properties = properties;
            results.fingerprints.properties = this.calculateAudioHash(JSON.stringify(properties));
            
            context.close();
            callback();
        } catch (e) {
            results.properties = { error: e.message };
            results.fingerprints.properties = 'error';
            callback();
        }
    }

    // 复制音频属性 (忽略敏感属性)
    copyAudioProperties(target, source, prefix = '') {
        const skipProperties = ['dopplerFactor', 'speedOfSound', 'currentTime'];
        
        for (const prop in source) {
            try {
                const value = source[prop];
                const isFunction = typeof value === 'function';
                const isSkipped = skipProperties.includes(prop);
                const isValidType = typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean';
                
                if (!isFunction && !isSkipped && isValidType) {
                    const key = prefix ? `${prefix}.${prop}` : prop;
                    target[key] = value;
                }
            } catch (e) {
                // 忽略访问错误
            }
        }
    }

    // 获取DynamicsCompressor指纹 - 增强版本，支持动态噪点检测
    getDynamicsCompressorFingerprint(results, callback) {
        try {
            const OfflineAudioContextClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
            if (!OfflineAudioContextClass) {
                results.fingerprints.compressor = 'not supported';
                results.compressorNoiseDetection = { 
                    hasDynamicNoise: false, 
                    details: '不支持OfflineAudioContext',
                    confidence: 1.0 
                };
                callback();
                return;
            }

            // 执行两次相同的音频压缩器测试以检测动态噪点
            this.performDualCompressorTest(OfflineAudioContextClass, results, callback);

        } catch (e) {
            results.fingerprints.compressor = 'error';
            results.compressorNoiseDetection = { 
                hasDynamicNoise: false, 
                details: `压缩器测试错误: ${e.message}`,
                confidence: 0 
            };
            callback();
        }
    }

    // 执行双重压缩器测试以检测动态噪点
    performDualCompressorTest(OfflineAudioContextClass, results, callback) {
        const testResults = [];
        let completedTests = 0;
        const totalTests = 2;
        
        // 执行两次相同的测试
        for (let testIndex = 0; testIndex < totalTests; testIndex++) {
            setTimeout(() => {
                this.runSingleCompressorTest(OfflineAudioContextClass, testIndex, (testResult) => {
                    testResults.push(testResult);
                    completedTests++;
                    
                    if (completedTests === totalTests) {
                        // 分析两次测试结果
                        const noiseAnalysis = this.analyzeCompressorNoise(testResults);
                        
                        // 选择第一次测试结果作为主要指纹
                        results.fingerprints.compressor = testResults[0].fingerprint;
                        results.compressorNoiseDetection = noiseAnalysis;
                        results.compressorTestDetails = testResults; // 保存详细测试数据
                        
                        callback();
                    }
                });
            }, testIndex * 100); // 间隔100ms执行，确保时间差异
        }
    }

    // 执行单次压缩器测试
    runSingleCompressorTest(OfflineAudioContextClass, testIndex, callback) {
        try {
            // 创建离线音频上下文 (1秒，44100采样率)
            const offlineContext = new OfflineAudioContextClass(1, 44100, 44100);
            
            // 创建振荡器
            const oscillator = offlineContext.createOscillator();
            oscillator.type = 'triangle';
            oscillator.frequency.value = 10000;

            // 创建动态压缩器
            const compressor = offlineContext.createDynamicsCompressor();
            if (compressor.threshold) compressor.threshold.value = -50;
            if (compressor.knee) compressor.knee.value = 40;
            if (compressor.ratio) compressor.ratio.value = 12;
            if (compressor.reduction) compressor.reduction.value = -20;
            if (compressor.attack) compressor.attack.value = 0;
            if (compressor.release) compressor.release.value = 0.25;

            // 连接节点
            oscillator.connect(compressor);
            compressor.connect(offlineContext.destination);
            oscillator.start(0);

            const testStartTime = performance.now();

            // 开始渲染
            offlineContext.startRendering().then(buffer => {
                const renderTime = performance.now() - testStartTime;
                const channelData = buffer.getChannelData(0);
                
                // 计算多个区域的指纹以增强检测精度
                const fingerprintData = this.calculateEnhancedCompressorFingerprint(channelData);
                
                callback({
                    testIndex: testIndex,
                    fingerprint: fingerprintData.mainFingerprint,
                    detailedFingerprint: fingerprintData.detailedFingerprint,
                    renderTime: renderTime,
                    bufferLength: channelData.length,
                    timestamp: Date.now(),
                    statistics: fingerprintData.statistics
                });
                
            }).catch(e => {
                callback({
                    testIndex: testIndex,
                    fingerprint: 'error',
                    detailedFingerprint: null,
                    renderTime: 0,
                    error: e.message,
                    timestamp: Date.now()
                });
            });

        } catch (e) {
            callback({
                testIndex: testIndex,
                fingerprint: 'error',
                detailedFingerprint: null,
                renderTime: 0,
                error: e.message,
                timestamp: Date.now()
            });
        }
    }

    // 计算增强的压缩器指纹
    calculateEnhancedCompressorFingerprint(channelData) {
        const segments = [
            { start: 4500, end: 5000, name: 'main' },
            { start: 1000, end: 1500, name: 'early' },
            { start: 8000, end: 8500, name: 'mid' },
            { start: 15000, end: 15500, name: 'late' }
        ];
        
        const fingerprints = {};
        const statistics = {};
        
        segments.forEach(segment => {
            let sum = 0;
            let max = 0;
            let min = Infinity;
            let variance = 0;
            const values = [];
            
            for (let i = segment.start; i < Math.min(segment.end, channelData.length); i++) {
                const value = Math.abs(channelData[i]);
                sum += value;
                max = Math.max(max, value);
                min = Math.min(min, value);
                values.push(value);
            }
            
            const mean = sum / values.length;
            variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
            
            fingerprints[segment.name] = sum.toString();
            statistics[segment.name] = {
                sum: sum,
                mean: mean,
                max: max,
                min: min,
                variance: variance,
                count: values.length
            };
        });
        
        return {
            mainFingerprint: fingerprints.main,
            detailedFingerprint: fingerprints,
            statistics: statistics
        };
    }

    // 分析压缩器噪点
    // 分析压缩器噪点
    analyzeCompressorNoise(testResults) {
        try {
            if (testResults.length < 2) {
                return {
                    hasDynamicNoise: false,
                    details: '❌ 只执行了1次测试，无法进行对比分析',
                    simpleDetails: '测试次数不足',
                    confidence: 0
                };
            }
            
            const [test1, test2] = testResults;
            
            // 检查是否有测试错误
            if (test1.fingerprint === 'error' || test2.fingerprint === 'error') {
                return {
                    hasDynamicNoise: false,
                    details: '❌ 测试过程中发生错误，无法获得有效的音频数据',
                    simpleDetails: '测试执行失败',
                    confidence: 0
                };
            }
            
            const analysisResults = [];
            const simpleResults = [];
            let hasDynamicNoise = false;
            let noiseIndicators = 0;
            
            // 1. 主要指纹对比
            const mainFingerprintMatch = test1.fingerprint === test2.fingerprint;
            if (!mainFingerprintMatch) {
                hasDynamicNoise = true;
                noiseIndicators++;
                analysisResults.push('🔍 主要指纹不匹配：两次测试得到了不同的音频压缩器指纹值');
                simpleResults.push('主指纹不一致');
            } else {
                analysisResults.push('✅ 主要指纹一致：两次测试得到相同的压缩器指纹');
                simpleResults.push('主指纹一致');
            }
            
            // 2. 详细指纹对比（如果存在）
            if (test1.detailedFingerprint && test2.detailedFingerprint) {
                const segments = Object.keys(test1.detailedFingerprint);
                let mismatchedSegments = 0;
                const segmentDetails = [];
                
                segments.forEach(segment => {
                    if (test1.detailedFingerprint[segment] !== test2.detailedFingerprint[segment]) {
                        mismatchedSegments++;
                        segmentDetails.push(segment);
                    }
                });
                
                if (mismatchedSegments > 0) {
                    hasDynamicNoise = true;
                    noiseIndicators++;
                    analysisResults.push(`🔍 音频段差异：${mismatchedSegments}/${segments.length} 个音频段不一致 (${segmentDetails.join(', ')})`);
                    simpleResults.push(`${mismatchedSegments}段不一致`);
                } else {
                    analysisResults.push(`✅ 音频段一致：所有 ${segments.length} 个音频段都保持一致`);
                    simpleResults.push('所有段一致');
                }
            }
            
            // 3. 渲染时间差异分析
            if (test1.renderTime && test2.renderTime) {
                const timeDiff = Math.abs(test1.renderTime - test2.renderTime);
                const avgTime = (test1.renderTime + test2.renderTime) / 2;
                const timeVariance = timeDiff / avgTime;
                
                if (timeVariance > 0.5) { // 50%以上的时间差异
                    noiseIndicators++;
                    analysisResults.push(`⚠️ 渲染时间异常：时间差异过大 ${timeDiff.toFixed(2)}ms (变化率 ${(timeVariance * 100).toFixed(1)}%)`);
                    simpleResults.push('渲染时间异常');
                } else {
                    analysisResults.push(`✅ 渲染时间正常：时间差异 ${timeDiff.toFixed(2)}ms (变化率 ${(timeVariance * 100).toFixed(1)}%)`);
                    simpleResults.push('渲染时间正常');
                }
            }
            
            // 4. 统计数据差异分析（如果存在）
            if (test1.statistics && test2.statistics) {
                const statDifferences = this.compareStatistics(test1.statistics, test2.statistics);
                if (statDifferences.length > 0) {
                    hasDynamicNoise = true;
                    noiseIndicators++;
                    analysisResults.push(`🔍 统计差异：音频统计数据不一致 (${statDifferences.join(', ')})`);
                    simpleResults.push('统计数据异常');
                } else {
                    analysisResults.push('✅ 统计数据一致：音频统计特征保持稳定');
                    simpleResults.push('统计数据一致');
                }
            }
            
            // 5. 时间戳分析
            const timestampDiff = Math.abs(test1.timestamp - test2.timestamp);
            analysisResults.push(`⏱️ 测试执行信息：两次测试间隔 ${timestampDiff}ms`);
            
            // 生成结论
            let conclusion = '';
            if (!hasDynamicNoise) {
                conclusion = '🎉 结论：音频压缩器指纹完全一致，未发现篡改迹象，系统表现正常';
                simpleResults.push('未被篡改');
            } else {
                conclusion = `⚠️ 结论：检测到 ${noiseIndicators} 项异常指标，可能存在人为篡改或反指纹技术`;
                simpleResults.push(`疑似篡改(${noiseIndicators}项异常)`);
            }
            
            analysisResults.push(conclusion);
            
            // 计算置信度
            let confidence = 0.8;
            if (hasDynamicNoise) {
                confidence = Math.min(0.95, 0.6 + (noiseIndicators * 0.15));
            }
            
            return {
                hasDynamicNoise: hasDynamicNoise,
                details: analysisResults.join('\n'),
                simpleDetails: simpleResults.join(' | '),
                confidence: confidence,
                mainFingerprintMatch: mainFingerprintMatch,
                testCount: testResults.length,
                analysisTime: timestampDiff,
                noiseIndicators: noiseIndicators
            };
            
        } catch (error) {
            return {
                hasDynamicNoise: false,
                details: `❌ 噪点分析过程中发生错误：${error.message}`,
                simpleDetails: '分析失败',
                confidence: 0
            };
        }
    }

    // 比较统计数据
    compareStatistics(stats1, stats2) {
        const differences = [];
        const segments = Object.keys(stats1);
        
        segments.forEach(segment => {
            if (stats1[segment] && stats2[segment]) {
                const s1 = stats1[segment];
                const s2 = stats2[segment];
                
                // 比较方差（最敏感的指标）
                const varianceDiff = Math.abs(s1.variance - s2.variance);
                const avgVariance = (s1.variance + s2.variance) / 2;
                
                if (avgVariance > 0 && varianceDiff / avgVariance > 0.01) { // 1%的方差差异
                    differences.push(`${segment}段方差不同`);
                }
                
                // 比较均值
                const meanDiff = Math.abs(s1.mean - s2.mean);
                const avgMean = (s1.mean + s2.mean) / 2;
                
                if (avgMean > 0 && meanDiff / avgMean > 0.001) { // 0.1%的均值差异
                    differences.push(`${segment}段均值不同`);
                }
            }
        });
        
        return differences;
    }

    // 获取音频设备和格式指纹
    getAudioDeviceAndFormatFingerprint(results, callback) {
        try {
            // 获取音频格式支持
            results.formats = this.getAudioFormatSupport();
            
            const deviceInfo = {
                // 音频支持检测
                hasMediaDevices: !!navigator.mediaDevices,
                hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
                
                // 浏览器信息
                userAgent: navigator.userAgent.substring(0, 100), // 限制长度
                platform: navigator.platform
            };

            // 尝试获取媒体设备信息
            if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                navigator.mediaDevices.enumerateDevices()
                    .then(devices => {
                        const audioDevices = devices.filter(device => 
                            device.kind === 'audioinput' || device.kind === 'audiooutput'
                        );
                        deviceInfo.audioInputCount = audioDevices.filter(d => d.kind === 'audioinput').length;
                        deviceInfo.audioOutputCount = audioDevices.filter(d => d.kind === 'audiooutput').length;
                        
                        results.devices = deviceInfo;
                        results.fingerprints.device = this.calculateAudioHash(JSON.stringify(deviceInfo));
                        callback();
                    })
                    .catch(() => {
                        deviceInfo.audioInputCount = 0;
                        deviceInfo.audioOutputCount = 0;
                        results.devices = deviceInfo;
                        results.fingerprints.device = this.calculateAudioHash(JSON.stringify(deviceInfo));
                        callback();
                    });
            } else {
                deviceInfo.audioInputCount = 0;
                deviceInfo.audioOutputCount = 0;
                results.devices = deviceInfo;
                results.fingerprints.device = this.calculateAudioHash(JSON.stringify(deviceInfo));
                callback();
            }
        } catch (e) {
            results.devices = { error: e.message };
            results.formats = {};
            results.fingerprints.device = 'error';
            callback();
        }
    }

    // 检查AudioContext方法是否支持
    hasAudioMethod(methodName) {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            return !!(AudioContextClass && AudioContextClass.prototype[methodName]);
        } catch (e) {
            return false;
        }
    }

    // 获取音频格式支持信息
    getAudioFormatSupport() {
        const audio = document.createElement('audio');
        const formats = {
            ogg: !!audio.canPlayType('audio/ogg; codecs="vorbis"'),
            mp3: !!audio.canPlayType('audio/mpeg;'),
            wav: !!audio.canPlayType('audio/wav; codecs="1"'),
            m4a: !!audio.canPlayType('audio/mp4; codecs="mp4a.40.2"'),
            aac: !!audio.canPlayType('audio/aac;'),
            webm: !!audio.canPlayType('audio/webm; codecs="vorbis"')
        };
        return formats;
    }

    // 合并所有音频指纹（仅关注动态噪点）
    combineAudioFingerprints(audioResults) {
        try {
            // 执行音频噪点检测（仅动态噪点）
            const generalNoiseDetection = this.detectAudioNoise(audioResults);
            
            // 获取压缩器特定的噪点检测结果
            const compressorNoiseDetection = audioResults.compressorNoiseDetection || {
                hasDynamicNoise: false,
                details: '未执行压缩器噪点检测',
                confidence: 0
            };
            
            // 合并噪点检测结果（仅动态噪点）
            const combinedNoiseDetection = {
                general: generalNoiseDetection,
                compressor: compressorNoiseDetection,
                hasDynamicNoise: generalNoiseDetection.hasDynamicNoise || compressorNoiseDetection.hasDynamicNoise,
                hasStaticNoise: false, // 不再检测固定噪点
                overallConfidence: Math.max(generalNoiseDetection.confidence, compressorNoiseDetection.confidence),
                summary: this.createNoiseDetectionSummary(generalNoiseDetection, compressorNoiseDetection)
            };
            
            // 创建综合指纹对象
            const combined = {
                supportInfo: audioResults.supportInfo || {},
                properties: audioResults.fingerprints?.properties || 'error',
                compressor: audioResults.fingerprints?.compressor || 'error',
                device: audioResults.fingerprints?.device || 'error'
            };

            // 保存详细的噪点检测结果
            this.fingerprint.audioNoiseDetection = combinedNoiseDetection;
            
            // 如果有压缩器测试详情，也保存
            if (audioResults.compressorTestDetails) {
                this.fingerprint.compressorTestDetails = audioResults.compressorTestDetails;
            }

            // 生成最终哈希
            const combinedString = JSON.stringify(combined);
            return this.calculateAudioHash(combinedString);
        } catch (e) {
            this.fingerprint.audioNoiseDetection = { 
                general: { hasDynamicNoise: false, hasStaticNoise: false, details: 'error', confidence: 0 },
                compressor: { hasDynamicNoise: false, details: 'error', confidence: 0 },
                hasDynamicNoise: false,
                hasStaticNoise: false,
                overallConfidence: 0,
                summary: `合并错误: ${e.message}`
            };
            return 'combine-error';
        }
    }

    // 创建篡改检测摘要
    createNoiseDetectionSummary(generalDetection, compressorDetection) {
        const summaryParts = [];
        
        // 压缩器篡改检测摘要
        if (compressorDetection.hasDynamicNoise) {
            summaryParts.push(`⚠️ 检测到音频篡改迹象`);
            if (compressorDetection.simpleDetails) {
                summaryParts.push(`(${compressorDetection.simpleDetails})`);
            }
        } else {
            summaryParts.push('✅ 音频指纹未被篡改');
        }
        
        // 一般篡改检测摘要
        if (generalDetection.hasDynamicNoise) {
            summaryParts.push(`⚠️ 发现其他异常指标`);
        }
        
        // 综合结论
        if (!generalDetection.hasDynamicNoise && !compressorDetection.hasDynamicNoise) {
            summaryParts.push('✅ 所有检测项目均正常');
        }
        
        // 添加置信度信息
        const maxConfidence = Math.max(generalDetection.confidence, compressorDetection.confidence);
        summaryParts.push(`检测可信度: ${(maxConfidence * 100).toFixed(1)}%`);
        
        return summaryParts.join(' | ');
    }

    // 计算音频哈希
    calculateAudioHash(data) {
        let hash = 0;
        
        try {
            let input;
            
            // 处理不同类型的输入数据
            if (typeof data === 'object' && !Array.isArray(data)) {
                // 对象类型，转换为JSON字符串
                input = JSON.stringify(data);
            } else if (Array.isArray(data)) {
                if (data.length > 0 && typeof data[0] === 'string') {
                    // 字符串数组
                    input = data.join('');
                } else {
                    // 数值数组
                    input = data.join(',');
                }
            } else {
                // 其他类型，直接转换为字符串
                input = String(data);
            }
            
            // 生成哈希
            for (let i = 0; i < input.length; i++) {
                const char = input.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // 转换为32位整数
            }
            
            return Math.abs(hash).toString();
        } catch (error) {
            console.error('Audio hash calculation error:', error);
            return 'hash-error';
        }
    }

    // 收集字体信息
    async collectFonts() {
        const fonts = [
            'Arial', 'Arial Black', 'Arial Narrow', 'Calibri', 'Cambria', 'Comic Sans MS',
            'Consolas', 'Courier', 'Courier New', 'Georgia', 'Helvetica', 'Impact',
            'Lucida Console', 'Lucida Sans Unicode', 'Microsoft Sans Serif', 'Palatino',
            'Tahoma', 'Times', 'Times New Roman', 'Trebuchet MS', 'Verdana',
            'Webdings', 'Wingdings', 'MS Sans Serif', 'MS Serif',
            // 中文字体
            'SimSun', 'SimHei', 'Microsoft YaHei', 'KaiTi', 'FangSong',
            'STHeiti', 'STKaiti', 'STSong', 'STFangsong',
            // 其他常见字体
            'Monaco', 'Menlo', 'Ubuntu', 'Roboto', 'Open Sans', 'Source Sans Pro'
        ];

        const availableFonts = [];
        const testString = 'mmmmmmmmmmlli';
        const testSize = '72px';
        const baseFonts = ['monospace', 'sans-serif', 'serif'];

        // 创建基准测量
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.textBaseline = 'top';
        context.font = testSize + ' monospace';
        const baseWidths = {
            'monospace': context.measureText(testString).width,
            'sans-serif': context.measureText(testString).width,
            'serif': context.measureText(testString).width
        };

        // 测试每个字体
        for (const font of fonts) {
            let detected = false;
            for (const baseFont of baseFonts) {
                context.font = testSize + ' ' + font + ',' + baseFont;
                const width = context.measureText(testString).width;
                if (width !== baseWidths[baseFont]) {
                    detected = true;
                    break;
                }
            }
            if (detected) {
                availableFonts.push(font);
            }
        }

        this.fingerprint.fonts = availableFonts;
    }

    // 收集插件信息
    collectPlugins() {
        const plugins = [];
        
        if (navigator.plugins && navigator.plugins.length > 0) {
            for (let i = 0; i < navigator.plugins.length; i++) {
                const plugin = navigator.plugins[i];
                plugins.push({
                    name: plugin.name,
                    description: plugin.description,
                    filename: plugin.filename,
                    version: plugin.version || 'unknown'
                });
            }
        }

        this.fingerprint.plugins = plugins.map(p => p.name);
    }

    // 检测Canvas噪点
    detectCanvasNoise(canvas, ctx) {
        try {
            const results = [];
            const originalData = canvas.toDataURL();
            
            // 方法1: 多次渲染一致性检测（检测动态噪点）
            for (let i = 0; i < 2; i++) {
                // 清除并重新绘制相同内容
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                ctx.textBaseline = 'top';
                ctx.font = '14px Arial';
                ctx.fillStyle = '#f60';
                ctx.fillRect(125, 1, 62, 20);
                
                ctx.fillStyle = '#069';
                ctx.fillText('Browser Fingerprint', 2, 15);
                
                ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
                ctx.fillText('Canvas Test 🎨', 4, 45);

                ctx.beginPath();
                ctx.arc(50, 25, 20, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.fill();
                
                results.push(canvas.toDataURL());
            }
            
            // 检查一致性（动态噪点检测）
            const hasDynamicNoise = !results.every(data => data === originalData);
            
            // 方法2: 像素级分析（固定噪点检测）
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixelAnalysis = this.analyzeCanvasPixels(imageData.data);
            
            // 方法3: 数据熵分析（辅助固定噪点检测）
            const entropy = this.calculateEntropy(originalData);
            const hasHighEntropy = entropy > 7.8;
            
            // 综合判断固定噪点
            const hasStaticNoise = pixelAnalysis.hasNoise || hasHighEntropy;
            
            let details = [];
            if (hasDynamicNoise) details.push('检测到动态噪点');
            if (hasStaticNoise) {
                if (pixelAnalysis.hasNoise) details.push('检测到像素级固定噪点');
                if (hasHighEntropy) details.push(`检测到高熵固定噪点 (${entropy.toFixed(2)})`);
            }
            if (!hasDynamicNoise && !hasStaticNoise) details.push('未检测到噪点');
            
            return {
                hasDynamicNoise: hasDynamicNoise,
                hasStaticNoise: hasStaticNoise,
                details: details.join(', '),
                confidence: hasDynamicNoise || hasStaticNoise ? 0.9 : 0.8
            };
            
        } catch (error) {
            return {
                hasDynamicNoise: false,
                hasStaticNoise: false,
                details: `检测错误: ${error.message}`,
                confidence: 0
            };
        }
    }

    // 分析Canvas像素数据
    analyzeCanvasPixels(pixelData) {
        try {
            let suspiciousCount = 0;
            const totalPixels = pixelData.length / 4;
            
            // 检查单像素随机变化
            for (let i = 0; i < pixelData.length; i += 4) {
                const r = pixelData[i];
                const g = pixelData[i + 1];
                const b = pixelData[i + 2];
                const a = pixelData[i + 3];
                
                // 检查是否有异常的像素值变化
                if (a > 0) { // 只检查不透明像素
                    const variance = Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
                    if (variance > 30 && variance < 200) { // 可疑的中等差异
                        suspiciousCount++;
                    }
                }
            }
            
            const suspiciousRatio = suspiciousCount / totalPixels;
            
            if (suspiciousRatio > 0.1) {
                return {
                    hasNoise: true,
                    type: 'pixel_noise',
                    confidence: Math.min(suspiciousRatio * 2, 0.95),
                    details: `Suspicious pixel ratio: ${(suspiciousRatio * 100).toFixed(1)}%`
                };
            }
            
            return {
                hasNoise: false,
                type: 'pixel_clean',
                confidence: 0.8
            };
            
        } catch (error) {
            return {
                hasNoise: false,
                type: 'pixel_analysis_error',
                confidence: 0,
                details: error.message
            };
        }
    }

    // 检测Canvas噪点
    detectCanvasNoise(canvas, ctx) {
        try {
            const results = [];
            const originalData = canvas.toDataURL();
            
            // 方法1: 多次渲染一致性检测（检测动态噪点）
            for (let i = 0; i < 2; i++) {
                // 清除并重新绘制相同内容
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                ctx.textBaseline = 'top';
                ctx.font = '14px Arial';
                ctx.fillStyle = '#f60';
                ctx.fillRect(125, 1, 62, 20);
                
                ctx.fillStyle = '#069';
                ctx.fillText('Browser Fingerprint', 2, 15);
                
                ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
                ctx.fillText('Canvas Test 🎨', 4, 45);

                ctx.beginPath();
                ctx.arc(50, 25, 20, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.fill();
                
                results.push(canvas.toDataURL());
            }
            
            // 检查一致性（动态噪点检测）
            const hasDynamicNoise = !results.every(data => data === originalData);
            
            // 方法2: 像素级分析（固定噪点检测）
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixelAnalysis = this.analyzeCanvasPixels(imageData.data);
            
            // 方法3: 数据熵分析（辅助固定噪点检测）
            const entropy = this.calculateEntropy(originalData);
            const hasHighEntropy = entropy > 7.8;
            
            // 综合判断固定噪点
            const hasStaticNoise = pixelAnalysis.hasNoise || hasHighEntropy;
            
            let details = [];
            if (hasDynamicNoise) details.push('检测到动态噪点');
            if (hasStaticNoise) {
                if (pixelAnalysis.hasNoise) details.push('检测到像素级固定噪点');
                if (hasHighEntropy) details.push(`检测到高熵固定噪点 (${entropy.toFixed(2)})`);
            }
            if (!hasDynamicNoise && !hasStaticNoise) details.push('未检测到噪点');
            
            return {
                hasDynamicNoise: hasDynamicNoise,
                hasStaticNoise: hasStaticNoise,
                details: details.join(', '),
                confidence: hasDynamicNoise || hasStaticNoise ? 0.9 : 0.8
            };
            
        } catch (error) {
            return {
                hasDynamicNoise: false,
                hasStaticNoise: false,
                details: `检测错误: ${error.message}`,
                confidence: 0
            };
        }
    }

    // 检测音频指纹是否被篡改（仅检测动态篡改）
    detectAudioNoise(audioResults) {
        try {
            let hasDynamicNoise = false;
            const details = [];
            
            // 方法1: 检查音频指纹的一致性（篡改检测）
            if (audioResults.fingerprints) {
                const fingerprints = [
                    audioResults.fingerprints.properties,
                    audioResults.fingerprints.compressor,
                    audioResults.fingerprints.device
                ];
                
                // 检查是否有异常短或长的指纹（可能表示被篡改）
                fingerprints.forEach((fp, index) => {
                    if (typeof fp === 'string') {
                        if (fp.length < 5) {
                            hasDynamicNoise = true;
                            details.push(`音频指纹 ${index} 长度异常短`);
                        } else if (fp.length > 1000) {
                            hasDynamicNoise = true;
                            details.push(`音频指纹 ${index} 长度异常长`);
                        }
                    }
                });
            }
            
            if (!hasDynamicNoise) {
                details.push('音频指纹长度检查正常');
            }
            
            return {
                hasDynamicNoise: hasDynamicNoise,
                hasStaticNoise: false, // 不再检测固定噪点
                details: details.join(', '),
                confidence: hasDynamicNoise ? 0.7 : 0.8
            };
            
        } catch (error) {
            return {
                hasDynamicNoise: false,
                hasStaticNoise: false,
                details: `音频检测错误: ${error.message}`,
                confidence: 0
            };
        }
    }

    // 辅助方法：将ArrayBuffer转换为字符串
    arrayBufferToString(buffer) {
        try {
            const uint8Array = new Uint8Array(buffer);
            let result = '';
            for (let i = 0; i < Math.min(100, uint8Array.length); i++) {
                result += uint8Array[i].toString();
            }
            return result;
        } catch (error) {
            return 'conversion_error';
        }
    }

    // 计算数据熵
    calculateEntropy(data) {
        const frequency = {};
        const length = data.length;

        // 计算字符频率
        for (let i = 0; i < length; i++) {
            const char = data[i];
            frequency[char] = (frequency[char] || 0) + 1;
        }

        // 计算熵
        let entropy = 0;
        for (const char in frequency) {
            const prob = frequency[char] / length;
            entropy -= prob * Math.log2(prob);
        }

        return entropy;
    }
}
