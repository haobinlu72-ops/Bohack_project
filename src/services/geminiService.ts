// src/services/geminiService.ts
import type { VideoAnalysisRequest } from '@/types';

// 定义 Gemini API 内容类型接口
interface GeminiInlineData {
  mimeType: string;
  data: string;
}

interface GeminiContentPart {
  text?: string;
  inlineData?: GeminiInlineData;
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiContentPart[];
}

// Gemini API 基础地址
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent';

// 获取Gemini API Key
const getGeminiApiKey = (): string => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('未配置 VITE_GEMINI_API_KEY 环境变量，将使用模拟数据');
    return 'MOCK_KEY'; // 返回模拟密钥
  }
  return apiKey;
};

// 生成模拟分析结果（Gemini调用失败时使用）
const generateMockAnalysis = (framesCount: number, videoName: string): string => {
  return `视频分析结果（模拟）：
1. 视频"${videoName}"共提取了${framesCount}帧，内容包含动态场景变化
2. 整体主题推测为日常活动记录，画面呈现连贯的时间序列
3. 帧之间存在明显的时间递进关系，场景元素随时间有规律性变化
4. 可能用途为个人生活记录或活动存档

注：当前Gemini服务暂时不可用，以上为基于帧数量的模拟分析结果`;
};

// 调用Gemini分析视频帧
export async function analyzeFramesWithGemini(
  params: VideoAnalysisRequest,
  frames: string[],
  intervalSeconds: number,
  audioTranscript: string
): Promise<string> {
  try {
    const apiKey = getGeminiApiKey();
    
    // 如果是模拟密钥，直接返回模拟结果
    if (apiKey === 'MOCK_KEY') {
      console.log('使用模拟分析结果');
      return generateMockAnalysis(frames.length, params.video.name);
    }

    // 构建提示词，加入音频转录信息
    const prompt = params.prompt || `你是专业的视频内容分析专家，以下是视频按时间顺序提取的关键帧及音频转录内容，请详细分析：
1. 逐帧描述视频中的核心内容（场景、物体、人物、动作等）；
2. 结合音频内容，分析视频的整体主题、情节走向；
3. 分析帧之间的时间关联和内容变化；
4. 推测视频的用途或创作意图；
5. 关注视频中的人的声音和声调。

音频转录内容：${audioTranscript}`;

    // 准备请求内容
    const contents: GeminiContent[] = [
      {
        role: "user",
        parts: [
          { text: prompt }
        ]
      }
    ];

    // 添加所有帧图片
    frames.forEach((frame, index) => {
      try {
        if (!contents[0]) {
          console.error(`处理视频帧 #${index} 时出错: contents[0] 未定义`);
          return;
        }

        // 提取MIME类型和base64数据（加强类型检查）
        const matches = frame.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!matches || matches.length < 3) {
          console.warn(`跳过格式错误的帧 #${index}`);
          return;
        }

        // 使用非空断言确保类型为string（已通过前面的检查确保存在）
        const mimeType: string = matches[1]!;
        const base64Data: string = matches[2]!;

        // 只处理支持的图片类型
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
          console.warn(`跳过不支持的图片类型 #${index}：${mimeType}`);
          return;
        }

        contents[0].parts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        });
      } catch (err) {
        console.error(`处理视频帧 #${index} 时出错:`, err);
      }
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
          temperature: 0.5,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      console.error(`Gemini API 调用失败: ${response.statusText}，将使用模拟数据`);
      return generateMockAnalysis(frames.length, params.video.name);
    }

    const responseData = await response.json();
    
    // 提取分析结果
    const analysisText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!analysisText) {
      console.warn('Gemini返回空结果，使用模拟数据');
      return generateMockAnalysis(frames.length, params.video.name);
    }

    return analysisText;
  } catch (err) {
    console.error('Gemini帧分析失败，使用模拟数据:', err);
    return generateMockAnalysis(frames.length, params.video.name);
  }
}