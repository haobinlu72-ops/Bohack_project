// src/services/videoAnalysisService.ts
import type { VideoAnalysisRequest, VideoAnalysisResponse, AnalysisError } from '@/types';
import { analyzeFramesWithGemini } from './geminiService';
import { 
  getFileHash,
  getCachedResult,
  setCachedResult,
  extractAudioAndTranscribe,
  extractVideoFrames
} from './deepseekService';

// 生成纯本地模拟分析结果
const generateFallbackAnalysis = (videoInfo: any): string => {
  return `视频分析结果（本地 fallback）：
- 视频名称：${videoInfo.name}
- 视频大小：${videoInfo.size}

由于服务暂时不可用，无法提供详细分析。请稍后再试，或检查网络连接。`;
};

export async function analyzeVideo(
  request: VideoAnalysisRequest
): Promise<{ data?: VideoAnalysisResponse; error?: AnalysisError }> {
  try {
    // 检查缓存 - 使用请求中的帧间隔
    const interval = request.frameInterval; // 从请求获取帧间隔，而不是固定值
    const fileHash = await getFileHash(request.video, interval);
    const cachedResult = getCachedResult(fileHash);
    
    if (cachedResult) {
      return {
        data: {
          analysis: cachedResult,
          model: 'Gemini Pro (缓存)',
          framesExtracted: 0
        }
      };
    }

    // 提取视频帧 - 使用用户指定的间隔
    console.log(`开始提取视频帧，间隔${interval}秒...`);
    const frames = await extractVideoFrames(request.video, interval);
    console.log(`成功提取 ${frames.length} 帧`);

    // 提取音频并转文本
    console.log('开始提取音频并转换为文本...');
    const audioTranscript = await extractAudioAndTranscribe(request.video);
    console.log('音频转文本完成');

    // 使用Gemini分析视频帧
    const analysis = await analyzeFramesWithGemini(request, frames, interval, audioTranscript);
    
    // 缓存结果
    setCachedResult(fileHash, analysis);
    
    return {
      data: {
        analysis,
        model: analysis.includes('(模拟)') ? '模拟分析模式' : 'Gemini Pro',
        framesExtracted: frames.length
      }
    };
  } catch (err) {
    console.error('视频分析失败:', err);
    // 最终fallback
    const fallbackAnalysis = generateFallbackAnalysis({
      name: request.video.name,
      size: formatFileSize(request.video.size)
    });
    
    return {
      data: {
        analysis: fallbackAnalysis,
        model: '本地 fallback 模式',
        framesExtracted: 0
      }
    };
  }
}

// 辅助函数：格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}