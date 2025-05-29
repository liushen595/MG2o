<template>
    <!-- 引言显示 -->
    <view v-if="showIntroduction" class="introduction-container">
        <text class="introduction-text">{{ text }}</text>
    </view>
</template>
<script setup>
    // 添加 props 声明
    import { defineProps, defineEmits } from 'vue';
    const props = defineProps({
    text: {
        type: String,
        required: true
    },
    // 声明 showIntroduction 属性
    showIntroduction: {
        type: Boolean,
        required: true
    }
})
</script>
<style scoped> /* 添加 scoped 防止样式污染 */
    .introduction-container {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 40rpx;
        margin: 50rpx 0;
        text-align: center;
        animation: fadeIn 1s ease;
            
        /* 确保容器足够高 */
        min-height: 150rpx;
    }

    .introduction-text {
        /* 保持其他样式不变 */
        
        /* 简化背景实现 */
        background: 
            linear-gradient(135deg, #f5f7fa 0%, #e4edf9 100%);
        border: 1px solid rgba(24, 144, 255, 0.2);
        position: relative;
        overflow: visible;
    }

        /* 添加引号装饰 */
        .introduction-text::before,
        .introduction-text::after {
        content: "";
        position: absolute;
        font-size: 60rpx;
        color: rgba(24, 144, 255, 0.3);
        font-family: serif;
    }

        .introduction-text::before {
        top: -20rpx;
        left: 10rpx;
    }

        .introduction-text::after {
        bottom: -40rpx;
        right: 10rpx;
        transform: rotate(180deg);
    }

    @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
    }
</style>