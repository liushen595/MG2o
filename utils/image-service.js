import { ref, watchEffect } from 'vue';
import useGlobalSettings from '../composables/useGlobalSettings.js';

let websocket = null;
let isConnected = false;
let messageCallbacks = [];
let audioContext = null;

// 音频播放队列
let audioQueue = [];
let isPlaying = false;

// 添加语音识别结果回调
let onSpeechRecognitionCallback = null;

// 获取全局设置实例
const globalSettings = useGlobalSettings();
const { voiceMap, getCurrentVoiceCode } = globalSettings;
const BASE_URL = 'https://huisuda.com/api/v1/process-image/';

export default {
  /**
   * 上传图片到服务器进行处理
   * @param {File} imageFile 图片文件对象
   * @param {object} [options] 附加选项
   * @returns {Promise<object>} 处理结果
   */
    _handleError(error) {
      const errorMap = {
          'AbortError': { code: 408, message: '请求超时，请检查网络连接' },
          'NetworkError': { code: 503, message: '网络连接失败' },
          'TypeError': { code: 400, message: '请求参数错误' }
      };
      
      // 处理 uni.uploadFile 的错误
      if (error.errMsg) {
          if (error.errMsg.includes('timeout')) {
              return { code: 408, message: '上传超时，请重试' };
          }
          if (error.errMsg.includes('network')) {
              return { code: 503, message: '网络错误，请检查网络连接' };
          }
      }
      
      return {
          code: error.code || 500,
          message: errorMap[error.name]?.message || error.message || '图片处理失败',
          original: error
      };
  },
  async processImage(imageFile, options = {}) {
    try {
      // 构造FormData对象
      const formData = new FormData();
      formData.append('image', imageFile);
      
      // 合并请求参数
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          ...getGlobalSettings().apiHeaders // 从全局配置获取公共请求头
        },
        body: formData
      };

      // 添加超时处理
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(BASE_URL, {
        ...requestOptions,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      // 处理响应
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '图片处理失败');
      }

      const result = await response.json();
      return this._validateResponse(result);
    } catch (error) {
      console.error('图片上传失败:', error);
      throw this._handleError(error);
    }
  },

  // 响应数据验证
  _validateResponse(response) {
    const requiredKeys = ['message', 'response', 'filename', 'content_type'];
    if (!requiredKeys.every(key => key in response)) {
      throw new Error('无效的API响应格式');
    }
    
    return {
      success: response.message === '图片处理成功',
      description: response.response,
      filename: response.filename,
      mimeType: response.content_type,
      model: response.model_used || 'unknown'
    };
  },

  // 错误处理
  _handleError(error) {
    const errorMap = {
      AbortError: { code: 408, message: '请求超时' },
      NetworkError: { code: 503, message: '网络连接失败' }
    };
    
    return {
      code: error.code || 500,
      message: errorMap[error.name]?.message || error.message || '未知错误',
      original: error
    };
  },

  /**
   * 兼容UniAPP的上传方法
   * @param {string} tempFilePath 临时文件路径
   * @param {object} [options] 附加选项
   */
  uniProcessImage(tempFilePath, options = {}) {
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: BASE_URL,
        filePath: tempFilePath,
        name: 'image',
        formData: {
          String: '' // 根据截图中的参数要求
        },
        success: (res) => {
          if (res.statusCode !== 200) {
            return reject({ code: res.statusCode, message: '请求失败' });
          }
          try {
            const data = JSON.parse(res.data);
            resolve(this._validateResponse(data));
          } catch (e) {
            reject(this._handleError(e));
          }
        },
        fail: (err) => reject(this._handleError(err))
      });
    });
  }
};
