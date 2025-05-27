<template>
	<view class="settings-container">
		<view class="header">
			<text class="title">设置</text>
		</view>
		
		<!-- 音色设置区域 -->
		<view class="settings-section">
			<view class="section-title">
				<text>🎙️ 音色设置</text>
			</view>
			<view class="voice-list">
				<view v-for="voice in voices" :key="voice.id" 
					class="voice-item" 
					:class="{ selected: selectedVoice === voice.id }"
					@click="selectVoice(voice.id)">
					<view class="voice-info">
						<text class="voice-name">{{ voice.name }}</text>
						<text class="voice-desc">{{ voice.desc }}</text>
					</view>
					<view class="check-icon" v-if="selectedVoice === voice.id">✓</view>
				</view>
			</view>
		</view>
		
		<!-- 其他设置区域 -->
		<view class="settings-section">
			<view class="section-title">
				<text>⚙️ 通用设置</text>
			</view>
			<view class="setting-item">
				<text>自动连接服务器</text>
				<switch :checked="autoConnect" @change="onAutoConnectChange" />
			</view>
			<view class="setting-item">
				<text>语音识别语言</text>
				<picker @change="onLanguageChange" :value="languageIndex" :range="languages">
					<view class="picker">
						<text>{{ languages[languageIndex] }}</text>
						<text class="arrow">></text>
					</view>
				</picker>
			</view>
		</view>
		
		<!-- 存储设置区域 -->
		<view class="settings-section">
			<view class="section-title">
				<text>💾 存储设置</text>
			</view>
			<view class="setting-item">
				<text>保存对话记录</text>
				<switch :checked="saveHistory" @change="onSaveHistoryChange" />
			</view>
			<view class="setting-item" @click="clearHistory">
				<text>清除所有对话记录</text>
				<text class="clear-btn">清除</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			voices: [
				{ id: 1, name: '温柔女声', desc: '适合故事讲解' },
				{ id: 2, name: '专业男声', desc: '适合知识讲解' },
				{ id: 3, name: '可爱童声', desc: '适合儿童互动' },
				{ id: 4, name: '方言模式(粤语)', desc: '粤语特色' }
			],
			selectedVoice: 1,
			autoConnect: true,
			saveHistory: true,
			languageIndex: 0,
			languages: ['中文', '英文', '中英混合']
		}
	},
	onLoad() {
		// 从本地存储加载设置
		this.loadSettings();
	},
	methods: {
		// 选择音色
		async selectVoice(voiceId) {
			try {
				this.selectedVoice = voiceId;
				// 保存到本地存储
				uni.setStorageSync('selectedVoice', voiceId);
				
				// 通知父页面音色已更改
				uni.$emit('voiceChanged', voiceId);
				
				uni.showToast({
					title: '音色切换成功,可能有延迟',
					icon: 'none',
					duration: 1500
				});
			} catch (error) {
				console.error('音色切换失败:', error);
				uni.showToast({
					title: '音色切换失败',
					icon: 'none',
					duration: 2000
				});
			}
		},
		
		// 自动连接开关
		onAutoConnectChange(e) {
			this.autoConnect = e.detail.value;
			uni.setStorageSync('autoConnect', this.autoConnect);
		},
		
		// 保存历史开关
		onSaveHistoryChange(e) {
			this.saveHistory = e.detail.value;
			uni.setStorageSync('saveHistory', this.saveHistory);
		},
		
		// 语言切换
		onLanguageChange(e) {
			this.languageIndex = e.detail.value;
			uni.setStorageSync('languageIndex', this.languageIndex);
		},
		
		// 清除历史记录
		clearHistory() {
			uni.showModal({
				title: '确认清除',
				content: '确定要清除所有对话记录吗？此操作不可恢复。',
				success: (res) => {
					if (res.confirm) {
						try {
							uni.removeStorageSync('chatHistory');
							uni.showToast({
								title: '清除成功',
								icon: 'success'
							});
						} catch (error) {
							uni.showToast({
								title: '清除失败',
								icon: 'none'
							});
						}
					}
				}
			});
		},
		
		// 加载设置
		loadSettings() {
			try {
				this.selectedVoice = uni.getStorageSync('selectedVoice') || 1;
				this.autoConnect = uni.getStorageSync('autoConnect') !== false; // 默认true
				this.saveHistory = uni.getStorageSync('saveHistory') !== false; // 默认true
				this.languageIndex = uni.getStorageSync('languageIndex') || 0;
			} catch (error) {
				console.error('加载设置失败:', error);
			}
		}
	}
}
</script>

<style scoped>
.settings-container {
	padding: 20rpx;
	background-color: #f5f5f5;
	min-height: 100vh;
}

.header {
	text-align: center;
	padding: 40rpx 0;
}

.title {
	font-size: 48rpx;
	font-weight: bold;
	color: #333;
}

.settings-section {
	background-color: #fff;
	border-radius: 16rpx;
	margin-bottom: 30rpx;
	overflow: hidden;
}

.section-title {
	padding: 30rpx 40rpx 20rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.section-title text {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
}

.voice-list {
	padding: 20rpx 0;
}

.voice-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx 40rpx;
	border-bottom: 1rpx solid #f8f8f8;
	transition: background-color 0.3s;
}

.voice-item:last-child {
	border-bottom: none;
}

.voice-item.selected {
	background-color: #e6f7ff;
}

.voice-info {
	display: flex;
	flex-direction: column;
}

.voice-name {
	font-size: 32rpx;
	color: #333;
	margin-bottom: 8rpx;
}

.voice-desc {
	font-size: 26rpx;
	color: #999;
}

.check-icon {
	color: #1890ff;
	font-size: 40rpx;
	font-weight: bold;
}

.setting-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx 40rpx;
	border-bottom: 1rpx solid #f8f8f8;
}

.setting-item:last-child {
	border-bottom: none;
}

.setting-item text {
	font-size: 32rpx;
	color: #333;
}

.picker {
	display: flex;
	align-items: center;
	color: #666;
}

.arrow {
	margin-left: 20rpx;
	font-size: 28rpx;
}

.clear-btn {
	color: #ff4d4f !important;
	font-size: 28rpx !important;
}
</style>
