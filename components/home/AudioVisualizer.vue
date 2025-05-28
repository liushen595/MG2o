<template>
    <view v-if="show" class="audio-visualizer">
        <view class="visualizer-bar" v-for="(value, index) in audioVisualizerData" :key="index"
            :style="{ height: value + '%' }">
        </view>

        <!-- 录音取消提示 -->
        <view v-if="isCancelRecording" class="cancel-recording-tip">
            <view class="cancel-icon"></view>
            <text>松开手指，取消发送</text>
        </view>
    </view>
</template>

<script setup>
    import { defineProps } from 'vue';

    defineProps({
        show: {
            type: Boolean,
            default: false
        },
        audioVisualizerData: {
            type: Array,
            default: () => Array(10).fill(0)
        },
        isCancelRecording: {
            type: Boolean,
            default: false
        }
    });
</script>

<style scoped>
    .audio-visualizer {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        height: 120rpx;
        min-height: 120rpx;
        margin-bottom: 20rpx;
        padding: 15rpx;
        background-color: rgba(255, 255, 255, 0.9);
        border-radius: 16rpx;
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
        border: 1rpx solid #eaeaea;
        animation: fadeIn 0.3s ease;
        position: relative;
    }

    .visualizer-bar {
        width: 9%;
        background: linear-gradient(to top, #52c41a, #1890ff);
        border-radius: 6rpx;
        transition: height 0.1s ease;
    }

    .cancel-recording-tip {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(255, 77, 79, 0.9);
        color: white;
        padding: 10rpx 20rpx;
        border-radius: 8rpx;
        display: flex;
        align-items: center;
        gap: 10rpx;
        font-size: 26rpx;
        animation: fadeIn 0.2s ease;
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
    }

    .cancel-icon {
        width: 28rpx;
        height: 28rpx;
        position: relative;
    }

    .cancel-icon:before,
    .cancel-icon:after {
        content: '';
        position: absolute;
        width: 100%;
        height: 4rpx;
        background-color: white;
        top: 50%;
        left: 0;
    }

    .cancel-icon:before {
        transform: translateY(-50%) rotate(45deg);
    }

    .cancel-icon:after {
        transform: translateY(-50%) rotate(-45deg);
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
