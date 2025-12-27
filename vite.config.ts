import { defineConfig, loadEnv } from 'vite'; // 新增 loadEnv
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量（从 .env 文件）
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  
  return {
    plugins: [vue(), vueJsx()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // 配置API代理，避免前端暴露API密钥
      proxy: {
        '/api': {
          target: env.VITE_GOOGLE_AI_BASE_URL, // 改用 loadEnv 加载的环境变量
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          // 添加API密钥到请求参数
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (proxyReq.path) {
                const apiKey = env.VITE_GOOGLE_AI_API_KEY; // 改用 loadEnv 加载的密钥
                // 向URL添加API密钥参数
                proxyReq.path += (proxyReq.path.includes('?') ? '&' : '?') + `key=${apiKey}`;
              }
            });
          },
        },
      },
    },
  };
});