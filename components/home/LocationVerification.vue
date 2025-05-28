<template>
    <view class="status-box" :class="{ 'success-box': isLocationVerified, 'error-box': locationError }" v-if="show">
        <view class="centered-content">
            <view class="status-icon" :class="{
                'success-icon': isLocationVerified,
                'error-icon': locationError,
                'waiting-icon': !isLocationVerified && !locationError
            }"></view>
            <view class="location-status"
                :class="{ 'location-denied': locationError, 'location-allowed': isLocationVerified }">
                <text>{{ locationStatusText }}</text>
            </view>
            <view class="location-details" v-if="locationDetails">
                <text>{{ locationDetails }}</text>
            </view>
            <button class="location-btn" :class="{ 'checking': isCheckingLocation }" :disabled="isCheckingLocation"
                @click="$emit('verify')">
                <text class="btn-text">{{ locationBtnText }}</text>
                <text class="loading-icon" v-if="isCheckingLocation"></text>
            </button>
        </view>
    </view>
</template>

<script setup>
    import { defineProps, defineEmits } from 'vue';

    defineProps({
        show: {
            type: Boolean,
            required: true
        },
        isLocationVerified: {
            type: Boolean,
            default: false
        },
        isCheckingLocation: {
            type: Boolean,
            default: false
        },
        locationError: {
            type: Boolean,
            default: false
        },
        locationStatusText: {
            type: String,
            default: '请验证您的位置'
        },
        locationDetails: {
            type: String,
            default: '此应用只能在特定地点使用'
        },
        locationBtnText: {
            type: String,
            default: '验证位置'
        }
    });

    defineEmits(['verify']);
</script>

<style scoped>

    /* 位置验证样式 */
    .status-box {
        position: relative;
        min-height: 320rpx;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 40rpx 30rpx;
        border-radius: 24rpx;
        box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.08);
        margin: 20rpx 0;
        transition: all 0.3s ease;
        overflow: hidden;
    }

    .centered-content {
        width: 100%;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .status-box.hide {
        max-height: 0;
        opacity: 0;
        padding: 0;
        margin: 0;
    }

    /* 状态图标 */
    .status-icon {
        width: 90rpx;
        height: 90rpx;
        border-radius: 50%;
        margin-bottom: 30rpx;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .status-icon:before,
    .status-icon:after {
        content: '';
        position: absolute;
    }

    .success-icon {
        background-color: rgba(82, 196, 26, 0.1);
    }

    .success-icon:before {
        width: 40rpx;
        height: 20rpx;
        border-left: 6rpx solid #52c41a;
        border-bottom: 6rpx solid #52c41a;
        transform: rotate(-45deg);
        margin-top: -6rpx;
    }

    .error-icon {
        background-color: rgba(255, 77, 79, 0.1);
    }

    .error-icon:before,
    .error-icon:after {
        width: 50rpx;
        height: 6rpx;
        background-color: #ff4d4f;
        border-radius: 3rpx;
    }

    .error-icon:before {
        transform: rotate(45deg);
    }

    .error-icon:after {
        transform: rotate(-45deg);
    }

    .waiting-icon {
        background-color: rgba(24, 144, 255, 0.1);
    }

    .waiting-icon:before {
        width: 40rpx;
        height: 40rpx;
        border: 6rpx solid #1890ff;
        border-radius: 50%;
    }

    .waiting-icon:after {
        width: 12rpx;
        height: 24rpx;
        background-color: #1890ff;
        top: 20rpx;
        left: 50%;
        transform: translateX(16rpx);
    }

    .location-status {
        font-size: 38rpx;
        font-weight: 600;
        margin-bottom: 20rpx;
        line-height: 1.4;
        color: #1890ff;
    }

    .location-allowed {
        color: #52c41a;
    }

    .location-denied {
        color: #ff4d4f;
    }

    .location-details {
        font-size: 28rpx;
        color: #666;
        line-height: 1.6;
        padding: 0 40rpx;
        margin-bottom: 30rpx;
        max-width: 520rpx;
    }

    .location-btn {
        width: 70%;
        min-width: 240rpx;
        max-width: 400rpx;
        height: 90rpx;
        line-height: 90rpx;
        border-radius: 45rpx;
        background: linear-gradient(135deg, #40a9ff, #1890ff);
        color: white;
        font-size: 32rpx;
        margin: 10rpx auto 20rpx;
        transition: all 0.3s;
        box-shadow: 0 8rpx 16rpx rgba(24, 144, 255, 0.3);
        position: relative;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
        border: none;
    }

    .location-btn:active {
        transform: translateY(2rpx);
        box-shadow: 0 4rpx 8rpx rgba(24, 144, 255, 0.2);
    }

    .location-btn:disabled {
        opacity: 0.7;
        background: linear-gradient(135deg, #91d5ff, #1890ff);
    }

    .location-btn.checking {
        background: linear-gradient(135deg, #91d5ff, #69c0ff);
    }

    .loading-icon {
        display: inline-block;
        width: 36rpx;
        height: 36rpx;
        margin-left: 16rpx;
        border: 3rpx solid rgba(255, 255, 255, 0.5);
        border-top: 3rpx solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }

        100% {
            transform: rotate(360deg);
        }
    }

    /* 状态框样式 */
    .success-box {
        background: linear-gradient(to bottom right, #f6ffed, #ffffff);
        border: 1px solid #b7eb8f;
    }

    .error-box {
        background: linear-gradient(to bottom right, #fff2f0, #ffffff);
        border: 1px solid #ffccc7;
    }

    /* 未验证状态 */
    .status-box:not(.success-box):not(.error-box) {
        background: linear-gradient(to bottom right, #e6f7ff, #ffffff);
        border: 1px solid #91d5ff;
    }

    /* 添加动画和过渡效果 */
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20rpx);
        }

        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .status-box {
        animation: fadeIn 0.4s ease-out;
    }

    .btn-text {
        position: relative;
        z-index: 1;
    }
</style>
