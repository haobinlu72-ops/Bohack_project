/**
 * 视频识别相关类型定义
 */
export interface VideoAnalysisRequest {
  video: File;
  prompt?: string; // 可选参数（AssemblyAI 不使用，保留以兼容）
}

export interface VideoAnalysisResponse {
  analysis: string; // 视频分析结果
  model?: string; // 使用的模型名称
  framesExtracted?: number; // 提取的关键帧数量（Cohere）
  transcriptId?: string; // 转录 ID（如果使用转录服务）
  [key: string]: any; // 兼容API可能返回的其他字段
}

export interface AnalysisError {
  message: string;
  code?: number;
}