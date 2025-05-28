<template>
    <view class="container">
        <view class="logo-container">
            <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
            <text class="app-title">苏博导智能体</text>
        </view>

        <view class="status-box" :class="{ 'success-box': isLocationVerified, 'error-box': locationError }">
            <view class="centered-content">
                <view class="location-status"
                    :class="{ 'location-denied': locationError, 'location-allowed': isLocationVerified }">
                    <text>{{ locationStatusText }}</text>
                </view>
                <view class="location-details" v-if="locationDetails">
                    <text>{{ locationDetails }}</text>
                </view>
                <button class="location-btn" :disabled="isCheckingLocation" @click="verifyUserLocation">
                    {{ locationBtnText }}
                </button>
            </view>
        </view>
    </view>
</template>

<script setup>
    import { onLoad, onShow, onHide } from '@dcloudio/uni-app';
    import { ref } from 'vue';
    import locationService from '../../utils/location-service.js';

    // 位置验证相关数据
    const isLocationVerified = ref(false);  //验证成功状态
    const isCheckingLocation = ref(false);  //防止重复点击
    const locationError = ref(false);       //错误状态
    const locationStatusText = ref('请验证您的位置'); //状态提示文字
    const locationDetails = ref('此应用只能在特定地点使用');
    const locationBtnText = ref('验证位置'); //错误信息和按钮文字
    const currentLocation = ref(null); //存储位置信息

    // 页面加载时执行
    onLoad(() => {
        console.log('位置验证页面已加载');
    });

    // 页面显示时触发
    onShow(() => {
        // 每次页面显示时尝试验证位置
        verifyUserLocation();
    });

    // 验证用户位置
    async function verifyUserLocation() {
        if (isCheckingLocation.value) return;

        isCheckingLocation.value = true;
        locationStatusText.value = '正在验证位置...';
        locationBtnText.value = '验证中...';

        try {
            const result = await locationService.validateUserLocation();

            isCheckingLocation.value = false;

            if (result.success) {
                isLocationVerified.value = true;
                locationError.value = false;
                locationStatusText.value = '位置验证成功';
                locationDetails.value = result.message;
                currentLocation.value = result.location;

                // 延迟一段时间，显示成功信息后再跳转
                setTimeout(() => {
                    // 位置验证成功，跳转到主页
                    uni.reLaunch({
                        url: '/pages/index/index',
                        success: () => {
                            console.log('导航到主页成功');
                        },
                        fail: (err) => {
                            console.error('导航到主页失败:', err);
                        }
                    });
                }, 1500);
            } else {
                isLocationVerified.value = false;
                locationError.value = true;
                locationStatusText.value = '位置验证失败';
                locationDetails.value = result.message;
                locationBtnText.value = '重试';

                // 如果是权限问题，提示用户打开设置
                if (result.needPermission) {
                    uni.showModal({
                        title: '需要位置权限',
                        content: '请在设置中开启位置权限以使用本应用',
                        confirmText: '去设置',
                        success: (res) => {
                            if (res.confirm) {
                                locationService.openSetting().then(result => {
                                    if (result) {
                                        verifyUserLocation();
                                    }
                                });
                            }
                        }
                    });
                }
            }
        } catch (error) {
            isCheckingLocation.value = false;
            isLocationVerified.value = false;
            locationError.value = true;
            locationStatusText.value = '位置验证出错';
            locationDetails.value = '无法获取位置信息，请检查权限设置';
            locationBtnText.value = '重试';
            console.error('位置验证错误:', error);
        }
    }
</script>

<style scoped>
    .container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background-color: #f5f7fa;
        padding: 30rpx;
    }

    .logo-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 60rpx;
    }

    .logo {
        width: 180rpx;
        height: 180rpx;
        margin-bottom: 20rpx;
    }

    .app-title {
        font-size: 40rpx;
        font-weight: bold;
        color: #333;
    }

    .status-box {
        width: 90%;
        padding: 40rpx;
        border-radius: 20rpx;
        background-color: #fff;
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
    }

    .success-box {
        background-color: #f6ffed;
        border: 1px solid #b7eb8f;
    }

    .error-box {
        background-color: #fff2f0;
        border: 1px solid #ffccc7;
    }

    .centered-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    .location-status {
        font-size: 34rpx;
        font-weight: bold;
        margin-bottom: 20rpx;
        color: #555;
    }

    .location-allowed {
        color: #52c41a;
    }

    .location-denied {
        color: #ff4d4f;
    }

    .location-details {
        font-size: 28rpx;
        margin-bottom: 30rpx;
        color: #666;
        line-height: 1.5;
    }

    .location-btn {
        background-color: #1890ff;
        color: white;
        padding: 20rpx 60rpx;
        border-radius: 10rpx;
        font-size: 30rpx;
        border: none;
        margin-top: 20rpx;
        transition: all 0.3s;
    }

    .location-btn:active {
        background-color: #096dd9;
        transform: scale(0.98);
    }

    .location-btn[disabled] {
        background-color: #d9d9d9;
        color: rgba(0, 0, 0, 0.25);
    }
</style>
