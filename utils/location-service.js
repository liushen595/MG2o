/**
 * 位置服务工具
 * 提供获取用户位置和验证位置权限的功能
 */

// 允许访问的地点列表（经纬度和半径范围，单位：米）
const ALLOWED_LOCATIONS = [
  {
    name: '苏州科技园',
    latitude: 31.2959, 
    longitude: 120.5912,
    radius: 1000 // 允许1公里范围内访问
  },
  {
    name: '苏州大学',
    latitude: 31.3027, 
    longitude: 120.6497,
    radius: 500  // 允许500米范围内访问
  }
  // 可以添加更多允许的地点
];

/**
 * 计算两个坐标点之间的距离（米）
 * @param {Number} lat1 第一个点的纬度
 * @param {Number} lon1 第一个点的经度
 * @param {Number} lat2 第二个点的纬度
 * @param {Number} lon2 第二个点的经度
 * @returns {Number} 距离（米）
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // 地球半径，单位：米
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * 获取当前位置
 * @returns {Promise} 包含位置信息的promise
 */
const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    // 兼容微信小程序和其他平台
    uni.getLocation({
      type: 'gcj02', // 使用国测局坐标系（微信小程序要求）
      isHighAccuracy: true, // 开启高精度定位
      highAccuracyExpireTime: 3000, // 高精度定位超时时间，单位ms
      success: (res) => {
        console.log('位置获取成功:', res);
        resolve({
          latitude: res.latitude,
          longitude: res.longitude,
          accuracy: res.accuracy
        });
      },
      fail: (err) => {
        console.error('位置获取失败:', err);
        reject(err);
      }
    });
  });
};

/**
 * 检查位置权限
 * @returns {Promise} 权限状态
 */
const checkLocationPermission = () => {
  return new Promise((resolve, reject) => {
    // 兼容微信小程序和其他平台
    uni.getSetting({
      success: (res) => {
        // 检查是否有位置授权
        if (res.authSetting['scope.userLocation'] === true) {
          // 已授权
          resolve(true);
        } else if (res.authSetting['scope.userLocation'] === false) {
          // 明确拒绝
          resolve(false);
        } else {
          // 未询问过，视为未授权
          resolve(false);
        }
      },
      fail: (err) => {
        console.error('获取权限设置失败:', err);
        reject(err);
      }
    });
  });
};

/**
 * 请求位置权限
 * @returns {Promise} 授权结果
 */
const requestLocationPermission = () => {
  return new Promise((resolve, reject) => {
    // 在微信小程序中，我们需要通过调用getLocation间接触发授权
    uni.getLocation({
      type: 'gcj02',
      success: () => {
        resolve(true);
      },
      fail: (err) => {
        // 微信小程序环境中，用户可能拒绝了授权
        if (err.errMsg && err.errMsg.indexOf('auth deny') >= 0) {
          // 用户拒绝了授权
          console.log('用户拒绝了位置授权');
          resolve(false);
        } else {
          console.error('请求位置授权失败:', err);
          reject(err);
        }
      }
    });
  });
};

/**
 * 打开设置页
 * @returns {Promise} 操作结果
 */
const openSetting = () => {
  return new Promise((resolve, reject) => {
    uni.openSetting({
      success: (res) => {
        if (res.authSetting['scope.userLocation']) {
          resolve(true);
        } else {
          resolve(false);
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};

/**
 * 验证位置是否在允许范围内
 * @param {Object} location 位置对象，包含latitude和longitude
 * @returns {Object} 验证结果，包含isAllowed和nearestLocation
 */
const validateLocation = (location) => {
  let isAllowed = false;
  let minDistance = Number.MAX_VALUE;
  let nearestLocation = null;

  // 检查每个允许的地点
  for (const allowedLoc of ALLOWED_LOCATIONS) {
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      allowedLoc.latitude,
      allowedLoc.longitude
    );

    // 更新最近的地点
    if (distance < minDistance) {
      minDistance = distance;
      nearestLocation = {
        ...allowedLoc,
        distance: Math.round(distance)
      };
    }

    // 检查是否在任一允许范围内
    if (distance <= allowedLoc.radius) {
      isAllowed = true;
      nearestLocation.isInside = true;
      break;
    }
  }

  return {
    isAllowed,
    nearestLocation
  };
};

/**
 * 完整的位置验证流程
 * @returns {Promise} 验证结果
 */
const validateUserLocation = async () => {
  try {
    // 检查权限
    const hasPermission = await checkLocationPermission();
    
    if (!hasPermission) {
      console.log('没有位置权限，尝试请求...');
      // 请求权限
      try {
        const granted = await requestLocationPermission();
        if (!granted) {
          return {
            success: false,
            message: '无法获取位置权限，请在设置中开启',
            needPermission: true
          };
        }
      } catch (error) {
        return {
          success: false,
          message: '请求位置权限失败，请在设置中手动开启',
          error,
          needPermission: true
        };
      }
    }
    
    // 获取位置
    try {
      const location = await getCurrentLocation();
      
      // 验证位置
      const validationResult = validateLocation(location);
      
      if (validationResult.isAllowed) {
        return {
          success: true,
          message: `位置验证成功，您在${validationResult.nearestLocation.name}范围内`,
          location,
          validationResult
        };
      } else {
        return {
          success: false,
          message: `您不在允许访问的区域内，最近的地点是${validationResult.nearestLocation.name}，距离${validationResult.nearestLocation.distance}米`,
          location,
          validationResult
        };
      }
    } catch (locError) {
      // 特别处理用户拒绝授权的情况
      if (locError.errMsg && locError.errMsg.indexOf('auth deny') >= 0) {
        return {
          success: false,
          message: '您拒绝了位置权限，请在设置中开启',
          needPermission: true,
          error: locError
        };
      }
      
      return {
        success: false,
        message: '获取位置失败，请检查GPS是否开启',
        error: locError
      };
    }
  } catch (error) {
    return {
      success: false,
      message: '位置验证过程发生错误',
      error
    };
  }
};

export default {
  getCurrentLocation,
  checkLocationPermission,
  requestLocationPermission,
  openSetting,
  validateLocation,
  validateUserLocation,
  ALLOWED_LOCATIONS
};