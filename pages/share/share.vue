<template>
    <view class="container">
        <text>收藏并扫描此二维码,可再次进入本程序</text>
        <image class="qrcode" src="/static/二维码.jpg" show-menu-by-longpress></image>
        <button class="back-btn" @click="goBack">返回</button>
    </view>
</template>

<script setup>
    // uni-app 组合式 API 生命周期钩子
    import { onLoad, onShow } from '@dcloudio/uni-app';

    // 返回上一页
    function goBack() {
        uni.navigateBack();
    }

    // 页面加载时执行（只执行一次）
    onLoad(() => {
        console.log('分享页面已加载');
    });

    // 页面显示时执行（每次进入页面都会执行）
    onShow(() => {
        console.log('分享页面已显示');
    });
</script>

<style scoped>
    .container {
        /* 关键样式：弹性盒子布局 */
        display: flex;
        flex-direction: column;
        /* 垂直排列 */
        align-items: center;
        /* 水平居中 */
        justify-content: center;
        /* 垂直居中（如果需要） */
        min-height: 100vh;
        /* 确保容器高度撑满屏幕 */
    }

    .qrcode {
        /* 图片样式 */
        width: 300px;
        /* 固定宽度 */
        height: 200px;
        /* 固定高度 */
        margin: 20px 0;
        /* 上下边距 */
        display: block;
        /* 转为块级元素 */
    }

    .tip-text {
        margin-bottom: 20px;
        /* 文字与图片间距 */
    }

    .back-btn {
        margin-top: 30px;
        /* 按钮与图片间距 */
        width: 120px;
        /* 按钮宽度 */
    }
</style>
