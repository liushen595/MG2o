import { ref } from 'vue';
import xiaozhiService from '../../utils/xiaozhi-service.js';

export default function useAudioRecording(isConnected, selectedVoice, startResponseTimeout, clearResponseTimeout, addLog) {
    const isRecording = ref(false);
    const audioVisualizerData = ref(Array(10).fill(0));
    const visualizerTimer = ref(null);
    const recordingTimeout = ref(null);

    // 触摸录音相关
    const touchStartY = ref(0);
    const isCancelRecording = ref(false);
    const cancelDistance = ref(100); // 上滑多少距离取消录音（单位rpx）
    const recordStartTime = ref(0);
    const minRecordDuration = ref(1000); // 最短录音时长(毫秒)
    const isValidRecording = ref(false);
    const isInquiry = ref(false);

    // 初始化录音功能
    function initRecording() {
        xiaozhiService.initRecorder(
            // 开始录音回调
            () => {
                addLog('录音开始', 'info');
                // 开始模拟音频可视化数据
                startAudioVisualization();
            },
            // 停止录音回调
            (res) => {
                addLog(`录音结束，文件路径: ${res.tempFilePath}`, 'info');
                addLog(`录音时长: ${res.duration}ms，文件大小: ${res.fileSize}字节`, 'info');

                // 发送录音文件到服务器
                sendRecordFile(res.tempFilePath);
            },
            // 错误回调
            (err) => {
                addLog(`录音错误: ${JSON.stringify(err)}`, 'error');
                isRecording.value = false;
            }
        );
    }

    // 开始录音
    function startRecording() {
        if (!isConnected.value) {
            addLog('请先连接到服务器', 'error');
            return;
        }

        addLog('正在启动录音...', 'info');

        // 配置录音参数
        const options = {
            duration: 60000, // 最长60秒
            sampleRate: 16000, // 采样率16kHz，符合服务器要求
            numberOfChannels: 1, // 单声道
            encodeBitRate: 64000, // 编码比特率
            format: 'mp3', // 输出格式，使用mp3确保良好兼容性
            frameSize: 50 // 指定帧大小
        };

        const success = xiaozhiService.startRecording(options);
        if (!success) {
            addLog('录音启动失败', 'error');
            isRecording.value = false;
        } else {
            isRecording.value = true;
            // 启动录音超时保护
            recordingTimeout.value = setTimeout(() => {
                if (isRecording.value) {
                    stopRecording();
                }
            }, 60000);
        }
    }

    // 停止录音
    function stopRecording() {
        if (!isRecording.value) return;

        addLog('正在停止录音...', 'info');

        // 立即将录音状态设为false，防止需要点击两次按钮
        isRecording.value = false;

        // 清除录音超时
        if (recordingTimeout.value) {
            clearTimeout(recordingTimeout.value);
            recordingTimeout.value = null;
        }

        // 停止可视化
        stopAudioVisualization();

        // 定义进度回调函数
        const progressCallback = (progress) => {
            addLog(`上传进度: ${Math.round(progress * 100)}%`, 'info');
        };

        // 停止录音并发送
        xiaozhiService.stopRecordingAndSend(progressCallback, selectedVoice.value)
            .catch(error => {
                addLog(`录音停止错误: ${error}`, 'error');
            });
    }

    // 发送录音文件到服务器
    function sendRecordFile(filePath) {
        addLog('正在准备发送录音文件...', 'info');

        startResponseTimeout(); // 开始响应超时计时器

        // 定义进度回调函数
        const progressCallback = (progress) => {
            addLog(`上传进度: ${progress}%`, 'info');
        };

        // 使用xiaozhi-service的统一接口发送录音
        xiaozhiService.sendAudioFile(filePath, progressCallback, selectedVoice.value)
            .then(() => {
                addLog('音频数据发送成功', 'success');
            })
            .catch(error => {
                addLog(`音频发送失败: ${error}`, 'error');
                clearResponseTimeout();
            });
    }

    // 开始音频可视化
    function startAudioVisualization() {
        // 清除现有的可视化定时器
        stopAudioVisualization();

        // 创建一个新的可视化定时器，模拟音频可视化效果
        visualizerTimer.value = setInterval(() => {
            // 创建随机波形数据
            audioVisualizerData.value = Array(10).fill(0).map(() => {
                return Math.random() * 80 + 20; // 20-100之间的随机数
            });
        }, 100); // 每100ms更新一次
    }

    // 停止音频可视化
    function stopAudioVisualization() {
        if (visualizerTimer.value) {
            clearInterval(visualizerTimer.value);
            visualizerTimer.value = null;
        }
        audioVisualizerData.value = Array(10).fill(0); // 重置可视化数据
    }

    // 触摸开始录音（按下）
    function startTouchRecording(e) {
        if (!isConnected.value) {
            addLog('请先连接到服务器', 'error');
            return;
        }

        // 如果已经在录音，先停止之前的录音
        if (isRecording.value || xiaozhiService.isCurrentlyRecording()) {
            stopRecording();
            return;
        }

        // 记录开始触摸的Y坐标和时间戳
        touchStartY.value = e.touches[0].clientY;
        isCancelRecording.value = false;
        recordStartTime.value = Date.now();
        isValidRecording.value = false;

        addLog('正在启动录音...', 'info');

        // 配置录音参数
        const options = {
            duration: 60000, // 最长60秒
            sampleRate: 16000, // 采样率16kHz
            numberOfChannels: 1, // 单声道
            encodeBitRate: 64000, // 编码比特率
            format: 'mp3', // 输出格式
            frameSize: 50 // 帧大小
        };

        const success = xiaozhiService.startRecording(options);
        if (!success) {
            isRecording.value = false;
        } else {
            isRecording.value = true;
        }
    }

    // 触摸移动（检测是否上滑取消）
    function touchMoveRecording(e) {
        if (!isRecording.value) return;

        const currentY = e.touches[0].clientY;
        const moveDistance = touchStartY.value - currentY;

        // rpx 转 px 的近似转换
        const cancelDistancePx = cancelDistance.value * (uni.getSystemInfoSync().windowWidth / 750);

        // 判断是否满足取消条件（上滑超过指定距离）
        isCancelRecording.value = moveDistance > cancelDistancePx;
    }

    // 触摸结束录音（松开）
    function endTouchRecording() {
        if (!isRecording.value) return;

        const recordDuration = Date.now() - recordStartTime.value;

        // 如果是取消录音状态，则取消录音
        if (isCancelRecording.value) {
            cancelRecording();
            return;
        }

        // 判断是否为有效录音（时长大于最小值）
        if (recordDuration < minRecordDuration.value) {
            addLog('录音时间太短，已取消', 'info');
            cancelRecording();
            return;
        }

        // 正常结束录音并发送
        finishRecording();
        stopRecording();
    }

    // 取消触摸录音（触摸被取消，如来电等）
    function cancelTouchRecording() {
        if (isRecording.value) {
            cancelRecording();
        }
    }

    // 取消录音
    function cancelRecording() {
        uni.vibrateShort();
        xiaozhiService.cancelRecording();
        isRecording.value = false;
        stopAudioVisualization();
        addLog('录音已取消', 'info');
    }

    // 完成录音并发送
    function finishRecording() {
        uni.vibrateShort();
        isValidRecording.value = true;
        addLog('录音完成，准备发送', 'info');
    }

    // 清理资源
    function cleanupResources() {
        stopAudioVisualization();

        if (recordingTimeout.value) {
            clearTimeout(recordingTimeout.value);
            recordingTimeout.value = null;
        }
    }

    return {
        isRecording,
        audioVisualizerData,
        isCancelRecording,
        initRecording,
        startRecording,
        stopRecording,
        startTouchRecording,
        touchMoveRecording,
        endTouchRecording,
        cancelTouchRecording,
        cleanupResources
    };
}
