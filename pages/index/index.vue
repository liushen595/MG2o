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
			<!-- 引言显示区域 -->
			<Introduction :text="introductionState.introductionText"
				:show-introduction="introductionState.showIntroduction" />

			<!-- 消息记录部分 -->
			<view class="message-list-container">
				<MessageList :messages="messages" :lastMessageId="lastMessageId" :isLoading="isLoading"
					:isUserScrolling="isUserScrolling" :hasNewMessage="hasNewMessage" @scroll="onScroll"
					@scrollToBottom="scrollToBottom"
					:followUpQuestions="followUpQuestions"
					:showFollowUp="showFollowUp"
					@send-follow-up="sendFollowUpQuestion"
					@toggle-follow-up="toggleFollowUp" />
			</view>

			<!-- 消息输入部分 -->
			<MessageInput v-model:messageText="messageText" :isConnected="isConnected" :isRecording="isRecording"
				:isCancelRecording="isCancelRecording" :audioVisualizerData="audioVisualizerData" @send="sendMessage"
				@touchStart="startTouchRecording" @touchMove="touchMoveRecording" @touchEnd="endTouchRecording"
				@touchCancel="cancelTouchRecording" 
				@image-sent="handleImageMessage"
				/>
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
	import Introduction from '../../components/home/Introduction.vue';
	import FollowUp from '../../components/home/FollowUpQuestions.vue';

	// 导入可复用逻辑
	import useLogger from '../../composables/home/useLogger.js';
	import useMessages from '../../composables/home/useMessages.js';
	import useConnection from '../../composables/home/useConnection.js';
	import useAudioRecording from '../../composables/home/useAudioRecording.js';
	import useNavigation from '../../composables/home/useNavigation.js';
	import useGlobalSettings from '../../composables/useGlobalSettings.js';
	import useIntroduction from '../../composables/home/useItroduction.js';
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
	//初始化引言区域
	const { state: introductionState, show, hide } = useIntroduction()
	//const introductionText = ref("您好，欢迎使用苏州大学博物馆导航系统！");
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
		// 移除 selectedVoice，现在使用全局设置
		sendMessage: originalSendMessage, // 重命名原始方法
		addMessage,
		onScroll,
		scrollToBottom,
		loadSettings,
		cleanupResources: cleanupMessagesResources,
		followUpQuestions,
		showFollowUp,
		sendFollowUpQuestion,
		toggleFollowUp
	} = messageService;
	const sendMessage = () => {
		hide(); // 隐藏引言
		originalSendMessage(); // 调用原始发送方法
	};
	// 设置连接服务的回调函数
	setCallbacks(
		messageService.handleServerMessage,
		messageService.handleSpeechRecognition
	);

	// 初始化音频录制服务
	const audioService = useAudioRecording(
		isConnected,
		startResponseTimeout,
		clearResponseTimeout,
		addLog
	);
	const handleImageMessage = (imageData) => {
		 hide(); // 隐藏引言
    	 messageService.handleImageMessage(imageData);
	};
	// 从音频服务中直接使用响应式状态
	const {
		isRecording,
		audioVisualizerData,
		isCancelRecording,
		initRecording,
		startTouchRecording,
		touchMoveRecording,
		endTouchRecording: originalEndTouchRecording,
		cancelTouchRecording,
		cleanupResources: cleanupAudioResources
	} = audioService;
	const endTouchRecording = () => {
		hide(); // 隐藏引言
		originalEndTouchRecording(); // 调用原始方法
	};
	// 初始化导航功能
	const { showDrawer, openDrawer, closeDrawer, navigateToPage } = useNavigation();

	// 初始化应用
	function initializeApp() {
		show();
		// 添加初始日志
		addLog('准备就绪,正在连接服务器...', 'info');

		// 从本地存储加载音色设置, 已更换为全局设置
		// loadSettings();

		// 初始化录音功能
		initRecording();

		// 加载全局设置
		loadAllSettings();

		// 自动连接服务器
		connectToServer();
		//连接后显示引言
		showIntroduction.value = true
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
		overflow: hidden;
	}

	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		position: relative;
		background-color: #f5f7fa;
		width: 95%;
		overflow: hidden;
		padding: 0 20rpx;
		/* 移除底部padding，因为MessageInput是fixed定位 */
	}

	/* 消息列表容器，让其占据主要空间 */
	.message-list-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: relative;
		/* 确保绝对定位的子元素相对于此容器定位 */
		min-height: 0;
		/* 确保flex子项能收缩 */
		margin-bottom: 220rpx;
		/* 为底部fixed的MessageInput留出空间 */
	}
</style>
