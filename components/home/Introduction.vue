<template>
    <!-- 引言显示 -->
    <view v-if="showIntroduction" class="introduction-container">
        <text class="introduction-text">
            <text v-for="(char, index) in charArray" :key="index" class="char"
                :style="{ animationDelay: `${index * 0.1}s` }">
                {{ char }}
            </text>
        </text>
    </view>
</template>
<script setup>
    // 添加 props 声明
    import { defineProps, defineEmits, computed } from 'vue';
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
    });

    // 将文本转换为字符数组
    const charArray = computed(() => {
        return props.text.split('');
    });
</script>
<style scoped>

    /* 添加 scoped 防止样式污染 */
    .introduction-container {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 40rpx 20rpx;
        margin: 0;
        text-align: center;
        animation: fadeIn 1s ease;
        background: none !important;
        box-shadow: none !important;
        border: none !important;
        z-index: 10;
    }

    .introduction-text {
        /* 彻底移除所有背景和边框样式 */
        border: none !important;
        background: none !important;
        padding: 0;
        margin: 0;
        box-shadow: none !important;
        position: relative;
        display: inline-block;
        width: 100%;
    }

    .char {
        display: inline-block;
        font-size: 32rpx;
        color: rgba(24, 144, 255, 0.8);
        margin: 0 2rpx;
        opacity: 0;
        animation: fadeIn 0.5s ease forwards;
        animation-delay: var(--animation-delay, 0s);
        transition: transform 0.3s ease;

        /* 确保文字在最上层 */
        position: relative;
        z-index: 1;
    }

    /* 添加引号装饰 */
    .introduction-text::before,
    .introduction-text::after {
        content: '"';
        position: absolute;
        font-size: 50rpx;
        color: rgba(24, 144, 255, 0.3);
        font-family: Georgia, serif;
        font-weight: bold;
    }

    .introduction-text::before {
        top: -10rpx;
        left: -30rpx;
    }

    .introduction-text::after {
        bottom: -30rpx;
        right: -30rpx;
    }

    @keyframes charFadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }

        to {
            opacity: 1;
            transform: translateY(0);
        }

    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }

        to {
            opacity: 1;
        }
    }
</style>
