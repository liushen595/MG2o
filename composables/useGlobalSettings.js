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
    languageIndex: 1,
    regionIndex: 1,
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

watch(() => globalSettings.languageIndex, (newIndex) => {
    uni.setStorageSync('languageIndex', newIndex);
    console.log('语言设置已保存:', language[newIndex] || '未知语言');
});

watch(() => globalSettings.regionIndex, (newIndex) => {
    uni.setStorageSync('regionIndex', newIndex);
    console.log('地区设置已保存:', region[newIndex] || '未知地区');
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
    };

    // 从本地存储加载所有设置
    const loadAllSettings = () => {
        try {
            globalSettings.selectedVoice = uni.getStorageSync('selectedVoice') || 1;
            globalSettings.autoConnect = uni.getStorageSync('autoConnect') !== false;
            globalSettings.saveHistory = uni.getStorageSync('saveHistory') !== false;
            globalSettings.languageIndex = uni.getStorageSync('languageIndex') || 1;
            globalSettings.regionIndex = uni.getStorageSync('regionIndex') || 1;

            console.log('全局设置已加载:', {
                voice: voiceNames[globalSettings.selectedVoice],
                autoConnect: globalSettings.autoConnect,
                saveHistory: globalSettings.saveHistory,
                language: language[globalSettings.languageIndex],
                region: region[globalSettings.regionIndex]
            });
        } catch (error) {
            console.error('加载全局设置失败:', error);
        }
    };

    // 获取当前音色名称
    const getCurrentVoiceName = () => {
        return voiceNames[globalSettings.selectedVoice] || '未知音色';
    };

    // 获取当前音色名称(Edge API)
    const getCurrentVoiceCode = () => {
        return voiceMap[globalSettings.selectedVoice] || voiceMap[1];
    };
    const globalSettings = {
        apiEndpoints: {
            imageProcessing: 'https://huisuda.com/api/v1/process-image/'
        },
        imageOptions: {
            maxSize: 5 * 1024 * 1024, // 5MB
            allowedTypes: ['image/jpeg', 'image/png']
    }
    };

    // 获取当前地区
    const getCurrentRegion = () => {
        return region[globalSettings.regionIndex] || '';
    };

    // 获取当前语言
    const getCurrentLanguage = () => {
        return language[globalSettings.languageIndex] || '中文简体';
    };    // 获取当前语言代码
    const getCurrentLanguageCode = () => {
        console.log('getCurrentLanguageCode 被调用');
        console.log('globalSettings.languageIndex:', globalSettings.languageIndex);
        const codes = {
            1: 'zh-CN',
            2: 'en-US',
            3: 'en-GB',
            4: 'ja-JP',
            5: 'ko-KR',
            6: 'fr-FR',
            7: 'hu-HU'
        };
        const result = codes[globalSettings.languageIndex] || 'zh-CN';
        console.log('getCurrentLanguageCode 返回:', result);
        return result;
    };

    return {
        // 响应式状态
        settings: globalSettings,

        // 映射数据
        voiceMap,
        voiceNames,
        region,
        language,

        // 方法
        updateVoice,
        updateAutoConnect,
        updateSaveHistory,
        updateLanguage,
        updateRegion,
        loadAllSettings,
        getCurrentVoiceName,
        getCurrentVoiceCode,
        getCurrentRegion,
        getCurrentLanguage,
        getCurrentLanguageCode
    };
}
