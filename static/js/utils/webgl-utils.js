/**
 * WebGL工具类 - 统一管理WebGL相关操作
 */
class WebGLUtils {
    // 已知的标准哈希值
    static KNOWN_HASHES = {
        RED_RECTANGLE: 'bf9da7959d914298f9ce9e41a480fd66f76fac5c6f5e0a9b5a99b18cfc6fd997'
    };

    // 顶点着色器代码
    static VERTEX_SHADERS = {
        BASIC: 'attribute vec3 coordinates;void main(void) { gl_Position = vec4(coordinates, 1.0);}',
        CUBE: `
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
        `
    };

    // 片元着色器代码
    static FRAGMENT_SHADERS = {
        RED: 'void main(void) { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);}',
        CUBE: `
            precision mediump float;
            varying vec4 vfragColor;
            void main() {
                gl_FragColor = vfragColor;
            }
        `
    };

    /**
     * 获取WebGL上下文
     * @param {HTMLCanvasElement} canvas Canvas元素
     * @param {Object} options WebGL上下文选项
     * @returns {WebGLRenderingContext|null} WebGL上下文
     */
    static getContext(canvas, options = {}) {
        const defaultOptions = { preserveDrawingBuffer: true };
        const finalOptions = { ...defaultOptions, ...options };

        return canvas.getContext('webgl', finalOptions) ||
               canvas.getContext('experimental-webgl', finalOptions);
    }

    /**
     * 创建着色器
     * @param {WebGLRenderingContext} gl WebGL上下文
     * @param {number} type 着色器类型
     * @param {string} source 着色器源码
     * @returns {WebGLShader|null} 着色器对象
     */
    static createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('着色器编译错误:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    /**
     * 创建着色器程序
     * @param {WebGLRenderingContext} gl WebGL上下文
     * @param {string} vertexSource 顶点着色器源码
     * @param {string} fragmentSource 片元着色器源码
     * @returns {WebGLProgram|null} 着色器程序
     */
    static createProgram(gl, vertexSource, fragmentSource) {
        const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

        if (!vertexShader || !fragmentShader) {
            return null;
        }

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('程序链接错误:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }

        return program;
    }

    /**
     * 创建缓冲区
     * @param {WebGLRenderingContext} gl WebGL上下文
     * @param {number} target 缓冲区目标
     * @param {ArrayBuffer} data 数据
     * @param {number} usage 使用方式
     * @returns {WebGLBuffer} 缓冲区对象
     */
    static createBuffer(gl, target, data, usage = gl.STATIC_DRAW) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(target, buffer);
        gl.bufferData(target, data, usage);
        return buffer;
    }

    /**
     * 绘制红色矩形 (固定噪点检测)
     * @param {HTMLCanvasElement} canvas Canvas元素
     * @returns {boolean} 绘制是否成功
     */
    static drawRedRectangle(canvas) {
        try {
            const gl = this.getContext(canvas);
            if (!gl) return false;

            // 顶点数据和索引
            const vertices = new Float32Array([-.75, .75, 0, -.75, -.75, 0, .75, -.75, 0, .75, .75, 0]);
            const indices = new Uint16Array([3, 2, 1, 3, 1, 0]);

            // 创建缓冲区
            const vertexBuffer = this.createBuffer(gl, gl.ARRAY_BUFFER, vertices);
            const indexBuffer = this.createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, indices);

            // 创建着色器程序
            const program = this.createProgram(gl, 
                this.VERTEX_SHADERS.BASIC, 
                this.FRAGMENT_SHADERS.RED);

            if (!program) return false;

            // 设置程序和属性
            gl.useProgram(program);
            
            const coord = gl.getAttribLocation(program, 'coordinates');
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(coord);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

            // 渲染设置
            gl.clearColor(0, 0, 0, 0);
            gl.enable(gl.DEPTH_TEST);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.viewport(0, 0, canvas.width, canvas.height);

            // 绘制
            gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

            return true;

        } catch (error) {
            console.error('绘制红色矩形时出错:', error);
            return false;
        }
    }

    /**
     * 绘制彩色立方体 (动态噪点检测)
     * @param {HTMLCanvasElement} canvas Canvas元素
     * @returns {boolean} 绘制是否成功
     */
    static drawColoredCube(canvas) {
        try {
            const gl = this.getContext(canvas);
            if (!gl) return false;

            // 立方体顶点位置
            const positions = new Float32Array([
                -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,    // 前面
                -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1, -1, // 后面
                -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1,     // 顶面
                -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, // 底面
                1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1,     // 右面
                -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1  // 左面
            ]);

            // 每个面的颜色
            const faceColors = [
                [1.0, 1.0, 1.0, 1.0], // 白色
                [1.0, 0.0, 0.0, 1.0], // 红色
                [0.0, 1.0, 0.0, 1.0], // 绿色
                [0.0, 0.0, 1.0, 1.0], // 蓝色
                [1.0, 1.0, 0.0, 1.0], // 黄色
                [1.0, 0.0, 1.0, 1.0]  // 品红色
            ];

            // 展开颜色数组
            const colors = [];
            for (let j = 0; j < faceColors.length; ++j) {
                const c = faceColors[j];
                colors.push(...c, ...c, ...c, ...c);
            }

            // 索引数组
            const indices = new Uint16Array([
                0, 1, 2, 0, 2, 3,       // 前面
                4, 5, 6, 4, 6, 7,       // 后面
                8, 9, 10, 8, 10, 11,    // 顶面
                12, 13, 14, 12, 14, 15, // 底面
                16, 17, 18, 16, 18, 19, // 右面
                20, 21, 22, 20, 22, 23  // 左面
            ]);

            // 创建缓冲区
            const positionBuffer = this.createBuffer(gl, gl.ARRAY_BUFFER, positions);
            const colorBuffer = this.createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(colors));
            const indexBuffer = this.createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, indices);

            // 创建着色器程序
            const program = this.createProgram(gl, 
                this.VERTEX_SHADERS.CUBE, 
                this.FRAGMENT_SHADERS.CUBE);

            if (!program) return false;

            // 设置变换矩阵
            const projectionMatrix = this.createPerspectiveMatrix(
                45 * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
            const modelMatrix = this.createTranslationMatrix(0, 0, -6);

            // 使用程序
            gl.useProgram(program);

            // 设置uniform
            const projectionLocation = gl.getUniformLocation(program, 'uprojectionMatrix');
            const modelLocation = gl.getUniformLocation(program, 'umodelMatrix');
            gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
            gl.uniformMatrix4fv(modelLocation, false, modelMatrix);

            // 设置顶点属性
            const positionAttrib = gl.getAttribLocation(program, 'avertPosition');
            const colorAttrib = gl.getAttribLocation(program, 'avertColor');

            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.vertexAttribPointer(positionAttrib, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(positionAttrib);

            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
            gl.vertexAttribPointer(colorAttrib, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(colorAttrib);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

            // 渲染设置
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(1, 1, 0, 1); // 黄色背景
            gl.clearDepth(1.0);
            gl.enable(gl.DEPTH_TEST);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // 绘制立方体
            gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

            return true;

        } catch (error) {
            console.error('绘制彩色立方体时出错:', error);
            return false;
        }
    }

    /**
     * 读取像素数据并计算指纹
     * @param {HTMLCanvasElement} canvas Canvas元素
     * @returns {Promise<string>} 指纹哈希
     */
    static async readPixelsAndHash(canvas) {
        try {
            const gl = this.getContext(canvas);
            if (!gl) throw new Error('无法获取WebGL上下文');

            const buffer = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
            gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight,
                gl.RGBA, gl.UNSIGNED_BYTE, buffer);

            const hashBuffer = await CryptoUtils.hash(buffer.buffer);
            return CryptoUtils.buf2hex(hashBuffer);

        } catch (error) {
            console.error('读取像素数据时出错:', error);
            throw error;
        }
    }

    /**
     * 收集WebGL基础信息
     * @param {WebGLRenderingContext} gl WebGL上下文
     * @returns {Object} WebGL信息
     */
    static collectBasicInfo(gl) {
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

    /**
     * 创建透视投影矩阵
     * @param {number} fovy 视野角度
     * @param {number} aspect 宽高比
     * @param {number} near 近平面
     * @param {number} far 远平面
     * @returns {Float32Array} 投影矩阵
     */
    static createPerspectiveMatrix(fovy, aspect, near, far) {
        const f = 1 / Math.tan(fovy / 2);
        const nf = 1 / (near - far);

        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, -1,
            0, 0, 2 * far * near * nf, 0
        ]);
    }

    /**
     * 创建平移矩阵
     * @param {number} x X轴平移
     * @param {number} y Y轴平移
     * @param {number} z Z轴平移
     * @returns {Float32Array} 平移矩阵
     */
    static createTranslationMatrix(x, y, z) {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1
        ]);
    }

    /**
     * 检测WebGL支持情况
     * @param {HTMLCanvasElement} canvas Canvas元素
     * @returns {Object} 支持情况
     */
    static detectSupport(canvas) {
        const gl = this.getContext(canvas);
        
        return {
            basicSupport: !!gl,
            experimentalSupport: !!canvas.getContext('experimental-webgl'),
            readPixelsSupport: !!(gl && gl.readPixels)
        };
    }
}

// 导出工具类
window.WebGLUtils = WebGLUtils;
