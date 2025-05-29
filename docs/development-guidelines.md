# 苏博导智能体开发规范文档

## 1. 项目概述

苏博导智能体是一个基于uni-app框架开发的移动应用，主要功能是提供语音交互服务，帮助用户进行博物馆导览。该应用使用Vue 3组合式API进行开发，采用高度模块化的架构以提高代码的可维护性和可扩展性。项目特点包括：

- **模块化架构**: 使用composables进行逻辑复用，组件化UI开发
- **响应式状态管理**: 基于Vue 3响应式系统的状态同步
- **实时通信**: WebSocket连接管理与消息处理
- **智能语音交互**: 集成STT/TTS和大模型问答

## 2. 文件目录结构及说明

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
│   └── xiaozhi-service.js       # 小智语音交互服务
├── static/                      # 静态资源
│   ├── logo.png
│   ├── wx.png                   # 微信二维码
│   └── 二维码.jpg
└── docs/                        # 项目文档
    ├── architecture.md          # 架构文档
    ├── CSDN.md                  # 技术详解
    └── development-guidelines.md # 开发规范(本文档)
```

## 3. 开发规范

### 3.1 组件开发规范

#### 组件位置

- 所有通用UI组件应放在`components/`目录下
- 特定页面使用的组件应放在对应的页面子目录中，如`components/home/`
- 每个组件应该有自己的独立文件

#### 组件设计原则

- **单一职责**: 每个组件只负责一个功能
- **可复用性**: 通过props使组件可配置
- **松耦合**: 减少组件间的直接依赖

#### 组件文件结构

组件文件应包含三部分：

```vue
<template>
  <!-- 组件模板 -->
</template>

<script setup>
  // 组件逻辑
  import { ref } from 'vue';
  
  // 定义属性
  const props = defineProps({
    property: {
      type: Type,
      required: Boolean,
      default: DefaultValue
    }
  });
  
  // 定义事件
  const emit = defineEmits(['eventName']);
  
  // 组件逻辑代码
</script>

<style scoped>
  /* 组件样式 */
</style>
```

### 3.2 Composables开发规范

#### Composables位置

- 全局通用的Composables应放在`composables/`根目录下
- 特定功能领域的Composables应放在对应的子目录中，如`composables/home/`

#### Composables设计原则

- **功能聚焦**: 每个composable专注于一个业务领域
- **状态封装**: 对外暴露最小必要的状态和方法
- **错误处理**: 包含完善的错误处理逻辑

#### Composables文件结构

```js
import { ref, computed } from 'vue';
// 导入其他依赖

export default function useFeatureName(dependency1, dependency2) {
  // 响应式状态
  const state1 = ref(initialValue);
  const state2 = ref(initialValue);
  
  // 计算属性
  const computedValue = computed(() => {
    // 计算逻辑
  });
  
  // 功能方法
  function method1() {
    // 实现逻辑
  }
  
  function method2() {
    // 实现逻辑
  }
  
  // 清理资源方法
  function cleanupResources() {
    // 清理资源
  }
  
  // 返回状态和方法
  return {
    state1,
    state2,
    computedValue,
    method1,
    method2,
    cleanupResources
  };
}
```

### 3.3 页面开发规范

#### 页面位置

- 所有页面应放在`pages/`目录下
- 每个页面应有自己的子目录，如`pages/index/`
- 每个页面的主文件命名为页面名称，如`index.vue`

#### 页面设计原则

- 页面应尽量轻量，主要负责组合组件和调用composables
- 复杂业务逻辑应封装在composables中
- 页面文件中应包含页面级的生命周期管理

#### 页面文件结构

```vue
<template>
  <!-- 页面结构 -->
</template>

<script setup>
  import { onLoad, onShow, onHide, onUnload } from '@dcloudio/uni-app';
  
  // 导入组件
  import Component1 from '../../components/Component1.vue';
  
  // 导入复用逻辑
  import useFeature from '../../composables/useFeature.js';
  
  // 初始化功能
  const { state, method } = useFeature();
  
  // 初始化应用
  function initializeApp() {
    // 初始化代码
  }
  
  // 清理应用资源
  function cleanupApp() {
    // 清理资源
  }
  
  // 生命周期钩子
  onLoad(() => {
    initializeApp();
  });
  
  onShow(() => {
    // 页面显示时的处理
  });
  
  onHide(() => {
    // 页面隐藏时的处理
  });
  
  onUnload(() => {
    cleanupApp();
  });
</script>

<style>
  /* 页面样式 */
</style>
```

### 3.4 命名规范

- **组件**: 使用PascalCase (如`MessageList.vue`)
- **Composables**: 使用camelCase并带有use前缀 (如`useMessages.js`)
- **工具类**: 使用kebab-case (如`location-service.js`)
- **变量/函数**: 使用camelCase
- **常量**: 使用UPPER_SNAKE_CASE
- **CSS类名**: 使用kebab-case


## 4. 开发流程

### 4.1 添加新功能

1. **分析需求**: 确定功能属于UI层还是业务逻辑层
2. **选择模块**:
   - UI功能 → 创建/修改组件
   - 业务逻辑 → 创建/修改composable
   - 页面级功能 → 修改页面文件
3. **实现功能**: 遵循单一职责原则
4. **测试集成**: 确保与现有功能兼容

### 4.2 修改现有功能

1. **定位模块**: 找到对应的组件或composable
2. **影响分析**: 评估修改对其他模块的影响
3. **实施修改**: 保持接口的向后兼容性
4. **验证功能**: 测试相关联的所有功能

## 5. 最佳实践

### 5.1 性能优化(暂未进行优化工作，可忽略)

- **懒加载**: 按需加载组件和资源
- **缓存策略**: 合理使用缓存减少重复计算
- **优化渲染**: 避免不必要的DOM操作

### 5.2 状态管理

- 使用响应式状态避免不必要的重新渲染
- 合理使用computed属性进行数据计算
- 及时清理定时器和事件监听器

### 5.3 生命周期管理

- 组件卸载时清理资源
- 使用生命周期钩子合理管理应用状态
- 创建`initializeApp()`和`cleanupApp()`函数进行集中管理

## 6. 通信机制

### 6.1 组件通信

- **父子组件**: 通过props（向下）和emits（向上）进行通信
- **兄弟组件**: 通过共同的父组件或composables共享状态

### 6.2 业务逻辑通信

- **页面与Composable**: 通过函数调用和响应式状态共享
- **Composables之间**: 通过回调函数和状态依赖注入
- **所有组件和页面的设置项**：使用全局状态共享`composables/useGlobalSettings.js`逻辑，然后将相关设置项放入`pages/settings/settings.vue`

### 6.3 实时通信

- **WebSocket**: 与后端服务器的实时双向通信
- **事件系统**: uni-app的事件机制（如音色切换事件）

## 7. 文档维护

- 所有重要的架构变更应更新在`architecture.md`中
- 技术实现详情应记录在`CSDN.md`中
- 开发规范更新应反映在本文档中
- 重要API应有注释说明用途和参数

## 8. 版本控制

- 使用Git进行版本控制
- 每个功能开发应该在各自的分支进行，必要时创建新的功能分支
- 提交消息应清晰描述变更内容
- 合并前应进行代码审查

## 9. 故障排查指南

### 9.1 连接问题
- 检查WebSocket连接状态
- 验证服务器地址配置
- 查看网络连接日志

### 9.2 音频问题
- 检查录音权限
- 验证音频格式支持
- 查看音频队列状态

### 9.3 状态同步问题
- 检查响应式状态绑定
- 验证composables返回值
- 查看Vue开发工具状态
