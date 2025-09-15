/**
 * Canvas绘制工具类 - 统一管理Canvas相关操作
 */
class CanvasUtils {
    /**
     * 创建标准Canvas元素
     * @param {number} width 宽度
     * @param {number} height 高度
     * @returns {HTMLCanvasElement} Canvas元素
     */
    static createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }

    /**
     * 绘制标准测试图形
     * @param {HTMLCanvasElement} canvas Canvas元素
     * @returns {string} Canvas数据URL
     */
    static drawTestPattern(canvas) {
        const ctx = canvas.getContext('2d');

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

        return canvas.toDataURL();
    }

    /**
     * 缩放Canvas以适合显示
     * @param {HTMLCanvasElement} originalCanvas 原始Canvas
     * @param {number} maxWidth 最大宽度
     * @param {number} maxHeight 最大高度
     * @returns {HTMLCanvasElement} 缩放后的Canvas
     */
    static scaleCanvas(originalCanvas, maxWidth, maxHeight) {
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

    /**
     * 分析像素数据
     * @param {Uint8ClampedArray} pixelData 像素数据
     * @returns {Object} 分析结果
     */
    static analyzePixels(pixelData) {
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

            // 计算熵值（简化版本）
            const entropy = this.calculateSimpleEntropy(pixelData);

            if (suspiciousRatio > 0.1) {
                return {
                    hasNoise: true,
                    type: 'pixel_noise',
                    confidence: Math.min(suspiciousRatio * 2, 0.95),
                    details: `可疑像素比例: ${(suspiciousRatio * 100).toFixed(1)}%`,
                    totalPixels: totalPixels,
                    suspiciousPixels: suspiciousCount,
                    entropy: entropy
                };
            }

            return {
                hasNoise: false,
                type: 'pixel_clean',
                confidence: 0.8,
                totalPixels: totalPixels,
                suspiciousPixels: suspiciousCount,
                entropy: entropy
            };

        } catch (error) {
            return {
                hasNoise: false,
                type: 'pixel_analysis_error',
                confidence: 0,
                details: error.message,
                totalPixels: 0,
                suspiciousPixels: 0,
                entropy: 0
            };
        }
    }

    /**
     * 计算简化的像素熵值
     * @param {Uint8ClampedArray} pixelData 像素数据
     * @returns {number} 熵值
     */
    static calculateSimpleEntropy(pixelData) {
        try {
            const histogram = new Array(256).fill(0);
            const totalPixels = pixelData.length / 4;

            // 统计像素值分布（只统计红色通道作为简化）
            for (let i = 0; i < pixelData.length; i += 4) {
                histogram[pixelData[i]]++;
            }

            // 计算熵值
            let entropy = 0;
            for (let count of histogram) {
                if (count > 0) {
                    const probability = count / totalPixels;
                    entropy -= probability * Math.log2(probability);
                }
            }

            return entropy;
        } catch (error) {
            console.error('计算熵值失败:', error);
            return 0;
        }
    }

    /**
     * 检测Canvas渲染一致性
     * @param {HTMLCanvasElement} canvas Canvas元素
     * @param {Function} drawFunction 绘制函数
     * @param {number} testCount 测试次数
     * @returns {Object} 一致性检测结果
     */
    static detectRenderingConsistency(canvas, drawFunction, testCount = 3) {
        const results = [];
        const ctx = canvas.getContext('2d');

        for (let i = 0; i < testCount; i++) {
            // 清除并重新绘制
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawFunction(canvas, ctx);
            results.push(canvas.toDataURL());
        }

        // 检查一致性
        const isConsistent = results.every(data => data === results[0]);

        return {
            isConsistent,
            hasDynamicNoise: !isConsistent,
            testCount: testCount,
            uniqueResults: [...new Set(results)].length
        };
    }
}

// 导出工具类
window.CanvasUtils = CanvasUtils;
