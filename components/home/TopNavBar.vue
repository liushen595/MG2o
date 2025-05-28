<template>
    <view class="top-nav">
        <view class="nav-left" @click="$emit('openDrawer')">
            <text class="menu-btn">☰</text>
        </view>
        <text class="nav-title">苏博导智能体</text>
        <view class="nav-right">
            <view class="connection-indicator" :class="{ connected: isConnected }" @click="$emit('reconnect')">
                <text class="status-dot"></text>
                <text class="status-text">{{ connectionStatusText }}</text>
            </view>
        </view>
    </view>
</template>

<script setup>
    import { defineProps, defineEmits } from 'vue';

    defineProps({
        isConnected: {
            type: Boolean,
            default: false
        },
        connectionStatusText: {
            type: String,
            default: '未连接'
        }
    });

    defineEmits(['openDrawer', 'reconnect']);
</script>

<style scoped>

    /* 顶部导航栏 */
    .top-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 100rpx;
        padding: 0 20rpx;
        background-color: #fff;
        border-radius: 16rpx;
        margin: 20rpx 0 10rpx 0;
        /* 调整上下边距 */
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
        z-index: 10;
        /* 确保导航栏在最上层 */
    }

    .nav-left {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        background-color: #f5f5f5;
        transition: background-color 0.2s;
    }

    .nav-left:active {
        background-color: #e8e8e8;
    }

    .menu-btn {
        font-size: 36rpx;
        color: #333;
    }

    .nav-title {
        font-size: 36rpx;
        font-weight: bold;
        color: #333;
    }

    .nav-right {
        display: flex;
        align-items: center;
    }

    /* 连接状态指示器 */
    .connection-indicator {
        display: flex;
        align-items: center;
        padding: 8rpx 16rpx;
        border-radius: 20rpx;
        background-color: #fff2f0;
        border: 1rpx solid #ffccc7;
        transition: all 0.2s;
    }

    .connection-indicator.connected {
        background-color: #f6ffed;
        border-color: #b7eb8f;
    }

    .connection-indicator:active {
        transform: scale(0.95);
    }

    .status-dot {
        width: 12rpx;
        height: 12rpx;
        border-radius: 50%;
        background-color: #ff4d4f;
        margin-right: 8rpx;
    }

    .connection-indicator.connected .status-dot {
        background-color: #52c41a;
    }

    .status-text {
        font-size: 24rpx;
        color: #ff4d4f;
    }

    .connection-indicator.connected .status-text {
        color: #52c41a;
    }
</style>
