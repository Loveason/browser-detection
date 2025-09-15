/**
 * 音频工具类 - 统一管理音频相关操作
 */
class AudioUtils {
    /**
     * 检测AudioContext支持情况
     * @returns {Object} 支持情况
     */
    static detectSupport() {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const OfflineAudioContextClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;

        return {
            basicSupport: !!AudioContextClass,
            offlineSupport: !!OfflineAudioContextClass,
            createAnalyser: this.hasMethod('createAnalyser'),
            createOscillator: this.hasMethod('createOscillator'),
            createGain: this.hasMethod('createGain'),
            createDynamicsCompressor: this.hasMethod('createDynamicsCompressor'),
            createScriptProcessor: this.hasMethod('createScriptProcessor')
        };
    }

    /**
     * 检查AudioContext方法是否支持
     * @param {string} methodName 方法名
     * @returns {boolean} 是否支持
     */
    static hasMethod(methodName) {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            return !!(AudioContextClass && AudioContextClass.prototype[methodName]);
        } catch (e) {
            return false;
        }
    }

    /**
     * 获取音频格式支持信息
     * @returns {Object} 格式支持情况
     */
    static getFormatSupport() {
        const audio = document.createElement('audio');
        return {
            ogg: !!audio.canPlayType('audio/ogg; codecs="vorbis"'),
            mp3: !!audio.canPlayType('audio/mpeg;'),
            wav: !!audio.canPlayType('audio/wav; codecs="1"'),
            m4a: !!audio.canPlayType('audio/mp4; codecs="mp4a.40.2"'),
            aac: !!audio.canPlayType('audio/aac;'),
            webm: !!audio.canPlayType('audio/webm; codecs="vorbis"')
        };
    }

    /**
     * 复制音频属性 (忽略敏感属性)
     * @param {Object} target 目标对象
     * @param {Object} source 源对象
     * @param {string} prefix 前缀
     */
    static copyProperties(target, source, prefix = '') {
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

    /**
     * 获取AudioContext属性指纹
     * @returns {Promise<Object>} 属性指纹结果
     */
    static async getContextProperties() {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const context = new AudioContextClass();
            const analyser = context.createAnalyser();

            const properties = {};

            // 复制AudioContext属性
            this.copyProperties(properties, context, 'AudioContext');
            this.copyProperties(properties, context.destination, 'Destination');
            this.copyProperties(properties, context.listener, 'Listener');
            this.copyProperties(properties, analyser, 'Analyser');

            const fingerprint = await CryptoUtils.hashString(JSON.stringify(properties));

            context.close();

            return {
                properties,
                fingerprint,
                error: null
            };

        } catch (e) {
            return {
                properties: { error: e.message },
                fingerprint: 'error',
                error: e.message
            };
        }
    }

    /**
     * 获取媒体设备信息
     * @returns {Promise<Object>} 设备信息
     */
    static async getDeviceInfo() {
        try {
            const deviceInfo = {
                hasMediaDevices: !!navigator.mediaDevices,
                hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
                userAgent: navigator.userAgent.substring(0, 100),
                platform: navigator.platform,
                audioInputCount: 0,
                audioOutputCount: 0
            };

            // 尝试获取媒体设备信息
            if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                try {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const audioDevices = devices.filter(device =>
                        device.kind === 'audioinput' || device.kind === 'audiooutput'
                    );
                    deviceInfo.audioInputCount = audioDevices.filter(d => d.kind === 'audioinput').length;
                    deviceInfo.audioOutputCount = audioDevices.filter(d => d.kind === 'audiooutput').length;
                } catch (e) {
                    // 获取设备信息失败，保持默认值
                }
            }

            const fingerprint = await CryptoUtils.hashString(JSON.stringify(deviceInfo));

            return {
                info: deviceInfo,
                fingerprint,
                error: null
            };

        } catch (e) {
            return {
                info: { error: e.message },
                fingerprint: 'error',
                error: e.message
            };
        }
    }

    /**
     * 执行单次压缩器测试
     * @param {number} testIndex 测试索引
     * @returns {Promise<Object>} 测试结果
     */
    static async runCompressorTest(testIndex) {
        try {
            const OfflineAudioContextClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
            if (!OfflineAudioContextClass) {
                throw new Error('不支持OfflineAudioContext');
            }

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
            const buffer = await offlineContext.startRendering();
            const renderTime = performance.now() - testStartTime;
            const channelData = buffer.getChannelData(0);

            // 计算多个区域的指纹
            const fingerprintData = this.calculateEnhancedFingerprint(channelData);

            return {
                testIndex,
                fingerprint: fingerprintData.mainFingerprint,
                detailedFingerprint: fingerprintData.detailedFingerprint,
                renderTime,
                bufferLength: channelData.length,
                timestamp: Date.now(),
                statistics: fingerprintData.statistics,
                error: null
            };

        } catch (e) {
            return {
                testIndex,
                fingerprint: 'error',
                detailedFingerprint: null,
                renderTime: 0,
                error: e.message,
                timestamp: Date.now()
            };
        }
    }

    /**
     * 计算增强的压缩器指纹
     * @param {Float32Array} channelData 音频数据
     * @returns {Object} 指纹数据
     */
    static calculateEnhancedFingerprint(channelData) {
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
            const values = [];

            for (let i = segment.start; i < Math.min(segment.end, channelData.length); i++) {
                const value = Math.abs(channelData[i]);
                sum += value;
                max = Math.max(max, value);
                min = Math.min(min, value);
                values.push(value);
            }

            const mean = sum / values.length;
            const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;

            fingerprints[segment.name] = sum.toString();
            statistics[segment.name] = {
                sum,
                mean,
                max,
                min,
                variance,
                count: values.length
            };
        });

        return {
            mainFingerprint: fingerprints.main,
            detailedFingerprint: fingerprints,
            statistics
        };
    }

    /**
     * 执行双重压缩器测试
     * @returns {Promise<Object>} 测试结果
     */
    static async runDualCompressorTest() {
        const testResults = [];
        const totalTests = 2;

        // 并发执行两次测试
        const promises = [];
        for (let i = 0; i < totalTests; i++) {
            promises.push(
                new Promise(resolve => {
                    setTimeout(async () => {
                        const result = await this.runCompressorTest(i);
                        resolve(result);
                    }, i * 100); // 间隔100ms
                })
            );
        }

        const results = await Promise.all(promises);
        testResults.push(...results);

        // 分析结果
        const analysis = this.analyzeCompressorResults(testResults);

        return {
            testResults,
            analysis,
            fingerprint: testResults[0]?.fingerprint || 'error'
        };
    }

    /**
     * 分析压缩器测试结果
     * @param {Array} testResults 测试结果数组
     * @returns {Object} 分析结果
     */
    static analyzeCompressorResults(testResults) {
        try {
            if (testResults.length < 2) {
                return {
                    hasDynamicNoise: false,
                    details: '测试次数不足',
                    simpleDetails: '测试次数不足',
                    confidence: 0
                };
            }

            const [test1, test2] = testResults;

            if (test1.fingerprint === 'error' || test2.fingerprint === 'error') {
                return {
                    hasDynamicNoise: false,
                    details: '测试执行失败',
                    simpleDetails: '测试执行失败',
                    confidence: 0
                };
            }

            const analysisResults = [];
            const simpleResults = [];
            let hasDynamicNoise = false;
            let noiseIndicators = 0;

            // 主要指纹对比
            const mainFingerprintMatch = test1.fingerprint === test2.fingerprint;
            if (!mainFingerprintMatch) {
                hasDynamicNoise = true;
                noiseIndicators++;
                analysisResults.push('主要指纹不匹配');
                simpleResults.push('主指纹不一致');
            } else {
                analysisResults.push('主要指纹一致');
                simpleResults.push('主指纹一致');
            }

            // 详细指纹对比
            if (test1.detailedFingerprint && test2.detailedFingerprint) {
                const segments = Object.keys(test1.detailedFingerprint);
                let mismatchedSegments = 0;

                segments.forEach(segment => {
                    if (test1.detailedFingerprint[segment] !== test2.detailedFingerprint[segment]) {
                        mismatchedSegments++;
                    }
                });

                if (mismatchedSegments > 0) {
                    hasDynamicNoise = true;
                    noiseIndicators++;
                    analysisResults.push(`${mismatchedSegments}/${segments.length} 个音频段不一致`);
                    simpleResults.push(`${mismatchedSegments}段不一致`);
                } else {
                    analysisResults.push(`所有 ${segments.length} 个音频段都一致`);
                    simpleResults.push('所有段一致');
                }
            }

            // 渲染时间差异分析
            if (test1.renderTime && test2.renderTime) {
                const timeDiff = Math.abs(test1.renderTime - test2.renderTime);
                const avgTime = (test1.renderTime + test2.renderTime) / 2;
                const timeVariance = timeDiff / avgTime;

                if (timeVariance > 0.5) {
                    noiseIndicators++;
                    analysisResults.push(`渲染时间异常: ${timeDiff.toFixed(2)}ms`);
                    simpleResults.push('渲染时间异常');
                } else {
                    analysisResults.push(`渲染时间正常: ${timeDiff.toFixed(2)}ms`);
                    simpleResults.push('渲染时间正常');
                }
            }

            // 计算置信度
            let confidence = 0.8;
            if (hasDynamicNoise) {
                confidence = Math.min(0.95, 0.6 + (noiseIndicators * 0.15));
            }

            return {
                hasDynamicNoise,
                details: analysisResults.join('; '),
                simpleDetails: simpleResults.join(' | '),
                confidence,
                mainFingerprintMatch,
                testCount: testResults.length,
                noiseIndicators
            };

        } catch (error) {
            return {
                hasDynamicNoise: false,
                details: `分析错误: ${error.message}`,
                simpleDetails: '分析失败',
                confidence: 0
            };
        }
    }
}

// 导出工具类
window.AudioUtils = AudioUtils;
