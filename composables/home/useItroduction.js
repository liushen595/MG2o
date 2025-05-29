// useIntroduction.js
import { ref,onMounted } from 'vue'

export default function useIntroduction() {
  // props的响应式状态
  const state = ref({
    showIntroduction: true,
    introductionText: "您好,我是苏州大学博物馆导航助手,请问有什么是我可以帮你的"
  })
  // 组件功能的基础方法
  const show = (customText) => {
    state.value.showIntroduction = true
    if (customText) {
      state.value.introductionText = customText
    }
  }

  const hide = () => {
    state.value.showIntroduction = false
  }
  return {
    // 直接对应组件需要的props
    state,
    
    // 基础操作方法
    show,
    hide
  }
}