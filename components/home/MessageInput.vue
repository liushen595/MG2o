<template>
    <view class="message-input-container" :class="{ 'keyboard-active': keyboardVisible }">
        <view class="input-wrapper" :class="{ 'keyboard-active': keyboardVisible }">
            <!-- 音频可视化区域 (录音时替换文本输入区域) -->
            <view v-if="isRecording" class="audio-visualizer-area">
                <view class="visualizer-bars">
                    <view v-for="(height, index) in audioVisualizerData" :key="index" class="visualizer-bar"
                        :style="{ height: height + '%' }">
                    </view>
                </view>
                <view v-if="isCancelRecording" class="cancel-tip">
                    <view class="cancel-icon"></view>
                    <text>松开手指，取消发送</text>
                </view>
            </view>

            <!-- 文本输入区域 -->
            <view v-else class="text-input-area">
                <textarea class="message-input" v-model="messageTextModel" placeholder="输入消息..."
                    :disabled="!isConnected" auto-height maxlength="500" show-confirm-bar="false"
                    :adjust-position="true" confirm-type="send" @confirm="sendMessage" @focus="handleInputFocus"
                    @blur="handleInputBlur" @click="handleTextAreaClick" />
            </view> <!-- 功能按键区域 -->
            <view class="function-buttons-area" :class="getCurrentModeClass()">
                <!-- 普通状态：左侧加号 + 右侧说话/发送按钮 -->
                <template v-if="inputState === 'initial' || inputState === 'textInput'">
                    <!-- 左侧加号 -->
                    <view class="left-button-area">
                        <!-- <button class="camera-btn" @click="handleCameraClick">
                            <image class="camera-icon" src="../icons/相册.jpg" mode="aspectFit" />
                        </button> -->
                        <button v-if="inputState !== 'voiceReady'" class="plus-btn" @click="handlePlusClick">
                            <view class="plus-icon"></view>
                            +
                        </button>
                    </view>
                    <!-- 右侧说话/发送按钮 -->
                    <view class="right-button-area">
                        <button class="text-btn" :class="hasText ? 'send-mode' : 'mic-mode'" :disabled="!isConnected"
                            @click="handleRightButtonClick">
                            {{ hasText ? '发送' : '说话' }}
                        </button>
                    </view>
                </template>

                <!-- 录音准备状态：全宽度按钮 -->
                <template v-else>
                    <button class="voice-ready-btn" :class="{ recording: isRecording }" :disabled="!isConnected"
                        @touchstart="startTouchRecording" @touchmove="touchMoveRecording" @touchend="endTouchRecording"
                        @touchcancel="cancelTouchRecording">
                        {{ isRecording ? '松开发送' : '按住说话' }}
                    </button>
                </template>
            </view>
        </view>
    </view>
</template>

<script setup>
    import { defineProps, defineEmits, computed, ref, nextTick } from 'vue';
    import imageService from '../../utils/image-service.js';
    const props = defineProps({
        messageText: {
            type: String,
            default: ''
        },
        isConnected: {
            type: Boolean,
            default: false
        },
        isRecording: {
            type: Boolean,
            default: false
        },
        isCancelRecording: {
            type: Boolean,
            default: false
        },
        audioVisualizerData: {
            type: Array,
            default: () => Array(12).fill(20)
        }
    });

    const emit = defineEmits([
       'update:messageText',
        'send',
        'touchStart',
        'touchMove', 
        'touchEnd',
        'touchCancel',
        'keyboard-show',    
        'keyboard-hide',    
        'keyboard-height-change', 
        'image-sent'
    ]);

    // 输入状态：'initial', 'textInput', 'voiceReady'
    const inputState = ref('initial');
    const keyboardVisible = ref(false);

    const messageTextModel = computed({
        get: () => props.messageText,
        set: (value) => emit('update:messageText', value)
    });

    // 是否有文本内容
    const hasText = computed(() => {
        return messageTextModel.value && messageTextModel.value.trim().length > 0;
    });
    function handleCameraClick() {
               
    }
    // 获取当前模式的CSS类
    function getCurrentModeClass() {
        switch (inputState.value) {
            case 'initial':
                return 'initial-state';
            case 'textInput':
                return 'initial-state';
            case 'voiceReady':
                return 'voice-ready-state';
            default:
                return 'initial-state';
        }
    }

    // 处理文本区域点击
    function handleTextAreaClick() {
        if (inputState.value === 'voiceReady') {
            inputState.value = 'initial';
        }
    }    // 处理输入框获得焦点
    function handleInputFocus() {
        keyboardVisible.value = true;
        emit('keyboard-show'); // 通知父组件
    
    uni.onKeyboardHeightChange(res => {
        if (res.height > 0) {
            const heightInPx = res.height + 'px';
            document.documentElement.style.setProperty('--keyboard-height', heightInPx);
            // 通知父组件键盘高度变化
            emit('keyboard-height-change', res.height);
        } else {
            document.documentElement.style.setProperty('--keyboard-height', '0px');
            emit('keyboard-height-change', 0);
        }
    });
}

    // 处理输入框失去焦点
    function handleInputBlur() {
        keyboardVisible.value = false;
        emit('keyboard-hide'); // 通知父组件
        document.documentElement.style.setProperty('--keyboard-height', '0px');

        if (inputState.value === 'textInput' && !hasText.value) {
            inputState.value = 'initial';
        }
    }

    // 处理加号按钮点击
    function handlePlusClick() {
        // 预留功能，暂时无操作
        console.log('加号按钮已按下, 但目前相关功能还未开发');
         uni.chooseImage({
            count: 1,
            sourceType: ['album'],
            success: async (res) => {
                const tempFilePath = res.tempFilePaths[0];
                
                // 显示加载提示
                uni.showLoading({
                    title: '图片处理中...'
                });
                
                try {
                    const result = await imageService.uniProcessImage(tempFilePath);
                    
                    // 隐藏加载提示
                    uni.hideLoading();
                    
                    // 触发图片消息事件，传递完整的图片信息
                    emit('image-sent', {
                        type: 'image',
                        url: result.filename,
                        description: result.description,
                        localPath: tempFilePath, // 保留本地预览路径
                        mimeType: result.mimeType,
                        model: result.model
                    });
                    
                } catch (error) {
                    uni.hideLoading();
                    uni.showToast({
                        title: error.message || '图片上传失败',
                        icon: 'none'
                    });
                }
            },
            fail: (err) => {
                console.error('选择图片失败:', err);
                uni.showToast({
                    title: '选择图片失败',
                    icon: 'none'
                });
            }
        });
    }    // 处理右侧按钮点击（麦克风/发送按钮）
    function handleRightButtonClick() {
        if (hasText.value) {
            // 发送消息
            sendMessage();
        } else {
            // 切换到录音模式
            if (keyboardVisible.value) {
                // 如果键盘是弹出状态，先收起键盘
                hideKeyboard();
                // 延迟切换到录音模式，确保键盘完全收起
                setTimeout(() => {
                    inputState.value = 'voiceReady';
                }, 100);
            } else {
                inputState.value = 'voiceReady';
            }
        }
    }

    // 隐藏键盘
    function hideKeyboard() {
        uni.hideKeyboard();
        keyboardVisible.value = false;
    }

    // 发送消息
    function sendMessage() {
        if (!messageTextModel.value.trim() || !props.isConnected) return;
        emit('send');
        // 发送后重置状态
        if (!keyboardVisible.value) {
            inputState.value = 'initial';
        }
    }

    // 录音相关事件处理
    function startTouchRecording(e) {
        emit('touchStart', e);
    }

    function touchMoveRecording(e) {
        emit('touchMove', e);
    } function endTouchRecording() {
        emit('touchEnd');
        // 录音结束后始终重置为初始状态
        setTimeout(() => {
            inputState.value = 'initial';
        }, 300); // 短暂延迟，让录音动画完成
    }

    function cancelTouchRecording() {
        emit('touchCancel');
        // 取消录音后始终重置为初始状态
        setTimeout(() => {
            inputState.value = 'initial';
        }, 300); // 短暂延迟，让录音动画完成
    }
       
</script>

<style lang="scss" scoped>
    @import './MessageInput.scss';
</style>
