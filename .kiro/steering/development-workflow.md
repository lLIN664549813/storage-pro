---
inclusion: always
---

# Storage Pro 开发工作流程

## 📋 开发前必读文档顺序

在开始任何开发任务前，请按照以下顺序阅读相关文档：

### 1. 阅读 requirements.md → 理解需求
**位置**: `.kiro/specs/storage-pro-enhancement/requirements.md`

**目的**: 
- 了解功能的用户故事
- 理解验收标准
- 明确优先级（P0/P1/P2/P3）

**关键内容**:
- 用户故事：作为...，我希望...，这样我就能...
- 验收标准：WHEN...THEN...THE 系统 SHALL...
- 术语表：理解项目专业术语

---

### 2. 查看 ITERATION_PLAN.md → 了解当前迭代任务
**位置**: `.kiro/specs/storage-pro-enhancement/ITERATION_PLAN.md`

**目的**:
- 了解当前迭代的目标
- 查看功能清单和完成状态
- 理解技术任务分解

**关键内容**:
- 当前迭代的功能清单
- 技术任务列表
- 验收标准
- 风险与应对措施

---

### 3. 参考 IMPLEMENTATION_PLAN.md → 了解技术方案
**位置**: `docs/IMPLEMENTATION_PLAN.md`

**目的**:
- 了解整体技术架构
- 理解技术选型决策
- 掌握实施步骤

**关键内容**:
- 技术栈说明
- 架构设计
- 实施步骤
- 注意事项

---

### 4. 使用 QUICK_DEV_GUIDE.md → 复制代码模板
**位置**: `docs/QUICK_DEV_GUIDE.md`

**目的**:
- 快速获取代码模板
- 了解开发规范
- 学习常用工具函数

**关键内容**:
- 组件开发模板
- Composable 开发模板
- 测试代码模板
- 常用工具函数

---

### 5. 查阅 API_REFERENCE.md → 查看 API 文档
**位置**: `docs/API_REFERENCE.md`

**目的**:
- 了解现有 API 接口
- 理解数据结构
- 掌握函数签名

**关键内容**:
- Composables API
- 组件 Props 和 Events
- 类型定义
- 使用示例

---

### 6. 更新 PROGRESS.md → 记录进度
**位置**: `.kiro/specs/storage-pro-enhancement/PROGRESS.md`

**目的**:
- 记录开发进度
- 记录遇到的问题和解决方案
- 更新功能完成度

**关键内容**:
- 每日进度记录
- 问题和解决方案
- 功能完成度统计
- 代码质量指标

---

## 🔄 标准开发流程

### 阶段 1: 准备阶段
1. ✅ 阅读 `requirements.md` 理解需求
2. ✅ 查看 `ITERATION_PLAN.md` 确认任务
3. ✅ 参考 `IMPLEMENTATION_PLAN.md` 了解技术方案

### 阶段 2: 开发阶段
1. ✅ 使用 `QUICK_DEV_GUIDE.md` 获取代码模板
2. ✅ 查阅 `API_REFERENCE.md` 了解 API
3. ✅ 编写代码实现功能
4. ✅ 编写单元测试
5. ✅ 运行 `npm run build` 确保构建成功

### 阶段 3: 完成阶段
1. ✅ 更新 `PROGRESS.md` 记录进度

---

## 📝 开发规范

### 代码规范
- 遵循 ESLint 和 Prettier 配置
- 使用 TypeScript 严格模式
- 所有公共函数必须有 JSDoc 注释
- 代码注释使用中文

### 提交规范
- 提交信息使用中文
- 遵循 Conventional Commits 格式
- 每次提交保持原子性

### 测试规范
- 关键业务逻辑需要单元测试
- 公共工具函数需要测试覆盖
- 修复 bug 时添加对应的测试用例

---

## 🎯 快速参考

### 常用命令
```bash
# 开发
npm run dev

# 构建
npm run build

# 测试
npm run test

# 代码检查
npm run lint

# 类型检查
npm run type-check
```

### 常用文件路径
```
.kiro/specs/storage-pro-enhancement/
├── requirements.md          # 需求文档
├── ITERATION_PLAN.md       # 迭代计划
├── PROGRESS.md             # 进度跟踪
├── FEATURES.md             # 功能说明
└── ITERATION1_SUMMARY.md   # 迭代总结

docs/
├── IMPLEMENTATION_PLAN.md  # 实施计划
├── QUICK_DEV_GUIDE.md      # 快速开发指南
├── API_REFERENCE.md        # API 参考
└── README.md               # 文档索引
```

---

## ⚠️ 注意事项

1. **开发前必须阅读需求文档**，避免理解偏差
2. **遵循迭代计划**，不要跨迭代开发功能
3. **及时更新进度文档**，便于团队协作
4. **代码提交前必须构建成功**，确保代码质量
5. **遇到问题及时记录**，便于后续回顾和改进

---

## 🔗 相关链接

- [需求文档](../.kiro/specs/storage-pro-enhancement/requirements.md)
- [迭代计划](../.kiro/specs/storage-pro-enhancement/ITERATION_PLAN.md)
- [实施计划](../../docs/IMPLEMENTATION_PLAN.md)
- [快速开发指南](../../docs/QUICK_DEV_GUIDE.md)
- [API 参考](../../docs/API_REFERENCE.md)
- [进度跟踪](../.kiro/specs/storage-pro-enhancement/PROGRESS.md)

---

**文档版本**: v1.0  
**创建日期**: 2025-12-31  
**最后更新**: 2025-12-31
