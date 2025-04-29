<template>
	<view class="container">
		<view class="header">
			<text class="title">苏博导智能体</text>
		</view>

		<!-- 服务器连接部分 -->
		<view class="connection-section">
			<view class="connection-header" @click="toggleConnectionPanel">
				<view class="connection-title">
					<text>连接服务</text>
					<text class="connection-status" :class="{ connected: isConnected }">{{ connectionStatusText
					}}</text>
				</view>
				<view class="toggle-arrow" :class="{ expanded: showConnectionPanel }">
					<view class="triangle"></view>
				</view>
			</view>
			<view class="connection-form" v-if="showConnectionPanel">
				<input class="server-input" v-model="serverUrl" placeholder="WebSocket服务器地址" />
				<button class="connect-btn" :class="{ 'disconnect-btn': isConnected }" @click="toggleConnection">
					{{ isConnected ? '断开' : '连接' }}
				</button>
			</view>
		</view>

		<!-- 消息记录部分 -->
		<scroll-view class="conversation" scroll-y="true" :scroll-top="scrollTop">
			<view class="conversation-inner">
				<view v-for="(msg, index) in messages" :key="index" class="message" :class="{ user: msg.isUser }">
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
		</scroll-view>

		<!-- 消息输入部分 -->
		<view class="message-input-container">
			<view class="input-wrapper">
				<input class="message-input" v-model="messageText" placeholder="输入消息..." :disabled="!isConnected"
					@confirm="sendMessage" />
				<button class="send-btn" @click="sendMessage" :disabled="!isConnected || !messageText.trim()">
					<view class="send-icon"></view>
				</button>
			</view>
			<button class="record-btn" @click="toggleRecording" :disabled="!isConnected"
				:class="{ recording: isRecording }">
				<view class="mic-icon"></view>
				<text>{{ isRecording ? '停止' : '录音' }}</text>
			</button>
		</view>

		<!-- 录音可视化显示 -->
		<view v-if="isRecording" class="audio-visualizer">
			<view class="visualizer-bar" v-for="(value, index) in audioVisualizerData" :key="index"
				:style="{ height: value + '%' }"></view>
		</view>

		<!-- 日志部分 -->
		<!-- 		<view class="log-container">
			<text class="log-title">日志</text>
			<scroll-view class="log-content" scroll-y="true" :scroll-top="logScrollTop">
				<view v-for="(log, index) in logs" :key="index" class="log-entry" :class="log.type">
					<text>{{log.time}} - {{log.message}}</text>
				</view>
			</scroll-view>
		</view> -->
	</view>
</template>

<script>
	import xiaozhiService from '../../utils/xiaozhi-service.js';

	export default {
		data() {
			return {
				serverUrl: 'ws://10.10.81.91:8082/xiaozhi/v1/',
				isConnected: false,
				connectionStatusText: '未连接',
				messageText: '',
				messages: [],
				logs: [],
				scrollTop: 0,
				logScrollTop: 0,
				isRecording: false,
				isLaoding: false,
				audioVisualizerData: Array(10).fill(0), // 假设有10个柱状图
				showConnectionPanel: false // 控制连接面板是否展开
			}
		},
		onLoad() {
			// 添加初始日志
			this.addLog('准备就绪，请连接服务器开始测试...', 'info');

			// 自动连接服务器
			this.connectToServer();

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
				},
				// 错误回调
				(err) => {
					this.addLog(`录音错误: ${JSON.stringify(err)}`, 'error');
					this.isRecording = false;
				}
			);
		},
		methods: {
			// 切换连接状态
			toggleConnection() {
				if (this.isConnected) {
					this.disconnectFromServer();
				} else {
					this.connectToServer();
				}
			},

			// 切换连接面板的显示状态
			toggleConnectionPanel() {
				this.showConnectionPanel = !this.showConnectionPanel;
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
					}
				).catch(error => {
					this.addLog(`连接失败: ${error}`, 'error');
					this.connectionStatusText = '连接失败';
				});
			},

			// 断开服务器连接
			disconnectFromServer() {
				xiaozhiService.disconnectFromServer();
				this.isConnected = false;
				this.connectionStatusText = '已断开';
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

				// 发送到服务器
				xiaozhiService.sendTextMessage(message).catch(error => {
					this.addLog(`发送失败: ${error}`, 'error');
					// 发送失败时隐藏加载动画
					this.isLoading = false;
				});

				// 清空输入框
				this.messageText = '';
			},

			// 处理服务器消息
			handleServerMessage(message) {
				if (message.type === 'hello') {
					this.addLog(`服务器回应: ${message.message}`, 'info');
					// 隐藏加载动画
					this.isLoading = false;
				} else if (message.type === 'tts') {
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

			// 添加消息到会话记录
			addMessage(text, isUser = false) {
				this.messages.push({
					text,
					isUser
				});

				// 滚动到底部
				this.$nextTick(() => {
					this.scrollTop = 9999999;
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
				this.stopAudioVisualization();

				// 停止录音并发送
				xiaozhiService.stopRecordingAndSend()
					.catch(error => {
						this.addLog(`录音停止错误: ${error}`, 'error');
					});
			},

			// 发送录音文件到服务器
			sendRecordFile(filePath) {
				this.addLog('正在准备发送录音文件...', 'info');

				// 显示加载动画
				this.isLoading = true;

				// 使用xiaozhi-service的统一接口发送录音
				xiaozhiService.sendAudioFile(filePath)
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
			},

			// 停止音频可视化
			stopAudioVisualization() {
				if (this.visualizerTimer) {
					clearInterval(this.visualizerTimer);
					this.visualizerTimer = null;
				}
				this.audioVisualizerData = Array(10).fill(0); // 重置可视化数据
			},

			// 切换录音状态
			toggleRecording() {
				if (this.isRecording) {
					this.stopRecording();
				} else {
					this.startRecording();
				}
			}
		}
	}
</script>

<style>
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
		max-width: 672rpx;
		max-height: 65vh;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
		border: 1rpx solid #eaeaea;
		position: relative;
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
		transform: rotate(45deg);
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
		transform: rotate(-45deg);
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
		padding: 16rpx 24rpx;
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
</style>
