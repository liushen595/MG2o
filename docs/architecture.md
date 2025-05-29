# 苏博导智能体架构文档

## 项目概述

苏博导智能体是一个基于uni-app框架开发的移动应用，主要功能是提供语音交互服务，帮助用户进行博物馆导览。该应用使用Vue 3组合式API进行开发，采用高度模块化的架构以提高代码的可维护性和可扩展性。

## 项目结构

```
mg2o/
├── App.vue                      # 应用入口文件
├── index.html                   # HTML入口文件
├── main.js                      # 主JS文件
├── manifest.json                # 小程序配置文件
├── pages.json                   # 页面配置
├── uni.scss                     # 全局样式
├── components/                  # UI组件
│   └── home/                    # 首页相关组件
│       ├── AudioVisualizer.vue     # 音频可视化组件
│       ├── LocationVerification.vue # 位置验证组件
│       ├── MessageInput.vue        # 消息输入组件
│       ├── MessageList.vue         # 消息列表组件
│       ├── SideDrawer.vue          # 侧边栏组件
│       ├── SpeechRecognition.vue   # 语音识别结果组件
│       └── TopNavBar.vue           # 顶部导航栏组件
├── composables/                 # 可复用逻辑
│   ├── useGlobalSettings.js     # 全局设置
│   └── home/                    # 首页相关逻辑
│       ├── useConnection.js     # 连接管理
│       ├── useMessages.js       # 消息处理
│       ├── useAudioRecording.js # 音频录制
│       ├── useLocation.js       # 位置验证逻辑
│       ├── useLogger.js         # 日志记录
│       └── useNavigation.js     # 导航管理
├── pages/                       # 页面目录
│   ├── about/                   # 关于页面
│   │   └── about.vue
│   ├── index/                   # 主页
│   │   └── index.vue            # 主页视图
│   ├── location/                # 位置验证页面
│   │   └── location.vue
│   ├── settings/                # 设置页面
│   │   └── settings.vue
│   └── share/                   # 分享页面
│       └── share.vue
├── utils/                       # 工具类
│   ├── location-service.js      # 位置服务
│   └── xiaozhi-service.js       # 小智服务
├── static/                      # 静态资源
│   ├── logo.png
│   ├── wx.png                   # 微信二维码
│   └── 二维码.jpg
└── docs/                        # 项目文档
    ├── architecture.md          # 架构文档(本文档)
    ├── CSDN.md                  # 技术详解
    └── development-guidelines.md # 开发规范
```

## 核心模块说明

### 1. 组件模块（Components）

#### 1.1 SideDrawer.vue
- 功能：提供应用的主导航菜单
- 特点：支持导航到各个页面，显示应用标志和标题

#### 1.2 TopNavBar.vue
- 功能：显示页面标题和连接状态
- 特点：提供打开侧边栏的按钮，展示服务器连接状态

#### 1.3 LocationVerification.vue
- 功能：验证用户位置信息
- 特点：显示位置验证状态，处理位置验证失败和成功

#### 1.4 MessageList.vue
- 功能：展示用户与智能体之间的对话记录
- 特点：支持自动滚动到底部，显示加载状态

#### 1.5 MessageInput.vue
- 功能：提供文本输入和语音输入功能
- 特点：支持长按录音，滑动取消录音

#### 1.6 AudioVisualizer.vue
- 功能：录音时展示音频波形
- 特点：动态显示录音音量变化

#### 1.7 SpeechRecognition.vue
- 功能：显示语音识别的实时结果
- 特点：动态更新识别文本

### 2. 可复用逻辑（Composables）

#### 2.1 useLogger.js
- 功能：提供日志记录功能
- 特点：记录应用运行时的关键信息

#### 2.2 useLocation.js
- 功能：管理位置验证相关逻辑
- 特点：处理位置获取、验证和定期检查

#### 2.3 useConnection.js
- 功能：管理与服务器的WebSocket连接
- 特点：处理连接、断开、重连和消息传输
- 优化点：支持回调设置，提供状态同步机制

#### 2.4 useMessages.js
- 功能：管理消息列表和消息发送逻辑
- 特点：处理消息存储、展示和滚动逻辑
- 优化点：完全响应式状态管理，支持实时文本消息发送

#### 2.5 useAudioRecording.js
- 功能：管理音频录制功能
- 特点：处理录音启动、停止、取消和可视化数据生成

#### 2.6 useNavigation.js（新增）
- 功能：管理应用导航逻辑
- 特点：处理侧边栏状态、页面跳转和路由管理
- 优化点：集中管理导航相关逻辑，提高代码复用性

## 架构优化亮点

### 1. 响应式状态管理优化
- **问题**：原来存在状态同步问题，本地变量与composables状态不一致
- **解决方案**：直接使用composables返回的响应式状态，移除手动同步逻辑
- **效果**：修复了文本消息发送功能，提高了状态管理的可靠性

### 2. 循环依赖问题解决
- **问题**：composables之间存在循环依赖，导致需要使用临时空函数
- **解决方案**：引入回调设置机制（`setCallbacks`），避免初始化时的循环依赖
- **效果**：消除了所有临时空函数，代码更加简洁

### 3. 模块化程度提升
- **新增功能**：`useNavigation.js` composable
- **重构收益**：将导航相关逻辑从页面中提取出来
- **维护性**：每个composable职责单一，易于测试和维护

### 4. 生命周期管理优化
- **重构方式**：创建`initializeApp()`和`cleanupApp()`函数
- **优势**：生命周期逻辑更加清晰，减少重复代码

## 数据流架构

### 1. 单向数据流
```
用户交互 → 组件事件 → 页面处理 → Composable业务逻辑 → 状态更新 → UI更新
```

### 2. 响应式数据流
```
Composable状态 ←→ 页面响应式引用 ←→ 组件Props ←→ UI展示
```

### 3. 跨模块通信
```
连接状态 → 消息服务 → 音频服务
     ↓
  回调机制 → 状态同步 → UI更新
```

## 通信机制

### 1. 组件通信
- **父子组件**：通过props（向下）和emits（向上）进行通信
- **兄弟组件**：通过共同的父组件或composables共享状态

### 2. 业务逻辑通信
- **页面与Composable**：通过函数调用和响应式状态共享
- **Composables之间**：通过回调函数和状态依赖注入

### 3. 实时通信
- **WebSocket**：与后端服务器的实时双向通信
- **事件系统**：uni-app的事件机制（如音色切换事件）

## 技术栈详情

### 前端技术
- **框架**：uni-app (支持多端部署)
- **语法**：Vue 3 Composition API
- **状态管理**：响应式状态 + Composables
- **样式**：SCSS + uni-app内置样式

### 通信技术
- **实时通信**：WebSocket
- **音频处理**：uni.getRecorderManager() API
- **位置服务**：uni.getLocation() API

### 开发工具
- **构建工具**：uni-app CLI
- **代码规范**：ESLint + Prettier
- **版本控制**：Git

## 性能优化策略

### 1. 状态管理优化
- 使用响应式状态避免不必要的重新渲染
- 合理使用computed属性进行数据计算
- 及时清理定时器和事件监听器

### 2. 网络优化
- WebSocket连接复用
- 音频流式传输
- 错误重试机制

### 3. 内存管理
- 组件卸载时清理资源
- 音频队列管理避免内存泄漏
- 合理的状态生命周期管理

## 开发指南

### 添加新功能
1. **分析需求**：确定功能属于UI层还是业务逻辑层
2. **选择模块**：
   - UI功能 → 创建/修改组件
   - 业务逻辑 → 创建/修改composable
   - 页面级功能 → 修改页面文件
3. **实现功能**：遵循单一职责原则
4. **测试集成**：确保与现有功能兼容

### 修改现有功能
1. **定位模块**：找到对应的组件或composable
2. **影响分析**：评估修改对其他模块的影响
3. **实施修改**：保持接口的向后兼容性
4. **验证功能**：测试相关联的所有功能

### 代码规范
1. **命名规范**：
   - 组件：PascalCase (如 `MessageList.vue`)
   - Composables：camelCase with use前缀 (如 `useMessages.js`)
   - 变量/函数：camelCase
2. **文件结构**：
   - 组件文件包含template、script、style三部分
   - Composables返回对象包含状态和方法
3. **注释规范**：
   - 重要业务逻辑添加注释
   - 复杂函数添加参数和返回值说明

## 最佳实践

### 1. 组件设计原则
- **单一职责**：每个组件只负责一个功能
- **可复用性**：通过props使组件可配置
- **松耦合**：减少组件间的直接依赖

### 2. Composables设计原则
- **功能聚焦**：每个composable专注于一个业务领域
- **状态封装**：对外暴露最小必要的状态和方法
- **错误处理**：包含完善的错误处理逻辑

### 3. 性能最佳实践
- **懒加载**：按需加载组件和资源
- **缓存策略**：合理使用缓存减少重复计算
- **优化渲染**：避免不必要的DOM操作

## 故障排查指南

### 1. 连接问题
- 检查WebSocket连接状态
- 验证服务器地址配置
- 查看网络连接日志

### 2. 音频问题
- 检查录音权限
- 验证音频格式支持
- 查看音频队列状态

### 3. 状态同步问题
- 检查响应式状态绑定
- 验证composables返回值
- 查看Vue DevTools状态

## 未来扩展计划

### 1. 功能扩展
- 多语言支持
- 更多音色选择

### 2. 技术升级
- TypeScript支持

### 3. 性能优化
- 渲染性能提升
