/**
 * 视频解析相关类型定义
 */
export interface VideoAnalysisRequest {
  video: File;
}

export interface VideoAnalysisResponse {
  analysis: string;
  [key: string]: any; // 兼容API可能返回的其他字段
}

export interface AnalysisError {
  message: string;
  code?: number;
}