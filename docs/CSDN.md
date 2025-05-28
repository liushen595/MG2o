# 苏州大学博物馆智能语音助手小程序技术详解

本项目基于小智开源项目（MIT协议）进行深度定制，专为苏州大学博物馆打造，支持语音识别、TTS、知识问答、地理位置感知等功能。本文将逐个讲解项目中的关键技术要点，并配以源码片段说明。

---

## 1. WebSocket 实时通信

项目通过 WebSocket 与后端服务保持实时连接，实现语音、文本、TTS等消息的双向传递。

**技术实现说明：**
- 使用 `uni.connectSocket` 创建 WebSocket 连接，支持微信小程序环境。
- 连接建立后自动发送 hello 握手消息，进行身份认证。
- 通过 `onMessage` 监听服务器推送的各种消息类型，实现实时交互。
- 支持断线重连、错误处理和连接关闭的回调。

**核心代码片段：**
```js
// utils/xiaozhi-service.js
const connectToServer = (url, onConnectCallback, onMessageCallback, onCloseCallback, onErrorCallback, onSpeechRecognition) => {
  return new Promise((resolve, reject) => {
    // ...existing code...
    websocket = uni.connectSocket({
      url: connUrl,
      success: () => {
        console.log('WebSocket连接创建成功');
      },
      fail: (err) => {
        // ...existing code...
      }
    });
    // ...existing code...
  });
};
```

---

## 2. 语音识别（STT）与文本转语音（TTS）

支持用户语音输入自动识别为文本，并将文本内容转为语音播放。

**技术实现说明：**
- 语音识别（STT）：用户录音后，音频数据通过 WebSocket 上传到后端，后端返回识别结果。
- 文本转语音（TTS）：后端推送 TTS 消息，前端解析 base64 编码的 MP3 数据并播放。
- 通过回调机制将识别结果和语音播放状态反馈到界面。

**语音识别回调：**
```js
// utils/xiaozhi-service.js
if (message.type === 'stt') {
  // 语音识别结果
  if (onSpeechRecognitionCallback && message.text) {
    onSpeechRecognitionCallback(message.text);
  }
}
```

**TTS 音频播放：**
```js
// utils/xiaozhi-service.js
if (message.type === 'tts' && message.state === 'sentence_start') {
  if (message.tts_file) {
    const arrayBuffer = uni.base64ToArrayBuffer(message.tts_file.data);
    playMP3Data(arrayBuffer);
  }
}
```

---

## 3. 音频播放队列与异步播放

为保证多段语音顺序播放，项目实现了音频队列和异步播放机制。

**技术实现说明：**
- 所有待播放的 MP3 数据会被依次加入 `audioQueue` 队列。
- 通过 `playNextInQueue` 方法实现队列自动播放，播放结束后自动销毁音频对象并播放下一个。
- 采用微信小程序的 `InnerAudioContext`，并用临时文件方式兼容 iOS/Android。

**核心代码片段：**
```js
// utils/xiaozhi-service.js
const playMP3Data = (mp3Data) => {
  if (!mp3Data || mp3Data.byteLength === 0) return;
  audioQueue.push(mp3Data);
  if (!isPlaying) {
    playNextInQueue();
  }
};
```

---

## 4. 地理位置感知与权限校验

通过微信小程序API获取用户位置，判断是否在苏州大学天赐庄校区范围内。

**技术实现说明：**
- 使用微信小程序 `wx.getFuzzyLocation` 或 `uni.getLocation` 获取用户经纬度。
- 通过 `calculateDistance` 方法判断用户是否在允许的地理围栏内。
- 支持多地点配置，便于后续扩展。

**核心代码片段：**
```js
// utils/location-service.js
const ALLOWED_LOCATIONS = [
  {
    name: '苏州大学本部',
    latitude: 31.30675141358815, 
    longitude: 120.64005983467405,
    radius: 10000
  }
];
```

---

## 5. 大模型知识问答与定制化内容

后端服务集成了苏州大学博物馆知识库，支持展品、历史等专业问答。

**技术实现说明：**
- 前端通过 WebSocket 发送文本或语音消息，后端基于大模型和知识库返回专业解答。
- 支持多轮对话，能够根据上下文理解用户意图。
- 回答内容可通过 TTS 实时播报。

**消息处理片段：**
```js
// utils/xiaozhi-service.js
if (message.type === 'llm') {
  console.log('大模型回复:', message.text);
}
```

---

## 6. 录音管理与音频上传

支持用户录音并上传至后端，自动完成语音识别。

**技术实现说明：**
- 通过 `uni.getRecorderManager` 管理录音，支持录音开始、结束、错误等事件。
- 录音结束后自动读取音频文件并通过 WebSocket 上传。
- 上传完成后自动发送结束信号，后端返回识别结果。

**录音与上传流程：**
```js
// utils/xiaozhi-service.js
const startRecording = (options = {}) => {
  // ...existing code...
  recorderManager.start(recordOptions);
};

const stopRecordingAndSend = (progressCallback) => {
  // ...existing code...
  sendAudioFile(currentFilePath, progressCallback)
    .then(resolve)
    .catch(reject);
};
```

---

## 7. 前端页面与交互体验

主页面支持文本输入、语音输入、消息展示、录音可视化等，提升用户体验。

**技术实现说明：**
- 使用 uni-app 框架，页面组件化，支持响应式数据绑定。
- 支持文本输入、语音输入、消息滚动展示、录音动画等丰富交互。
- 通过状态管理和回调机制，保证用户体验流畅。

**页面片段：**
```vue
<!-- pages/index/index.vue -->
<view class="message-input-container">
  <input class="message-input" v-model="messageText" placeholder="输入消息..." :disabled="!isConnected" />
  <button class="send-btn" @click="sendMessage">发送</button>
  <button class="record-btn" @touchstart="startTouchRecording">按住说话</button>
</view>
```

---

## 总结

本项目通过uni-app和微信小程序API，结合WebSocket、音频处理、地理位置、AI问答等多项技术，为苏州大学博物馆打造了智能化、交互式的语音导览体验。欢迎交流与改进建议！
