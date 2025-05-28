import { ref, nextTick } from 'vue';

export default function useLogger() {
    const logs = ref([]);
    const logScrollTop = ref(0);

    // 添加日志
    function addLog(message, type = 'info') {
        const now = new Date();
        const time = now.toLocaleTimeString();

        logs.value.push({
            time,
            message,
            type
        });

        // 限制日志数量
        if (logs.value.length > 100) {
            logs.value.shift();
        }

        // 滚动到底部
        nextTick(() => {
            logScrollTop.value = 9999999;
        });
    }

    return {
        logs,
        logScrollTop,
        addLog
    };
}
