/**
 * 小智语音助手服务
 * 提供WebSocket连接、消息发送和TTS音频播放功能
 * 
 * 基于小智开源项目(MIT协议)修改
 * 原项目版权所有者: 小智开源项目
 * 修改部分版权所有者: 515, 2025
 * 
 * @license MIT
 */

// 导入全局状态管理，获取音色映射
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

// 默认音色 - 使用全局状态管理
let currentVoice = getCurrentVoiceCode();

/**
 * 连接到小智服务器
 * @param {String} url WebSocket服务器地址
 * @param {Function} onConnectCallback 连接成功回调
 * @param {Function} onMessageCallback 消息接收回调
 * @param {Function} onCloseCallback 连接关闭回调
 * @param {Function} onErrorCallback 错误回调 
 * @param {Function} onSpeechRecognition 语音识别结果回调
 * @returns {Promise} 连接结果
 */
// 新增设置音色的方法
const connectToServer = (url, onConnectCallback, onMessageCallback, onCloseCallback, onErrorCallback, onSpeechRecognition) => {
  return new Promise((resolve, reject) => {
    try {
      // 保存语音识别回调函数
      onSpeechRecognitionCallback = onSpeechRecognition
      // 检查URL格式
      if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
        const error = 'URL格式错误，必须以ws://或wss://开头';
        if (onErrorCallback) onErrorCallback(error);
        reject(error);
        return;
      }

      // 添加认证参数
      let connUrl = url;
      if (url.indexOf('?') === -1) {
        connUrl = `${url}?device_id=uniapp_device&device_mac=00:11:22:33:44:55`;
      } else {
        connUrl = `${url}&device_id=uniapp_device&device_mac=00:11:22:33:44:55`;
      }

      // 关闭已存在的连接
      if (websocket) {
        websocket.close();
        websocket = null;
      }

      // 创建WebSocket连接
      websocket = uni.connectSocket({
        url: connUrl,
        success: () => {
          console.log('WebSocket连接创建成功');
        },
        fail: (err) => {
          console.error('WebSocket连接创建失败', err);
          if (onErrorCallback) onErrorCallback(err);
          reject(err);
        }
      });

      // 监听WebSocket连接打开
      websocket.onOpen(() => {
        console.log('WebSocket连接已打开');
        isConnected = true;

        // 发送hello消息
        sendHelloMessage().then(() => {
          if (onConnectCallback) onConnectCallback();
          resolve(true);
        }).catch(err => {
          if (onErrorCallback) onErrorCallback(err);
          reject(err);
        });
      });

      // 监听WebSocket错误
      websocket.onError((err) => {
        console.error('WebSocket错误', err);
        isConnected = false;
        if (onErrorCallback) onErrorCallback(err);
        reject(err);
      });

      // 监听WebSocket关闭
      websocket.onClose(() => {
        console.log('WebSocket连接已关闭');
        isConnected = false;
        if (onCloseCallback) onCloseCallback();
      });

      // 监听WebSocket消息
      websocket.onMessage((res) => {
        try {
          // 检查是否为文本消息
          if (typeof res.data === 'string') {
            const message = JSON.parse(res.data);

            // 处理不同类型的消息
            if (message.type === 'hello') {
              console.log('服务器回应：', message.type);
            } else if (message.type === 'tts') {
              // TTS状态消息
              if (message.state === 'start') {
                console.log('服务器开始发送语音');
              } else if (message.state === 'sentence_start') {
                console.log('服务器发送语音段:', message.text);
                // 处理 base64 MP3数据
                if (message.tts_file) {
                  //             const audioData = atob(message.tts_file.data);

                  //             const arrayBuffer = new ArrayBuffer(audioData.length);
                  //             const uint8Array = new Uint8Array(arrayBuffer);
                  //             for (let i = 0; i < audioData.length; i++) {
                  //               uint8Array[i] = audioData.charCodeAt(i);
                  //             }
                  const arrayBuffer = uni.base64ToArrayBuffer(message.tts_file.data);
                  console.log('收到语音数据，大小:', arrayBuffer.byteLength, '字节');
                  playMP3Data(arrayBuffer);
                }
              } else if (message.state === 'sentence_end') {
                console.log('语音段结束:', message.text);
              } else if (message.state === 'stop') {
                console.log('服务器语音传输结束');
              }
            } else if (message.type === 'stt') {
              // 语音识别结果
              console.log('语音识别结果:', message.text);
              // 如果有语音识别回调，则调用它
              if (onSpeechRecognitionCallback && message.text) {
                onSpeechRecognitionCallback(message.text);
              }
            } else if (message.type === 'llm') {
              // 大模型回复
              console.log('大模型回复:', message.text);
            }

            // 调用消息回调
            if (onMessageCallback) onMessageCallback(message);
          } else {
            // 处理二进制数据 - MP3格式
            handleBinaryMessage(res.data);
          }
        } catch (error) {
          console.error('WebSocket消息处理错误:', error);
        }
      });
    } catch (error) {
      console.error('连接错误:', error);
      if (onErrorCallback) onErrorCallback(error);
      reject(error);
    }
  });
};

/**
 * 发送hello握手消息
 * @returns {Promise} 握手结果
 */
const sendHelloMessage = () => {
  return new Promise((resolve, reject) => {
    if (!websocket || !isConnected) {
      reject('WebSocket未连接');
      return;
    }

    try {
      // 设置设备信息
      const helloMessage = {
        type: 'hello',
        device_id: 'uniapp_device',
        device_name: 'UniApp设备',
        device_mac: '00:11:22:33:44:55',
        token: 'your-token1' // 使用config.yaml中配置的token
      };

      console.log('发送hello握手消息');
      websocket.send({
        data: JSON.stringify(helloMessage),
        success: () => {
          console.log('hello消息发送成功');
          resolve(true);
        },
        fail: (err) => {
          console.error('hello消息发送失败', err);
          reject(err);
        }
      });
    } catch (error) {
      console.error('发送hello消息错误:', error);
      reject(error);
    }
  });
};

/**
 * 断开WebSocket连接
 */
const disconnectFromServer = () => {
  if (websocket) {
    websocket.close();
    websocket = null;
    isConnected = false;
  }
};

/**
 * 发送文本消息
 * @param {String} message 文本消息
 * @param {String} voice 语音音色 
 * @returns {Promise} 发送结果
 */
const sendTextMessage = (message, voiceId = 1) => {
  return new Promise((resolve, reject) => {
    if (!message || !websocket || !isConnected) {
      reject('WebSocket未连接或消息为空');
      return;
    }

    try {      // 获取最新的全局设置实例
      const currentGlobalSettings = useGlobalSettings();

      // 使用全局音色映射
      const selectedVoice = voiceMap[voiceId];

      // 获取当前地区和语言设置
      const currentRegion = currentGlobalSettings.getCurrentRegion();
      const currentLanguageCode = currentGlobalSettings.getCurrentLanguageCode();


      // 构建附加提示文本
      let additionalPrompt = '';
      if (currentRegion && currentRegion.trim() !== '') {
        additionalPrompt += `请结合${currentRegion}的历史和文化`;
      }
      if (currentLanguageCode && currentLanguageCode !== 'zh-CN') {
        if (additionalPrompt) {
          additionalPrompt += `，忽略我提问时使用的语言，请一定使用${currentLanguageCode}对应的语言来回答`;
        } else {
          additionalPrompt += `忽略我提问时使用的语言，请一定使用${currentLanguageCode}对应的语言来回答`;
        }
      }
      if (additionalPrompt) {
        additionalPrompt += '。';
      }

      // 直接发送listen消息
      const listenMessage = {
        type: 'listen',
        mode: 'manual',
        state: 'detect',
        text: message + (additionalPrompt ? ' ' + additionalPrompt : ''),
        voice: selectedVoice // 使用全局状态管理中的音色
      };

      console.log('发送文本消息，使用音色:', selectedVoice);
      console.log('完整消息内容:', listenMessage.text);
      websocket.send({
        data: JSON.stringify(listenMessage),
        success: () => {
          console.log('文本消息发送成功：' + message);
          resolve(true);
        },
        fail: (err) => {
          console.error('文本消息发送失败', err);
          reject(err);
        }
      });
    } catch (error) {
      console.error('发送消息错误:', error);
      reject(error);
    }
  });
};

/**
 * 处理二进制消息
 * @param {ArrayBuffer} data 二进制数据
 */
const handleBinaryMessage = (data) => {
  try {
    // 检查数据类型
    if (data instanceof ArrayBuffer) {
      console.log('收到二进制数据，大小:', data.byteLength, '字节');

      // 检查数据头部，判断是否为MP3数据
      const headerView = new Uint8Array(data, 0, 4);

      // MP3文件通常以ID3标签(ID3v2)开头，或者直接是MP3帧
      // ID3v2标签以'ID3'开头
      const isID3 = headerView[0] === 73 && headerView[1] === 68 && headerView[2] === 51;

      // MP3帧通常以0xFF开头，后面跟着0xE0-0xFF之间的字节
      const isMP3Frame = headerView[0] === 0xFF && (headerView[1] & 0xE0) === 0xE0;

      if (isID3 || isMP3Frame) {
        console.log('检测到MP3数据，准备播放');
        playMP3Data(data);
      } else {
        console.log('收到未知格式的二进制数据');
      }
    } else {
      console.log('收到非ArrayBuffer数据');
    }
  } catch (error) {
    console.error('处理二进制消息错误:', error);
  }
};

/**
 * 播放MP3数据
 * @param {ArrayBuffer} mp3Data MP3数据
 */
const playMP3Data = (mp3Data) => {
  if (!mp3Data || mp3Data.byteLength === 0) {
    console.warn('无效的MP3数据，无法播放');
    return;
  }

  // 将数据加入队列
  audioQueue.push(mp3Data);
  console.log('MP3数据已加入播放队列，当前队列长度:', audioQueue.length);

  // 如果当前没有播放，开始播放
  if (!isPlaying) {
    playNextInQueue();
  }
};

/**
 * 播放队列中的下一个音频
 */
const playNextInQueue = () => {
  if (audioQueue.length === 0) {
    isPlaying = false;
    return;
  }

  isPlaying = true;
  const mp3Data = audioQueue.shift();

  // 使用微信小程序的音频API播放
  const innerAudioContext = uni.createInnerAudioContext();
  // 将ArrayBuffer转换为临时文件
  const fs = wx.getFileSystemManager();
  const tempFilePath = `${uni.env.USER_DATA_PATH}/temp_audio_${Date.now()}.mp3`;
  console.log('创建临时文件路径:', tempFilePath);
  try {
    // 使用异步写入方式替代同步写入，避免iOS平台兼容性问题
    fs.writeFile({
      filePath: tempFilePath,
      data: mp3Data,
      success: () => {
        console.log('开始播放音频:', tempFilePath);
        innerAudioContext.src = tempFilePath;
        innerAudioContext.autoplay = true;
        innerAudioContext.obeyMuteSwitch = false; // 不遵循静音开关
      },
      fail: (error) => {
        console.error('写入音频文件失败:', error);
        isPlaying = false;
        // 播放下一个音频
        playNextInQueue();
      }
    });

    // 注意：由于变成异步写入，下面的代码会被提前执行，所以移到success回调中

    innerAudioContext.onPlay(() => {
      console.log('音频开始播放');
    });

    innerAudioContext.onEnded(() => {
      console.log('音频播放结束');
      innerAudioContext.destroy();

      // 删除临时文件
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {
        console.error('删除临时文件失败:', e);
      }

      // 播放下一个
      playNextInQueue();
    });

    innerAudioContext.onError((err) => {
      console.error('音频播放错误:', err);
      innerAudioContext.destroy();

      // 删除临时文件
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {
        console.error('删除临时文件失败:', e);
      }

      // 播放下一个
      playNextInQueue();
    });
  } catch (error) {
    console.error('创建临时音频文件失败:', error);
    isPlaying = false;
  }
};

/**
 * 检查连接状态
 * @returns {Boolean} 是否已连接
 */
const isConnectedToServer = () => {
  return isConnected;
};

let recorderManager = null; // 录音管理器
let isRecording = false;    // 是否正在录音
let recordFilePath = '';    // 录音文件路径

/**
 * 初始化录音管理器
 * @param {Function} onStartCallback 开始录音回调
 * @param {Function} onStopCallback 停止录音回调
 * @param {Function} onErrorCallback 错误回调
 */
const initRecorder = (onStartCallback, onStopCallback, onErrorCallback) => {
  if (!recorderManager) {
    recorderManager = uni.getRecorderManager();

    // 监听录音开始事件
    recorderManager.onStart(() => {
      console.log('录音开始');
      isRecording = true;
      if (onStartCallback) onStartCallback();
    });

    // 监听录音结束事件
    recorderManager.onStop((res) => {
      console.log('录音结束', res);
      isRecording = false;
      recordFilePath = res.tempFilePath;

      if (onStopCallback) onStopCallback(res);
    });

    // 监听录音错误事件
    recorderManager.onError((err) => {
      console.error('录音错误', err);
      isRecording = false;
      if (onErrorCallback) onErrorCallback(err);
    });
  }

  return recorderManager;
};

/**
 * 开始录音
 * @param {Object} options 录音选项
 */
const startRecording = (options = {}) => {
  if (!recorderManager) {
    console.error('录音管理器未初始化');
    return false;
  }

  if (isRecording) {
    console.warn('已经在录音中');
    return false;
  }

  // 默认录音设置 - 调整参数以提高MP3兼容性
  const defaultOptions = {
    duration: 30000, // 最长录音时间缩短为30秒
    sampleRate: 16000, // 采样率
    numberOfChannels: 1, // 录音通道数
    encodeBitRate: 32000, // 降低比特率，提高兼容性
    format: 'mp3', // 音频格式
    frameSize: 50 // 指定帧大小，单位KB
  };

  // 合并用户选项
  const recordOptions = { ...defaultOptions, ...options };

  try {
    recorderManager.start(recordOptions);
    return true;
  } catch (error) {
    console.error('开始录音失败:', error);
    return false;
  }
};

/**
 * 停止录音并发送到服务器
 * @param {Function} progressCallback 上传进度回调
 * @param {Number} voiceId 音色ID
 * @returns {Promise} 上传结果
 */
const stopRecordingAndSend = (progressCallback, voiceId) => {
  return new Promise((resolve, reject) => {
    if (!recorderManager || !isRecording) {
      reject('没有正在进行的录音');
      return;
    }

    // 重置录音文件路径，确保获取到最新的录音
    recordFilePath = '';

    // 停止录音
    recorderManager.stop();

    // 等待onStop回调获取录音文件路径
    const maxWaitTime = 5000; // 最长等待5秒
    const startTime = Date.now();

    const checkRecordFile = () => {
      // 检查是否已经得到录音文件
      if (recordFilePath) {
        console.log('获取到录音文件路径:', recordFilePath);

        // 确保获得文件后立即发送，避免被下一个录音覆盖
        const currentFilePath = recordFilePath;

        sendAudioFile(currentFilePath, progressCallback, voiceId)
          .then(resolve)
          .catch(reject);
      } else {
        // 检查是否超时
        if (Date.now() - startTime > maxWaitTime) {
          reject('获取录音文件超时');
          return;
        }

        // 继续等待
        setTimeout(checkRecordFile, 100);
      }
    };

    checkRecordFile();
  });
};

/**
 * 发送音频文件到服务器
 * @param {String} filePath 音频文件路径
 * @param {Function} progressCallback 上传进度回调
 * @returns {Promise} 上传结果
 */
const sendAudioFile = (filePath, progressCallback, voiceId = 1) => {
  return new Promise((resolve, reject) => {
    if (!websocket || !isConnected) {
      reject('WebSocket未连接');
      return;
    } console.log('准备发送音频文件:', filePath);    // 获取最新的全局设置实例
    const currentGlobalSettings = useGlobalSettings();

    // 使用全局音色映射
    const selectedVoice = voiceMap[voiceId];
    currentVoice = selectedVoice;
    console.log('当前音色设置为:', currentVoice);

    // 获取当前地区和语言设置
    const currentRegion = currentGlobalSettings.getCurrentRegion();
    const currentLanguageCode = currentGlobalSettings.getCurrentLanguageCode();

    // 调试信息 - sendAudioFile
    console.log('=== sendAudioFile 调试信息 ===');
    console.log('currentGlobalSettings:', currentGlobalSettings);
    console.log('getCurrentRegion 类型:', typeof currentGlobalSettings.getCurrentRegion);
    console.log('getCurrentLanguageCode 类型:', typeof currentGlobalSettings.getCurrentLanguageCode);
    console.log('currentRegion:', currentRegion);
    console.log('currentLanguageCode:', currentLanguageCode);
    console.log('currentLanguageCode 类型:', typeof currentLanguageCode);

    // 构建附加提示文本
    let additionalPrompt = '';
    if (currentRegion && currentRegion.trim() !== '') {
      additionalPrompt += `请结合${currentRegion}的历史和文化`;
    }
    if (currentLanguageCode && currentLanguageCode !== 'zh-CN') {
      if (additionalPrompt) {
        additionalPrompt += `，忽略我提问时使用的语言，请一定使用${currentLanguageCode}对应的语言来回答`;
      } else {
        additionalPrompt += `忽略我提问时使用的语言，请一定使用${currentLanguageCode}对应的语言来回答`;
      }
    }
    if (additionalPrompt) {
      additionalPrompt += '。';
    }

    try {
      // 1. 发送录音开始信号 - 使用标准的listen协议消息格式
      const listenStartMessage = {
        type: 'listen',
        mode: 'manual',
        state: 'start',
        format: 'mp3',
        voice: selectedVoice, // 使用全局状态管理中的音色
        address: additionalPrompt
      };
      // 使用JSON.stringify()序列化消息
      const startData = JSON.stringify(listenStartMessage);

      // 直接使用websocket对象发送文本消息
      websocket.send({
        data: startData,
        success: () => {
          console.log('发送录音开始信号成功');

          // 2. 读取音频文件内容
          uni.getFileSystemManager().readFile({
            filePath,
            success: (res) => {
              // 这里获取的是ArrayBuffer格式的音频数据
              const audioData = res.data;

              // 3. 发送二进制音频数据 - 这是关键部分
              websocket.send({
                data: audioData, // 直接发送ArrayBuffer
                // 不加任何额外参数
                success: () => {
                  console.log('发送音频数据成功，大小:', audioData.byteLength, '字节');
                  // 4. 发送录音结束信号
                  const listenEndMessage = {
                    type: 'listen',
                    mode: 'manual',
                    state: 'stop',
                    format: 'mp3',
                    voice: selectedVoice // 使用全局状态管理中的音色
                  };
                  console.log('发送录音结束信号，使用音色:', listenEndMessage.voice);

                  // 增加一点延迟再发送结束信号
                  setTimeout(() => {
                    // 结束信号也需要JSON序列化
                    websocket.send({
                      data: JSON.stringify(listenEndMessage),
                      success: () => {
                        console.log('发送录音结束信号成功');
                        resolve(true);
                      },
                      fail: (err) => {
                        console.error('发送录音结束信号失败:', err);
                        reject(err);
                      }
                    });
                  }, 3000); // 3000ms延迟，确保服务器有时间处理音频数据
                },
                fail: (err) => {
                  console.error('发送音频数据失败:', err);
                  reject(err);
                }
              });
            },
            fail: (err) => {
              console.error('读取音频文件失败:', err);
              reject(err);
            }
          });
        },
        fail: (err) => {
          console.error('发送录音开始信号失败:', err);
          reject(err);
        }
      });
    } catch (error) {
      console.error('发送音频过程出错:', error);
      reject(error);
    }
  });
};

/**
 * 检查是否正在录音
 * @returns {Boolean} 是否正在录音
 */
const isCurrentlyRecording = () => {
  return isRecording;
};

/**
 * 重置录音状态
 */
const resetRecordingState = () => {
  isRecording = false;
};

export default {
  connectToServer,
  disconnectFromServer,
  sendTextMessage,
  isConnectedToServer,
  initRecorder,
  startRecording,
  stopRecordingAndSend,
  isCurrentlyRecording,
  resetRecordingState,
};