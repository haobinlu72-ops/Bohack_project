import type { VideoAnalysisRequest, VideoAnalysisResponse, AnalysisError } from '@/types';

/**
 * 调用Google AI Studio API解析视频
 * @param params 包含视频文件的请求参数
 * @returns 解析结果或错误信息
 */
export async function analyzeVideo(
  params: VideoAnalysisRequest
): Promise<{ data?: VideoAnalysisResponse; error?: AnalysisError }> {
  try {
    // 构建FormData
    const formData = new FormData();
    formData.append('video', params.video);

    // 调用API（通过Vite代理转发）
    const response = await fetch('/api/videos:analyze', {
      method: 'POST',
      body: formData,
      headers: {
        // 不需要设置Content-Type，浏览器会自动处理multipart/form-data
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error: {
          message: errorData.error?.message || `请求失败: ${response.statusText}`,
          code: response.status
        }
      };
    }

    const data = await response.json();
    return { data };

  } catch (err) {
    console.error('视频解析失败:', err);
    return {
      error: {
        message: err instanceof Error ? err.message : '解析过程发生未知错误'
      }
    };
  }
}