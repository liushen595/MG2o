<template>
	<view class="container">
		<!-- 左侧侧拉导航栏 -->
		<SideDrawer v-model:showDrawer="showDrawer" @navigate="navigateToPage" />

		<!-- 主内容区域 -->
		<view class="main-content">
			<!-- 顶部导航栏 -->
			<TopNavBar :isConnected="isConnected" :connectionStatusText="connectionStatusText" @openDrawer="openDrawer"
				@reconnect="reconnectServer" />

			<!-- 位置验证已移至独立页面 -->

			<!-- 消息记录部分 -->
			<view class="message-list-container">
				<MessageList :messages="messages" :lastMessageId="lastMessageId" :isLoading="isLoading"
					:isUserScrolling="isUserScrolling" :hasNewMessage="hasNewMessage" @scroll="onScroll"
					@scrollToBottom="scrollToBottom" />
			</view>

			<!-- 消息输入部分 -->
			<MessageInput v-model:messageText="messageText" :isConnected="isConnected" :isRecording="isRecording"
				:isCancelRecording="isCancelRecording" @send="sendMessage" @touchStart="startTouchRecording"
				@touchMove="touchMoveRecording" @touchEnd="endTouchRecording" @touchCancel="cancelTouchRecording" />

			<!-- 录音可视化显示 -->
			<AudioVisualizer :show="isLocationVerified && isRecording" :audioVisualizerData="audioVisualizerData"
				:isCancelRecording="isCancelRecording" />

			<!-- 识别结果显示 -->
			<SpeechRecognition :text="speechRecognitionText" />
		</view>
	</view>
</template>

<script setup>	import { ref } from 'vue';
	import { onLoad, onShow, onHide, onUnload } from '@dcloudio/uni-app';

	// 导入组件
	import SideDrawer from '../../components/home/SideDrawer.vue';
	import TopNavBar from '../../components/home/TopNavBar.vue';
	import MessageList from '../../components/home/MessageList.vue';
	import MessageInput from '../../components/home/MessageInput.vue';
	import AudioVisualizer from '../../components/home/AudioVisualizer.vue';
	import SpeechRecognition from '../../components/home/SpeechRecognition.vue';

	// 导入可复用逻辑
	import useLogger from '../../composables/home/useLogger.js';
	import useMessages from '../../composables/home/useMessages.js';
	import useConnection from '../../composables/home/useConnection.js';
	import useAudioRecording from '../../composables/home/useAudioRecording.js';
	import useNavigation from '../../composables/home/useNavigation.js';
	import useGlobalSettings from '../../composables/useGlobalSettings.js';

	// 初始化全局设置
	const { settings, loadAllSettings } = useGlobalSettings();

	// 初始化日志系统
	const { logs, logScrollTop, addLog } = useLogger();
	// 位置验证已移至独立页面，不再需要位置服务
	// 但我们仍然需要isLocationVerified来控制某些功能
	const isLocationVerified = ref(true); // 假定位置已验证（因为用户能进入此页面说明已通过位置验证）

	// 初始化连接服务
	const connectionService = useConnection(
		null, // 消息处理回调稍后设置
		null, // 语音识别回调稍后设置
		addLog
	);

	// 从连接服务中解构所有需要的状态和方法
	const {
		serverUrl,
		isConnected,
		connectionStatusText,
		connectToServer,
		disconnectFromServer,
		reconnectServer,
		startResponseTimeout,
		clearResponseTimeout,
		setCallbacks
	} = connectionService;
	// 初始化消息系统
	const messageService = useMessages(
		isConnected,
		startResponseTimeout,
		clearResponseTimeout,
		addLog
	);
	// 从消息服务中直接使用响应式状态
	const {
		messages,
		messageText,
		isLoading,
		lastMessageId,
		isUserScrolling,
		hasNewMessage,
		speechRecognitionText,
		// 移除 selectedVoice，现在使用全局设置
		sendMessage,
		addMessage,
		onScroll,
		scrollToBottom,
		loadSettings,
		cleanupResources: cleanupMessagesResources
	} = messageService;

	// 设置连接服务的回调函数
	setCallbacks(
		messageService.handleServerMessage,
		messageService.handleSpeechRecognition
	);	// 初始化音频录制服务
	const audioService = useAudioRecording(
		isConnected,
		startResponseTimeout,
		clearResponseTimeout,
		addLog
	);

	// 从音频服务中直接使用响应式状态
	const {
		isRecording,
		audioVisualizerData,
		isCancelRecording,
		initRecording,
		startTouchRecording,
		touchMoveRecording,
		endTouchRecording,
		cancelTouchRecording,
		cleanupResources: cleanupAudioResources
	} = audioService;

	// 初始化导航功能
	const { showDrawer, openDrawer, closeDrawer, navigateToPage } = useNavigation();

	// 初始化应用
	function initializeApp() {
		// 添加初始日志
		addLog('准备就绪,正在连接服务器...', 'info');

		// 从本地存储加载音色设置
		loadSettings();
		// 初始化录音功能
		initRecording();

		// 加载全局设置
		loadAllSettings();

		// 自动连接服务器
		connectToServer();
	}
	// 清理应用资源
	function cleanupApp() {
		// 清理资源
		cleanupMessagesResources();
		cleanupAudioResources();
	}

	// 生命周期钩子
	onLoad(() => {
		initializeApp();
	});

	onShow(() => {
		// 自动连接到服务器
		if (!isConnected.value) {
			connectToServer();
		}
	});

	onHide(() => {
		// 页面隐藏时不需要特殊处理
	});

	onUnload(() => {
		cleanupApp();
	});
</script>

<style>

	/* 全局样式可以保留，组件特定样式已移至各组件中 */
	.container {
		height: 100vh;
		width: 100%;
		display: flex;
		flex-direction: column;
		position: relative;
		background-color: #f5f7fa;
	}

	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		/* 均匀分布子元素 */
		position: relative;
		background-color: #f5f7fa;
		width: 100%;
		height: 100%;
		overflow: hidden;
		padding-bottom: 20rpx;
		/* 增加底部内边距 */
	}

	/* 消息列表容器，让其占据主要空间 */
	.message-list-container {
		flex: 1;
		min-height: 60vh;
		/* 确保至少有60%的视窗高度 */
		display: flex;
		flex-direction: column;
	}
</style>
