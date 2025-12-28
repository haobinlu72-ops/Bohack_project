// src/services/deepseekService.ts
import type { AnalysisError } from '@/types';

// DeepSeek 官方API地址
const DEEPSEEK_API_BASE = 'https://api.deepseek.com/v1/chat/completions';

// 获取 DeepSeek API Key
const getDeepSeekApiKey = (): string => {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.warn('未配置 VITE_DEEPSEEK_API_KEY 环境变量，将跳过DeepSeek处理');
    return 'MOCK_KEY'; // 返回模拟密钥
  }
  return apiKey;
};

// 提取音频并转录为文本
export async function extractAudioAndTranscribe(videoFile: File): Promise<string> {
  try {
    // 这里实现音频提取和转录的基础版本
    // 实际项目中可能需要使用专门的音频处理库如ffmpeg.wasm
    console.log('提取音频并转换为文本');
    
    // 模拟音频转录过程
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('音频转录：视频包含可识别的语音内容，主要讨论了视频中的关键场景和动作（实际实现需要音频处理库支持）');
      }, 1000);
    });
  } catch (error) {
    console.error('音频提取和转录失败:', error);
    return '未能提取音频内容：音频处理过程中发生错误';
  }
}

// 调用DeepSeek生成最终文本
export async function generateFinalTextWithDeepSeek(
  rawAnalysis: string,
  videoInfo: {
    name: string;
    size: string;
    framesCount: number;
    intervalSeconds: number;
  },
  audioTranscript: string  // 添加音频转录参数
): Promise<string> {
  try {
    const apiKey = getDeepSeekApiKey();
    
    // 如果是模拟密钥，直接返回原始分析结果
    if (apiKey === 'MOCK_KEY') {
      return rawAnalysis;
    }
    
    // 构造提示词，让DeepSeek整理结果，加入音频信息
    const prompt = `请将以下视频分析原始结果和音频转录内容整理成格式清晰、语言流畅的最终报告：
${rawAnalysis}

音频转录内容：
${audioTranscript}

整理要求：
1. 保留所有关键信息
2. 分点论述，逻辑清晰
3. 语言正式、专业
4. 补充视频基础信息：
   - 文件名: ${videoInfo.name}
   - 文件大小: ${videoInfo.size}
   - 提取帧数: ${videoInfo.framesCount}
   - 帧提取间隔: ${videoInfo.intervalSeconds}秒
5. 从视频中识别主体的状态或行为特征，例如：
   - 安静/活跃/紧张/疲劳
   - 正在执行的动作或流程阶段
   - 环境与姿态特征
6. 不要输出生成时间`;

    // 调用 DeepSeek API
    console.log('调用 DeepSeek API 生成最终文本...');
    const response = await fetch(DEEPSEEK_API_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 3000,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`DeepSeek API 调用失败: ${errorData.error?.message || response.statusText}`);
    }

    // 解析响应
    const responseData = await response.json();
    const finalText = responseData.choices?.[0]?.message?.content || '';
    
    if (!finalText) {
      throw new Error('DeepSeek API 返回空结果');
    }

    return finalText;
  } catch (err) {
    console.error('DeepSeek文本生成失败，使用原始分析结果:', err);
    return rawAnalysis; // 失败时返回原始分析结果
  }
}

// 提取视频帧的工具函数
export async function extractVideoFrames(videoFile: File, intervalSeconds: number = 5): Promise<string[]> {
  return new Promise((resolve, reject) => {
    // 检查浏览器环境
    if (typeof window === 'undefined') {
      reject(new Error('视频帧提取需要浏览器环境'));
      return;
    }

    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('无法创建 Canvas 上下文'));
      return;
    }

    video.preload = 'metadata';
    video.muted = true;
    video.crossOrigin = 'anonymous';
    video.style.display = 'none'; // 确保视频元素不显示在页面上
    document.body.appendChild(video); // 添加到DOM以确保能正确加载
    
    const objectUrl = URL.createObjectURL(videoFile);
    video.src = objectUrl;
    
    // 超时处理 - 缩短超时时间便于测试
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('视频加载超时，请尝试较短的视频（建议1分钟内）'));
    }, 420000); // 1分钟超时
    
    // 清理函数
    const cleanup = () => {
      video.pause();
      URL.revokeObjectURL(objectUrl);
      document.body.removeChild(video); // 从DOM移除
      clearTimeout(timeoutId);
    };
    
    video.addEventListener('loadedmetadata', () => {
      try {
        clearTimeout(timeoutId);
        const maxDimension = 800; // 减小尺寸以避免请求过大
        let width = video.videoWidth;
        let height = video.videoHeight;
        
        // 调整尺寸
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const frames: string[] = [];
        const duration = video.duration;
        if (isNaN(duration)) {
          cleanup();
          reject(new Error('无法获取视频时长'));
          return;
        }
        
        const totalFrames = Math.floor(duration / intervalSeconds);
        const framesToExtract = Math.max(1, Math.min(30, totalFrames + 1)); // 限制最大帧数以避免请求过大
        
        console.log(`视频时长: ${duration.toFixed(1)}秒, 计划提取 ${framesToExtract} 帧`);
        
        let framesExtracted = 0;
        
        const extractFrame = (time: number) => {
          if (framesExtracted >= framesToExtract || time >= duration) {
            cleanup();
            resolve(frames);
            return;
          }
          video.currentTime = time;
        };
        
        const seekedHandler = () => {
          try {
            ctx.drawImage(video, 0, 0, width, height);
            // 使用较低质量减少数据大小
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            frames.push(dataUrl);
            framesExtracted++;
            console.log(`已提取 ${framesExtracted}/${framesToExtract} 帧`);
            extractFrame(intervalSeconds * framesExtracted);
          } catch (error) {
            cleanup();
            reject(error);
          }
        };
        
        video.addEventListener('seeked', seekedHandler);
        
        extractFrame(0);
      } catch (error) {
        cleanup();
        reject(error);
      }
    });
    
    video.addEventListener('error', () => {
      cleanup();
      reject(new Error(`视频加载失败: ${video.error?.message || '未知错误'}`));
    });
  });
}

// 缓存相关函数
const CACHE_PREFIX = 'video_analysis_';

export async function getFileHash(file: File, interval: number): Promise<string> {
  const hashString = `${file.name}_${file.size}_${file.lastModified}_${interval}`;
  let hash = 0;
  for (let i = 0; i < hashString.length; i++) {
    const char = hashString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return `${CACHE_PREFIX}${Math.abs(hash)}`;
}

export function getCachedResult(fileHash: string): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    
    const cached = localStorage.getItem(fileHash);
    if (cached) {
      const data = JSON.parse(cached);
      // 缓存有效期24小时
      if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
        return data.result;
      } else {
        localStorage.removeItem(fileHash);
      }
    }
  } catch (error) {
    console.warn('读取缓存失败:', error);
  }
  return null;
}

export function setCachedResult(fileHash: string, result: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    
    localStorage.setItem(fileHash, JSON.stringify({
      result,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.warn('保存缓存失败:', error);
  }
}