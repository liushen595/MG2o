<template>
    <view class="status-box" :class="{ 'success-box': isLocationVerified, 'error-box': locationError }" v-if="show">
        <view class="centered-content">
            <view class="location-status"
                :class="{ 'location-denied': locationError, 'location-allowed': isLocationVerified }">
                <text>{{ locationStatusText }}</text>
            </view>
            <view class="location-details" v-if="locationDetails">
                <text>{{ locationDetails }}</text>
            </view>
            <button class="location-btn" :disabled="isCheckingLocation" @click="$emit('verify')">
                {{ locationBtnText }}
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
        min-height: 300rpx;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 40rpx;
    }

    .centered-content {
        width: 100%;
        text-align: center;
    }

    .status-box.hide {
        max-height: 0;
        opacity: 0;
        padding: 0;
        margin: 0;
    }

    .location-status {
        font-size: 36rpx;
        margin-bottom: 30rpx;
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
    }

    .location-btn {
        width: 60%;
        min-width: 240rpx;
        max-width: 400rpx;
        height: 80rpx;
        line-height: 80rpx;
        border-radius: 40rpx;
        background: #1890ff;
        color: white;
        font-size: 32rpx;
        margin: 0 auto 20rpx;
        transition: all 0.3s;
    }

    /* 状态框样式 */
    .success-box {
        background: #f6ffed;
        border: 1px solid #b7eb8f;
    }

    .error-box {
        background: #fff2f0;
        border: 1px solid #ffccc7;
    }

    /* 未验证状态 */
    .status-box:not(.success-box):not(.error-box) {
        background: #fffbe6;
        border: 1px solid #ffe58f;
    }
</style>
