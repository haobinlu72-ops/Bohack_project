// src/services/deepseekService.ts
import type { AnalysisError } from '@/types';

// DeepSeek 官方API地址
const DEEPSEEK_API_BASE = 'https://api.deepseek.com/v1/chat/completions';

// 获取 DeepSeek API Key
const getDeepSeekApiKey = (): string => {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('请配置 VITE_DEEPSEEK_API_KEY 环境变量（从 DeepSeek 控制台获取）');
  }
  return apiKey;
};

// 调用DeepSeek生成最终文本
export async function generateFinalTextWithDeepSeek(
  rawAnalysis: string,
  videoInfo: {
    name: string;
    size: string;
    framesCount: number;
    intervalSeconds: number;
  }
): Promise<string> {
  try {
    const apiKey = getDeepSeekApiKey();
    
    // 构造提示词，让DeepSeek整理结果
    const prompt = `请将以下视频分析原始结果整理成格式清晰、语言流畅的最终报告：
${rawAnalysis}

整理要求：
1. 保留所有关键信息
2. 分点论述，逻辑清晰
3. 语言正式、专业
4. 补充视频基础信息：
   - 文件名: ${videoInfo.name}
   - 文件大小: ${videoInfo.size}
   - 提取帧数: ${videoInfo.framesCount}
   - 帧提取间隔: ${videoInfo.intervalSeconds}秒
   - 分析模型: Gemini Pro Vision（帧分析） + DeepSeek（文本整理）`;

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
        temperature: 0.3,
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
    console.error('DeepSeek文本生成失败:', err);
    throw err;
  }
}

// 提取视频帧的工具函数（从原代码保留）
export async function extractVideoFrames(videoFile: File, intervalSeconds: number = 5): Promise<string[]> {
  return new Promise((resolve, reject) => {
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
    
    const objectUrl = URL.createObjectURL(videoFile);
    video.src = objectUrl;
    
    // 延长超时时间至30秒
    const timeoutId = setTimeout(() => {
      video.pause();
      URL.revokeObjectURL(objectUrl);
      reject(new Error('视频加载超时，请尝试较短的视频（建议1分钟内）'));
    }, 30000);
    
    video.addEventListener('loadedmetadata', () => {
      clearTimeout(timeoutId);
      // 限制最大尺寸
      const maxDimension = 1024;
      let width = video.videoWidth;
      let height = video.videoHeight;
      
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const frames: string[] = [];
      const duration = video.duration;
      const totalFrames = Math.floor(duration / intervalSeconds);
      const framesToExtract = Math.max(1, Math.min(10, totalFrames + 1));
      
      let framesExtracted = 0;
      
      const extractFrame = (time: number) => {
        const nextTime = intervalSeconds * framesExtracted;
        if (framesExtracted >= framesToExtract || nextTime >= duration) {
          video.pause();
          URL.revokeObjectURL(objectUrl);
          resolve(frames);
          return;
        }
        video.currentTime = time;
      };
      
      video.addEventListener('seeked', () => {
        try {
          ctx.drawImage(video, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          frames.push(dataUrl);
          framesExtracted++;
          extractFrame(intervalSeconds * framesExtracted);
        } catch (error) {
          video.pause();
          URL.revokeObjectURL(objectUrl);
          reject(error);
        }
      });
      
      extractFrame(0);
    });
    
    video.addEventListener('error', (e) => {
      clearTimeout(timeoutId);
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`视频加载失败: ${video.error?.message || '未知错误'}`));
    });
  });
}

// 缓存相关函数（保留）
const CACHE_PREFIX = 'video_analysis_';

export async function getFileHash(file: File, interval: number): Promise<string> {
  const hashString = `${file.name}_${file.size}_${file.lastModified}_${interval}`;
  let hash = 0;
  for (let i = 0; i < hashString.length; i++) {
    const char = hashString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `${CACHE_PREFIX}${Math.abs(hash)}`;
}

export function getCachedResult(fileHash: string): string | null {
  try {
    const cached = localStorage.getItem(fileHash);
    if (cached) {
      const data = JSON.parse(cached);
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
    localStorage.setItem(fileHash, JSON.stringify({
      result,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.warn('保存缓存失败:', error);
  }
}