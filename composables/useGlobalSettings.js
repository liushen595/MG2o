/**
 * 全局设置状态管理
 * 用于在不同页面和组件间共享设置状态
 */
import { ref, reactive, watch } from 'vue';

// 全局响应式状态
const globalSettings = reactive({
    selectedVoice: 1,
    autoConnect: true,
    saveHistory: true,
    languageIndex: 0
});

// 音色映射
const voiceMap = {
    1: 'zh-CN-XiaoxiaoNeural',    // 温柔女声(晓晓)
    2: 'zh-CN-YunxiNeural',     // 专业男声(云希)
    3: 'zh-CN-XiaoyiNeural',  // 可爱童声(艾艺)
    4: 'zh-HK-HiuGaaiNeural'    // 方言模式(粤语)
};

const voiceNames = {
    1: '温柔女声',
    2: '专业男声',
    3: '可爱童声',
    4: '方言模式(粤语)'
};

// 监听音色变化，自动保存到本地存储
watch(() => globalSettings.selectedVoice, (newVoice) => {
    try {
        uni.setStorageSync('selectedVoice', newVoice);
        console.log('音色设置已保存:', voiceNames[newVoice]);
    } catch (error) {
        console.error('保存音色设置失败:', error);
    }
});

// 监听其他设置变化
watch(() => globalSettings.autoConnect, (newValue) => {
    uni.setStorageSync('autoConnect', newValue);
});

watch(() => globalSettings.saveHistory, (newValue) => {
    uni.setStorageSync('saveHistory', newValue);
});

watch(() => globalSettings.languageIndex, (newValue) => {
    uni.setStorageSync('languageIndex', newValue);
});

export default function useGlobalSettings() {

    // 更新音色设置
    const updateVoice = (voiceId) => {
        globalSettings.selectedVoice = voiceId;
    };

    // 更新自动连接设置
    const updateAutoConnect = (value) => {
        globalSettings.autoConnect = value;
    };

    // 更新保存历史设置
    const updateSaveHistory = (value) => {
        globalSettings.saveHistory = value;
    };

    // 更新语言设置
    const updateLanguage = (index) => {
        globalSettings.languageIndex = index;
    };

    // 从本地存储加载所有设置
    const loadAllSettings = () => {
        try {
            globalSettings.selectedVoice = uni.getStorageSync('selectedVoice') || 1;
            globalSettings.autoConnect = uni.getStorageSync('autoConnect') !== false;
            globalSettings.saveHistory = uni.getStorageSync('saveHistory') !== false;
            globalSettings.languageIndex = uni.getStorageSync('languageIndex') || 0;

            console.log('全局设置已加载:', {
                voice: voiceNames[globalSettings.selectedVoice],
                autoConnect: globalSettings.autoConnect,
                saveHistory: globalSettings.saveHistory,
                language: globalSettings.languageIndex
            });
        } catch (error) {
            console.error('加载全局设置失败:', error);
        }
    };

    // 获取当前音色名称
    const getCurrentVoiceName = () => {
        return voiceNames[globalSettings.selectedVoice] || '未知音色';
    };

    // 获取当前音色代码
    const getCurrentVoiceCode = () => {
        return voiceMap[globalSettings.selectedVoice] || voiceMap[1];
    };

    return {
        // 响应式状态
        settings: globalSettings,

        // 映射数据
        voiceMap,
        voiceNames,

        // 方法
        updateVoice,
        updateAutoConnect,
        updateSaveHistory,
        updateLanguage,
        loadAllSettings,
        getCurrentVoiceName,
        getCurrentVoiceCode
    };
}
