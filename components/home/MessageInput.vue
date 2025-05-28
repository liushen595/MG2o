<template>
    <view class="message-input-container">
        <view class="input-wrapper">
            <input class="message-input" v-model="messageTextModel" placeholder="输入消息..." :disabled="!isConnected"
                @confirm="sendMessage" />
            <button class="send-btn" @click="sendMessage" :disabled="!isConnected || !messageTextModel.trim()">
                <view class="send-icon"></view>
            </button>
        </view>
        <button class="record-btn" @touchstart="startTouchRecording" @touchmove="touchMoveRecording"
            @touchend="endTouchRecording" @touchcancel="cancelTouchRecording" :disabled="!isConnected"
            :class="{ recording: isRecording, 'cancel-recording': isCancelRecording }">
            <view class="mic-icon"></view>
            <text>{{ isRecording ? '松开发送' : '按住说话' }}</text>
        </button>
    </view>
</template>

<script setup>
    import { defineProps, defineEmits, computed } from 'vue';

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
        }
    });

    const emit = defineEmits([
        'update:messageText',
        'send',
        'touchStart',
        'touchMove',
        'touchEnd',
        'touchCancel'
    ]);

    const messageTextModel = computed({
        get: () => props.messageText,
        set: (value) => emit('update:messageText', value)
    });

    function sendMessage() {
        if (!messageTextModel.value.trim() || !props.isConnected) return;
        emit('send');
    }

    function startTouchRecording(e) {
        emit('touchStart', e);
    }

    function touchMoveRecording(e) {
        emit('touchMove', e);
    }

    function endTouchRecording() {
        emit('touchEnd');
    }

    function cancelTouchRecording() {
        emit('touchCancel');
    }
</script>

<style scoped>
    .message-input-container {
        display: flex;
        gap: 16rpx;
        margin: 10rpx 0 30rpx 0;
        /* 上右下左边距，增加了上边距和下边距 */
        padding: 0 15rpx;
        /* 增加左右内边距 */
    }

    .input-wrapper {
        flex: 1;
        position: relative;
        display: flex;
        align-items: center;
        background-color: #fff;
        border-radius: 12rpx;
        padding: 0 5rpx 0 20rpx;
        box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.07);
        border: 1rpx solid #e8e8e8;
    }

    .message-input {
        flex: 1;
        padding: 15rpx 0;
        font-size: 28rpx;
        border: none;
        background-color: transparent;
    }

    .send-btn {
        width: 68rpx;
        height: 68rpx;
        border-radius: 35rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #1890ff;
        transition: all 0.3s;
        border: none;
        padding: 0;
        margin: 3rpx;
    }

    .send-btn:active {
        transform: scale(0.95);
        background-color: #096dd9;
    }

    .send-btn[disabled] {
        background-color: #c2c1c1;
        opacity: 0.5;
    }

    .send-icon {
        width: 0;
        height: 0;
        border-top: 10rpx solid transparent;
        border-bottom: 10rpx solid transparent;
        border-left: 16rpx solid white;
        margin-left: 5rpx;
    }

    /* 录音按钮样式 */
    .record-btn {
        min-width: 220rpx;
        height: 74rpx;
        border-radius: 12rpx;
        background-color: #52c41a;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 20rpx;
        gap: 10rpx;
        box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.07);
        border: 1rpx solid #e8e8e8;
        font-size: 28rpx;
        transition: all 0.3s;
    }

    .record-btn:active {
        background-color: #389e0d;
        transform: scale(0.98);
    }

    .record-btn[disabled] {
        background-color: #f5f5f5;
        color: #bbb;
        opacity: 0.5;
    }

    .record-btn.recording {
        background-color: #ff4d4f;
        animation: pulse 1.5s infinite;
    }

    .record-btn.cancel-recording {
        background-color: #ff7875;
    }

    .mic-icon {
        width: 32rpx;
        height: 32rpx;
        border-radius: 50%;
        background-color: white;
        position: relative;
    }

    .mic-icon::before {
        content: '';
        position: absolute;
        width: 16rpx;
        height: 16rpx;
        background-color: currentColor;
        border-radius: 50%;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
    }

    .mic-icon::after {
        content: '';
        position: absolute;
        width: 10rpx;
        height: 10rpx;
        border: 2rpx solid currentColor;
        border-radius: 50%;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        animation: ripple 1.5s infinite;
        opacity: 0;
    }

    .recording .mic-icon::after {
        opacity: 1;
    }

    @keyframes pulse {
        0% {
            background-color: #ff4d4f;
        }

        50% {
            background-color: #ff7875;
        }

        100% {
            background-color: #ff4d4f;
        }
    }

    @keyframes ripple {
        0% {
            width: 0;
            height: 0;
            opacity: 1;
        }

        100% {
            width: 24rpx;
            height: 24rpx;
            opacity: 0;
        }
    }
</style>
