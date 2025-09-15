/**
 * 加密工具类 - 统一管理所有加密相关操作
 */
class CryptoUtils {
    /**
     * SHA-256 哈希计算
     * @param {ArrayBuffer|Uint8Array} buffer 要计算哈希的数据
     * @returns {Promise<ArrayBuffer>} 哈希结果
     */
    static async hash(buffer) {
        return crypto.subtle.digest('SHA-256', buffer);
    }

    /**
     * 将buffer转换为16进制字符串
     * @param {ArrayBuffer} buffer 要转换的buffer
     * @returns {string} 16进制字符串
     */
    static buf2hex(buffer) {
        return Array.from(new Uint8Array(buffer))
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * 计算字符串哈希
     * @param {string} str 要计算哈希的字符串
     * @returns {Promise<string>} 哈希字符串
     */
    static async hashString(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await this.hash(data);
        return this.buf2hex(hashBuffer);
    }

    /**
     * 简单哈希函数 (非加密)
     * @param {string} str 输入字符串
     * @returns {string} 哈希结果
     */
    static simpleHash(str) {
        let hash = 0;
        if (str.length === 0) return hash.toString();

        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }

        return Math.abs(hash).toString(16);
    }

    /**
     * 计算数据熵
     * @param {string} data 输入数据
     * @returns {number} 熵值
     */
    static calculateEntropy(data) {
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

// 导出工具类
window.CryptoUtils = CryptoUtils;
