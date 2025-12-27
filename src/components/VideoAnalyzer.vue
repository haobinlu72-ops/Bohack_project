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

      <button class="analyze-btn" @click="startAnalysis" :disabled="!selectedFile">
        开始分析视频
      </button>
    </div>

    <!-- 右栏结果区（保持不变） -->
    <div class="result-section">
      <h2>解析结果</h2>
      <div class="result-card">
        <template v-if="analysisResult">
          <div class="result-content">{{ analysisResult }}</div>
        </template>
        <template v-else>
          <div class="empty-tip">
            上传视频并点击“开始分析”后，AI解析结果将显示于此
          </div>
        </template>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
// 逻辑部分保持不变（和之前一致）
import { ref } from 'vue';
import { analyzeVideo } from '@/services/cohereService';

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const analysisResult = ref<string | null>(null);

const triggerFileInput = () => {
  fileInput.value?.click();
};
const handleFileChange = (e: Event) => {
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
  try {
    const result = await analyzeVideo(selectedFile.value); 
    analysisResult.value = result;
  } catch (err) {
    console.error('分析失败:', err);
    analysisResult.value = '解析失败，请重试';
  }
};
</script>

<style scoped>
/* 全局容器：全屏无滚动条 + 柔和背景 */
.analyzer-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  padding: 12px; /* 全局留12px边距，避免贴边太生硬 */
  margin: 0;
  gap: 16px;
  background: #f8f9fa;
  box-sizing: border-box;
  overflow: hidden; /* 彻底禁止滚动条 */
}

/* 左栏：40%宽度 + 完整显示按钮 */
.upload-section {
  width: 40%;
  height: 100%;
  padding: 20px 24px; /* 调整内边距，确保按钮不被截断 */
  background: #ffffff;
  border-radius: 12px; /* 加回圆角，提升美观度 */
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  box-sizing: border-box; /* 确保padding不溢出高度 */
  gap: 12px; /* 用gap控制子元素（标题、上传区、文件预览、按钮）的间距 */
}

/* 上传区域：居中+柔和样式 */
.upload-area {
  border: 2px dashed #b3d4fc;
  border-radius: 8px;
  padding: 20px;
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
  gap: 12px; /* 按钮和预览区域的间距 */
  flex-wrap: wrap; /* 小屏幕自动换行 */
}

/* 选择文件按钮样式 */
.select-file-btn {
  padding: 8px 16px;
  background: #f5faff;
  border: 1px solid #409eff;
  border-radius: 6px;
  color: #409eff;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}
.select-file-btn:hover {
  background: #e6f2ff;
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