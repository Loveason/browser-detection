/**
 * 浏览器检测工具类 - 统一管理浏览器特征检测
 */
class BrowserUtils {
    /**
     * 获取用户代理信息
     * @returns {Object} 用户代理信息
     */
    static getUserAgentInfo() {
        const ua = navigator.userAgent;
        
        return {
            full: ua,
            platform: navigator.platform,
            vendor: navigator.vendor || '',
            language: navigator.language,
            languages: navigator.languages || [],
            onLine: navigator.onLine,
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack
        };
    }

    /**
     * 获取屏幕信息
     * @returns {Object} 屏幕信息
     */
    static getScreenInfo() {
        return {
            width: screen.width,
            height: screen.height,
            availWidth: screen.availWidth,
            availHeight: screen.availHeight,
            colorDepth: screen.colorDepth,
            pixelDepth: screen.pixelDepth,
            orientation: screen.orientation ? screen.orientation.type : undefined,
            devicePixelRatio: window.devicePixelRatio || 1
        };
    }

    /**
     * 获取时区信息
     * @returns {Object} 时区信息
     */
    static getTimezoneInfo() {
        const now = new Date();
        
        return {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: now.getTimezoneOffset(),
            locale: Intl.DateTimeFormat().resolvedOptions().locale,
            dateString: now.toString(),
            toDateString: now.toDateString(),
            toTimeString: now.toTimeString(),
            toLocaleString: now.toLocaleString()
        };
    }

    /**
     * 获取插件信息
     * @returns {Array} 插件列表
     */
    static getPluginsInfo() {
        const plugins = [];
        
        try {
            for (let i = 0; i < navigator.plugins.length; i++) {
                const plugin = navigator.plugins[i];
                const mimeTypes = [];
                
                for (let j = 0; j < plugin.length; j++) {
                    mimeTypes.push({
                        type: plugin[j].type,
                        description: plugin[j].description,
                        suffixes: plugin[j].suffixes
                    });
                }
                
                plugins.push({
                    name: plugin.name,
                    description: plugin.description,
                    filename: plugin.filename,
                    version: plugin.version,
                    mimeTypes
                });
            }
        } catch (e) {
            // 插件信息获取失败
        }
        
        return plugins;
    }

    /**
     * 获取字体信息
     * @returns {Object} 字体检测结果
     */
    static getFontInfo() {
        const baseFonts = ['monospace', 'sans-serif', 'serif'];
        const testFonts = [
            // 常见西文字体
            'Arial', 'Arial Black', 'Arial Narrow', 'Arial Unicode MS',
            'Calibri', 'Cambria', 'Comic Sans MS', 'Consolas', 'Courier New',
            'Georgia', 'Helvetica', 'Helvetica Neue', 'Impact', 'Lucida Console',
            'Lucida Sans Unicode', 'Microsoft Sans Serif', 'Palatino Linotype',
            'Segoe UI', 'Tahoma', 'Times', 'Times New Roman', 'Trebuchet MS',
            'Verdana', 'Webdings', 'Wingdings', 'Symbol',
            
            // 中文字体
            'SimSun', 'SimHei', 'Microsoft YaHei', 'Microsoft JhengHei',
            'PingFang SC', 'PingFang TC', 'Hiragino Sans GB', 'STHeiti',
            'STKaiti', 'STSong', 'STFangsong', 'LiSu', 'YouYuan', 'FangSong',
            'KaiTi', 'NSimSun', 'DengXian', 'FangSong_GB2312', 'KaiTi_GB2312',
            'SimSun-ExtB', 'Microsoft YaHei UI',
            
            // 日文字体
            'Hiragino Kaku Gothic Pro', 'Hiragino Mincho Pro', 'Osaka-Mono',
            'Meiryo', 'MS Gothic', 'MS Mincho', 'MS PGothic', 'MS PMincho',
            'Yu Gothic', 'Yu Mincho',
            
            // 韩文字体
            'Gulim', 'Dotum', 'Batang', 'Gungsuh', 'Malgun Gothic',
            
            // macOS 系统字体
            'Apple Symbols', 'AppleGothic', 'AppleMyungjo', 'Helvetica Neue',
            'Lucida Grande', 'Menlo', 'Monaco', 'San Francisco', 'SF Pro Display',
            'SF Pro Text', 'SF Mono', 'New York', '.SF NS Text', '.SF NS Display',
            'Avenir', 'Avenir Next', 'Baskerville', 'Big Caslon', 'Bodoni 72',
            'Chalkboard SE', 'Copperplate', 'Didot', 'Futura', 'Gill Sans',
            'Hoefler Text', 'Marker Felt', 'Optima', 'Papyrus', 'Phosphate',
            'Rockwell', 'Savoye LET', 'SignPainter', 'Skia', 'Snell Roundhand',
            'Zapfino',
            
            // Windows 系统字体
            'Segoe UI Historic', 'Segoe UI Emoji', 'Segoe UI Symbol',
            'Segoe Print', 'Segoe Script', 'Cambria Math', 'Ebrima',
            'Gabriola', 'Gadugi', 'Javanese Text', 'Leelawadee UI',
            'Malgun Gothic', 'Myanmar Text', 'Nirmala UI', 'Segoe MDL2 Assets',
            'Yu Gothic UI',
            
            // Linux 字体
            'DejaVu Sans', 'DejaVu Serif', 'DejaVu Sans Mono', 'Liberation Sans',
            'Liberation Serif', 'Liberation Mono', 'Ubuntu', 'Ubuntu Mono',
            'Droid Sans', 'Droid Serif', 'Droid Sans Mono', 'Roboto',
            'Noto Sans', 'Noto Serif', 'Source Sans Pro', 'Source Serif Pro',
            'Source Code Pro', 'Open Sans', 'Lato', 'Montserrat',
            
            // 表情符号字体
            'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
            'Noto Color Emoji', 'Android Emoji', 'EmojiOne Color',
            'Twemoji Mozilla', 'JoyPixels',
            
            // 编程字体
            'Fira Code', 'Source Code Pro', 'Inconsolata', 'Monaco', 'Menlo',
            'DejaVu Sans Mono', 'Courier Prime', 'Anonymous Pro', 'Ubuntu Mono',
            'JetBrains Mono', 'Cascadia Code', 'SF Mono',
            
            // 设计字体
            'Proxima Nova', 'Montserrat', 'Open Sans', 'Lato', 'Roboto',
            'Poppins', 'Nunito', 'Raleway', 'Source Sans Pro', 'Ubuntu',
            'PT Sans', 'Oswald', 'Merriweather', 'Playfair Display',
            'Inter', 'Work Sans', 'Libre Franklin', 'Space Grotesk'
        ];

        const availableFonts = [];
        const testString = 'abcdefghijklmnopqrstuvwxyz0123456789';
        const testSize = '72px';
        const testContainer = document.createElement('div');
        
        testContainer.style.position = 'absolute';
        testContainer.style.left = '-9999px';
        testContainer.style.top = '-9999px';
        testContainer.style.visibility = 'hidden';
        document.body.appendChild(testContainer);

        try {
            // 获取基础字体的尺寸
            const baseSizes = {};
            baseFonts.forEach(baseFont => {
                const span = document.createElement('span');
                span.style.fontSize = testSize;
                span.style.fontFamily = baseFont;
                span.textContent = testString;
                testContainer.appendChild(span);
                
                baseSizes[baseFont] = {
                    width: span.offsetWidth,
                    height: span.offsetHeight
                };
                
                testContainer.removeChild(span);
            });

            // 测试每个字体
            testFonts.forEach(font => {
                let detected = false;
                
                baseFonts.forEach(baseFont => {
                    const span = document.createElement('span');
                    span.style.fontSize = testSize;
                    span.style.fontFamily = `"${font}", ${baseFont}`;
                    span.textContent = testString;
                    testContainer.appendChild(span);
                    
                    const detected1 = span.offsetWidth !== baseSizes[baseFont].width || 
                                    span.offsetHeight !== baseSizes[baseFont].height;
                    
                    testContainer.removeChild(span);
                    
                    if (detected1) {
                        detected = true;
                    }
                });
                
                if (detected) {
                    availableFonts.push(font);
                }
            });

        } catch (e) {
            // 字体检测失败
        } finally {
            document.body.removeChild(testContainer);
        }

        return {
            available: availableFonts,
            count: availableFonts.length,
            list: availableFonts.join(', ')
        };
    }

    /**
     * 获取存储信息
     * @returns {Object} 存储检测结果
     */
    static getStorageInfo() {
        const storage = {
            localStorage: false,
            sessionStorage: false,
            indexedDB: false,
            webSQL: false,
            cookieEnabled: navigator.cookieEnabled
        };

        try {
            if (window.localStorage) {
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
                storage.localStorage = true;
            }
        } catch (e) {
            storage.localStorage = false;
        }

        try {
            if (window.sessionStorage) {
                sessionStorage.setItem('test', 'test');
                sessionStorage.removeItem('test');
                storage.sessionStorage = true;
            }
        } catch (e) {
            storage.sessionStorage = false;
        }

        try {
            storage.indexedDB = !!window.indexedDB;
        } catch (e) {
            storage.indexedDB = false;
        }

        try {
            storage.webSQL = !!window.openDatabase;
        } catch (e) {
            storage.webSQL = false;
        }

        return storage;
    }

    /**
     * 获取硬件信息
     * @returns {Object} 硬件信息
     */
    static getHardwareInfo() {
        return {
            hardwareConcurrency: navigator.hardwareConcurrency || 0,
            deviceMemory: navigator.deviceMemory || 0,
            maxTouchPoints: navigator.maxTouchPoints || 0,
            vendor: navigator.vendor || '',
            vendorSub: navigator.vendorSub || '',
            productSub: navigator.productSub || '',
            oscpu: navigator.oscpu || ''
        };
    }

    /**
     * 获取连接信息
     * @returns {Object} 连接信息
     */
    static getConnectionInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (!connection) {
            return { supported: false };
        }

        return {
            supported: true,
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData,
            type: connection.type
        };
    }

    /**
     * 检测广告拦截器
     * @returns {Promise<boolean>} 是否检测到广告拦截器
     */
    static async detectAdBlocker() {
        return new Promise(resolve => {
            // 创建一个看起来像广告的元素
            const adElement = document.createElement('div');
            adElement.innerHTML = '&nbsp;';
            adElement.className = 'adsbox';
            adElement.style.position = 'absolute';
            adElement.style.left = '-9999px';
            adElement.style.height = '1px';
            
            document.body.appendChild(adElement);
            
            setTimeout(() => {
                const blocked = adElement.offsetHeight === 0;
                document.body.removeChild(adElement);
                resolve(blocked);
            }, 100);
        });
    }

    /**
     * 获取权限信息
     * @returns {Promise<Object>} 权限状态
     */
    static async getPermissionsInfo() {
        const permissions = {};
        const permissionNames = [
            'camera', 'microphone', 'geolocation', 'notifications',
            'push', 'midi', 'accelerometer', 'gyroscope', 'magnetometer'
        ];

        if (!navigator.permissions) {
            return { supported: false };
        }

        try {
            for (const permission of permissionNames) {
                try {
                    const result = await navigator.permissions.query({ name: permission });
                    permissions[permission] = result.state;
                } catch (e) {
                    permissions[permission] = 'unknown';
                }
            }
        } catch (e) {
            // 权限查询失败
        }

        return {
            supported: true,
            permissions
        };
    }

    /**
     * 生成浏览器特征指纹
     * @returns {Promise<Object>} 浏览器指纹结果
     */
    static async generateBrowserFingerprint() {
        try {
            const features = {
                userAgent: this.getUserAgentInfo(),
                screen: this.getScreenInfo(),
                timezone: this.getTimezoneInfo(),
                plugins: this.getPluginsInfo(),
                fonts: this.getFontInfo(),
                storage: this.getStorageInfo(),
                hardware: this.getHardwareInfo(),
                connection: this.getConnectionInfo()
            };

            // 异步获取的特征
            features.adBlocker = await this.detectAdBlocker();
            features.permissions = await this.getPermissionsInfo();

            // 生成指纹
            const fingerprintString = JSON.stringify(features);
            const fingerprint = await CryptoUtils.hashString(fingerprintString);

            return {
                features,
                fingerprint,
                timestamp: Date.now(),
                error: null
            };

        } catch (e) {
            return {
                features: null,
                fingerprint: 'error',
                timestamp: Date.now(),
                error: e.message
            };
        }
    }

    /**
     * 检测浏览器类型
     * @returns {Object} 浏览器类型信息
     */
    static detectBrowserType() {
        const ua = navigator.userAgent;
        const browsers = {
            chrome: /Chrome/i.test(ua) && !/Edge/i.test(ua),
            firefox: /Firefox/i.test(ua),
            safari: /Safari/i.test(ua) && !/Chrome/i.test(ua),
            edge: /Edge/i.test(ua),
            ie: /Trident/i.test(ua),
            opera: /Opera/i.test(ua) || /OPR/i.test(ua)
        };

        const detected = Object.keys(browsers).find(browser => browsers[browser]);
        
        return {
            detected: detected || 'unknown',
            browsers,
            userAgent: ua
        };
    }

    /**
     * 检测操作系统
     * @returns {Object} 操作系统信息
     */
    static detectOperatingSystem() {
        const ua = navigator.userAgent;
        const platform = navigator.platform;
        
        const systems = {
            windows: /Win/i.test(platform),
            mac: /Mac/i.test(platform),
            linux: /Linux/i.test(platform),
            android: /Android/i.test(ua),
            ios: /iPhone|iPad|iPod/i.test(ua)
        };

        const detected = Object.keys(systems).find(system => systems[system]);

        return {
            detected: detected || 'unknown',
            systems,
            platform,
            userAgent: ua
        };
    }
}

// 导出工具类
window.BrowserUtils = BrowserUtils;
