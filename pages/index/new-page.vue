<template>
  <view class="container">
    <text>收藏并扫描此二维码,可再次进入本程序</text>
    <image class="qrcode" src="../index/二维码.jpg"></image>
    <button @click="goBack">返回</button>
  </view>
</template>

<script>
    export default {
        methods: {
            goBack() {
            uni.navigateBack();
            }
        }
    }
</script>
<style>
    .container {
        /* 关键样式：弹性盒子布局 */
        display: flex;
        flex-direction: column;  /* 垂直排列 */
        align-items: center;     /* 水平居中 */
        justify-content: center; /* 垂直居中（如果需要） */
        min-height: 100vh;       /* 确保容器高度撑满屏幕 */
    }
    .qrcode {
        /* 图片样式 */
        width: 300px;           /* 固定宽度 */
        height: 200px;          /* 固定高度 */
        margin: 20px 0;         /* 上下边距 */
        display: block;         /* 转为块级元素 */
    }
    .tip-text {
        margin-bottom: 20px;    /* 文字与图片间距 */
    }
    .back-btn {
        margin-top: 30px;       /* 按钮与图片间距 */
        width: 120px;           /* 按钮宽度 */
    }
</style>
