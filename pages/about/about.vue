<template>
	<view class="about-container">
		<view class="header">
			<image class="logo" src="/static/logo.png" mode="aspectFit"></image>
			<text class="app-name">苏博导智能体</text>
			<text class="version">版本 2.0.1</text>
		</view>

		<view class="info-section">
			<view class="info-item">
				<text class="label">应用介绍</text>
				<text class="content">苏州大学博物馆智能语音助手，为您提供专业的博物馆导览服务，支持语音交互和智能问答。</text>
			</view>

			<view class="info-item">
				<text class="label">主要功能</text>
				<view class="feature-list">
					<text class="feature">• 智能语音对话</text>
					<text class="feature">• 多种音色选择</text>
					<text class="feature">• 实时位置验证</text>
					<text class="feature">• 文字语音互转</text>
				</view>
			</view>

			<view class="info-item">
				<text class="label">开发团队</text>
				<view class="team-info">
					<text class="content">苏州大学计算机科学与技术学院</text>
					<text class="content">核心研究人员：唐子抗、彭凯恩、刘亦君、倪羽辰</text>
					<text class="content">指导老师：邓滔、贾俊铖</text>
				</view>
			</view>

			<view class="info-item">
				<text class="label">技术支持</text>
				<text class="content">基于AI语音识别和自然语言处理技术</text>
			</view>
		</view>

		<view class="contact-section">
			<view class="section-title">
				<text>联系我们</text>
			</view>
			<view class="contact-item" @click="copyEmail">
				<text class="contact-label">邮箱</text>
				<text class="contact-value">dengtao@suda.edu.cn</text>
			</view>
			<view class="contact-item" @click="copyPhone">
				<text class="contact-label">电话</text>
				<text class="contact-value">0512-67501234</text>
			</view>
		</view>

		<view class="footer">
			<text class="copyright">© 2024 苏州大学. 保留所有权利.</text>
			<view class="links">
				<text class="link" @click="showPrivacy">隐私政策</text>
				<text class="divider">|</text>
				<text class="link" @click="showTerms">使用条款</text>
			</view>
		</view>
	</view>
</template>

<script setup>
	// 复制邮箱
	const copyEmail = () => {
		uni.setClipboardData({
			data: 'dengtao@suda.edu.cn',
			success: () => {
				uni.showToast({
					title: '邮箱已复制',
					icon: 'success'
				});
			}
		});
	};

	// 复制电话
	const copyPhone = () => {
		uni.setClipboardData({
			data: '0512-67501234',
			success: () => {
				uni.showToast({
					title: '电话已复制',
					icon: 'success'
				});
			}
		});
	};

	// 显示隐私政策
	const showPrivacy = () => {
		uni.showModal({
			title: '隐私政策',
			content: '我们重视您的隐私保护，仅收集必要的位置和语音信息用于提供服务，不会泄露给第三方。',
			showCancel: false
		});
	};

	// 显示使用条款
	const showTerms = () => {
		uni.showModal({
			title: '使用条款',
			content: '请在博物馆指定区域内使用本应用，遵守相关使用规范，合理使用语音服务。',
			showCancel: false
		});
	};
</script>

<style scoped>
	.about-container {
		padding: 20rpx;
		background-color: #f5f5f5;
		min-height: 100vh;
	}

	.header {
		text-align: center;
		padding: 60rpx 0;
		background-color: #fff;
		border-radius: 16rpx;
		margin-bottom: 30rpx;
	}

	.logo {
		width: 120rpx;
		height: 120rpx;
		margin-bottom: 30rpx;
	}

	.app-name {
		display: block;
		font-size: 48rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 16rpx;
	}

	.version {
		font-size: 28rpx;
		color: #999;
	}

	.info-section {
		background-color: #fff;
		border-radius: 16rpx;
		margin-bottom: 30rpx;
		overflow: hidden;
	}

	.info-item {
		padding: 40rpx;
		border-bottom: 1rpx solid #f8f8f8;
	}

	.info-item:last-child {
		border-bottom: none;
	}

	.label {
		display: block;
		font-size: 32rpx;
		font-weight: 600;
		color: #333;
		margin-bottom: 20rpx;
	}

	.content {
		font-size: 28rpx;
		color: #666;
		line-height: 1.6;
	}

	.feature-list {
		display: flex;
		flex-direction: column;
	}

	.feature {
		font-size: 28rpx;
		color: #666;
		line-height: 1.8;
		margin-bottom: 8rpx;
	}

	.contact-section {
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

	.contact-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx 40rpx;
		border-bottom: 1rpx solid #f8f8f8;
	}

	.contact-item:last-child {
		border-bottom: none;
	}

	.contact-label {
		font-size: 30rpx;
		color: #333;
	}

	.contact-value {
		font-size: 28rpx;
		color: #1890ff;
	}

	.footer {
		text-align: center;
		padding: 40rpx 20rpx;
	}

	.copyright {
		font-size: 24rpx;
		color: #999;
		margin-bottom: 20rpx;
	}

	.links {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.link {
		font-size: 24rpx;
		color: #1890ff;
		padding: 0 20rpx;
	}

	.divider {
		color: #ccc;
		font-size: 24rpx;
	}

	.team-info {
		display: flex;
		flex-direction: column;
	}

	.team-info .content {
		margin-bottom: 12rpx;
	}

	.team-info .content:last-child {
		margin-bottom: 0;
	}
</style>
