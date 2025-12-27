import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // 注意：Cohere API 直接在前端使用，可能需要配置代理以避免 CORS 问题
  // API Key 通过环境变量 VITE_COHERE_API_KEY 配置
});