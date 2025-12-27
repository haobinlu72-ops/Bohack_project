# 迁移到 Cohere API - 手动修改指南

## ✅ 已自动完成的修改

以下文件已经自动更新：
- ✅ `src/services/cohereService.ts` - 新建 Cohere 服务文件
- ✅ `src/components/VideoAnalyzer.vue` - 更新引用新的服务
- ✅ `src/types/index.ts` - 更新类型定义
- ✅ `env.d.ts` - 更新环境变量类型定义
- ✅ `vite.config.ts` - 更新注释

## 📝 需要手动完成的步骤

### 1. 删除旧的服务文件

**文件路径**: `src/services/assemblyAiService.ts`

**操作**: 删除此文件（如果不再需要）

```bash
# 在项目根目录执行
rm src/services/assemblyAiService.ts
```

或者在文件管理器中直接删除该文件。

---

### 2. 更新环境变量配置

**文件路径**: `.env`（项目根目录）

**操作**: 创建或更新 `.env` 文件，将 AssemblyAI 的 API Key 改为 Cohere 的 API Key

**原配置**（如果存在）:
```env
VITE_ASSEMBLYAI_API_KEY=your_assemblyai_api_key
```

**新配置**:
```env
VITE_COHERE_API_KEY=your_cohere_api_key_here
```

**获取 Cohere API Key**:
1. 访问 [Cohere Dashboard](https://dashboard.cohere.com/)
2. 注册/登录账号
3. 在 API Keys 页面创建或复制 API Key
4. 将 API Key 粘贴到 `.env` 文件中

---

### 3. 更新 README.md

**文件路径**: `README.md`

**需要修改的部分**:

#### 3.1 更新项目描述（第1-2行）

**原内容**:
```markdown
# 视频语音识别工具

基于 Vue 3 + TypeScript + AssemblyAI 的视频语音识别应用。
```

**改为**:
```markdown
# 视频智能分析工具

基于 Vue 3 + TypeScript + Cohere AI 的视频智能分析应用。
```

#### 3.2 更新功能特性部分

**原内容**:
- 🎤 使用 AssemblyAI 识别视频中的语音内容
- 📝 自动生成转录文本、摘要和章节信息

**改为**:
- 🤖 使用 Cohere AI 分析视频内容
- 🖼️ 自动提取视频关键帧
- 📝 生成详细的视频描述和分析

#### 3.3 更新 API Key 配置说明

**查找并替换**:
- 将 "AssemblyAI" 替换为 "Cohere"
- 将 "VITE_ASSEMBLYAI_API_KEY" 替换为 "VITE_COHERE_API_KEY"
- 将 AssemblyAI 官网链接替换为 Cohere 官网链接

**示例**:
```markdown
### 2. 配置 Cohere API Key

1. 访问 [Cohere Dashboard](https://dashboard.cohere.com/) 注册账号并获取 API Key
2. 在项目根目录创建 `.env` 文件：

```env
VITE_COHERE_API_KEY=your_api_key_here
```
```

#### 3.4 更新使用说明

**原内容**:
- **视频转录内容**：完整的语音转录文本
- **内容摘要**：视频内容的简要总结
- **视频章节**：自动识别的时间点和章节标题

**改为**:
- **视频分析结果**：Cohere AI 生成的详细视频描述和分析
- **视频基本信息**：文件名、大小、类型等元数据
- **关键帧提取**：从视频中提取的关键帧信息

#### 3.5 更新技术栈部分

**原内容**:
- **AI 服务**：AssemblyAI（语音识别和转录）

**改为**:
- **AI 服务**：Cohere AI（文本生成和分析）

#### 3.6 更新优化特性部分

删除或更新关于"单一请求"和"自动章节"的说明，因为 Cohere 使用不同的工作方式。

#### 3.7 更新参考文档部分

**原内容**:
- [AssemblyAI 文档](https://www.assemblyai.com/docs)
- [AssemblyAI API 参考](https://www.assemblyai.com/docs/api-reference)

**改为**:
- [Cohere 文档](https://docs.cohere.com/)
- [Cohere API 参考](https://docs.cohere.com/reference)

---

### 4. 更新 TROUBLESHOOTING.md（如果存在）

**文件路径**: `TROUBLESHOOTING.md`

**需要修改的部分**:

#### 4.1 更新环境变量检查部分

**查找并替换**:
- 将 "VITE_ASSEMBLYAI_API_KEY" 替换为 "VITE_COHERE_API_KEY"
- 将 "AssemblyAI" 替换为 "Cohere"

#### 4.2 更新 API 代理配置部分

**原配置**:
```typescript
'/api/assemblyai': {
  target: 'https://api.assemblyai.com/v2',
  // ...
}
```

**新配置**:
```typescript
'/api/cohere': {
  target: 'https://api.cohere.ai/v1',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api\/cohere/, ''),
  configure: (proxy, _options) => {
    proxy.on('proxyReq', (proxyReq, req, _res) => {
      const apiKey = process.env.VITE_COHERE_API_KEY;
      if (apiKey) {
        proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
      }
    });
  },
}
```

#### 4.3 更新常见错误部分

**更新错误信息**:
- 将 AssemblyAI 相关的错误说明改为 Cohere 相关的错误说明
- 更新 API 测试命令

**Cohere API 测试命令**:
```bash
curl https://api.cohere.ai/v1/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "command", "prompt": "Hello, world!", "max_tokens": 10}'
```

---

### 5. 验证配置

完成上述修改后，执行以下步骤验证：

1. **检查环境变量**:
   ```bash
   # 确保 .env 文件存在且包含正确的 API Key
   cat .env
   ```

2. **重启开发服务器**:
   ```bash
   npm run dev
   ```

3. **测试功能**:
   - 上传一个测试视频
   - 查看浏览器控制台的日志
   - 确认能正常调用 Cohere API

---

## 🔍 重要说明

### Cohere 与 AssemblyAI 的区别

1. **AssemblyAI**: 
   - 专注于音频/视频转录
   - 直接处理视频文件，提取音频并转写
   - 提供章节、摘要等结构化输出

2. **Cohere**:
   - 专注于文本生成和分析
   - 不直接处理视频文件
   - 需要先提取视频信息（关键帧、元数据等），然后生成文本分析

### 当前实现方式

当前的实现会：
1. 提取视频的关键帧（使用 HTML5 Video API）
2. 获取视频元数据（文件名、大小等）
3. 将这些信息作为提示发送给 Cohere
4. Cohere 生成详细的分析文本

### 如果需要更高级的功能

如果将来需要：
- **视觉分析**: 可能需要集成图像识别服务（如 Google Vision API）
- **音频转录**: 可以结合 AssemblyAI 或 Whisper API 先转录音频，再用 Cohere 分析
- **多模态分析**: 等待 Cohere 支持图像输入的多模态模型

---

## ✅ 完成检查清单

- [ ] 删除 `src/services/assemblyAiService.ts` 文件
- [ ] 更新 `.env` 文件中的 API Key
- [ ] 更新 `README.md` 中的所有相关说明
- [ ] 更新 `TROUBLESHOOTING.md`（如果存在）
- [ ] 重启开发服务器
- [ ] 测试视频上传和分析功能
- [ ] 检查浏览器控制台是否有错误

---

## 📚 参考资源

- [Cohere 官方文档](https://docs.cohere.com/)
- [Cohere Dashboard](https://dashboard.cohere.com/)
- [Cohere API 参考](https://docs.cohere.com/reference)
- [Cohere 模型列表](https://docs.cohere.com/docs/models)

