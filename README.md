# MG2O 苏州大学博物馆智能语音助手小程序

基于小智开源项目的微信小程序版智能语音助手，经过定制化开发，专门用于介绍苏州大学博物馆，提供语音交互、TTS文本转语音以及大模型问答功能。后端服务经过特殊修改，融入了苏州大学博物馆的专业知识库。

## 项目结构

```
├── App.vue              # 应用入口文件
├── index.html           # HTML入口文件  
├── main.js              # 主JS文件
├── manifest.json        # 小程序配置文件
├── pages.json           # 页面配置
├── uni.scss             # 全局样式
├── pages/               # 页面目录
│   └── index/           # 主页
│       └── index.vue    # 主页视图
├── static/              # 静态资源
└── utils/               # 工具类
    ├── location-service.js  # 位置服务
    └── xiaozhi-service.js   # 小智语音交互服务

```

## 特点

- **语音识别(STT)**: 支持将用户语音实时转换为文本，方便语音输入和控制。
- **文本转语音(TTS)**: 将文本内容转化为自然流畅的语音播放。
- **大模型集成**: 接入大语言模型，实现自然的对话交互和问答功能。
- **博物馆知识库**: 后端集成苏州大学博物馆专业知识库，能够回答关于馆藏文物、历史背景等专业问题。
- **定制化导览体验**: 提供博物馆专业导览服务，根据用户所处位置提供相关展品信息。
- **WebSocket通信**: 通过WebSocket实现与后端服务器的实时双向通信。
- **音频流式处理**: 支持音频流处理，实现语音的实时播放。
- **地理位置感知**: 在苏州大学天赐庄校区博物馆范围内提供基于位置的精准服务。

## 技术栈

- 前端框架: uni-app
- 运行环境: 微信小程序
- 通信协议: WebSocket
- 音频格式: MP3

## 功能模块

### xiaozhi-service.js

提供与小智语音服务器交互的核心功能，已针对苏州大学博物馆进行定制化修改，包括：

- WebSocket连接管理
- 语音录制和发送
- 文本消息发送
- TTS语音播放与博物馆讲解内容
- 音频队列管理
- 博物馆专业知识问答

### location-service.js

提供位置服务功能，用于获取用户在博物馆内的精确位置，自动推送相关展品信息。

## 使用方法
在苏州大学天赐庄校区10km范围内扫码试用:
![alt text](wx.png)
1. 连接服务器：
```javascript
import xiaozhiService from '@/utils/xiaozhi-service.js';

// 连接到语音服务器
xiaozhiService.connectToServer(
  'ws://your-server-address',
  () => console.log('连接成功'),
  (message) => console.log('收到消息', message),
  () => console.log('连接关闭'),
  (error) => console.log('错误', error),
  (text) => console.log('语音识别结果', text)
);
```

2. 发送文本消息：
```javascript
xiaozhiService.sendTextMessage('你好，小智');
```

3. 语音交互：
```javascript
// 初始化录音
xiaozhiService.initRecorder(
  () => console.log('开始录音'),
  () => console.log('录音结束'),
  (err) => console.log('录音错误', err)
);

// 开始录音
xiaozhiService.startRecording();

// 停止录音并发送
xiaozhiService.stopRecordingAndSend()
  .then(() => console.log('语音发送成功'))
  .catch(err => console.log('语音发送失败', err));
```

## 开源协议

本项目采用MIT许可证开源：
- 后端服务基于小智开源项目(MIT协议)修改，已针对苏州大学博物馆知识库进行深度定制，原项目版权归原作者所有
- 微信小程序前端为原创，版权归515所有
- 苏州大学博物馆相关知识内容的版权归苏州大学博物馆所有

使用本项目代码时，请遵守MIT协议的相关规定。如需使用本项目中的苏州大学博物馆专业知识内容，请联系相关版权方获得授权。
