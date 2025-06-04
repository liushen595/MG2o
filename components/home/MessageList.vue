<template>
    <scroll-view class="conversation" scroll-y="true" :scroll-with-animation="true" :scroll-into-view="lastMessageId"
        @scroll="onScroll" :enable-back-to-top="true" :scroll-anchoring="true">
        <view class="conversation-inner">
            <view v-for="(msg, index) in messages" :key="index" class="message" :class="{ user: msg.isUser }"
                :id="'msg-' + index">
                <text>{{ msg.text }}</text>
            </view>
            <FollowUp 
                v-if="followUpQuestions.length > 0"class="follow-up-wrapper"
                :follow-up-questions="followUpQuestions"
                :show-follow-up="showFollowUp"
                @send-follow-up="$emit('send-follow-up', $event)"
                @toggle-follow-up="$emit('toggle-follow-up')"
            />
            <!-- 加载动画 -->
            <view v-if="isLoading" class="loading-container">
                <view class="loading-dots">
                    <view class="dot dot1"></view>
                    <view class="dot dot2"></view>
                    <view class="dot dot3"></view>
                </view>
            </view>
        </view>

        <!-- 新消息提示 -->
        <view v-if="isUserScrolling && hasNewMessage" class="new-message-tip" @click="scrollToBottom">
            <text>有新消息</text>
            <view class="arrow-down">↓</view>
        </view>
    </scroll-view>
</template>

<script setup>
    import { defineProps, defineEmits } from 'vue';
    import FollowUp from "../home/FollowUpQuestions.vue";
    defineProps({
        messages: {
            type: Array,
            default: () => []
        },
        lastMessageId: {
            type: String,
            default: ''
        },
        isLoading: {
            type: Boolean,
            default: false
        },
        isUserScrolling: {
            type: Boolean,
            default: false
        },
        hasNewMessage: {
            type: Boolean,
            default: false
        },
        followUpQuestions: {
            type: Array,
            default: () => []
        },
        showFollowUp: {
            type: Boolean,
            default: false
        }
    });

    const emit = defineEmits(['scroll', 'scrollToBottom']);

    function onScroll(e) {
        emit('scroll', e);
    }

    function scrollToBottom() {
        emit('scrollToBottom');
    }
</script>

<style scoped>
    .follow-up-wrapper {
            position: sticky;
            bottom: 20rpx;
            z-index: 2;
            background: linear-gradient(to bottom, transparent 0%, white 30%);
            padding-top: 40rpx;
            margin-top: -20rpx;
    }
    .conversation {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #fff;
        border-radius: 16rpx;
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
        border: 1rpx solid #eaeaea;
        padding-bottom: 0 !important; /* 移除滚动条的padding */
    }

    /* 隐藏滚动条 */
    .conversation ::-webkit-scrollbar {
        display: none;
        width: 0 !important;
        height: 0 !important;
        -webkit-appearance: none;
        background: transparent;
        padding-bottom: 240rpx;
    }

    .conversation-inner {
        padding: 20rpx 20rpx 240rpx 20rpx;
        min-height: 100%;
        display: flex;
        flex-direction: column;
    }

    .message {
        max-width: 85%;
        padding: 18rpx 24rpx;
        border-radius: 18rpx;
        margin-bottom: 24rpx;
        word-break: break-word;
        position: relative;
        line-height: 1.5;
        font-size: 28rpx;
        box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
        animation: fadeIn 0.3s ease;
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

    .message.user {
        background-color: #e3f2fd;
        margin-left: auto;
        text-align: right;
        border-bottom-right-radius: 4rpx;
        color: #0d47a1;
    }

    .message:not(.user) {
        background-color: #f5f5f5;
        margin-right: auto;
        border-bottom-left-radius: 4rpx;
        color: #333;
    }

    .message.user::after {
        content: '';
        position: absolute;
        bottom: 0;
        right: -10rpx;
        width: 0;
        height: 0;
        border-left: 10rpx solid transparent;
        border-right: 10rpx solid transparent;
        border-bottom: 15rpx solid #e3f2fd;
        transform: rotate(0deg);
    }

    .message:not(.user)::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: -10rpx;
        width: 0;
        height: 0;
        border-left: 10rpx solid transparent;
        border-right: 10rpx solid transparent;
        border-bottom: 15rpx solid #f5f5f5;
        transform: rotate(0deg);
    }

    /* 加载动画容器 */
    .loading-container {
        margin-right: auto;
        margin-bottom: 24rpx;
        padding: 16rpx 48rpx 16rpx 24rpx;
        left: -10rpx;
        background-color: #f5f5f5;
        border-radius: 16rpx;
        display: flex;
        align-items: center;
        height: auto;
        min-height: 60rpx;
        animation: fadeIn 0.3s ease;
        box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
    }

    /* 加载点容器 */
    .loading-dots {
        display: flex;
        align-items: center;
        gap: 10rpx;
    }

    /* 单个点样式 */
    .dot {
        width: 12rpx;
        height: 12rpx;
        border-radius: 50%;
        background-color: #1890ff;
        opacity: 0.6;
    }

    /* 三个点的动画延迟 */
    .dot1 {
        animation: bounce 1.4s infinite ease-in-out;
    }

    .dot2 {
        animation: bounce 1.4s infinite ease-in-out 0.2s;
    }

    .dot3 {
        animation: bounce 1.4s infinite ease-in-out 0.4s;
    }

    /* 弹跳效果动画 */
    @keyframes bounce {

        0%,
        100% {
            transform: translateY(0);
        }

        50% {
            transform: translateY(-10rpx);
        }
    }

    /* 新消息提示 */
    .new-message-tip {
        position: absolute;
        bottom: 20rpx;
        right: 20rpx;
        background-color: #1890ff;
        color: white;
        padding: 12rpx 20rpx;
        border-radius: 25rpx;
        font-size: 26rpx;
        display: flex;
        align-items: center;
        gap: 8rpx;
        box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.3);
        z-index: 10;
        cursor: pointer;
        transition: all 0.3s ease;
        animation: newMessagePulse 2s infinite;
    }

    .new-message-tip:active {
        transform: scale(0.95);
        background-color: #096dd9;
    }

    .arrow-down {
        font-size: 20rpx;
        font-weight: bold;
        animation: arrowBounce 1s infinite;
    }

    @keyframes newMessagePulse {

        0%,
        100% {
            box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.3);
        }

        50% {
            box-shadow: 0 6rpx 20rpx rgba(24, 144, 255, 0.5);
        }
    }

    @keyframes arrowBounce {

        0%,
        100% {
            transform: translateY(0);
        }

        50% {
            transform: translateY(3rpx);
        }
    }
</style>
