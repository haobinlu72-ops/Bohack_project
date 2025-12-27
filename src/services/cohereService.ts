import type { VideoAnalysisRequest, VideoAnalysisResponse, AnalysisError } from '@/types';

// Cohere API 配置
const COHERE_API_BASE = 'https://api.cohere.ai/v1';

// 获取 API Key（从环境变量）
const getApiKey = (): string => {
  const apiKey = import.meta.env.VITE_COHERE_API_KEY;
  if (!apiKey) {
    throw new Error('请配置 VITE_COHERE_API_KEY 环境变量。请在项目根目录创建 .env 文件并添加：VITE_COHERE_API_KEY=your_api_key_here');
  }
  return apiKey;
};

// 本地存储键名
const CACHE_PREFIX = 'cohere_video_';

/**
 * 计算文件的简单哈希值（基于文件名和大小）用于缓存
 */
async function getFileHash(file: File): Promise<string> {
  const hashString = `${file.name}_${file.size}_${file.lastModified}`;
  let hash = 0;
  for (let i = 0; i < hashString.length; i++) {
    const char = hashString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `${CACHE_PREFIX}${Math.abs(hash)}`;
}

/**
 * 从缓存获取结果
 */
function getCachedResult(fileHash: string): VideoAnalysisResponse | null {
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

/**
 * 保存结果到缓存
 */
function setCachedResult(fileHash: string, result: VideoAnalysisResponse): void {
  try {
    localStorage.setItem(fileHash, JSON.stringify({
      result,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.warn('保存缓存失败:', error);
  }
}

/**
 * 提取视频的关键帧（简化版：使用 HTML5 Video API）
 */
async function extractVideoFrames(videoFile: File, maxFrames: number = 5): Promise<string[]> {
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
    
    const objectUrl = URL.createObjectURL(videoFile);
    video.src = objectUrl;
    
    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const frames: string[] = [];
      const frameInterval = Math.max(1, Math.floor(video.duration / (maxFrames + 1)));
      let framesExtracted = 0;
      
      const extractFrame = (time: number) => {
        if (framesExtracted >= maxFrames) {
          URL.revokeObjectURL(objectUrl);
          resolve(frames);
          return;
        }
        
        video.currentTime = time;
      };
      
      video.addEventListener('seeked', () => {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          frames.push(dataUrl);
          framesExtracted++;
          
          if (framesExtracted < maxFrames) {
            extractFrame(frameInterval * (framesExtracted + 1));
          } else {
            URL.revokeObjectURL(objectUrl);
            resolve(frames);
          }
        } catch (error) {
          URL.revokeObjectURL(objectUrl);
          reject(error);
        }
      }, { once: false });
      
      extractFrame(frameInterval);
    });
    
    video.addEventListener('error', (e) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('视频加载失败'));
    });
  });
}

/**
 * 将图像数据 URL 转换为 base64
 */
function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(',')[1];
}

/**
 * 调用 Cohere API 分析视频
 */
export async function analyzeVideo(
  params: VideoAnalysisRequest
): Promise<{ data?: VideoAnalysisResponse; error?: AnalysisError }> {
  try {
    console.log('开始分析视频:', params.video.name, params.video.size, 'bytes');
    
    // 检查缓存
    const fileHash = await getFileHash(params.video);
    const cachedResult = getCachedResult(fileHash);
    if (cachedResult) {
      console.log('使用缓存结果');
      return { data: cachedResult };
    }

    const apiKey = getApiKey();
    
    // 提取视频关键帧
    console.log('正在提取视频关键帧...');
    const frames = await extractVideoFrames(params.video, 3);
    console.log(`成功提取 ${frames.length} 帧`);

    // 构建分析提示
    const videoInfo = {
      name: params.video.name,
      size: `${(params.video.size / 1024 / 1024).toFixed(2)} MB`,
      type: params.video.type,
      framesCount: frames.length
    };

    // 注意：Cohere 的文本生成 API 主要处理文本，这里我们创建一个详细的提示来描述视频
    // 如果 Cohere 将来支持图像输入，可以传递图像数据
    const prompt = params.prompt || `请分析以下视频文件的信息并给出详细描述：

视频文件名：${videoInfo.name}
文件大小：${videoInfo.size}
文件类型：${videoInfo.type}
提取的关键帧数量：${videoInfo.framesCount}

请提供：
1. 视频可能的主要内容描述
2. 视频的场景和可能的主题
3. 视频的视觉特征（基于文件名和类型推断）
4. 其他值得注意的信息

请用中文回答，格式清晰。`;

    console.log('调用 Cohere API 进行分析...');
    
    // 调用 Cohere 文本生成 API
    const response = await fetch(`${COHERE_API_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model: 'command',
        prompt: prompt,
        max_tokens: 1000,
        temperature: 0.7,
        k: 0,
        p: 0.75,
        stop_sequences: [],
        return_likelihoods: 'NONE',
      }),
    });

    if (!response.ok) {
      let errorMessage = `Cohere API 调用失败: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        console.error('Cohere API 错误详情:', errorData);
      } catch (e) {
        const errorText = await response.text().catch(() => '');
        console.error('Cohere API 错误响应:', errorText);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.generations || !data.generations[0] || !data.generations[0].text) {
      throw new Error('Cohere API 返回格式异常');
    }

    const analysisText = data.generations[0].text.trim();
    
    // 构建完整的结果
    let analysisContent = `## 视频分析结果\n\n${analysisText}\n\n`;
    
    // 添加视频基本信息
    analysisContent += `## 视频基本信息\n\n`;
    analysisContent += `- **文件名**: ${videoInfo.name}\n`;
    analysisContent += `- **文件大小**: ${videoInfo.size}\n`;
    analysisContent += `- **文件类型**: ${videoInfo.type}\n`;
    analysisContent += `- **提取帧数**: ${videoInfo.framesCount}\n`;
    
    // 如果提供了自定义提示，添加说明
    if (params.prompt) {
      analysisContent += `\n**分析提示**: ${params.prompt}\n`;
    }

    const result: VideoAnalysisResponse = {
      analysis: analysisContent.trim(),
      model: 'cohere-command',
      framesExtracted: frames.length,
    };

    // 保存到缓存
    setCachedResult(fileHash, result);

    console.log('视频分析完成');
    return { data: result };

  } catch (err) {
    console.error('视频分析失败:', err);
    
    let errorMessage = '分析过程发生未知错误';
    let errorCode: number | undefined;

    if (err instanceof Error) {
      errorMessage = err.message;
      
      // 处理常见的 API 错误
      if (errorMessage.includes('API_KEY') || errorMessage.includes('Authorization') || 
          errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        errorMessage = 'API Key 配置错误或无效，请检查环境变量 VITE_COHERE_API_KEY 是否正确';
      } else if (errorMessage.includes('quota') || errorMessage.includes('limit') || 
                 errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        errorMessage = 'API 配额已用完或请求过于频繁，请稍后再试';
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || 
                 errorMessage.includes('Failed to fetch')) {
        errorMessage = '网络请求失败，请检查网络连接';
      } else if (errorMessage.includes('CORS') || errorMessage.includes('cors')) {
        errorMessage = 'CORS 错误：可能需要配置后端代理（见 TROUBLESHOOTING.md）';
      } else if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
        errorMessage = `请求格式错误: ${errorMessage}`;
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        errorMessage = '访问被拒绝，请检查 API Key 权限';
      } else if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
        errorMessage = '服务器内部错误，请稍后重试';
      }
    }

    return {
      error: {
        message: errorMessage,
        code: errorCode
      }
    };
  }
}

