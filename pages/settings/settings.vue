<template>
	<view class="settings-container">
		<!-- 主设置页面 -->
		<view v-if="currentPage === 'main'" class="main-page">
			<view class="header">
				<text class="title">设置</text>
			</view>

			<!-- 音色设置区域 -->
			<view class="settings-section">
				<view class="section-title">
					<text>🎙️ 音色设置</text>
				</view>
				<view class="voice-list">
					<view v-for="voice in voices" :key="voice.id" class="voice-item"
						:class="{ selected: selectedVoice === voice.id }" @click="selectVoice(voice.id)">
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
				<view class="setting-item" @click="goToLanguagePage">
					<text>语言设置</text>
					<view class="setting-value">
						<text>{{ getCurrentLanguage() }}</text>
						<text class="arrow">></text>
					</view>
				</view>
				<view class="setting-item" @click="goToRegionPage">
					<text>地区设置</text>
					<view class="setting-value">
						<text>{{ getCurrentRegion() || '默认' }}</text>
						<text class="arrow">></text>
					</view>
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

		<!-- 语言设置页面 -->
		<view v-if="currentPage === 'language'" class="sub-page">
			<view class="sub-header">
				<view class="back-btn" @click="goBackToMain">
					<text class="back-icon">‹</text>
					<text>返回</text>
				</view>
				<text class="sub-title">语言设置</text>
				<view class="placeholder"></view>
			</view>

			<view class="settings-section">
				<view class="option-list">
					<view v-for="(lang, index) in languageOptions" :key="index" class="option-item"
						:class="{ selected: languageIndex === (index + 1) }" @click="onLanguageSelect(index + 1)">
						<text class="option-text">{{ lang }}</text>
						<view class="check-icon" v-if="languageIndex === (index + 1)">✓</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 地区设置页面 -->
		<view v-if="currentPage === 'region'" class="sub-page">
			<view class="sub-header">
				<view class="back-btn" @click="goBackToMain">
					<text class="back-icon">‹</text>
					<text>返回</text>
				</view>
				<text class="sub-title">地区设置</text>
				<view class="placeholder"></view>
			</view>

			<view class="settings-section">
				<view class="option-list">
					<view v-for="(reg, index) in regionOptions" :key="index" class="option-item"
						:class="{ selected: regionIndex === (index + 1) }" @click="onRegionChange(index + 1)">
						<text class="option-text">{{ reg || '默认' }}</text>
						<view class="check-icon" v-if="regionIndex === (index + 1)">✓</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
	import { ref, reactive, onMounted, watch } from 'vue';
	import { onLoad } from '@dcloudio/uni-app';
	import useGlobalSettings from '../../composables/useGlobalSettings.js';

	// 使用全局状态管理
	const {
		settings,
		voiceNames,
		region,
		language,
		updateVoice,
		updateAutoConnect,
		updateSaveHistory,
		updateLanguage,
		updateRegion,
		loadAllSettings,
		getCurrentVoiceName,
		getCurrentLanguage,
		getCurrentRegion
	} = useGlobalSettings();

	// 响应式数据
	const voices = reactive([
		{ id: 1, name: `${voiceNames[1]}`, desc: '适合故事讲解' },
		{ id: 2, name: `${voiceNames[2]}`, desc: '适合知识讲解' },
		{ id: 3, name: `${voiceNames[3]}`, desc: '适合儿童互动' },
		{ id: 4, name: `${voiceNames[4]}`, desc: '粤语特色' }
	]);
	// 为了保持模板兼容性，创建响应式引用
	const selectedVoice = ref(settings.selectedVoice);
	const autoConnect = ref(settings.autoConnect);
	const saveHistory = ref(settings.saveHistory);
	const languageIndex = ref(settings.languageIndex);
	const regionIndex = ref(settings.regionIndex);

	// 二级页面状态管理
	const currentPage = ref('main'); // 'main', 'language', 'region'

	// 语言和地区选项数组
	const languageOptions = reactive(Object.values(language));
	const regionOptions = reactive(Object.values(region));

	const languages = reactive(['中文', '英文', '中英混合']);

	// 监听全局设置变化，同步到本地响应式状态
	watch(() => settings.selectedVoice, (newValue) => {
		selectedVoice.value = newValue;
	});
	watch(() => settings.autoConnect, (newValue) => {
		autoConnect.value = newValue;
	});
	watch(() => settings.saveHistory, (newValue) => {
		saveHistory.value = newValue;
	}); watch(() => settings.languageIndex, (newValue) => {
		languageIndex.value = newValue;
	});
	watch(() => settings.regionIndex, (newValue) => {
		regionIndex.value = newValue;
	});

	// 选择音色
	const selectVoice = async (voiceId) => {
		try {
			// 使用全局状态管理更新音色
			updateVoice(voiceId);

			uni.showToast({
				title: '音色切换成功',
				icon: 'success',
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
	};

	// 自动连接开关
	const onAutoConnectChange = (e) => {
		updateAutoConnect(e.detail.value);
	};

	// 保存历史开关
	const onSaveHistoryChange = (e) => {
		updateSaveHistory(e.detail.value);
	};

	// 语言切换
	const onLanguageChange = (e) => {
		updateLanguage(e.detail.value);
	};

	// 地区切换
	const onRegionChange = (index) => {
		updateRegion(index);
		uni.showToast({
			title: '地区设置成功',
			icon: 'success',
			duration: 1500
		});
	};

	// 语言设置
	const onLanguageSelect = (index) => {
		updateLanguage(index);
		uni.showToast({
			title: '语言设置成功',
			icon: 'success',
			duration: 1500
		});
	};

	// 页面导航方法
	const goToLanguagePage = () => {
		currentPage.value = 'language';
	};

	const goToRegionPage = () => {
		currentPage.value = 'region';
	};

	const goBackToMain = () => {
		currentPage.value = 'main';
	};

	// 清除历史记录
	const clearHistory = () => {
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
	};
	// 加载设置
	const loadSettings = () => {
		// 使用全局状态管理加载所有设置
		loadAllSettings();
	};

	// 生命周期钩子
	onLoad(() => {
		// 从本地存储加载设置
		loadSettings();
	});
</script>

<style scoped>
	.settings-container {
		padding: 20rpx;
		background-color: #f5f5f5;
		min-height: 100vh;
	}

	.main-page,
	.sub-page {
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

	/* 二级页面头部 */
	.sub-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20rpx 0;
		margin-bottom: 20rpx;
	}

	.back-btn {
		display: flex;
		align-items: center;
		padding: 10rpx;
		color: #1890ff;
		font-size: 32rpx;
	}

	.back-icon {
		font-size: 40rpx;
		margin-right: 8rpx;
		font-weight: bold;
	}

	.sub-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
	}

	.placeholder {
		width: 120rpx;
		/* 和返回按钮宽度保持平衡 */
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
		transition: background-color 0.2s;
	}

	.setting-item:last-child {
		border-bottom: none;
	}

	.setting-item:active {
		background-color: #f8f8f8;
	}

	.setting-item text {
		font-size: 32rpx;
		color: #333;
	}

	.setting-value {
		display: flex;
		align-items: center;
		color: #666;
		font-size: 28rpx;
	}

	.picker {
		display: flex;
		align-items: center;
		color: #666;
	}

	.arrow {
		margin-left: 20rpx;
		font-size: 28rpx;
		color: #999;
	}

	.clear-btn {
		color: #ff4d4f !important;
		font-size: 28rpx !important;
	}

	/* 选项列表样式 */
	.option-list {
		padding: 0;
	}

	.option-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 30rpx 40rpx;
		border-bottom: 1rpx solid #f8f8f8;
		transition: background-color 0.2s;
	}

	.option-item:last-child {
		border-bottom: none;
	}

	.option-item.selected {
		background-color: #e6f7ff;
	}

	.option-item:active {
		background-color: #f0f0f0;
	}

	.option-text {
		font-size: 32rpx;
		color: #333;
	}
</style>
