// src/services/geminiService.ts
import type { VideoAnalysisRequest } from '@/types';

// Gemini API 基础地址
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent';

// 获取Gemini API Key
const getGeminiApiKey = (): string => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('请配置 VITE_GEMINI_API_KEY 环境变量（从Google Cloud控制台获取）');
  }
  return apiKey;
};

// 调用Gemini分析视频帧
export async function analyzeFramesWithGemini(
  params: VideoAnalysisRequest,
  frames: string[],
  intervalSeconds: number
): Promise<string> {
  try {
    const apiKey = getGeminiApiKey();
    
    // 构建提示词
    const prompt = params.prompt || `你是专业的视频内容分析专家，以下是视频按时间顺序提取的关键帧（从左到右、从上到下为时间顺序），请详细分析：
1. 逐帧描述视频中的核心内容（场景、物体、人物、动作等）；
2. 总结视频的整体主题、情节走向；
3. 分析帧之间的时间关联和内容变化；
4. 推测视频的用途或创作意图。`;

    // 准备请求内容
    const contents = [
      {
        role: "user",
        parts: [
          { text: prompt }
        ]
      }
    ];

    // 添加所有帧图片
    frames.forEach(frame => {
      contents[0].parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: frame.replace(/^data:image\/jpeg;base64,/, "") // 提取base64数据
        }
      });
    });

    // 调用Gemini API
    console.log('调用Gemini API分析视频帧...');
    const response = await fetch(`${GEMINI_API_BASE}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API 调用失败: ${errorData.error?.message || response.statusText}`);
    }

    const responseData = await response.json();
    
    // 提取分析结果
    const analysisText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!analysisText) {
      throw new Error('Gemini API 返回空结果，请检查提示词或视频帧');
    }

    return analysisText;
  } catch (err) {
    console.error('Gemini帧分析失败:', err);
    throw err;
  }
}