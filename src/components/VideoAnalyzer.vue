<!-- src/components/VideoAnalyzer.vue -->
<template>
  <div class="analyzer-container">
    <div class="upload-section">
      <h2>视频智能分析工具</h2>
      <!-- 上传区域 -->
      <div class="upload-area" @click="triggerFileInput" @dragover.prevent @drop="handleDrop">
        <div class="upload-icon">↑</div>
        <p>点击或拖拽视频文件此处上传</p>
        <p class="tip">支持MP4、MOV、AVI格式，最大100MB</p>
        <input
          type="file"
          ref="fileInput"
          class="file-input"
          accept="video/mp4,video/quicktime,video/x-msvideo"
          @change="handleFileChange"
        >
      </div>

      <!-- 文件选择+预览区域 -->
      <div class="file-ops-area">
        <button class="select-file-btn" @click="triggerFileInput">选择文件</button>
        <div class="file-preview">
          <span class="preview-label">已选文件：</span>
          <span class="file-name">{{ selectedFile ? selectedFile.name : "未选择文件" }}</span>
        </div>
      </div>

      <!-- 提示信息 -->
      <div v-if="selectedFile" class="info-container">
        <p class="info-text">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          将使用 Gemini AI 直接分析视频内容，生成详细描述
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
import { ref } from 'vue';
import { analyzeVideo } from '@/services/videoAnalysisService';
import type { VideoAnalysisRequest } from '@/types';

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const isAnalyzing = ref(false);
const analysisResult = ref('');
const errorMessage = ref('');

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value?.click();
};

// 处理文件选择
const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files?.[0]) {
    selectedFile.value = target.files[0];
    errorMessage.value = '';
  }
};

// 处理拖放文件
const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  if (e.dataTransfer?.files?.[0]) {
    selectedFile.value = e.dataTransfer.files[0];
    errorMessage.value = '';
  }
};

// 处理分析
const handleAnalyze = async () => {
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
    analysisResult.value = data.analysis;
  }

  isAnalyzing.value = false;
};
</script>

<style scoped>
.analyzer-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.upload-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

h2 {
  color: #333;
  text-align: center;
  margin: 0;
}

.upload-area {
  border: 2px dashed #409eff;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s;
}

.upload-area:hover {
  border-color: #337ecc;
}

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

.file-ops-area {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.select-file-btn {
  padding: 8px 16px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.select-file-btn:hover {
  background: #e9eef3;
}

.file-preview {
  padding: 8px 12px;
  background: #f5faff;
  border-radius: 6px;
  font-size: 14px;
  color: #409eff;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-label {
  font-weight: 500;
}

.info-container {
  padding: 12px;
  background: #f0f9eb;
  border-radius: 4px;
  color: #67c23a;
  font-size: 14px;
}

.info-text {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.analyze-btn:disabled {
  background: #a0cfff;
  cursor: not-allowed;
  box-shadow: none;
}

.analyze-btn:hover:not(:disabled) {
  background: #337ecc;
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.4);
}

.error-message {
  margin-top: 1rem;
  padding: 12px;
  background: #fef0f0;
  border-radius: 4px;
  color: #f56c6c;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
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
</style>