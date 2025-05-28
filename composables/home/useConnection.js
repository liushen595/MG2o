import { ref, watchEffect } from 'vue';
import xiaozhiService from '../../utils/xiaozhi-service.js';

export default function useConnection(initialHandleServerMessage, initialHandleSpeechRecognition, addLog) {
    const serverUrl = ref('wss://huisuda.com/xiaozhi/v1/');
    const isConnected = ref(false);
    const connectionStatusText = ref('未连接');
    const responseTimeoutId = ref(null);
    const responseTimeoutDuration = ref(10000); // 10秒超时

    // 存储回调函数
    let handleServerMessage = initialHandleServerMessage;
    let handleSpeechRecognition = initialHandleSpeechRecognition;

    // 定期同步xiaozhi-service的连接状态
    function syncConnectionState() {
        const serviceIsConnected = xiaozhiService.isConnectedToServer();

        // 如果后端服务状态与当前UI状态不一致，进行更新
        if (serviceIsConnected !== isConnected.value) {
            console.log(`同步连接状态: 从 ${isConnected.value} 更改为 ${serviceIsConnected}`);
            isConnected.value = serviceIsConnected;
            connectionStatusText.value = serviceIsConnected ? '已连接' : '未连接';
            addLog(`连接状态已同步: ${connectionStatusText.value}`, 'info');
        }
    }

    // 每3秒同步一次状态（确保UI状态与后端状态一致）
    setInterval(syncConnectionState, 3000);

    // 允许外部更新回调函数
    function setCallbacks(newHandleServerMessage, newHandleSpeechRecognition) {
        handleServerMessage = newHandleServerMessage;
        handleSpeechRecognition = newHandleSpeechRecognition;
        addLog('已更新回调处理函数', 'info');
    }    // 连接到服务器
    function connectToServer() {
        addLog(`正在连接: ${serverUrl.value}`, 'info');
        connectionStatusText.value = '正在连接...';

        xiaozhiService.connectToServer(
            serverUrl.value,
            // 连接成功回调
            () => {
                console.log('连接服务器成功，更新状态为已连接');
                isConnected.value = true;
                connectionStatusText.value = '已连接';
                addLog('已连接到服务器', 'success');
                // 立即同步状态确保UI一致
                syncConnectionState();
            },
            // 消息接收回调
            (message) => {
                // 每次收到消息也验证连接状态
                syncConnectionState();
                handleServerMessage(message);
            },
            // 连接关闭回调
            () => {
                console.log('连接关闭，更新状态为已断开');
                isConnected.value = false;
                connectionStatusText.value = '已断开';
                addLog('已断开连接', 'info');
            },
            // 错误回调
            (error) => {
                console.log('连接错误:', error);
                isConnected.value = false;
                connectionStatusText.value = '连接错误';
                addLog(`连接错误: ${error}`, 'error');
            },
            // 语音识别结果回调
            (text) => {
                handleSpeechRecognition(text);
            }
        ).catch(error => {
            console.log('连接失败:', error);
            addLog(`连接失败: ${error}`, 'error');
            connectionStatusText.value = '连接失败';
        });
    }    // 断开服务器连接
    function disconnectFromServer() {
        xiaozhiService.disconnectFromServer();
        isConnected.value = false;
        connectionStatusText.value = '未连接';
        addLog('已断开连接', 'info');
    }

    // 重连服务器
    function reconnectServer() {
        console.log('尝试重新连接服务器，当前状态:', isConnected.value ? '已连接' : '未连接');
        addLog('正在重新连接服务器...', 'info');

        // 无论当前状态如何，都先断开再重连
        disconnectFromServer();

        // 等待一段时间确保断开完成
        setTimeout(() => {
            connectToServer();
        }, 1000);
    }

    // 开始响应超时计时器
    function startResponseTimeout() {
        // 清除现有的计时器
        clearResponseTimeout();

        // 设置新的计时器
        responseTimeoutId.value = setTimeout(() => {
            addLog('服务器响应超时', 'error');
        }, responseTimeoutDuration.value);
    }

    // 清除响应超时计时器
    function clearResponseTimeout() {
        if (responseTimeoutId.value) {
            clearTimeout(responseTimeoutId.value);
            responseTimeoutId.value = null;
        }
    }

    // 初始化时立即同步一次状态
    syncConnectionState();

    return {
        serverUrl,
        isConnected,
        connectionStatusText,
        connectToServer,
        disconnectFromServer,
        reconnectServer,
        startResponseTimeout,
        clearResponseTimeout,
        setCallbacks,
        syncConnectionState
    };
}
