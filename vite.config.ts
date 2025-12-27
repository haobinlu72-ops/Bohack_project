import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src') // 保持原有别名
    }
  },
  // 新增：配置 API 代理，解决跨域
  server: {
    proxy: {
      // 匹配以 /api/deepseek 开头的请求，转发到 DeepSeek 官方 API
      '/api/deepseek': {
        target: 'https://api.deepseek.com/v1',
        changeOrigin: true, // 关键：模拟跨域请求的 Origin
        rewrite: (path) => path.replace(/^\/api\/deepseek/, ''), // 去掉前缀
        secure: true, // 启用 HTTPS
        timeout: 60000 // 延长超时时间（视频分析请求耗时久）
      }
    }
  }
});