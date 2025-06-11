/**
 * 全局设置状态管理
 * 用于在不同页面和组件间共享设置状态
 */
import { ref, reactive, watch } from 'vue';

// 语言代码映射
const languageCodes = {
    1: 'zh-CN',
    2: 'en-US',
    3: 'en-GB',
    4: 'ja-JP',
    5: 'ko-KR',
    6: 'fr-FR',
    7: 'hu-HU'
};

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

const region = {
    1: '',
    2: '美国',
    3: '英国',
    4: '日本',
    5: '韩国',
    6: '法国',
    7: '匈牙利',
}

const language = {
    1: '中文简体',
    2: 'English(US)',
    3: 'English(UK)',
    4: '日本語',
    5: '한국어',
    6: 'Français',
    7: 'Magyar',
}

// 外语音色映射
const foreignVoiceMap = {
    2: 'en-US-AriaNeural',    // English(US)
    3: 'en-GB-SoniaNeural',   // English(UK)
    4: 'ja-JP-NanamiNeural',  // 日本語
    5: 'ko-KR-SunHiNeural',   // 한국어
    6: 'fr-FR-DeniseNeural',  // Français
    7: 'hu-HU-NoemiNeural',   // Magyar
};

// 全局响应式状态
const globalSettings = reactive({
    selectedVoice: 1,
    autoConnect: true,
    saveHistory: true,
    languageIndex: 1,
    regionIndex: 1,

    // 计算属性 - 使用 getter 实现响应式计算
    get currentVoiceCode() {
        return voiceMap[this.selectedVoice] || voiceMap[1];
    },

    get currentVoiceName() {
        return voiceNames[this.selectedVoice] || '未知音色';
    },

    get currentRegion() {
        return region[this.regionIndex] || '';
    },

    get currentLanguage() {
        return language[this.languageIndex] || '中文简体';
    },

    get currentLanguageCode() {
        return languageCodes[this.languageIndex] || 'zh-CN';
    },

    // 智能音色选择 - 根据语言自动选择合适音色
    get smartVoice() {
        // 如果是非中文语言，使用对应的外语音色
        if (this.currentLanguageCode !== 'zh-CN') {
            return foreignVoiceMap[this.languageIndex] || this.currentVoiceCode;
        }
        // 中文使用用户设置的音色
        return this.currentVoiceCode;
    },

    // 附加提示文本构建
    get additionalPrompt() {
        let prompt = '';
        if (this.currentRegion && this.currentRegion.trim() !== '') {
            prompt += `请结合${this.currentRegion}的历史和文化`;
        }
        if (this.currentRegion && this.currentRegion.trim() === '') {
            prompt += "现在不需要结合特定国家的历史和文化";
        }
        if (this.currentLanguageCode) {
            if (prompt) {
                prompt += `，忽略我提问时使用的语言，请一定使用${this.currentLanguageCode}对应的语言来回答`;
            } else {
                prompt += `忽略我提问时使用的语言，请一定使用${this.currentLanguageCode}对应的语言来回答`;
            }
        }
        if (prompt) {
            prompt += '。';
        }
        return prompt;
    }
});


// 监听音色变化，自动保存到本地存储
watch(() => globalSettings.selectedVoice, (newVoice) => {
    try {
        uni.setStorageSync('selectedVoice', newVoice);
        console.log('音色设置已保存:', globalSettings.currentVoiceName);
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

watch(() => globalSettings.languageIndex, (newIndex) => {
    uni.setStorageSync('languageIndex', newIndex);
    console.log('语言设置已保存:', globalSettings.currentLanguage);
});

watch(() => globalSettings.regionIndex, (newIndex) => {
    uni.setStorageSync('regionIndex', newIndex);
    console.log('地区设置已保存:', globalSettings.currentRegion);
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

    // 更新地区设置
    const updateRegion = (index) => {
        globalSettings.regionIndex = index;
    };    // 从本地存储加载所有设置
    const loadAllSettings = () => {
        try {
            globalSettings.selectedVoice = uni.getStorageSync('selectedVoice') || 1;
            globalSettings.autoConnect = uni.getStorageSync('autoConnect') !== false;
            globalSettings.saveHistory = uni.getStorageSync('saveHistory') !== false;
            globalSettings.languageIndex = uni.getStorageSync('languageIndex') || 1;
            globalSettings.regionIndex = uni.getStorageSync('regionIndex') || 1;

            console.log('全局设置已加载:', {
                voice: globalSettings.currentVoiceName,
                autoConnect: globalSettings.autoConnect,
                saveHistory: globalSettings.saveHistory,
                language: globalSettings.currentLanguage,
                region: globalSettings.currentRegion
            });
        } catch (error) {
            console.error('加载全局设置失败:', error);
        }
    }; globalSettings.apiEndpoints = {
        // 直接扩展原有的响应式对象
        imageProcessing: 'https://huisuda.com/api/v1/process-image/'
    };
    globalSettings.imageOptions = {
        maxSize: 5 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png']
    };

    return {
        // 响应式状态
        settings: globalSettings,

        // 映射数据
        voiceMap,
        voiceNames,
        region,
        language,
        languageCodes,
        foreignVoiceMap,

        // 方法
        updateVoice,
        updateAutoConnect,
        updateSaveHistory,
        updateLanguage,
        updateRegion,
        loadAllSettings,

        // 保留一些兼容性方法（逐步废弃）
        getCurrentVoiceName: () => globalSettings.currentVoiceName,
        getCurrentVoiceCode: () => globalSettings.currentVoiceCode,
        getCurrentRegion: () => globalSettings.currentRegion,
        getCurrentLanguage: () => globalSettings.currentLanguage,
        getCurrentLanguageCode: () => globalSettings.currentLanguageCode,
        getCurrentLanguageIndex: () => globalSettings.languageIndex
    };
}
