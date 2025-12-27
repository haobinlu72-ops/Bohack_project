# 故障排除指南

## 如果 AssemblyAI API 调用失败

### 1. 检查环境变量配置

确保 `.env` 文件存在且配置正确：

```env
VITE_ASSEMBLYAI_API_KEY=your_actual_api_key_here
```

**注意**：
- 环境变量必须以 `VITE_` 开头
- 修改 `.env` 后需要重启开发服务器
- API Key 不能有空格或引号

### 2. 检查浏览器控制台错误

打开浏览器开发者工具（F12），查看 Console 标签页中的错误信息：

- **401 Unauthorized**: API Key 无效或未配置
- **403 Forbidden**: API Key 权限不足
- **429 Too Many Requests**: API 配额用完或请求过于频繁
- **CORS 错误**: 需要配置后端代理（见下方）

### 3. CORS 问题解决方案

如果遇到 CORS（跨域）错误，AssemblyAI API 可能不支持直接从浏览器调用。有两种解决方案：

#### 方案 A: 使用 Vite 代理（推荐）

修改 `vite.config.ts`，添加代理配置：

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import path from 'path';

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/assemblyai': {
        target: 'https://api.assemblyai.com/v2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/assemblyai/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // 添加 API Key 到请求头
            const apiKey = process.env.VITE_ASSEMBLYAI_API_KEY;
            if (apiKey && proxyReq.getHeader('authorization') !== apiKey) {
              proxyReq.setHeader('authorization', apiKey);
            }
          });
        },
      },
    },
  },
});
```

然后修改 `src/services/assemblyAiService.ts` 中的 API 基础 URL：

```typescript
// 将
const ASSEMBLYAI_API_BASE = 'https://api.assemblyai.com/v2';
// 改为
const ASSEMBLYAI_API_BASE = '/api/assemblyai';
```

#### 方案 B: 创建简单的后端代理服务器

创建一个 Node.js 后端服务器（推荐使用 Express）：

**server.js**:
```javascript
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fetch = require('node-fetch');
const fs = require('fs');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });
const ASSEMBLYAI_API_KEY = process.env.VITE_ASSEMBLYAI_API_KEY;

app.use(cors());
app.use(express.json());

// 上传文件代理
app.post('/api/upload', upload.single('video'), async (req, res) => {
  try {
    const fileBuffer = fs.readFileSync(req.file.path);
    
    const response = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'authorization': ASSEMBLYAI_API_KEY,
      },
      body: fileBuffer,
    });

    const data = await response.json();
    
    // 清理临时文件
    fs.unlinkSync(req.file.path);
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建转录任务代理
app.post('/api/transcript', async (req, res) => {
  try {
    const response = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'authorization': ASSEMBLYAI_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取转录状态代理
app.get('/api/transcript/:id', async (req, res) => {
  try {
    const response = await fetch(`https://api.assemblyai.com/v2/transcript/${req.params.id}`, {
      headers: {
        'authorization': ASSEMBLYAI_API_KEY,
      },
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('代理服务器运行在 http://localhost:3001');
});
```

### 4. 检查 API Key 格式

AssemblyAI API Key 通常是一个字符串，例如：
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

确保：
- 没有多余的空格
- 没有引号
- 是完整的 Key

### 5. 测试 API Key 是否有效

可以在浏览器控制台或使用 curl 测试：

```bash
curl https://api.assemblyai.com/v2/transcript \
  -H "authorization: YOUR_API_KEY" \
  -H "content-type: application/json" \
  -d '{"audio_url": "https://storage.googleapis.com/aai-docs-samples/espn.m4a"}'
```

### 6. 检查文件大小限制

- AssemblyAI 免费计划可能有文件大小限制
- 建议测试较小的视频文件（< 10MB）先确认功能正常

### 7. 查看详细日志

代码中已添加了详细的控制台日志。打开浏览器控制台查看：
- "开始识别视频..." - 文件信息
- "正在上传视频文件..." - 上传开始
- "视频上传成功..." - 上传完成
- "创建转录任务..." - 任务创建
- "开始轮询转录状态..." - 状态轮询

如果有任何错误，会在控制台显示详细信息。

## 常见错误和解决方案

| 错误信息 | 可能原因 | 解决方案 |
|---------|---------|---------|
| "API Key 配置错误" | 环境变量未设置或格式错误 | 检查 `.env` 文件配置 |
| "CORS 错误" | 浏览器直接调用 API 被阻止 | 使用 Vite 代理或后端服务器 |
| "上传失败: 413" | 文件过大 | 压缩视频或升级 API 计划 |
| "转录超时" | 视频过长或网络问题 | 检查网络连接，使用较小的视频测试 |
| "配额已用完" | 免费额度用尽 | 等待重置或升级计划 |

## 获取帮助

如果问题仍然存在：
1. 查看浏览器控制台的完整错误信息
2. 检查 AssemblyAI 官方文档：https://www.assemblyai.com/docs
3. 确认 API Key 在 AssemblyAI 控制台中是否有效

