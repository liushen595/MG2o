import { ref, nextTick } from 'vue';
import xiaozhiService from '../../utils/xiaozhi-service.js';
import useGlobalSettings from '../useGlobalSettings.js';

export default function useMessages(isConnected, startResponseTimeout, clearResponseTimeout, addLog) {
    const messages = ref([]);
    const messageText = ref('');
    const isLoading = ref(false);
    const lastMessageId = ref('');

    // 滚动检测相关
    const isUserScrolling = ref(false);
    const scrollTimeout = ref(null);
    const lastScrollTop = ref(0);
    const hasNewMessage = ref(false);

    // 语音识别相关
    const speechRecognitionText = ref('');
    const speechRecognitionTimer = ref(null);

    // 使用全局设置管理音色选择
    const { settings, getCurrentVoiceCode } = useGlobalSettings();    // 发送消息
    function sendMessage() {
        if (!messageText.value.trim() || !isConnected.value) return;

        const message = messageText.value.trim();
        addLog(`发送消息: ${message}`, 'info');

        // 添加到消息列表
        addMessage(message, true);

        // 显示加载动画
        isLoading.value = true;

        // 设置响应超时计时器
        startResponseTimeout();

        // 发送到服务器，使用全局设置中的音色
        xiaozhiService.sendTextMessage(message, settings.selectedVoice).catch(error => {
            addLog(`发送失败: ${error}`, 'error');
            // 发送失败时隐藏加载动画
            isLoading.value = false;
            // 清除响应超时计时器
            clearResponseTimeout();
        });

        // 清空输入框
        messageText.value = '';
    }

    // 添加消息到会话记录
    function addMessage(text, isUser = false) {
        messages.value.push({
            text,
            isUser
        });

        // 只有在用户没有手动滚动的情况下才自动滚动到底部
        nextTick(() => {
            if (!isUserScrolling.value) {
                const lastIndex = messages.value.length - 1;
                lastMessageId.value = 'msg-' + lastIndex;
                hasNewMessage.value = false;
            } else {
                // 用户正在滚动时，设置新消息标记
                hasNewMessage.value = true;
            }
        });
    }

    // 处理滚动事件
    function onScroll(e) {
        const currentScrollTop = e.detail.scrollTop;
        // 检测用户是否在主动滚动
        if (Math.abs(currentScrollTop - lastScrollTop.value) > 5) {
            isUserScrolling.value = true;
            // 清除之前的定时器
            if (scrollTimeout.value) {
                clearTimeout(scrollTimeout.value);
            }
            // 1.5秒后重置滚动状态，允许自动滚动
            scrollTimeout.value = setTimeout(() => {
                isUserScrolling.value = false;
            }, 1500);
        }

        lastScrollTop.value = currentScrollTop;

        // 如果用户滚动到接近底部（距离底部小于100px），则重置为自动滚动模式
        const scrollHeight = e.detail.scrollHeight;
        const scrollViewHeight = e.detail.scrollTop + e.detail.clientHeight;
        if (scrollHeight - scrollViewHeight < 100) {
            isUserScrolling.value = false;
            if (scrollTimeout.value) {
                clearTimeout(scrollTimeout.value);
                scrollTimeout.value = null;
            }
        }
    }

    // 手动滚动到底部
    function scrollToBottom() {
        isUserScrolling.value = false;
        hasNewMessage.value = false;
        if (scrollTimeout.value) {
            clearTimeout(scrollTimeout.value);
            scrollTimeout.value = null;
        }

        nextTick(() => {
            if (messages.value.length > 0) {
                const lastIndex = messages.value.length - 1;
                lastMessageId.value = 'msg-' + lastIndex;
            }
        });
    }

    // 处理语音识别结果
    function handleSpeechRecognition(text) {
        if (!text) return;

        addLog(`收到语音识别结果: ${text}`, 'info');

        // 显示语音识别结果
        speechRecognitionText.value = text;

        // 同时添加到消息列表，作为用户消息显示在右侧
        addMessage(text, true);

        // 设置定时器，一段时间后清除语音识别结果显示
        if (speechRecognitionTimer.value) {
            clearTimeout(speechRecognitionTimer.value);
        }

        speechRecognitionTimer.value = setTimeout(() => {
            speechRecognitionText.value = '';
        }, 5000); // 5秒后清除显示
    }

    // 处理服务器消息
    function handleServerMessage(message) {
        // 收到任何服务器消息时，清除响应超时计时器
        clearResponseTimeout();

        if (message.type === 'hello') {
            addLog(`服务器回应: ${message.message}`, 'info');
            // 隐藏加载动画
            isLoading.value = false;
        } else if (message.type === 'tts') {
            if (true) {
                // TTS状态消息
                if (message.state === 'start') {
                    addLog('服务器开始发送语音', 'info');
                } else if (message.state === 'sentence_start') {
                    addLog(`服务器发送语音段: ${message.text}`, 'info');
                    // 添加文本到会话记录，并隐藏加载动画
                    if (message.text) {
                        addMessage(message.text, false);
                        isLoading.value = false;
                    }
                } else if (message.state === 'sentence_end') {
                    addLog(`语音段结束: ${message.text}`, 'info');
                } else if (message.state === 'stop') {
                    addLog('服务器语音传输结束', 'info');
                    // 确保隐藏加载动画
                    isLoading.value = false;
                }
            }
        } else if (message.type === 'stt') {
            // 语音识别结果
            addLog(`识别结果: ${message.text}`, 'info');
        } else if (message.type === 'llm') {
            // 大模型回复
            addLog(`大模型回复: ${message.text}`, 'info');
            // 添加大模型回复到会话记录
            if (message.text && message.text !== '😊') {
                addMessage(message.text, false);
                // 收到回复后隐藏加载动画
                isLoading.value = false;
            }
        } else {
            // 未知消息类型
            addLog(`未知消息类型: ${message.type}`, 'info');
            // 确保隐藏加载动画
            isLoading.value = false;
        }
    }    // 加载设置
    // function loadSettings() {
    //     // 不再需要单独加载设置，因为使用全局状态管理
    //     // 全局设置会自动加载并同步
    // }

    // 清理资源
    function cleanupResources() {
        if (scrollTimeout.value) {
            clearTimeout(scrollTimeout.value);
            scrollTimeout.value = null;
        }

        if (speechRecognitionTimer.value) {
            clearTimeout(speechRecognitionTimer.value);
            speechRecognitionTimer.value = null;
        }
    } return {
        messages,
        messageText,
        isLoading,
        lastMessageId,
        isUserScrolling,
        hasNewMessage,
        speechRecognitionText,
        // 移除 selectedVoice，现在使用全局状态管理
        sendMessage,
        addMessage,
        onScroll,
        scrollToBottom,
        handleSpeechRecognition,
        handleServerMessage,
        // 不再需要单独加载设置
        // loadSettings,
        cleanupResources
    };
}
