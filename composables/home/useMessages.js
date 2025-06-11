// useMessages.js
import { ref, nextTick } from 'vue';
import xiaozhiService from '../../utils/xiaozhi-service.js';
import useGlobalSettings from '../useGlobalSettings.js';
import imageService from '../../utils/image-service.js';

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

    // 追问相关状态
    const followUpQuestions = ref([]);
    const showFollowUp = ref(false);

    // 获取全局设置实例 - 直接使用 reactive 对象
    const { settings } = useGlobalSettings();
    // 发送追问问题
    function sendFollowUpQuestion(question) {
        // 添加到消息列表
        addMessage(question, true);

        // 显示加载动画
        isLoading.value = true;

        // 设置响应超时计时器
        startResponseTimeout();

        // 构建完整消息 - 直接使用 reactive 对象的属性
        const fullMessage = question + (settings.additionalPrompt ? ' ' + settings.additionalPrompt : '');

        xiaozhiService.sendTextMessage(fullMessage, settings.smartVoice).catch(error => {
            addLog(`发送失败: ${error}`, 'error');
            isLoading.value = false;
            clearResponseTimeout();
        });

        // 清空追问问题
        followUpQuestions.value = [];
        showFollowUp.value = false;
    }

    // 发送消息
    function sendMessage() {
        if (!messageText.value.trim() || !isConnected.value) return;

        const message = messageText.value.trim();
        addLog(`发送消息: ${message}`, 'info');

        // 添加到消息列表
        addMessage(message, true);

        // 清空追问问题
        followUpQuestions.value = [];
        showFollowUp.value = false;
        isLoading.value = true;
        startResponseTimeout();

        // 构建完整消息 - 直接使用 reactive 对象的属性
        const fullMessage = message + (settings.additionalPrompt ? ' ' + settings.additionalPrompt : '');

        xiaozhiService.sendTextMessage(fullMessage, settings.smartVoice).catch(error => {
            addLog(`发送失败: ${error}`, 'error');
            isLoading.value = false;
            clearResponseTimeout();
        });

        messageText.value = '';
    }

    // 添加消息到会话记录
    function addMessage(content, isUser = false, type = "text") {
        const messageIndex = messages.value.length; // 获取即将添加的消息索引
        const messageObj = {
            id: 'msg-' + messageIndex, // 修复：使用与模板一致的ID格式
            type,
            isUser,
            timestamp: Date.now(),
            content,
            status: 'sent'
        };

        // 如果是图片消息，添加图片相关属性
        if (type === 'image') {
            messageObj.imageUrl = content.url;
            messageObj.description = content.description;
            messageObj.localPath = content.localPath;
            messageObj.mimeType = content.mimeType;
            messageObj.model = content.model;
        }

        messages.value.push(messageObj);

        // 如果是用户消息，自动展开追问
        if (isUser) {
            showFollowUp.value = true;
        }
        // 修复：自动滚动到底部
        nextTick(() => {
            if (!isUserScrolling.value) {
                lastMessageId.value = 'bottom-anchor'; // 使用底部锚点而不是消息ID
                hasNewMessage.value = false;
            } else {
                hasNewMessage.value = true;
            }
        });
    }

    // 修改：处理图片消息 - 图片显示在用户侧，AI回复文本显示在机器人侧
    function handleImageMessage(imageData) {
        addLog(`收到图片消息: ${imageData.description}`, 'info');

        // 添加用户发送的图片消息（显示在右侧用户侧）
        addMessage(imageData, true, 'image');

        // 清空追问问题
        followUpQuestions.value = [];
        showFollowUp.value = false;        // 自动让AI对图片进行回复
        if (isConnected.value && imageData.description) {
            // 显示加载动画
            isLoading.value = true;
            startResponseTimeout();

            // 发送图片描述给AI进行语音回复
            // 这里直接发送描述文本，AI会返回纯文本回复
            const imagePrompt = imageData.description;

            // 构建完整消息 - 直接使用 reactive 对象的属性
            const fullMessage = imagePrompt + (settings.additionalPrompt ? ' ' + settings.additionalPrompt : '');

            xiaozhiService.sendTextMessage(fullMessage, settings.smartVoice).catch(error => {
                addLog(`发送图片描述失败: ${error}`, 'error');
                isLoading.value = false;
                clearResponseTimeout();

                // 显示错误提示
                uni.showToast({
                    title: 'AI回复失败，请重试',
                    icon: 'none'
                });
            });
        }
    }

    // 处理滚动事件
    function onScroll(e) {
        const currentScrollTop = e.detail.scrollTop;
        const scrollHeight = e.detail.scrollHeight;
        const scrollViewHeight = e.detail.clientHeight;

        // 检查是否接近底部（容差范围内）
        const isNearBottom = scrollHeight - (currentScrollTop + scrollViewHeight) < 150;

        if (isNearBottom) {
            // 如果接近底部，不认为是用户滚动
            isUserScrolling.value = false;
            hasNewMessage.value = false;
            if (scrollTimeout.value) {
                clearTimeout(scrollTimeout.value);
                scrollTimeout.value = null;
            }
        } else if (Math.abs(currentScrollTop - lastScrollTop.value) > 10) {
            // 只有在远离底部且滚动距离超过阈值时才认为是用户滚动
            isUserScrolling.value = true;
            if (scrollTimeout.value) {
                clearTimeout(scrollTimeout.value);
            }
            scrollTimeout.value = setTimeout(() => {
                isUserScrolling.value = false;
            }, 2000); // 延长超时时间
        }

        lastScrollTop.value = currentScrollTop;
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
                // 简化滚动逻辑，直接设置到最后一条消息或底部锚点
                lastMessageId.value = 'bottom-anchor';
            }
        });
    }

    // 处理语音识别结果
    function handleSpeechRecognition(text) {
        if (!text) return;
        addLog(`收到语音识别结果: ${text}`, 'info');
        addMessage(text, true);
        followUpQuestions.value = [];
        showFollowUp.value = false;
    }

    // 处理服务器消息 - 确保机器人回复只显示纯文本
    function handleServerMessage(message) {
        clearResponseTimeout();

        if (message.type === 'hello') {
            addLog(`服务器回应: ${message.message}`, 'info');
            isLoading.value = false;
        } else if (message.type === 'tts') {
            if (message.state === 'start') {
                addLog('服务器开始发送语音', 'info');
            } else if (message.state === 'sentence_start') {
                addLog(`服务器发送语音段: ${message.text}`, 'info');
                if (message.text) {
                    // 机器人回复添加为纯文本消息，显示在左侧
                    addMessage(message.text, false, 'text');
                    isLoading.value = false;
                }
            } else if (message.state === 'sentence_end') {
                addLog(`语音段结束: ${message.text}`, 'info');
            } else if (message.state === 'stop') {
                addLog('服务器语音传输结束', 'info');
                isLoading.value = false;
            }
        } else if (message.type === 'stt') {
            addLog(`识别结果: ${message.text}`, 'info');
        } else if (message.type === 'llm') {
            addLog(`大模型回复: ${message.text}`, 'info');
            if (message.text && message.text !== '😊') {
                // 机器人回复添加为纯文本消息，显示在左侧
                addMessage(message.text, false, 'text');
                isLoading.value = false;
            }
        } else if (message.type === 'follow_up_questions') {
            addLog(`收到追问问题: ${message.questions}`, 'info');

            let questions = [];
            if (message.questions) {
                if (Array.isArray(message.questions)) {
                    questions = message.questions;
                } else {
                    questions = message.questions.split('$');
                    if (questions.length === 1) {
                        questions = message.questions.split('?').filter(q => q.trim());
                        questions = questions.map(q => q.trim() + '?');
                    }
                }
            }
            followUpQuestions.value = questions;
            showFollowUp.value = true;
            isLoading.value = false;
            nextTick(() => {
                setTimeout(() => {
                    // 使用底部锚点确保追问区域可见
                    lastMessageId.value = 'bottom-anchor';
                }, 100);
            });

        } else {
            addLog(`未知消息类型: ${message.type}`, 'info');
            isLoading.value = false;
        }
    }

    function toggleFollowUp() {
        showFollowUp.value = !showFollowUp.value;
    }

    // 清理资源
    function cleanupResources() {
        if (scrollTimeout.value) {
            clearTimeout(scrollTimeout.value);
            scrollTimeout.value = null;
        }
    }

    return {
        messages,
        messageText,
        isLoading,
        lastMessageId,
        isUserScrolling,
        hasNewMessage,
        sendMessage,
        addMessage,
        onScroll,
        scrollToBottom,
        handleSpeechRecognition,
        handleServerMessage,
        cleanupResources,
        followUpQuestions,
        showFollowUp,
        sendFollowUpQuestion,
        toggleFollowUp,
        handleImageMessage
    };
}
