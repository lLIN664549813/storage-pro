# 📦 Storage Pro 部署指南

## 🚀 安装到 Chrome 浏览器

### 步骤 1：构建项目

```bash
# 安装依赖
npm install

# 构建生产版本
npm run build
```

构建完成后，会在 `dist` 目录生成所有文件。

### 步骤 2：加载扩展

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目的 `dist` 目录
6. 完成！

### 步骤 3：使用扩展

1. 访问任意网页（如 https://www.baidu.com）
2. 按 `F12` 打开 Chrome DevTools
3. 点击 **"Storage Pro"** 标签
4. 开始管理 localStorage

---

## 🔧 功能说明

### 查看数据
- 自动读取当前页面的所有 localStorage 项
- 自动识别并格式化 JSON 数据
- 显示键名和值的预览

### 编辑数据
- 点击"编辑"按钮修改值
- 支持 JSON 格式验证
- 实时保存到页面

### 管理数据
- **添加**：创建新的键值对
- **删除**：删除单个项（需确认）
- **清空**：清空所有数据（需确认）
- **刷新**：重新加载数据

### 快照功能
- **创建快照**：保存当前所有数据
- **恢复快照**：回滚到之前的状态
- **删除快照**：清理不需要的快照

---

## 🔄 开发模式

开发时使用热更新：

```bash
# 启动开发服务器
npm run dev

# 在 Chrome 中加载 dist 目录
# 修改代码后会自动重新构建
```

---

## 🐛 故障排查

### 扩展无法加载
- 确保选择的是 `dist` 目录
- 检查 `dist/manifest.json` 是否存在
- 重新运行 `npm run build`

### 看不到 Storage Pro 标签
- 确保扩展已启用
- 刷新当前页面
- 重新打开 DevTools

### 无法读取 localStorage
- 当前页面可能没有使用 localStorage
- 在控制台测试：`localStorage.setItem('test', 'hello')`
- 点击"刷新"按钮

---

## 📊 构建产物

| 文件 | 大小 | 说明 |
|------|------|------|
| JavaScript | ~76 KB | Vue 应用和业务逻辑 |
| CSS | ~10 KB | Tailwind 样式 |
| 图标 | ~19 KB | PNG 格式图标 |
| **总计** | **~105 KB** | 非常轻量 |

---

## 🎯 下一步

### 发布到 Chrome Web Store

1. 准备材料（截图、描述、图标）
2. 注册开发者账号（$5 一次性费用）
3. 打包 `dist` 目录为 ZIP
4. 上传并提交审核

详细步骤请参考 [Chrome Web Store 开发者文档](https://developer.chrome.com/docs/webstore/)。

---

需要帮助？查看 [README.md](README.md) 或提交 Issue。
