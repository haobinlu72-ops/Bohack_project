// src/types/index.ts
export interface VideoAnalysisRequest {
  video: File;
  prompt?: string; // 自定义分析提示词（可选）
}

export interface VideoAnalysisResponse {
  analysis: string; // 分析结果文本
  model: string; // 使用的模型名
  framesExtracted: number; // 提取的帧数
}

export interface AnalysisError {
  message: string; // 错误信息
}