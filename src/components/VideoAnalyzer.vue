<template>
  <div class="video-analyzer">
    <h2>视频智能分析工具</h2>
    
    <!-- 上传区域 -->
    <div class="upload-container">
      <label class="upload-label" :class="{ dragOver: isDragging }">
        <input 
          type="file" 
          accept="video/*" 
          class="file-input"
          @change="handleFileSelect"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleFileDrop"
        >
        <div class="upload-hint">
          <svg 
            class="upload-icon" 
            xmlns="http://www.w3.org/2000/svg" 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <p>点击或拖拽视频文件到此处上传</p>
          <p class="format-hint">支持MP4、MOV、AVI格式，最大100MB</p>
        </div>
      </label>

      <!-- 已选文件信息 -->
      <div v-if="selectedFile" class="file-info">
        <div class="file-details">
          <span class="file-name">{{ selectedFile.name }}</span>
          <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
        </div>
        <button 
          class="remove-btn" 
          @click="clearFile"
          aria-label="移除文件"
        >
          &times;
        </button>
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
import { ref } from 'vue';
import { analyzeVideo } from '@/services/cohereService';
import type { VideoAnalysisRequest } from '@/types';

// 状态管理
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
  if (target.files && target.files[0]) {
    validateFile(target.files[0]);
  }
};

/**
 * 处理拖放文件
 */
const handleFileDrop = (e: DragEvent) => {
  isDragging.value = false;
  if (e.dataTransfer?.files[0]) {
    validateFile(e.dataTransfer.files[0]);
  }
};

/**
 * 验证文件合法性
 */
const validateFile = (file: File) => {
  // 验证文件类型
  if (!file.type.startsWith('video/')) {
    errorMessage.value = '请上传视频文件';
    return;
  }

  // 验证文件大小（100MB）
  if (file.size > 100 * 1024 * 1024) {
    errorMessage.value = '文件大小不能超过100MB';
    return;
  }

  // 验证通过
  selectedFile.value = file;
  errorMessage.value = '';
  analysisResult.value = '';
};

/**
 * 清除选中文件
 */
const clearFile = () => {
  selectedFile.value = null;
  analysisResult.value = '';
  // 重置input值（允许重复选择同一文件）
  const input = document.querySelector('.file-input') as HTMLInputElement;
  if (input) input.value = '';
};

/**
 * 格式化文件大小
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * 处理视频解析
 */
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
  margin-bottom: 2rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.upload-container {
  margin-bottom: 2rem;
}

.upload-label {
  display: block;
  width: 100%;
  height: 200px;
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.upload-label.dragOver {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.file-input {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #6b7280;
}

.upload-icon {
  color: #9ca3af;
  margin-bottom: 1rem;
}

.format-hint {
  font-size: 0.875rem;
  margin-top: 0.5rem;
  color: #9ca3af;
}

.file-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  margin: 1rem 0;
  background-color: #f9fafb;
  border-radius: 0.375rem;
  border: 1px solid #f3f4f6;
}

.file-details {
  overflow: hidden;
}

.file-name {
  display: block;
  font-weight: 500;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 500px;
}

.file-size {
  font-size: 0.875rem;
  color: #6b7280;
}

.remove-btn {
  background: transparent;
  border: none;
  color: #ef4444;
  font-size: 1.25rem;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.remove-btn:hover {
  background-color: #fee2e2;
}

.analyze-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.analyze-btn:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

.analyze-btn:not(:disabled):hover {
  background-color: #2563eb;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-message {
  padding: 1rem;
  background-color: #fee2e2;
  border-left: 4px solid #ef4444;
  border-radius: 0.375rem;
  color: #b91c1c;
  margin: 1rem 0;
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

.info-container {
  margin: 1.5rem 0;
  padding: 0.75rem 1rem;
  background-color: #eff6ff;
  border-radius: 0.5rem;
  border: 1px solid #bfdbfe;
}

.info-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  color: #1e40af;
  font-size: 0.875rem;
}
</style>