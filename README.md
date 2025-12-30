# Storage Pro

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Vue](https://img.shields.io/badge/Vue-3.3.4-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.1.6-blue)

一个Chrome DevTools扩展，用于管理当前页面的localStorage数据。

## 功能特性

- 在Chrome DevTools中新增一个名为"Storage Pro"的面板
- 读取当前被检查页面的localStorage
- 自动解析JSON/原始字符串
- 支持查看、编辑、写回、删除localStorage项
- 支持快照与回滚功能
- 支持开发态HMR

## 技术栈

- Vue 3 + Composition API
- TypeScript
- Vite
- @crxjs/vite-plugin
- Tailwind CSS

## 安装与运行

1. 克隆仓库并安装依赖：

```bash
git clone [repository-url]
cd storage-pro
npm install
```

2. 开发模式运行：

```bash
npm run dev
```

3. 构建生产版本：

```bash
npm run build
```

## 安装到Chrome

1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目构建后的dist目录

## 使用方法

1. 打开任意网页
2. 打开Chrome DevTools (F12)
3. 点击"Storage Pro"标签
4. 在面板中查看、编辑或管理localStorage数据

## 项目结构

```
src/
├── assets/
├── components/
│   ├── StorageItem.vue
│   ├── StorageEditor.vue
│   └── StorageToolbar.vue
├── composables/
│   ├── useStorage.ts
│   └── useSnapshot.ts
├── devtools/
│   ├── devtools.html
│   └── devtools.ts
├── types/
│   └── storage.ts
├── App.vue
├── main.ts
├── style.css
└── manifest.json
```

## 许可证

MIT License

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

详细的贡献指南请查看 [CONTRIBUTING.md](CONTRIBUTING.md)

### 快速开始

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/新功能`)
3. 提交更改 (`git commit -m '新增：添加某个功能'`)
4. 推送到分支 (`git push origin feature/新功能`)
5. 创建 Pull Request 到 `develop` 分支

---

## 📚 相关文档

- [贡献指南](CONTRIBUTING.md) - 如何参与项目开发
- [部署指南](DEPLOYMENT_GUIDE.md) - 如何构建和安装扩展
- [GitHub 推送指南](推送到GitHub操作指南.md) - 如何推送代码到 GitHub

---

## ⭐ Star History

如果这个项目对你有帮助，请给它一个 Star ⭐

---

## 📧 联系方式

如有问题或建议，欢迎通过 GitHub Issues 联系。
