<template>
	<view class="container">
		<view class="header">
			<text class="title">苏博导智能体</text>
		</view>

		<!-- 服务器连接部分 -->
		<view class="connection-section">
			<view class="connection-header">
				<text>WebSocket连接</text>
				<text class="connection-status" :class="{ connected: isConnected }">{{ connectionStatusText }}</text>
			</view>
			<view class="connection-form">
				<input class="server-input" v-model="serverUrl" placeholder="WebSocket服务器地址" />
				<button class="connect-btn" @click="toggleConnection">{{ isConnected ? '断开' : '连接' }}</button>
			</view>
		</view>

		<!-- 消息记录部分 -->
		<scroll-view class="conversation" scroll-y="true" :scroll-top="scrollTop">
			<view v-for="(msg, index) in messages" :key="index" class="message" :class="{ user: msg.isUser }">
				<text>{{ msg.text }}</text>
			</view>
		</scroll-view>

		<!-- 消息输入部分 -->
		<view class="message-input-container">
			<input class="message-input" v-model="messageText" placeholder="输入消息..." :disabled="!isConnected"
				@confirm="sendMessage" />
			<button class="send-btn" @click="sendMessage" :disabled="!isConnected || !messageText.trim()">发送</button>
			<button class="record-btn" @click="toggleRecording" :disabled="!isConnected"
				:class="{ recording: isRecording }">
				{{ isRecording ? '停止录音' : '录音' }}
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
				// 修改这里，避免使用 Array(n).fill() 方法
				audioVisualizerData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
			}
		},
		onLoad() {
			// 添加初始日志
			this.addLog('准备就绪，请连接服务器开始测试...', 'info');

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

			// 连接到服务器
			connectToServer() {
				try {
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
						console.error('连接错误:', error);
						this.addLog(`连接失败: ${error?.message || '未知错误'}`, 'error');
						this.connectionStatusText = '连接失败';
					});
				} catch (err) {
					console.error('连接过程异常:', err);
					this.addLog(`连接异常: ${err?.message || '未知异常'}`, 'error');
					this.connectionStatusText = '连接异常';
				}
			},

			// 断开服务器连接
			disconnectFromServer() {
				xiaozhiService.disconnectFromServer();
				this.isConnected = false;
				this.connectionStatusText = '已断开';
				this.addLog('已断开连接', 'info');
			},

			// 发送消息
			sendMessage() {
				if (!this.messageText.trim() || !this.isConnected) return;

				const message = this.messageText.trim();
				this.addLog(`发送消息: ${message}`, 'info');

				// 添加到消息列表
				this.addMessage(message, true);

				// 发送到服务器
				xiaozhiService.sendTextMessage(message).catch(error => {
					this.addLog(`发送失败: ${error}`, 'error');
				});

				// 清空输入框
				this.messageText = '';
			},

			// 处理服务器消息
			handleServerMessage(message) {
				if (message.type === 'hello') {
					this.addLog(`服务器回应: ${message.message}`, 'info');
				} else if (message.type === 'tts') {
					// TTS状态消息
					if (message.state === 'start') {
						this.addLog('服务器开始发送语音', 'info');
					} else if (message.state === 'sentence_start') {
						this.addLog(`服务器发送语音段: ${message.text}`, 'info');
						// 添加文本到会话记录
						if (message.text) {
							this.addMessage(message.text, false);
						}
					} else if (message.state === 'sentence_end') {
						this.addLog(`语音段结束: ${message.text}`, 'info');
					} else if (message.state === 'stop') {
						this.addLog('服务器语音传输结束', 'info');
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
					}
				} else {
					// 未知消息类型
					this.addLog(`未知消息类型: ${message.type}`, 'info');
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

				// 使用xiaozhi-service的统一接口发送录音
				xiaozhiService.sendAudioFile(filePath)
					.then(() => {
						this.addLog('音频数据发送成功', 'success');
					})
					.catch(error => {
						this.addLog(`发送录音错误: ${error}`, 'error');

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
					// 创建新数组而不是直接修改
					const newData = [];
					for (let i = 0; i < 10; i++) {
						newData.push(Math.random() * 80 + 20); // 20-100之间的随机数
					}
					this.audioVisualizerData = newData;
				}, 100); // 每100ms更新一次
			},

			// 停止音频可视化
			stopAudioVisualization() {
				if (this.visualizerTimer) {
					clearInterval(this.visualizerTimer);
					this.visualizerTimer = null;
				}
				// 同样使用明确的数组
				this.audioVisualizerData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
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
		background-color: #f5f5f5;
		height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.header {
		text-align: center;
		margin-bottom: 20rpx;
	}

	.title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
	}

	.connection-section {
		background-color: #fff;
		border-radius: 10rpx;
		padding: 20rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
	}

	.connection-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.connection-status {
		font-size: 24rpx;
		color: #ff4d4f;
	}

	.connection-status.connected {
		color: #52c41a;
	}

	.connection-form {
		display: flex;
		gap: 20rpx;
	}

	.server-input {
		flex: 1;
		padding: 10rpx 20rpx;
		border: 1px solid #ddd;
		border-radius: 5rpx;
		font-size: 28rpx;
	}

	.connect-btn {
		background-color: #1890ff;
		color: white;
		font-size: 28rpx;
		padding: 0 30rpx;
		height: 70rpx;
		line-height: 70rpx;
	}

	.conversation {
		flex: 1;
		background-color: #fff;
		border-radius: 10rpx;
		padding: 20rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
	}

	.message {
		max-width: 80%;
		padding: 16rpx 24rpx;
		border-radius: 16rpx;
		margin-bottom: 20rpx;
		word-break: break-word;
	}

	.message.user {
		background-color: #e2f2ff;
		margin-left: auto;
		text-align: right;
	}

	.message:not(.user) {
		background-color: #f0f0f0;
		margin-right: auto;
	}

	.message-input-container {
		display: flex;
		gap: 20rpx;
		margin-bottom: 20rpx;
	}

	.message-input {
		flex: 1;
		padding: 10rpx 20rpx;
		border: 1px solid #ddd;
		border-radius: 5rpx;
		font-size: 28rpx;
	}

	.send-btn {
		background-color: #1890ff;
		color: white;
		font-size: 28rpx;
		padding: 0 30rpx;
		height: 70rpx;
		line-height: 70rpx;
	}

	.record-btn {
		background-color: #52c41a;
		color: white;
		font-size: 28rpx;
		padding: 0 30rpx;
		height: 70rpx;
		line-height: 70rpx;
		transition: all 0.3s;
	}

	.record-btn.recording {
		background-color: #ff4d4f;
		animation: pulse 1.5s infinite;
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

	.audio-visualizer {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		height: 100rpx;
		margin: 20rpx 0;
		padding: 10rpx;
		background-color: #f9f9f9;
		border-radius: 10rpx;
	}

	.visualizer-bar {
		width: 9%;
		height: 20%;
		background: linear-gradient(to top, #52c41a, #1890ff);
		border-radius: 3rpx;
		transition: height 0.1s ease;
	}

	.log-container {
		background-color: #fff;
		border-radius: 10rpx;
		padding: 20rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
		height: 300rpx;
		display: flex;
		flex-direction: column;
	}

	.log-title {
		font-size: 28rpx;
		font-weight: bold;
		margin-bottom: 10rpx;
	}

	.log-content {
		flex: 1;
		font-family: monospace;
		font-size: 24rpx;
	}

	.log-entry {
		margin: 5rpx 0;
		line-height: 1.5;
	}

	.log-entry.info {
		color: #333;
	}

	.log-entry.error {
		color: #ff4d4f;
	}

	.log-entry.success {
		color: #52c41a;
	}

	.log-entry.warning {
		color: #faad14;
	}
</style>
