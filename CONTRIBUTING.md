# 贡献指南

感谢你对 Storage Pro 项目的关注！我们欢迎所有形式的贡献。

## 🤝 如何贡献

### 报告问题

如果你发现了 bug 或有功能建议：

1. 在 [Issues](https://github.com/lLIN664549813/storage-pro/issues) 中搜索是否已有相关问题
2. 如果没有，创建新的 Issue
3. 清晰描述问题或建议，包括：
   - 问题的详细描述
   - 复现步骤（如果是 bug）
   - 期望的行为
   - 实际的行为
   - 截图（如果适用）
   - 环境信息（浏览器版本、操作系统等）

### 提交代码

#### 1. Fork 项目

点击页面右上角的 "Fork" 按钮，将项目 fork 到你的账号下。

#### 2. 克隆仓库

```bash
git clone https://github.com/你的用户名/storage-pro.git
cd storage-pro
```

#### 3. 添加上游仓库

```bash
git remote add upstream https://github.com/lLIN664549813/storage-pro.git
```

#### 4. 创建功能分支

```bash
# 切换到 develop 分支
git checkout develop

# 拉取最新代码
git pull upstream develop

# 创建功能分支
git checkout -b feature/你的功能名称
```

#### 5. 开发和提交

```bash
# 进行开发...

# 添加修改
git add .

# 提交（使用中文提交信息）
git commit -m "新增：描述你的修改"
```

#### 6. 推送到你的仓库

```bash
git push origin feature/你的功能名称
```

#### 7. 创建 Pull Request

1. 访问你 fork 的仓库页面
2. 点击 "Pull Request" 按钮
3. 选择：
   - Base repository: `lLIN664549813/storage-pro`
   - Base branch: `develop`
   - Head repository: `你的用户名/storage-pro`
   - Compare branch: `feature/你的功能名称`
4. 填写 PR 描述
5. 提交 PR

## 📋 代码规范

### 提交信息规范

使用中文，遵循以下格式：

- `新增：添加某功能`
- `修复：解决某问题`
- `优化：改进某性能`
- `重构：重构某模块`
- `文档：更新某文档`
- `样式：调整某样式`
- `测试：添加某测试`

### 代码风格

- 使用 TypeScript
- 遵循 ESLint 配置
- 使用 Vue 3 Composition API
- 组件使用 `<script setup lang="ts">`
- 添加必要的中文注释

### 测试要求

- 新功能需要添加相应的测试
- 确保所有测试通过
- Bug 修复需要添加回归测试

## 🔍 代码审查

所有 PR 都需要经过代码审查：

- 代码符合项目规范
- 功能正常工作
- 没有引入新的 bug
- 代码可读性良好
- 有适当的注释

## 🌿 分支策略

- `main` - 主分支，受保护，只接受来自 `develop` 的 PR
- `develop` - 开发分支，日常开发在此进行
- `feature/*` - 功能分支，开发新功能
- `fix/*` - 修复分支，修复 bug
- `hotfix/*` - 热修复分支，紧急修复生产问题

## 📞 需要帮助？

如果你有任何问题：

- 查看 [README.md](README.md)
- 查看 [部署指南](DEPLOYMENT_GUIDE.md)
- 在 [Issues](https://github.com/lLIN664549813/storage-pro/issues) 中提问
- 在 [Discussions](https://github.com/lLIN664549813/storage-pro/discussions) 中讨论

## 📜 行为准则

- 尊重所有贡献者
- 保持友好和专业
- 接受建设性的批评
- 关注项目的最佳利益

---

感谢你的贡献！🎉
