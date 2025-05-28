import { ref, computed } from 'vue';
import locationService from '../../utils/location-service.js';

export default function useLocation(addLog) {
    // 位置验证相关数据
    const isLocationVerified = ref(false);  //验证成功状态
    const isCheckingLocation = ref(false);  //防止重复点击
    const locationError = ref(false);       //错误状态
    const locationStatusText = ref('请验证您的位置'); //状态提示文字
    const locationDetails = ref('此应用只能在特定地点使用');
    const locationBtnText = ref('验证位置');//错误信息和按钮文字
    const currentLocation = ref(null);//存储位置信息
    const locationCheckInterval = ref(null);

    // 验证用户位置
    function verifyUserLocation() {
        // 防止重复点击
        if (isCheckingLocation.value) return;

        isCheckingLocation.value = true;
        locationStatusText.value = '正在获取位置...';
        locationError.value = false;        // 调用位置服务验证位置
        // 使用validateUserLocation替代checkLocation
        locationService.validateUserLocation()
            .then(result => {
                if (result.success) {
                    isLocationVerified.value = true;
                    locationStatusText.value = '位置验证成功';
                    locationDetails.value = '您可以开始使用所有功能了';
                    currentLocation.value = result.location;
                    addLog('位置验证成功', 'success');
                } else {
                    locationError.value = true;
                    locationStatusText.value = '位置验证失败';
                    locationDetails.value = result.message || '您不在指定区域内';
                    locationBtnText.value = '重试';
                    addLog('位置验证失败: ' + (result.message || '未知原因'), 'error');
                }
            })
            .catch(error => {
                locationError.value = true;
                locationStatusText.value = '位置获取失败';
                locationDetails.value = '请检查您的位置权限设置';
                locationBtnText.value = '重试';
                addLog('位置获取错误: ' + error, 'error');
            })
            .finally(() => {
                isCheckingLocation.value = false;
            });
    }

    // 开始定时检查位置
    function startLocationCheck() {
        stopLocationCheck(); // 先停止之前的检查

        // 设置定时检查
        locationCheckInterval.value = setInterval(() => {
            // 如果已经验证过位置，可以进行周期性检查
            if (isLocationVerified.value && !isCheckingLocation.value) {
                // 这里可以加入定时位置检查的逻辑
            }
        }, 60000); // 每分钟检查一次
    }

    // 停止定时检查位置
    function stopLocationCheck() {
        if (locationCheckInterval.value) {
            clearInterval(locationCheckInterval.value);
            locationCheckInterval.value = null;
        }
    }

    return {
        isLocationVerified,
        isCheckingLocation,
        locationError,
        locationStatusText,
        locationDetails,
        locationBtnText,
        currentLocation,
        verifyUserLocation,
        startLocationCheck,
        stopLocationCheck
    };
}
