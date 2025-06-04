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
    // 追问相关状态
    const followUpQuestions = ref([]);
    const showFollowUp = ref(false);
    // 发送追问问题
    function sendFollowUpQuestion(question) {
        // 添加到消息列表
        addMessage(question, true);
        
        // 显示加载动画
        isLoading.value = true;
        
        // 设置响应超时计时器
        startResponseTimeout();
        
        // 发送到服务器，使用全局设置中的音色
        xiaozhiService.sendTextMessage(question, settings.selectedVoice).catch(error => {
            addLog(`发送失败: ${error}`, 'error');
            isLoading.value = false;
            clearResponseTimeout();
        });
        
        // 清空追问问题
        followUpQuestions.value = [];
        showFollowUp.value = false;
    }
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
         // 如果是用户消息，自动展开追问
            if(isUser) {
                showFollowUp.value = true;
            }
        // 只有在用户没有手动滚动的情况下才自动滚动到底部
        nextTick(() => {
            if (!isUserScrolling.value) {
                const lastIndex = messages.value.length - 1;
                lastMessageId.value = 'msg-' + lastIndex;
                hasNewMessage.value = false;
                scrollToBottom();
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
                setTimeout(() => {
                uni.pageScrollTo({
                    scrollTop: 9999999,
                    duration: 300
                });
            }, 100);
            }
        });
    }    // 处理语音识别结果
    function handleSpeechRecognition(text) {
        if (!text) return;

        addLog(`收到语音识别结果: ${text}`, 'info');

        // 直接添加到消息列表，作为用户消息显示在右侧
        addMessage(text, true);
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
        } else if (message.type === 'follow_up_questions') {
            // 追问问题处理
            addLog(`收到追问问题: ${message.questions}`, 'info');
            
            // 解析追问问题（支持换行符和问号分隔）
                let questions = [];
                if (message.questions) {
                    if (Array.isArray(message.questions)) {
                        questions = message.questions;
                    } else {
                        // 尝试用换行符分割
                        questions = message.questions.split('$');
                        // 如果分割后只有1个元素，尝试用问号分割
                        if (questions.length === 1) {
                            questions = message.questions.split('?').filter(q => q.trim());
                            // 给每个问题添加问号
                            questions = questions.map(q => q.trim() + '?');
                        }
                    }
                }
            
                // 存储追问问题
                followUpQuestions.value = questions;
                // 默认显示追问区域
                showFollowUp.value = true;
                
                // 确保隐藏加载动画
                isLoading.value = false;
        }else {
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
    function toggleFollowUp() {
        showFollowUp.value = !showFollowUp.value;
    }
    // 清理资源
    function cleanupResources() {
        if (scrollTimeout.value) {
            clearTimeout(scrollTimeout.value);
            scrollTimeout.value = null;
        }
    } return {
        messages,
        messageText,
        isLoading,
        lastMessageId,
        isUserScrolling,
        hasNewMessage,
        // 移除 selectedVoice，现在使用全局状态管理
        sendMessage,
        addMessage,
        onScroll,
        scrollToBottom,
        handleSpeechRecognition,
        handleServerMessage,
        // 不再需要单独加载设置
        // loadSettings,
        cleanupResources,
        followUpQuestions,
        showFollowUp,
        sendFollowUpQuestion,
        toggleFollowUp
    };
}
