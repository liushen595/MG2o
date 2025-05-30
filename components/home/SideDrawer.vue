<template>
    <view>
        <view class="drawer-overlay" :class="{ show: showDrawer }" @click="closeDrawer"></view>
        <view class="drawer" :class="{ show: showDrawer }">
            <view class="drawer-header">
                <view class="">
                    <image class="drawer-logo" src="/static/logo.png" mode="aspectFit"></image>
                </view>
                <view><text class="drawer-title">苏博导智能体</text></view>
            </view>
            <view class="drawer-menu">
                <view class="menu-item active" @click="navigateToPage('voice-assistant')">
                    <text class="menu-icon">🎙️</text>
                    <text class="menu-text">语音助手</text>
                </view>
                <view class="menu-item" @click="navigateToPage('settings')">
                    <text class="menu-icon">⚙️</text>
                    <text class="menu-text">设置</text>
                </view>
                <view class="menu-item" @click="navigateToPage('share')">
                    <text class="menu-icon">📤</text>
                    <text class="menu-text">分享</text>
                </view>
                <view class="menu-item" @click="navigateToPage('about')">
                    <text class="menu-icon">ℹ️</text>
                    <text class="menu-text">关于</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
    import { defineProps, defineEmits } from 'vue';

    const props = defineProps({
        showDrawer: {
            type: Boolean,
            default: false
        }
    });

    const emit = defineEmits(['update:showDrawer', 'navigate']);

    function closeDrawer() {
        emit('update:showDrawer', false);
    }

    function navigateToPage(page) {
        emit('navigate', page);
    }
</script>

<style scoped>

    /* 侧拉导航栏样式 */
    .drawer-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 400;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    }

    .drawer-overlay.show {
        opacity: 1;
        visibility: visible;
    }

    .drawer {
        position: fixed;
        top: 0;
        left: -600rpx;
        width: 600rpx;
        height: 100%;
        background-color: #fff;
        z-index: 401;
        transition: left 0.3s ease;
        box-shadow: 2rpx 0 8rpx rgba(0, 0, 0, 0.1);
    }

    .drawer.show {
        left: 0;
    }

    /* 侧拉导航栏头部 */
    .drawer-header {
        padding: 80rpx 20rpx 40rpx;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }

    .drawer-logo {
        width: 100rpx;
        height: 100rpx;
        border-radius: 5rpx;
    }

    .drawer-title {
        font-size: 36rpx;
        font-weight: bold;
        margin-bottom: 100rpx;
    }

    /* 侧拉导航栏菜单 */
    .drawer-menu {
        padding: 40rpx 0;
    }

    .menu-item {
        display: flex;
        align-items: center;
        padding: 30rpx 40rpx;
        border-bottom: 1rpx solid #f0f0f0;
        transition: background-color 0.2s;
    }

    .menu-item:active {
        background-color: #f5f5f5;
    }

    .menu-item.active {
        background-color: #e6f7ff;
        border-right: 6rpx solid #1890ff;
    }

    .menu-icon {
        font-size: 40rpx;
        margin-right: 30rpx;
        width: 40rpx;
        text-align: center;
    }

    .menu-text {
        font-size: 32rpx;
        color: #333;
        font-weight: 500;
    }

    .menu-item.active .menu-text {
        color: #1890ff;
    }
</style>
