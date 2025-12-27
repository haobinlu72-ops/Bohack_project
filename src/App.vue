<template>
  <!-- 直接引入视频解析组件，和你原有代码一致，无需改动 -->
  <VideoAnalyzer />
</template>

<script setup lang="ts">
// 引入你的 VideoAnalyzer 组件，路径确保正确（和你原有一致）
import VideoAnalyzer from './components/VideoAnalyzer.vue';
</script>

<style>
/* 强制根容器全屏，解决撑不满、有空隙的核心样式 */
html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

#app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>