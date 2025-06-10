<template>
    <scroll-view 
       class="conversation" 
        scroll-y="true" 
        :scroll-with-animation="true" 
        :scroll-into-view="lastMessageId"
        :enhanced="true"
        :enable-back-to-top="true" 
        :scroll-anchoring="true"
        :style="{ height: '100%' }"
        @scroll="onScroll"
        @scrolltolower="handleScrollToLower"
    >
        <view class="conversation-inner">
            <view v-for="(msg, index) in messages" :key="msg.id || index" class="message" :class="{ user: msg.isUser }"
                :id="'msg-' + index">
                <!-- 消息内容保持不变 -->
                <template v-if="msg.isUser">
                    <text v-if="msg.type === 'text' || !msg.type">{{ msg.text || msg.content }}</text>
                    <view v-else-if="msg.type === 'image'" class="image-message-content">
                        <image 
                            :src="msg.localPath || msg.imageUrl" 
                            mode="widthFix"
                            class="message-image"
                            @click="previewImage(msg)"
                            @error="handleImageError(msg, index)"
                        />
                    </view>
                </template>
                <template v-else>
                    <text>{{ msg.text || msg.content }}</text>
                </template>
            </view>
            
            <FollowUp 
                v-if="followUpQuestions.length > 0" 
                class="follow-up-wrapper"
                :follow-up-questions="followUpQuestions" 
                :show-follow-up="showFollowUp"
                @send-follow-up="$emit('send-follow-up', $event)" 
                @toggle-follow-up="$emit('toggle-follow-up')" 
            />
            
            <!-- 加载动画 -->
            <view v-if="isLoading" class="loading-container" id="loading-indicator">
                <view class="loading-dots">
                    <view class="dot dot1"></view>
                    <view class="dot dot2"></view>
                    <view class="dot dot3"></view>
                </view>
            </view>
            
            <!-- 底部占位符，确保内容不被输入框遮挡 -->
            <view class="bottom-placeholder" id="bottom-anchor"></view>
        </view>
        
        <!-- 新消息提示 -->
        <view v-if="isUserScrolling && hasNewMessage" class="new-message-tip" @click="scrollToBottom">
            <text>有新消息</text>
            <view class="arrow-down">↓</view>
        </view>
    </scroll-view>
</template>

<script>
import FollowUp from './FollowUpQuestions';

export default {
    name: 'MessageList',
    components: {
        FollowUp
    },
    props: {
        messages: {
            type: Array,
            default: () => []
        },
        isLoading: {
            type: Boolean,
            default: false
        },
        lastMessageId: {
            type: String,
            default: ''
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
    },
    emits: ['scroll', 'scroll-to-bottom', 'send-follow-up', 'toggle-follow-up'],
    methods: {
        onScroll(e) {
            this.$emit('scroll', e);
        },
        scrollToBottom() {
            this.$emit('scroll-to-bottom');
        },
        // 新增：处理滚动到底部事件
        handleScrollToLower() {
            // 当滚动到底部时，重置用户滚动状态
            this.$emit('scroll-to-bottom');
        },
        previewImage(msg) {
            uni.previewImage({
                urls: [msg.localPath || msg.imageUrl],
                current: 0
            });
        },
        handleImageError(msg, index) {
            console.error(`图片加载失败: ${msg.imageUrl || msg.localPath}`);
            uni.showToast({
                title: '图片加载失败',
                icon: 'none'
            });
        }
    }
};
</script>

<style scoped>
    .conversation {
        flex: 1;
        background-color: #f5f5f5;
        width: 100%;
    }

    .conversation-inner {
        padding: 20rpx;
    }

    /* 新增：底部占位符，确保最后的内容不被输入框遮挡 */
    .bottom-placeholder {
        height: 40rpx; /* 调整这个值来控制底部间距 */
        width: 100%;
    }

    /* 其他样式保持不变 */
    .message {
        margin-bottom: 30rpx;
        display: flex;
        align-items: flex-start;
    }

    .message.user {
        justify-content: flex-end;
    }

    .message.user text,
    .message.user .image-message-content {
        background-color: #007AFF;
        color: white;
        padding: 20rpx 25rpx;
        border-radius: 35rpx;
        max-width: 70%;
        word-wrap: break-word;
        text-align: left;
    }

    .message:not(.user) text {
        background-color: white;
        color: #333;
        padding: 20rpx 25rpx;
        border-radius: 35rpx;
        max-width: 70%;
        word-wrap: break-word;
        border: 1px solid #e0e0e0;
    }

    .image-message-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        background-color: #007AFF !important;
        padding: 15rpx !important;
        border-radius: 20rpx !important;
    }

    .message-image {
        max-width: 100%;
        max-height: 400rpx;
        border-radius: 15rpx;
        margin-bottom: 0;
    }

    .follow-up-wrapper {
        margin-top: 20rpx;
    }

    .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 30rpx 0;
    }

    .loading-dots {
        display: flex;
        align-items: center;
        gap: 8rpx;
    }

    .dot {
        width: 12rpx;
        height: 12rpx;
        border-radius: 50%;
        background-color: #666;
        animation: loading 1.5s infinite ease-in-out;
    }

    .dot2 {
        animation-delay: 0.3s;
    }

    .dot3 {
        animation-delay: 0.6s;
    }

    @keyframes loading {
        0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
        }
        40% {
            transform: scale(1);
            opacity: 1;
        }
    }

    .new-message-tip {
        position: fixed;
        bottom: 200rpx;
        right: 30rpx;
        background-color: #007AFF;
        color: white;
        padding: 15rpx 25rpx;
        border-radius: 50rpx;
        display: flex;
        align-items: center;
        gap: 10rpx;
        font-size: 28rpx;
        box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.3);
        z-index: 100;
    }

    .arrow-down {
        font-size: 24rpx;
        animation: bounce 1s infinite;
    }

    @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
        }
        40% {
            transform: translateY(-5rpx);
        }
        60% {
            transform: translateY(-3rpx);
        }
    }
</style>
