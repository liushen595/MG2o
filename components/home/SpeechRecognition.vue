<template>
    <view v-if="text" class="speech-recognition-container">
        <view class="speech-recognition-text">
            <text>{{ text }}</text>
            <view class="recognition-icon">
                <view class="mic-small-icon"></view>
            </view>
        </view>
    </view>
</template>

<script setup>
    import { defineProps } from 'vue';

    defineProps({
        text: {
            type: String,
            default: ''
        }
    });
</script>

<style scoped>

    /* 语音识别结果显示样式 */
    .speech-recognition-container {
        background-color: #fff;
        border-radius: 16rpx;
        padding: 15rpx;
        margin-bottom: 20rpx;
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
        border: 1rpx solid #eaeaea;
        animation: fadeIn 0.3s ease;
    }

    .speech-recognition-text {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 10rpx;
        padding: 10rpx;
        background-color: #e3f2fd;
        color: #0d47a1;
        border-radius: 18rpx;
        border-bottom-right-radius: 4rpx;
        font-size: 28rpx;
        box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
        position: relative;
    }

    .speech-recognition-text::after {
        content: '';
        position: absolute;
        bottom: 0;
        right: -10rpx;
        width: 0;
        height: 0;
        border-left: 10rpx solid transparent;
        border-right: 10rpx solid transparent;
        border-bottom: 15rpx solid #e3f2fd;
        transform: rotate(45deg);
    }

    .recognition-icon {
        margin-left: 5rpx;
        opacity: 0.7;
    }

    .mic-small-icon {
        width: 24rpx;
        height: 24rpx;
        border-radius: 50%;
        background-color: #0d47a1;
        position: relative;
    }

    .mic-small-icon::before {
        content: '';
        position: absolute;
        width: 10rpx;
        height: 10rpx;
        background-color: white;
        border-radius: 50%;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10rpx);
        }

        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
