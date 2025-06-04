<template>
  <view v-if="followUpQuestions.length > 0" class="follow-up-container">
    <view class="follow-up-header" @click="toggleShow">
      <text class="follow-up-title">您还可以问：</text>
      <view class="arrow" :class="{ rotated: showFollowUp }">▼</view>
    </view>
    
    <view v-if="showFollowUp" class="follow-up-questions">
      <view v-for="(question, index) in followUpQuestions" 
            :key="index" 
            class="follow-up-item"
            @click="sendFollowUpQuestion(question)">
        <text>{{ question }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  followUpQuestions: {
    type: Array,
    default: () => []
  },
  showFollowUp: Boolean
});

const emit = defineEmits(['send-follow-up', 'toggle-follow-up']);

function sendFollowUpQuestion(question) {
  emit('send-follow-up', question);
}

function toggleShow() {
  emit('toggle-follow-up');
}
</script>

<style scoped>
.follow-up-container {
  background-color: #f5f7fa;
  border-radius: 16rpx;
  padding: 20rpx;
  margin: 20rpx 0;
  border: 1rpx solid #e1e4e8;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  margin: 30rpx 20rpx;
}

.follow-up-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10rpx 0;
  cursor: pointer;
}

.follow-up-title {
  font-size: 30rpx;
  color: #666;
  font-weight: bold;
}

.arrow {
  font-size: 24rpx;
  color: #999;
  transition: transform 0.3s ease;
}

.arrow.rotated {
  transform: rotate(180deg);
}

.follow-up-questions {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
  margin-top: 15rpx;
  padding-top: 15rpx;
  border-top: 1rpx dashed #e1e4e8;
}

.follow-up-item {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 18rpx 20rpx;
  font-size: 28rpx;
  color: #1890ff;
  border: 1rpx solid #e3f2fd;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.follow-up-item:active {
  background-color: #e3f2fd;
  transform: scale(0.98);
}

.follow-up-item::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, transparent 0%, rgba(24, 144, 255, 0.05) 100%);
  pointer-events: none;
}
</style>