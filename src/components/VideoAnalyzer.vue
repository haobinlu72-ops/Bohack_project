<!-- src/components/VideoAnalyzer.vue -->
<template>
  <div class="analyzer-container">
    <div class="upload-section">
      <h2>视频智能分析工具</h2>
      <!-- 蓝色虚线框（仅保留上传提示，移除按钮） -->
      <div class="upload-area" @click="triggerFileInput" @dragover.prevent @drop="handleDrop">
        <div class="upload-icon">↑</div>
        <p>点击或拖拽视频文件此处上传</p>
        <p class="tip">支持MP4、MOV、AVI格式，最大100MB</p>
        <!-- 把选择文件按钮从这里彻底移走 -->
        <input
          type="file"
          ref="fileInput"
          class="file-input"
          accept="video/mp4,video/quicktime,video/x-msvideo"
          @change="handleFileChange"
        >
      </div>

      <!-- 新增：文件选择+预览区域（按钮+状态都在虚线框外） -->
      <div class="file-ops-area">
        <button class="select-file-btn" @click="triggerFileInput">选择文件</button>
        <div class="file-preview">
          <span class="preview-label">已选文件：</span>
          <span class="file-name">{{ selectedFile ? selectedFile.name : "未选择文件" }}</span>
        </div>
      </div>

      <!-- 帧提取间隔设置 -->
      <div v-if="selectedFile" class="frame-interval">
        <label for="interval">关键帧提取间隔 (秒):</label>
        <input
          type="number"
          id="interval"
          v-model.number="frameInterval"
          min="1"
          max="60"
          step="1"
        >
        <p class="interval-hint">建议值: 3-10秒，间隔越小分析越精细但耗时越长</p>
      </div>

      <!-- 提示信息 -->
      <div v-if="selectedFile" class="info-container">
        <p class="info-text">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          将使用 Cohere AI 分析视频内容，提取关键帧并生成详细描述
        </p>
      </div>

      <!-- 解析按钮 -->
      <button 
        class="analyze-btn"
        @click="handleAnalyze"
        :disabled="!selectedFile || isAnalyzing"
      >
        <template v-if="isAnalyzing">
          <svg class="loading-spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M16 12a4 4 0 1 1-8 0"></path>
          </svg>
          分析中...
        </template>
        <template v-else>开始分析视频</template>
      </button>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error-message">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      {{ errorMessage }}
    </div>

    <!-- 分析结果 -->
    <div v-if="analysisResult" class="result-container">
      <h3>分析结果</h3>
      <div class="result-content">{{ analysisResult }}</div>
    </div>
  </div>
</template>


<script setup lang="ts">
// 逻辑部分保持不变（和之前一致）
import { ref } from 'vue';
import { analyzeVideo } from '@/services/cohereService';
import type { VideoAnalysisRequest } from '@/types';

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const isDragging = ref(false);
const isAnalyzing = ref(false);
const analysisResult = ref('');
const errorMessage = ref('');

/**
 * 处理文件选择
 */
const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files?.[0]) {
    selectedFile.value = target.files[0];
  }
};
const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  if (e.dataTransfer?.files?.[0]) {
    selectedFile.value = e.dataTransfer.files[0];
  }
};

const startAnalysis = async () => {
  if (!selectedFile.value) return;

  isAnalyzing.value = true;
  errorMessage.value = '';
  analysisResult.value = '';

  const request: VideoAnalysisRequest = {
    video: selectedFile.value
  };

  const { data, error } = await analyzeVideo(request);

  if (error) {
    errorMessage.value = error.message;
  } else if (data) {
    analysisResult.value = data.analysis || JSON.stringify(data, null, 2);
  }

  isAnalyzing.value = false;
};
</script>

<style scoped>
.video-analyzer {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

h2 {
  color: #333;
  text-align: center;
  cursor: pointer;
  flex: 1;
  /* 去掉原来的margin，改用upload-section的gap控制间距 */
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: border-color 0.3s;
}
.upload-area:hover {
  border-color: #409eff; /* hover时变主题色，提升交互感 */
}

/* 右栏：60%宽度 + 柔和卡片 */
.result-section {
  width: 60%;
  height: 100%;
  padding: 20px 24px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* 结果区域：美化+适配 */
.result-card {
  flex: 1;
  padding: 24px;
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow-y: auto;
  line-height: 1.8;
  font-size: 14px;
  color: #333;
}

/* 标题样式：提升层次感 */
h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

/* 上传提示样式 */
.upload-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 16px;
}

.file-input {
  display: none;
}

.upload-area p {
  margin: 8px 0;
  color: #666;
}
.tip {
  font-size: 12px;
  color: #999;
}

/* 按钮样式：完整显示+交互感 */
.analyze-btn:disabled {
  background: #a0cfff;
  cursor: not-allowed;
  box-shadow: none;
}
.analyze-btn:hover:not(:disabled) {
  background: #337ecc;
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.4);
}

/* 空提示样式：柔和居中 */
.empty-tip {
  color: #999;
  text-align: center;
  position: relative;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
}


.preview-label {
  font-weight: 500;
}
.file-name {
  color: #666;
  /* 文件名过长时自动省略 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 开始分析按钮：保持原有样式，通过upload-section的gap控制间距 */
.analyze-btn {
  width: 100%;
  padding: 14px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);
  transition: background 0.3s, box-shadow 0.3s;
}

.file-ops-area {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.result-container {
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #f3f4f6;
}

.result-container h3 {
  margin-top: 0;
  color: #111827;
  margin-bottom: 1rem;
  font-size: 1.25rem;
}

.result-content {
  color: #374151;
  line-height: 1.6;
  white-space: pre-wrap;
}

/* 其他样式保持不变，仅调整file-preview的margin */
.file-preview {
  padding: 8px 12px;
  background: #f5faff;
  border-radius: 6px;
  font-size: 14px;
  color: #409eff;
  flex: 1; /* 占满剩余宽度 */
}
</style>