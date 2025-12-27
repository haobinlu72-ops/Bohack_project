<!-- src/components/VideoAnalyzer.vue -->
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
          将使用 Gemini 分析视频帧内容，DeepSeek 生成最终报告，每隔{{ frameInterval }}秒提取一帧
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
          <span v-if="processingStep === 'frames'">提取视频帧中...</span>
          <span v-if="processingStep === 'gemini'">Gemini分析帧内容中...</span>
          <span v-if="processingStep === 'deepseek'">DeepSeek生成报告中...</span>
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
      <!-- 修改部分：使用pre标签确保文本格式正确显示 -->
      <pre class="result-content">{{ analysisResult }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { 
  extractVideoFrames, 
  getFileHash, 
  getCachedResult, 
  setCachedResult,
  generateFinalTextWithDeepSeek
} from '../services/deepseekService';
import { analyzeFramesWithGemini } from '../services/geminiService';
import type { VideoAnalysisRequest } from '../types';

// 状态管理
const selectedFile = ref<File | null>(null);
const isDragging = ref(false);
const isAnalyzing = ref(false);
const analysisResult = ref('');
const errorMessage = ref('');
const frameInterval = ref(5); // 默认5秒提取一帧
const processingStep = ref<'frames' | 'gemini' | 'deepseek'>('frames');

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
  processingStep.value = 'frames';

  try {
    // 检查缓存
    const fileHash = await getFileHash(selectedFile.value, frameInterval.value);
    const cachedResult = getCachedResult(fileHash);
    if (cachedResult) {
      console.log('使用缓存结果');
      analysisResult.value = cachedResult;
      isAnalyzing.value = false;
      return;
    }

    // 1. 提取视频帧
    console.log('提取关键帧...');
    const frames = await extractVideoFrames(selectedFile.value, frameInterval.value);
    console.log(`提取到 ${frames.length} 帧`);

    if (frames.length === 0) {
      throw new Error('无法从视频中提取关键帧');
    }

    // 2. 使用Gemini分析帧内容
    processingStep.value = 'gemini';
    const request: VideoAnalysisRequest = {
      video: selectedFile.value,
      prompt: `请分析视频中的这些关键帧（每隔${frameInterval.value}秒提取一帧，共${frames.length}帧）并提供详细描述，包括场景、物体、动作和时间线关联。`
    };
    
    const geminiAnalysis = await analyzeFramesWithGemini(request, frames, frameInterval.value);

    // 3. 使用DeepSeek生成最终文本
    processingStep.value = 'deepseek';
    const videoInfo = {
      name: selectedFile.value.name,
      size: formatFileSize(selectedFile.value.size),
      framesCount: frames.length,
      intervalSeconds: frameInterval.value
    };
    
    const finalResult = await generateFinalTextWithDeepSeek(geminiAnalysis, videoInfo);

    // 4. 缓存结果
    setCachedResult(fileHash, finalResult);
    
    // 5. 显示结果
    analysisResult.value = finalResult;
  } catch (err) {
    console.error('分析失败:', err);
    
    let errorMessage = '分析过程发生错误';
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    }

    // 错误类型细化
    if (errorMessage.includes('视频加载超时')) {
      errorMessage = '视频加载超时，请尝试更短的视频（建议1分钟以内）';
    } else if (errorMessage.includes('帧图片加载失败')) {
      errorMessage = '视频帧处理失败，请尝试其他格式的视频（MP4/AVI 优先）';
    } else if (errorMessage.includes('API Key')) {
      errorMessage = 'API Key 配置错误，请检查环境变量';
    } else if (errorMessage.includes('quota')) {
      errorMessage = 'API 额度不足，请前往官网充值或检查配额';
    } else if (errorMessage.includes('Model Not Exist')) {
      errorMessage = '模型不存在，请确认使用正确的模型名称';
    }

    errorMessage.value = errorMessage;
  } finally {
    isAnalyzing.value = false;
  }
};
</script>

<style scoped>
/* 保持原有样式不变 */
.frame-interval {
  margin: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.frame-interval label {
  font-weight: 500;
  color: #374151;
}

.frame-interval input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  max-width: 100px;
}

.interval-hint {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

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
  word-wrap: break-word; /* 新增：确保长单词不会溢出容器 */
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