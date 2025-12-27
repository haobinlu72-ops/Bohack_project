<template>
  <!-- 视频解析工具主页面 -->
  <VideoAnalyzer />
</template>

<script lang="ts">
// 引入视频解析组件（替代原List组件）
import VideoAnalyzer from './components/VideoAnalyzer.vue';

export default {
  name: 'App',
  components: {
    VideoAnalyzer // 注册视频解析组件
  }
};
</script>

<style>
/* 全局基础样式 */
body {
  margin: 0;
  padding: 20px;
  background-color: #f0f2f5;
  min-height: 100vh;
  box-sizing: border-box;
}

/* 确保根容器充满可用空间 */
#app {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
