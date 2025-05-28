import { ref } from 'vue';

export default function useNavigation() {
    const showDrawer = ref(false);

    // 页面路由映射
    const routeMap = {
        'settings': '/pages/settings/settings',
        'share': '/pages/share/share',
        'about': '/pages/about/about'
    };

    // 打开侧拉导航栏
    function openDrawer() {
        showDrawer.value = true;
    }

    // 关闭侧拉导航栏
    function closeDrawer() {
        showDrawer.value = false;
    }

    // 页面跳转
    function navigateToPage(page) {
        // 如果是当前页面，直接关闭抽屉
        if (page === 'voice-assistant') {
            closeDrawer();
            return;
        }

        const url = routeMap[page];
        if (!url) {
            console.error('未知页面:', page);
            closeDrawer();
            return;
        }

        uni.navigateTo({
            url: url,
            success: () => {
                closeDrawer();
            },
            fail: (err) => {
                console.error('跳转失败', err);
                closeDrawer();
            }
        });
    }

    return {
        showDrawer,
        openDrawer,
        closeDrawer,
        navigateToPage
    };
}
