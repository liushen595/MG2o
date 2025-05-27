<template>
	<view class="container">
		<!-- 左侧侧拉导航栏 -->
		<view class="drawer-overlay" :class="{ show: showDrawer }" @click="closeDrawer"></view>
		<view class="drawer" :class="{ show: showDrawer }">
			<view class="drawer-header">
				<view class="">
				<image class="drawer-logo" src="/static/logo.png" mode="aspectFit"></image>					
				</view>
				<view><text class="drawer-title">苏博导智能体</text></view>
			</view>
			<view class="drawer-menu">
				<view class="menu-item active" @click="navigateToPage('voice-assistant')">
					<text class="menu-icon">🎙️</text>
					<text class="menu-text">语音助手</text>
				</view>
				<view class="menu-item" @click="navigateToPage('settings')">
					<text class="menu-icon">⚙️</text>
					<text class="menu-text">设置</text>
				</view>
				<view class="menu-item" @click="navigateToPage('share')">
					<text class="menu-icon">📤</text>
					<text class="menu-text">分享</text>
				</view>
				<view class="menu-item" @click="navigateToPage('about')">
					<text class="menu-icon">ℹ️</text>
					<text class="menu-text">关于</text>
				</view>
			</view>
		</view>

		<!-- 主内容区域 -->
		<view class="main-content">
			<!-- 顶部导航栏 -->
			<view class="top-nav">
				<view class="nav-left" @click="openDrawer">
					<text class="menu-btn">☰</text>
				</view>
				<text class="nav-title">苏博导智能体</text>
				<view class="nav-right">
					<view class="connection-indicator" :class="{ connected: isConnected }" @click="reconnectServer">
						<text class="status-dot"></text>
						<text class="status-text">{{ connectionStatusText }}</text>
					</view>
				</view>
			</view>

			<!-- 位置验证部分 -->
			<view class="status-box" :class="{ 'success-box': isLocationVerified, 'error-box': locationError }" v-if="shouldShowStatusBox">
				<view class="centered-content">
					<view class="location-status" :class="{ 'location-denied': locationError, 'location-allowed': isLocationVerified }">
						<text>{{ locationStatusText }}</text>
					</view>
					<view class="location-details" v-if="locationDetails">
						<text>{{ locationDetails }}</text>
					</view>
					<button class="location-btn" :disabled="isCheckingLocation" @click="verifyUserLocation">{{ locationBtnText }}</button>
				</view>
			</view>			<!-- 消息记录部分 -->
			<scroll-view class="conversation" scroll-y="true" :scroll-with-animation="true" :scroll-into-view="lastMessageId" @scroll="onScroll">
				<view class="conversation-inner">
					<view v-for="(msg, index) in messages" :key="index" class="message" :class="{ user: msg.isUser }" :id="'msg-' + index">
						<text>{{ msg.text }}</text>
					</view>

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

			<!-- 消息输入部分 -->
			<view class="message-input-container">
				<view class="input-wrapper">
					<input class="message-input" v-model="messageText" placeholder="输入消息..." :disabled="!isConnected" @confirm="sendMessage" />
					<button class="send-btn" @click="sendMessage" :disabled="!isConnected || !messageText.trim()">
						<view class="send-icon"></view>
					</button>
				</view>			
				<button class="record-btn"
					@touchstart="startTouchRecording"
					@touchmove="touchMoveRecording"
					@touchend="endTouchRecording"
					@touchcancel="cancelTouchRecording"
					:disabled="!isConnected"
					:class="{ recording: isRecording, 'cancel-recording': isCancelRecording }">
					<view class="mic-icon"></view>
					<text>{{ isRecording ? '松开发送' : '按住说话' }}</text>
				</button>
			</view>

			<!-- 录音可视化显示 -->
			<view v-if="isLocationVerified && isRecording" class="audio-visualizer">
				<view class="visualizer-bar" v-for="(value, index) in audioVisualizerData" :key="index" :style="{ height: value + '%' }"></view>
				
				<!-- 录音取消提示 -->
				<view v-if="isCancelRecording" class="cancel-recording-tip">
					<view class="cancel-icon"></view>
					<text>松开手指，取消发送</text>
				</view>
			</view>

			<!-- 识别结果显示 -->
			<view v-if="speechRecognitionText" class="speech-recognition-container">
				<view class="speech-recognition-text">
					<text>{{ speechRecognitionText }}</text>
					<view class="recognition-icon">
						<view class="mic-small-icon"></view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import xiaozhiService from '../../utils/xiaozhi-service.js';
	import locationService from '../../utils/location-service.js';

	export default {
		data() {
			return {
				serverUrl: 'wss://huisuda.com/xiaozhi/v1/',
				isConnected: false,
				connectionStatusText: '未连接',
				messageText: '',
				messages: [],
				logs: [],
				scrollTop: 0,
				logScrollTop: 0,
				isRecording: false,
				isLoading: false,
				audioVisualizerData: Array(10).fill(0), // 假设有10个柱状图
				showConnectionPanel: false, // 控制连接面板是否展开
				responseTimeoutId: null, // 响应超时计时器ID				
				responseTimeoutDuration: 10000, // 响应超时时间，默认10秒
				lastMessageId: '', // 最后一条消息的ID
				
				// 侧拉导航栏
				showDrawer: false, // 控制侧拉导航栏显示
						// 滚动检测相关
				isUserScrolling: false, // 用户是否正在手动滚动
				scrollTimeout: null, // 滚动检测定时器
				lastScrollTop: 0, // 上次滚动位置
				hasNewMessage: false, // 是否有新消息（用户滚动时）
				
				// 语音识别相关
				speechRecognitionText: '', // 语音识别结果文本
				speechRecognitionTimer: null, // 语音识别结果显示定时器

				// 位置验证相关数据
				isLocationVerified: false,	  //验证成功状态
				isCheckingLocation: false,	  //防止重复点击
				locationError: false,		  //错误状态
				locationStatusText: '请验证您的位置', //状态提示文字
				locationDetails: '此应用只能在特定地点使用',				
				locationBtnText: '验证位置',//错误信息和按钮文字
				currentLocation: null,//存储位置信息
				locationCheckInterval: null,
				
				// 触摸录音相关
				touchStartY: 0, // 记录触摸开始的Y坐标
				isCancelRecording: false, // 是否处于取消录音状态
				cancelDistance: 100, // 上滑多少距离取消录音（单位rpx）
				recordStartTime: 0, // 录音开始的时间戳
				minRecordDuration: 1000, // 最短录音时长(毫秒)，少于这个时间视为误触
				isValidRecording: false, // 是否为有效录音				//追问
				isInquiry:false,
				//音色选择（从设置页获取）
				selectedVoice: 1       // 当前选中的音色ID
			}
		},		onLoad() {
			// 添加初始日志
			this.addLog('准备就绪,请先验证位置...', 'info');
			
			// 从本地存储加载音色设置
			this.loadSettings();

			// 初始化录音管理器
			xiaozhiService.initRecorder(
				// 开始录音回调
				() => {
					this.addLog('录音开始', 'info');
					// 开始模拟音频可视化数据
					this.startAudioVisualization();
				},
				// 停止录音回调
				(res) => {
					this.addLog(`录音结束，文件路径: ${res.tempFilePath}`, 'info');
					this.addLog(`录音时长: ${res.duration}ms，文件大小: ${res.fileSize}字节`, 'info');

					// 发送录音文件到服务器
					this.sendRecordFile(res.tempFilePath);
				},				// 错误回调
				(err) => {
					this.addLog(`录音错误: ${JSON.stringify(err)}`, 'error');
					this.isRecording = false;
				}
			);
			
			// 监听音色变更事件
			uni.$on('voiceChanged', (voiceId) => {
				this.selectedVoice = voiceId;
				this.addLog(`音色已切换: ${voiceId}`, 'info');
			});
		},
		onShow() {
			// 每次页面显示时验证位置
			this.verifyUserLocation();

			// 设置定时检查位置
			this.startLocationCheck();
		},		onHide() {
			// 页面隐藏时清除定时器
			this.stopLocationCheck();
		},		onUnload() {
			// 页面销毁时移除事件监听
			uni.$off('voiceChanged');
			
			// 清理滚动检测定时器
			if (this.scrollTimeout) {
				clearTimeout(this.scrollTimeout);
				this.scrollTimeout = null;
			}
		},
		computed: {
    		// 控制状态框显示的计算属性
			shouldShowStatusBox() {
				// 无论验证是否通过，只要未连接就显示
				return !this.isConnected
			}
  		},
		methods: {
			// 打开侧拉导航栏
			openDrawer() {
				this.showDrawer = true;
			},
			// 关闭侧拉导航栏
			closeDrawer() {
				this.showDrawer = false;
			},			// 页面跳转
			navigateToPage(page) {
				let url = '';
				switch(page) {
					case 'voice-assistant':
						// 当前页面，不跳转
						this.closeDrawer();
						return;
					case 'settings':
						url = '/pages/settings/settings';
						break;
					case 'share':
						url = '/pages/index/new-page';
						break;
					case 'about':
						url = '/pages/about/about';
						break;
					default:
						console.error('未知页面:', page);
						this.closeDrawer();
						return;
				}
				
				uni.navigateTo({
					url: url,
					success: () => {
						this.closeDrawer();
					},
					fail: (err) => {
						console.error('跳转失败', err);
						this.closeDrawer();
					}
				});
			},
			
			// 重连服务器
			reconnectServer() {
				if (this.isConnected) {
					this.disconnectFromServer();
				} else {
					this.connectToServer();
				}
			},
			
			// 加载设置
			loadSettings() {
				try {
					this.selectedVoice = uni.getStorageSync('selectedVoice') || 1;
				} catch (error) {
					console.error('加载设置失败:', error);
				}
			},

			// 连接到服务器
			connectToServer() {
				this.addLog(`正在连接: ${this.serverUrl}`, 'info');
				this.connectionStatusText = '正在连接...';

				xiaozhiService.connectToServer(
					this.serverUrl,
					// 连接成功回调
					() => {
						this.isConnected = true;
						this.connectionStatusText = '已连接';
						this.addLog('已连接到服务器', 'success');
						// 新增：关闭状态提示框
						this.showConnectionPanel = false; 
						// 新增：重置位置验证提示
						this.locationDetails = '位置验证通过，已建立连接'; 
					},
					// 消息接收回调
					(message) => {
						this.handleServerMessage(message);
					},
					// 连接关闭回调
					() => {
						this.isConnected = false;
						this.connectionStatusText = '已断开';
						this.addLog('已断开连接', 'info');
					},
					// 错误回调
					(error) => {
						this.isConnected = false;
						this.connectionStatusText = '连接错误';
						this.addLog(`连接错误: ${error}`, 'error');
					},
					// 语音识别结果回调
					(text) => {
						this.handleSpeechRecognition(text);
					}
				).catch(error => {
					this.addLog(`连接失败: ${error}`, 'error');
					this.connectionStatusText = '连接失败';
				});
			},			// 断开服务器连接
			disconnectFromServer() {
				xiaozhiService.disconnectFromServer();
				this.isConnected = false;
				this.connectionStatusText = '未连接';
				this.addLog('已断开连接', 'info');

				// 断开连接时隐藏加载动画
				this.isLoading = false;
			},

			// 发送消息
			sendMessage() {
				if (!this.messageText.trim() || !this.isConnected) return;

				const message = this.messageText.trim();
				this.addLog(`发送消息: ${message}`, 'info');

				// 添加到消息列表
				this.addMessage(message, true);

				// 显示加载动画
				this.isLoading = true;

				// 设置响应超时计时器
				this.startResponseTimeout();

				// 发送到服务器
				xiaozhiService.sendTextMessage(message,this.selectedVoice).catch(error => {
					this.addLog(`发送失败: ${error}`, 'error');
					// 发送失败时隐藏加载动画
					this.isLoading = false;
					// 清除响应超时计时器
					console.log("清除计时器")
					this.clearResponseTimeout();
				});

				// 清空输入框
				this.messageText = '';
			},

			// 处理服务器消息
			handleServerMessage(message) {
				// 收到任何服务器消息时，清除响应超时计时器
				this.clearResponseTimeout();

				if (message.type === 'hello') {
					this.addLog(`服务器回应: ${message.message}`, 'info');
					// 隐藏加载动画
					this.isLoading = false;
				} else if (message.type === 'tts') {
					if(true){
							// TTS状态消息
						if (message.state === 'start') {
							this.addLog('服务器开始发送语音', 'info');
						} else if (message.state === 'sentence_start') {
							this.addLog(`服务器发送语音段: ${message.text}`, 'info');
							// 添加文本到会话记录，并隐藏加载动画
							if (message.text) {
								this.addMessage(message.text, false);
								this.isLoading = false;
							}
						} else if (message.state === 'sentence_end') {
							this.addLog(`语音段结束: ${message.text}`, 'info');
						} else if (message.state === 'stop') {
							this.addLog('服务器语音传输结束', 'info');
							// 确保隐藏加载动画
							this.isLoading = false;
						}
					}
					
				} else if (message.type === 'stt') {
					// 语音识别结果
					this.addLog(`识别结果: ${message.text}`, 'info');
				} else if (message.type === 'llm') {
					// 大模型回复
					this.addLog(`大模型回复: ${message.text}`, 'info');
					// 添加大模型回复到会话记录
					if (message.text && message.text !== '😊') {
						this.addMessage(message.text, false);
						// 收到回复后隐藏加载动画
						this.isLoading = false;
					}
				} else {
					// 未知消息类型
					this.addLog(`未知消息类型: ${message.type}`, 'info');
					// 确保隐藏加载动画
					this.isLoading = false;
				}
			},

			// 处理语音识别结果
			handleSpeechRecognition(text) {
				if (!text) return;
				
				this.addLog(`收到语音识别结果: ${text}`, 'info');
				
				// 显示语音识别结果
				this.speechRecognitionText = text;
				
				// 同时添加到消息列表，作为用户消息显示在右侧
				this.addMessage(text, true);
				
				// 设置定时器，一段时间后清除语音识别结果显示
				if (this.speechRecognitionTimer) {
					clearTimeout(this.speechRecognitionTimer);
				}
				
				this.speechRecognitionTimer = setTimeout(() => {
					this.speechRecognitionText = '';
				}, 5000); // 5秒后清除显示
			},			// 添加消息到会话记录
			addMessage(text, isUser = false) {
				this.messages.push({
					text,
					isUser
				});

				// 只有在用户没有手动滚动的情况下才自动滚动到底部
				this.$nextTick(() => {
					if (!this.isUserScrolling) {
						const lastIndex = this.messages.length - 1;
						this.lastMessageId = 'msg-' + lastIndex;
						this.hasNewMessage = false;
					} else {
						// 用户正在滚动时，设置新消息标记
						this.hasNewMessage = true;
					}
				});
			},

			// 处理滚动事件
			onScroll(e) {
				const currentScrollTop = e.detail.scrollTop;
				// 检测用户是否在主动滚动
				if (Math.abs(currentScrollTop - this.lastScrollTop) > 5) {
					this.isUserScrolling = true;
					// 清除之前的定时器
					if (this.scrollTimeout) {
						clearTimeout(this.scrollTimeout);
					}
					// 1.5秒后重置滚动状态，允许自动滚动
					this.scrollTimeout = setTimeout(() => {
						this.isUserScrolling = false;
					}, 1500);
				}
				
				this.lastScrollTop = currentScrollTop;
				
				// 如果用户滚动到接近底部（距离底部小于100px），则重置为自动滚动模式
				const scrollHeight = e.detail.scrollHeight;
				const scrollViewHeight = e.detail.scrollTop + e.detail.clientHeight;
				if (scrollHeight - scrollViewHeight < 100) {
					this.isUserScrolling = false;
					if (this.scrollTimeout) {
						clearTimeout(this.scrollTimeout);
						this.scrollTimeout = null;
					}				}
			},			// 手动滚动到底部
			scrollToBottom() {
				this.isUserScrolling = false;
				this.hasNewMessage = false;
				if (this.scrollTimeout) {
					clearTimeout(this.scrollTimeout);
					this.scrollTimeout = null;
				}
				
				this.$nextTick(() => {
					if (this.messages.length > 0) {
						const lastIndex = this.messages.length - 1;
						this.lastMessageId = 'msg-' + lastIndex;
					}
				});
			},

			// 添加日志
			addLog(message, type = 'info') {
				const now = new Date();
				const time = now.toLocaleTimeString();

				this.logs.push({
					time,
					message,
					type
				});

				// 限制日志数量
				if (this.logs.length > 100) {
					this.logs.shift();
				}

				// 滚动到底部
				this.$nextTick(() => {
					this.logScrollTop = 9999999;
				});
			},

			// 开始录音
			startRecording() {
				if (!this.isConnected) {
					this.addLog('请先连接到服务器', 'error');
					return;
				}

				this.addLog('正在启动录音...', 'info');

				// 配置录音参数
				const options = {
					duration: 60000, // 最长60秒
					sampleRate: 16000, // 采样率16kHz，符合服务器要求
					numberOfChannels: 1, // 单声道
					encodeBitRate: 64000, // 编码比特率
					format: 'mp3', // 输出格式，使用mp3确保良好兼容性
					frameSize: 50 // 指定帧大小
				};

				const success = xiaozhiService.startRecording(options);
				if (!success) {
					this.addLog('录音启动失败', 'error');
					this.isRecording = false;
				} else {
					this.isRecording = true;
					// 启动录音超时保护
					this.recordingTimeout = setTimeout(() => {
						if (this.isRecording) {
							this.addLog('录音时间过长，自动停止', 'warning');
							this.stopRecording();
						}
					}, 60000);
				}
			},

			// 停止录音
			stopRecording() {
				if (!this.isRecording) return;

				this.addLog('正在停止录音...', 'info');

				// 立即将录音状态设为false，防止需要点击两次按钮
				this.isRecording = false;

				// 清除录音超时
				if (this.recordingTimeout) {
					clearTimeout(this.recordingTimeout);
					this.recordingTimeout = null;
				}

				// 停止可视化
				this.stopAudioVisualization();				// 定义进度回调函数
				const progressCallback = (progress) => {
					this.addLog(`上传进度: ${Math.round(progress * 100)}%`, 'info');
				};
				// 停止录音并发送
				xiaozhiService.stopRecordingAndSend(progressCallback, this.selectedVoice)
					.catch(error => {
						this.addLog(`录音停止错误: ${error}`, 'error');
					});
			},			// 发送录音文件到服务器
			sendRecordFile(filePath) {
				this.addLog('正在准备发送录音文件...', 'info');

				this.startResponseTimeout(); // 开始响应超时计时器

				// 显示加载动画
				this.isLoading = true;

				// 定义进度回调函数
				const progressCallback = (progress) => {
					this.addLog(`上传进度: ${progress}%`, 'info');
				};

				// 使用xiaozhi-service的统一接口发送录音
				xiaozhiService.sendAudioFile(filePath, progressCallback, this.selectedVoice)
					.then(() => {
						this.addLog('音频数据发送成功', 'success');
					})
					.catch(error => {
						this.addLog(`发送录音错误: ${error}`, 'error');
						// 错误时隐藏加载动画
						this.isLoading = false;

						// 显示错误提示给用户
						uni.showToast({
							title: '语音发送失败',
							icon: 'none',
							duration: 2000
						});
					});
			},

			// 开始音频可视化
			startAudioVisualization() {
				// 清除现有的可视化定时器
				this.stopAudioVisualization();

				// 创建一个新的可视化定时器，模拟音频可视化效果
				this.visualizerTimer = setInterval(() => {
					// 创建随机波形数据
					this.audioVisualizerData = Array(10).fill(0).map(() => {
						return Math.random() * 80 + 20; // 20-100之间的随机数
					});
				}, 100); // 每100ms更新一次
			},			// 停止音频可视化
			stopAudioVisualization() {
				if (this.visualizerTimer) {
					clearInterval(this.visualizerTimer);
					this.visualizerTimer = null;
				}
				this.audioVisualizerData = Array(10).fill(0); // 重置可视化数据
			},

			// 触摸开始录音（按下）
			startTouchRecording(e) {
				if (!this.isConnected) {
					this.addLog('请先连接到服务器', 'error');
					return;
				}

				// 如果已经在录音，先停止之前的录音
				if (this.isRecording || xiaozhiService.isCurrentlyRecording()) {
					this.addLog('检测到录音已在进行中，先停止之前的录音', 'warning');
					uni.getRecorderManager().stop();
					xiaozhiService.resetRecordingState();
					this.isRecording = false;
				}

				// 记录开始触摸的Y坐标和时间戳
				this.touchStartY = e.touches[0].clientY;
				this.isCancelRecording = false;
				this.recordStartTime = Date.now();
				this.isValidRecording = false;
				
				this.addLog('正在启动录音...', 'info');

				// 配置录音参数
				const options = {
					duration: 60000, // 最长60秒
					sampleRate: 16000, // 采样率16kHz，符合服务器要求
					numberOfChannels: 1, // 单声道
					encodeBitRate: 64000, // 编码比特率
					format: 'mp3', // 输出格式，使用mp3确保良好兼容性
					frameSize: 50 // 指定帧大小
				};

				const success = xiaozhiService.startRecording(options);
				if (!success) {
					this.addLog('录音启动失败', 'error');
					this.isRecording = false;
				} else {
					this.isRecording = true;
					// 启动录音超时保护
					this.recordingTimeout = setTimeout(() => {
						if (this.isRecording) {
							this.addLog('录音时间过长，自动停止', 'warning');
							this.stopRecording();
						}
					}, 60000);
					
					// 震动反馈
					uni.vibrateShort({
						success: () => {
							console.log('震动成功');
						}
					});
				}
			},
			
			// 触摸移动（检测是否上滑取消）
			touchMoveRecording(e) {
				if (!this.isRecording) return;
				
				const currentY = e.touches[0].clientY;
				const moveDistance = this.touchStartY - currentY;
				
				// rpx 转 px 的近似转换
				const cancelDistancePx = this.cancelDistance * (uni.getSystemInfoSync().windowWidth / 750);
				
				// 判断是否满足取消条件（上滑超过指定距离）
				if (moveDistance > cancelDistancePx) {
					if (!this.isCancelRecording) {
						this.isCancelRecording = true;
						// 震动反馈
						uni.vibrateShort();
					}
				} else {
					this.isCancelRecording = false;
				}
			},
			
			// 触摸结束录音（松开）
			endTouchRecording() {
				if (!this.isRecording) return;
				
				// 判断是否取消录音
				if (this.isCancelRecording) {
					this.cancelRecording();
				} else {
					this.finishRecording();
				}
			},
			
			// 取消触摸录音（触摸被取消，如来电等）
			cancelTouchRecording() {
				if (this.isRecording) {
					this.cancelRecording();
				}
			},
			
			// 取消录音
			cancelRecording() {
				this.addLog('取消录音', 'info');
				
				// 重置录音状态
				this.isRecording = false;
				this.isCancelRecording = false;
				
				// 清除录音超时
				if (this.recordingTimeout) {
					clearTimeout(this.recordingTimeout);
					this.recordingTimeout = null;
				}
				
				// 停止可视化
				this.stopAudioVisualization();
				
				// 停止录音但不发送
				if (xiaozhiService.isCurrentlyRecording()) {
					uni.getRecorderManager().stop();
					// 确保录音管理器状态重置
					setTimeout(() => {
						xiaozhiService.resetRecordingState();
					}, 300);
				}
				
				// 震动反馈
				uni.vibrateShort();
			},
			
			// 完成录音并发送
			finishRecording() {
				this.addLog('正在停止录音...', 'info');
				
				// 重置录音状态
				this.isRecording = false;
				this.isCancelRecording = false;
				
				// 清除录音超时
				if (this.recordingTimeout) {
					clearTimeout(this.recordingTimeout);
					this.recordingTimeout = null;
				}
				
				// 停止可视化
				this.stopAudioVisualization();
				
				// 检查录音是否满足最短录音时间要求
				const recordDuration = Date.now() - this.recordStartTime;
				if (recordDuration < this.minRecordDuration) {
					// 录音时间太短，视为误触
					this.addLog(`录音时间太短 (${recordDuration}ms)，不发送`, 'warning');
					
					// 显示提示
					uni.showToast({
						title: '说话时间太短',
						icon: 'none',
						duration: 1500
					});
					
					// 仅停止录音，不发送
					if (xiaozhiService.isCurrentlyRecording()) {
						uni.getRecorderManager().stop();
						xiaozhiService.resetRecordingState();
					}
					
					// 震动反馈
					uni.vibrateShort();
					return;				}
				
				// 停止录音并发送
				xiaozhiService.stopRecordingAndSend(undefined, this.selectedVoice)
					.catch(error => {
						this.addLog(`录音停止错误: ${error}`, 'error');
					});
				
				// 震动反馈
				uni.vibrateShort();
			},

			// 切换录音状态（保留此方法用于兼容，但不再使用）
			toggleRecording() {
				if (this.isRecording) {
					this.stopRecording();
				} else {
					this.startRecording();
				}
			},

			// 开始响应超时
			startResponseTimeout() {
				this.clearResponseTimeout(); // 清除已有的超时计时器
				this.responseTimeoutId = setTimeout(() => {
					this.addLog('服务器响应超时', 'error');
					this.isLoading = false; // 隐藏加载动画

					// 向用户显示超时提示信息
					this.addMessage('抱歉，服务器长时间未响应，请稍后再试', false);

					// 显示提示框
					uni.showToast({
						title: '服务器未响应',
						icon: 'none',
						duration: 2000
					});
				}, this.responseTimeoutDuration);
			},

			// 清除响应超时
			clearResponseTimeout() {
				if (this.responseTimeoutId) {
					clearTimeout(this.responseTimeoutId);
					this.responseTimeoutId = null;
				}
			},

			// 验证用户位置
			async verifyUserLocation() {
				if (this.isCheckingLocation) return;

				this.isCheckingLocation = true;
				this.locationStatusText = '正在验证位置...';
				this.locationBtnText = '验证中...';

				try {
					const result = await locationService.validateUserLocation();

					this.isCheckingLocation = false;

					if (result.success) {
						this.isLocationVerified = true;
						this.locationError = false;
						this.locationStatusText = '位置验证成功';
						this.locationDetails = result.message;
						this.currentLocation = result.location;
						this.addLog(result.message, 'success');
						this.connectToServer(); // 位置验证成功后自动连接服务器
					} else {
						this.isLocationVerified = false;
						this.locationError = true;
						this.locationStatusText = '位置验证失败';
						this.locationDetails = result.message;
						this.locationBtnText = '重试';
						this.addLog(result.message, 'error');

						// 如果是权限问题，提示用户打开设置
						if (result.needPermission) {
							uni.showModal({
								title: '需要位置权限',
								content: '请在设置中开启位置权限以使用本应用',
								confirmText: '去设置',
								success: (res) => {
									if (res.confirm) {
										locationService.openSetting().then(result => {
											if (result) {
												this.verifyUserLocation();
											}
										});
									}
								}
							});
						}
					}

				} catch (error) {
					this.isCheckingLocation = false;
					this.isLocationVerified = false;
					this.locationError = true;
					this.locationStatusText = '位置验证出错';
					this.locationDetails = '无法获取位置信息，请检查权限设置';
					this.locationBtnText = '重试';
					this.addLog('位置验证错误: ' + JSON.stringify(error), 'error');
				}
			},

			// 开始定时检查位置
			startLocationCheck() {
				// 每3分钟检查一次位置
				this.locationCheckInterval = setInterval(() => {
					// 只有已验证过位置才进行后续检查
					if (this.isLocationVerified) {
						this.checkLocationStillValid();
					}
				}, 3 * 60 * 1000);
			},

			// 停止定时检查
			stopLocationCheck() {
				if (this.locationCheckInterval) {
					clearInterval(this.locationCheckInterval);
					this.locationCheckInterval = null;
				}
			},

			// 检查位置是否仍然有效
			async checkLocationStillValid() {
				try {
					const location = await locationService.getCurrentLocation();
					const validationResult = locationService.validateLocation(location);

					if (!validationResult.isAllowed) {
						this.isLocationVerified = false;
						this.locationError = true;
						this.locationStatusText = '位置已更改';
						this.locationDetails = `您已离开允许的区域，请返回${validationResult.nearestLocation.name}`;
						this.locationBtnText = '重新验证';
						this.addLog('用户已离开允许区域，应用已锁定', 'warning');

						// 如果正在连接，断开连接
						if (this.isConnected) {
							this.disconnectFromServer();
						}

						// 显示提示
						uni.showToast({
							title: '您已离开允许区域',
							icon: 'none',
							duration: 3000
						});
					}
				} catch (error) {
					console.error('检查位置有效性失败:', error);
				}
			}
		}
	}
</script>

<style scoped>
	/* 容器样式 */
	.container {
		position: relative;
		width: 100%;
		height: 100vh;
		background-color: #f8f9fa;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
	}

	/* 侧拉导航栏遮罩 */
	.drawer-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 998;
		opacity: 0;
		visibility: hidden;
		transition: all 0.3s ease;
	}

	.drawer-overlay.show {
		opacity: 1;
		visibility: visible;
	}

	/* 侧拉导航栏 */
	.drawer {
		position: fixed;
		top: 0;
		left: -600rpx;
		width: 600rpx;
		height: 100%;
		background-color: #fff;
		z-index: 999;
		transition: left 0.3s ease;
		box-shadow: 2rpx 0 8rpx rgba(0, 0, 0, 0.1);
	}

	.drawer.show {
		left: 0;
	}

	/* 侧拉导航栏头部 */
	.drawer-header {
		padding: 80rpx 20rpx 40rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		/* text-align: center; */
		color: white;
	}

	.drawer-logo {
		width: 100rpx;
		height: 100rpx;
		border-radius: 5rpx;
		/* margin-bottom: 20rpx; */
	}

	.drawer-title {
		font-size: 36rpx;
		font-weight: bold;
		margin-bottom: 100rpx;
	}

	/* 侧拉导航栏菜单 */
	.drawer-menu {
		padding: 40rpx 0;
	}

	.menu-item {
		display: flex;
		align-items: center;
		padding: 30rpx 40rpx;
		border-bottom: 1rpx solid #f0f0f0;
		transition: background-color 0.2s;
	}

	.menu-item:active {
		background-color: #f5f5f5;
	}

	.menu-item.active {
		background-color: #e6f7ff;
		border-right: 6rpx solid #1890ff;
	}

	.menu-icon {
		font-size: 40rpx;
		margin-right: 30rpx;
		width: 40rpx;
		text-align: center;
	}

	.menu-text {
		font-size: 32rpx;
		color: #333;
		font-weight: 500;
	}

	.menu-item.active .menu-text {
		color: #1890ff;
	}

	/* 主内容区域 */
	.main-content {
		max-width: 90%;
		height: 100vh;
		display: flex;
		flex-direction: column;
		padding: 20rpx;
	}

	/* 顶部导航栏 */
	.top-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 100rpx;
		padding: 0 20rpx;
		background-color: #fff;
		border-radius: 16rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
	}

	.nav-left {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		background-color: #f5f5f5;
		transition: background-color 0.2s;
	}

	.nav-left:active {
		background-color: #e8e8e8;
	}

	.menu-btn {
		font-size: 36rpx;
		color: #333;
	}

	.nav-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
	}

	.nav-right {
		display: flex;
		align-items: center;
	}

	/* 连接状态指示器 */
	.connection-indicator {
		display: flex;
		align-items: center;
		padding: 8rpx 16rpx;
		border-radius: 20rpx;
		background-color: #fff2f0;
		border: 1rpx solid #ffccc7;
		transition: all 0.2s;
	}

	.connection-indicator.connected {
		background-color: #f6ffed;
		border-color: #b7eb8f;
	}

	.connection-indicator:active {
		transform: scale(0.95);
	}

	.status-dot {
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		background-color: #ff4d4f;
		margin-right: 8rpx;
	}

	.connection-indicator.connected .status-dot {
		background-color: #52c41a;
	}

	.status-text {
		font-size: 24rpx;
		color: #ff4d4f;
	}

	.connection-indicator.connected .status-text {
		color: #52c41a;
	}

	/* 添加按钮样式 */
	.newPageHeader {
		position: relative;
		padding: 15rpx 0;
		}

	.nav-button {
		position: absolute;
		left: 20rpx;
		top: 50%;
		transform: translateY(-50%);
		padding: 8rpx 20rpx;
		background: rgba(255, 255, 255, 0.9);
		border: 1rpx solid #eaeaea;
		border-radius: 30rpx;
		font-size: 24rpx;
		color: #333;
		box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
		z-index: 1;
		display: flex;
		align-items: center;
		gap: 8rpx;
	}

	.nav-button::after {
		content: '';
		border: none; /* 去除uniapp按钮默认边框 */
	}
	.container {
		padding: 20rpx;
		background-color: #f8f9fa;
		max-height: 95vh;
		height: 95vh;
		display: flex;
		flex-direction: column;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
	}

	.header {
		text-align: center;
		margin-bottom: 20rpx;
		padding: 15rpx 0;
	}

	.title {
		font-size: 38rpx;
		font-weight: bold;
		color: #333;
		text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
		letter-spacing: 1rpx;
	}

	.location-verification {
		background-color: #fff;
		border-radius: 16rpx;
		padding: 20rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
		border: 1rpx solid #eaeaea;
		text-align: center;
	}
	.location-allowed {
		color: #52c41a;
	}

	.location-denied {
		color: #ff4d4f;
	}
	.location-status {
		font-size: 36rpx;
		margin-bottom: 30rpx;
		line-height: 1.4;
		color: #1890ff;
	}
	.location-allowed {
		color: #52c41a;
	}

	.location-details {
		font-size: 28rpx;
		color: #666;
		line-height: 1.6;
		padding: 0 40rpx;
	}

	.location-btn {
		width: 60%;
		min-width: 240rpx;
		max-width: 400rpx;
		height: 80rpx;
		line-height: 80rpx;
		border-radius: 40rpx;
		background: #1890ff;
		color: white;
		font-size: 32rpx;
		margin: 0 auto 20rpx;
		transition: all 0.3s;
	}
	.connection-section {
		background-color: #fff;
		border-radius: 16rpx;
		padding: 20rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
		border: 1rpx solid #eaeaea;
	}

	.connection-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
		padding: 10rpx 5rpx;
	}

	.connection-title {
		display: flex;
		align-items: center;
		gap: 16rpx;
		font-weight: 500;
		font-size: 30rpx;
		color: #444;
	}

	.toggle-arrow {
		width: 32rpx;
		height: 32rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.3s ease;
		opacity: 0.6;
	}

	.triangle {
		width: 0;
		height: 0;
		border-left: 8rpx solid transparent;
		border-right: 8rpx solid transparent;
		border-top: 12rpx solid #666;
	}

	.toggle-arrow.expanded {
		transform: rotate(180deg);
	}

	.connection-status {
		font-size: 26rpx;
		padding: 4rpx 14rpx;
		border-radius: 50rpx;
		background-color: #fff2f0;
		color: #ff4d4f;
		font-weight: normal;
	}

	.connection-status.connected {
		background-color: #f6ffed;
		color: #52c41a;
	}

	.conversation {
		flex: 1;
		background-color: #fff;
		border-radius: 16rpx;
		padding: 20rpx;
		margin-bottom: 20rpx;
		width:94%;
		/* max-width: 672rpx; */
		max-height: 65vh;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
		border: 1rpx solid #eaeaea;
		position: relative;
		scrollbar-width: none;
		/* Firefox */
		-ms-overflow-style: none;
		/* IE and Edge */
		-webkit-overflow-scrolling: touch;
		/* 保持在 iOS 上滚动的流畅性 */
	}

	/* 隐藏滚动条 */
	.conversation ::-webkit-scrollbar {
		display: none;
		width: 0 !important;
		height: 0 !important;
		-webkit-appearance: none;
		background: transparent;
	}

	.conversation-inner {
		padding: 10rpx;
		min-height: 100%;
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

	.message-input-container {
		display: flex;
		gap: 16rpx;
		margin-bottom: 20rpx;
	}

	.input-wrapper {
		flex: 1;
		position: relative;
		display: flex;
		align-items: center;
		background-color: #fff;
		border-radius: 12rpx;
		padding: 0 5rpx 0 20rpx;
		box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.07);
		border: 1rpx solid #e8e8e8;
	}

	.message-input {
		flex: 1;
		padding: 15rpx 0;
		font-size: 28rpx;
		border: none;
		background-color: transparent;
	}

	.send-btn {
		width: 68rpx;
		height: 68rpx;
		border-radius: 35rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #1890ff;
		transition: all 0.3s;
		border: none;
		padding: 0;
		margin: 3rpx;
	}

	.send-btn:active {
		transform: scale(0.95);
		background-color: #096dd9;
	}

	.send-btn[disabled] {
		background-color: #c2c1c1;
		opacity: 0.5;
	}

	.send-icon {
		width: 0;
		height: 0;
		border-top: 10rpx solid transparent;
		border-bottom: 10rpx solid transparent;
		border-left: 16rpx solid white;
		margin-left: 5rpx;
	}

	.connection-form {
		display: flex;
		gap: 20rpx;
		margin-top: 15rpx;
		padding-top: 15rpx;
		border-top: 1rpx solid #f0f0f0;
		animation: slideDown 0.3s ease;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10rpx);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.server-input {
		flex: 1;
		padding: 15rpx 20rpx;
		border: 1rpx solid #e8e8e8;
		border-radius: 8rpx;
		font-size: 28rpx;
		background-color: #fafafa;
		transition: all 0.3s;
	}

	.server-input:focus {
		border-color: #40a9ff;
		background-color: #fff;
		box-shadow: 0 0 0 2rpx rgba(24, 144, 255, 0.2);
	}

	.connect-btn {
		background-color: #1890ff;
		color: white;
		font-size: 28rpx;
		padding: 0 30rpx;
		height: 70rpx;
		line-height: 70rpx;
		border-radius: 8rpx;
		border: none;
		transition: all 0.3s;
		box-shadow: 0 2rpx 5rpx rgba(24, 144, 255, 0.2);
	}

	.connect-btn:active {
		background-color: #096dd9;
	}

	.disconnect-btn {
		background-color: #ff4d4f;
		box-shadow: 0 2rpx 5rpx rgba(255, 77, 79, 0.2);
	}

	.disconnect-btn:active {
		background-color: #cf1322;
	}

	.record-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		background-color: #52c41a;
		color: white;
		font-size: 28rpx;
		height: 76rpx;
		padding: 0 25rpx;
		border-radius: 12rpx;
		transition: all 0.3s;
		border: none;
		box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.07);
	}

	.record-btn:active {
		transform: scale(0.97);
		background-color: #389e0d;
	}

	.record-btn[disabled] {
		background-color: #d9d9d9;
		opacity: 0.5;
	}
	.record-btn.recording {
		background-color: #ff4d4f;
		animation: pulse 1.5s infinite;
	}
	
	.record-btn.cancel-recording {
		background-color: #ff7875;
	}

	.cancel-recording-tip {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background-color: rgba(255, 77, 79, 0.9);
		color: white;
		padding: 10rpx 20rpx;
		border-radius: 8rpx;
		display: flex;
		align-items: center;
		gap: 10rpx;
		font-size: 26rpx;
		animation: fadeIn 0.2s ease;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
	}
	
	.cancel-icon {
		width: 28rpx;
		height: 28rpx;
		position: relative;
	}
	
	.cancel-icon:before, .cancel-icon:after {
		content: '';
		position: absolute;
		width: 100%;
		height: 4rpx;
		background-color: white;
		top: 50%;
		left: 0;
	}
	
	.cancel-icon:before {
		transform: translateY(-50%) rotate(45deg);
	}
	
	.cancel-icon:after {
		transform: translateY(-50%) rotate(-45deg);
	}

	.mic-icon {
		width: 32rpx;
		height: 32rpx;
		border-radius: 50%;
		background-color: white;
		position: relative;
	}

	.mic-icon::before {
		content: '';
		position: absolute;
		width: 16rpx;
		height: 16rpx;
		background-color: currentColor;
		border-radius: 50%;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}

	.mic-icon::after {
		content: '';
		position: absolute;
		width: 10rpx;
		height: 10rpx;
		border: 2rpx solid currentColor;
		border-radius: 50%;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		animation: ripple 1.5s infinite;
		opacity: 0;
	}

	.recording .mic-icon::after {
		opacity: 1;
	}

	@keyframes pulse {
		0% {
			background-color: #ff4d4f;
		}

		50% {
			background-color: #ff7875;
		}

		100% {
			background-color: #ff4d4f;
		}
	}

	@keyframes ripple {
		0% {
			width: 0;
			height: 0;
			opacity: 1;
		}

		100% {
			width: 24rpx;
			height: 24rpx;
			opacity: 0;
		}
	}

	.audio-visualizer {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		height: 120rpx;
		min-height: 120rpx;
		margin-bottom: 20rpx;
		padding: 15rpx;
		background-color: rgba(255, 255, 255, 0.9);
		border-radius: 16rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
		border: 1rpx solid #eaeaea;
		animation: fadeIn 0.3s ease;
	}

	.visualizer-bar {
		width: 9%;
		background: linear-gradient(to top, #52c41a, #1890ff);
		border-radius: 6rpx;
		transition: height 0.1s ease;
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

	/* 日志部分样式 */
	.log-container {
		background-color: #fff;
		border-radius: 16rpx;
		padding: 20rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
		border: 1rpx solid #eaeaea;
		height: 300rpx;
		display: flex;
		flex-direction: column;
		margin-top: 10rpx;
	}

	/* 语音识别结果显示样式 */
	.speech-recognition-container {
		background-color: #fff;
		border-radius: 16rpx;
		padding: 15rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
		border: 1rpx solid #eaeaea;
		animation: fadeIn 0.3s ease;
	}

	.speech-recognition-text {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 10rpx;
		padding: 10rpx;
		background-color: #e3f2fd;
		color: #0d47a1;
		border-radius: 18rpx;
		border-bottom-right-radius: 4rpx;
		font-size: 28rpx;
		box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
		position: relative;
	}

	.speech-recognition-text::after {
		content: '';
		position: absolute;
		bottom: 0;
		right: -10rpx;
		width: 0;
		height: 0;
		border-left: 10rpx solid transparent;
		border-right: 10rpx solid transparent;
		border-bottom: 15rpx solid #e3f2fd;
		transform: rotate(45deg);
	}

	.recognition-icon {
		margin-left: 5rpx;
		opacity: 0.7;
	}

	.mic-small-icon {
		width: 24rpx;
		height: 24rpx;
		border-radius: 50%;
		background-color: #0d47a1;
		position: relative;
	}

	.mic-small-icon::before {
		content: '';
		position: absolute;
		width: 10rpx;
		height: 10rpx;
		background-color: white;
		border-radius: 50%;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}

	.log-title {
		font-size: 28rpx;
		font-weight: 500;
		margin-bottom: 15rpx;
		color: #444;
	}

	.log-content {
		flex: 1;
		font-family: monospace;
		font-size: 24rpx;
		background-color: #fafafa;
		border-radius: 8rpx;
		padding: 10rpx;
	}

	.log-entry {
		margin: 8rpx 0;
		line-height: 1.5;
		padding: 4rpx 8rpx;
		border-radius: 4rpx;
	}

	.log-entry.info {
		color: #333;
	}

	.log-entry.error {
		color: #ff4d4f;
		background-color: rgba(255, 77, 79, 0.1);
	}

	.log-entry.success {
		color: #52c41a;
		background-color: rgba(82, 196, 26, 0.1);
	}

	.log-entry.warning {
		color: #faad14;
		background-color: rgba(250, 173, 20, 0.1);
	}
	/* 使更新后文字和按钮处于正确位置 */
	.status-box {
		position: relative;
		min-height: 300rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 40rpx;
	}
	.centered-content {
		width: 100%;
		text-align: center;
	}

	.status-box.hide {
		max-height: 0;
		opacity: 0;
		padding: 0;
		margin: 0;
	}
	.location-status {
		font-size: 36rpx;
		margin-bottom: 30rpx;
		color: #333;
		line-height: 1.4;
	}
	.verify-button {
		width: 60%;
		min-width: 240rpx;
		max-width: 400rpx;
		height: 80rpx;
		line-height: 80rpx;
		border-radius: 40rpx;
		background: #1890ff;
		color: white;
		font-size: 32rpx;
		margin: 0 auto 20rpx;
		transition: all 0.3s;
	}
	.details-text {
		font-size: 28rpx;
		color: #666;
		line-height: 1.6;
		padding: 0 40rpx;
	}
	/* 在原有样式基础上补充 */
	.success-box {
		background: #f6ffed;
		border: 1px solid #b7eb8f;
	}

	.error-box {
		background: #fff2f0;
		border: 1px solid #ffccc7;
	}

	/* 未验证状态 */
	.status-box:not(.success-box):not(.error-box) {
		background: #fffbe6;
		border: 1px solid #ffe58f;
	}
	/*改变音色系统的样式 */
	.voice-drawer {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 9999;
		pointer-events: none; /* 初始禁止交互 */
	}

	/* 显示时的遮罩层 */
	.drawer-mask {
		position: absolute;
		width: 100%;
		height: 100%;
		background: rgba(0,0,0,0.5);
		opacity: 0;
		transition: opacity 0.3s;
	}

	/* 抽屉内容区域 */
	.drawer-content {
		position: absolute;
		bottom: -100%;
		left: 0;
		width: 100%;
		height: 65vh;
		background: #fff;
		border-radius: 32rpx 32rpx 0 0;
		box-shadow: 0 -8rpx 40rpx rgba(0,0,0,0.15);
		transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
		padding: 32rpx;
		pointer-events: auto;
	}

	/* 显示状态 */
	.voice-drawer.show {
		pointer-events: auto;
	}
	.voice-drawer.show .drawer-mask {
		opacity: 1;
	}
	.voice-drawer.show .drawer-content {
		bottom: 0;
	}

	/* 音色列表项 */
	.voice-item {
		padding: 32rpx;
		margin: 20rpx 0;
		border-radius: 16rpx;
		background: #f8f8f8;
		display: flex;
		justify-content: space-between;
		align-items: center;
		transition: all 0.2s;
		position: relative;
	}

	.voice-item.selected {
		background: linear-gradient(135deg, #e3f2fd, #f0f9ff);
		box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.2);
	}

	/* 选中标记 */
	.check-icon {
		color: #1890ff;
		font-weight: bold;
		font-size: 36rpx;
	}

	/* 触发按钮样式 */
	.voice-btn {
		padding: 8rpx 24rpx;
		background: rgba(255,255,255,0.95);
		border: 1rpx solid #e0e0e0;
		border-radius: 48rpx;
		font-size: 28rpx;
		color: #333;
		box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08);
		margin-left: 20rpx;
		transition: all 0.2s;
	}

	.voice-btn:active {
		transform: scale(0.96);
		background: #f8f8f8;
	}

	/* 新消息提示样式 */
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
		0%, 100% {
			box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.3);
		}
		50% {
			box-shadow: 0 6rpx 20rpx rgba(24, 144, 255, 0.5);
		}
	}

	@keyframes arrowBounce {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(3rpx);
		}
	}
</style>