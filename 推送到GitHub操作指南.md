# 📤 推送到 GitHub 操作指南

## 🎯 快速推送三步骤

### 第一步：在 GitHub 创建仓库

1. 访问 https://github.com 并登录
2. 点击右上角 `+` → `New repository`
3. 填写信息：
   - Repository name: `storage-pro`
   - Description: `Chrome DevTools Extension for localStorage management`
   - 选择 Public 或 Private
   - **不要勾选** "Add a README file"
4. 点击 `Create repository`

### 第二步：初始化并推送代码

在项目根目录打开终端，执行以下命令：

```bash
# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "初始提交：完成 Storage Pro 基础功能开发"

# 重命名分支为 main
git branch -M main

# 添加远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/storage-pro.git

# 推送到 GitHub
git push -u origin main
```

### 第三步：验证推送成功

访问 `https://github.com/YOUR_USERNAME/storage-pro` 确认文件已上传。

---

## 🔐 身份验证

推送时需要输入：
- **用户名**：你的 GitHub 用户名
- **密码**：Personal Access Token（不是登录密码）

### 获取 Personal Access Token

1. GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. Generate new token (classic)
4. 勾选 `repo` 权限
5. 生成并复制 token
6. 推送时使用 token 作为密码

---

## � 日常更新命推送

修改代码后：

```bash
git add .
git commit -m "描述你的修改内容"
git push
```

---

## ❓ 常见问题

### 推送时提示 "Authentication failed"
使用 Personal Access Token 代替密码。

### 推送时提示 "rejected"
```bash
git pull origin main --rebase
git push origin main
```

### 不小心提交了 node_modules
```bash
git rm -r --cached node_modules
git commit -m "移除：删除 node_modules"
git push
```

---

更多 Git 使用技巧，请参考 [Git 官方文档](https://git-scm.com/doc)。
