# 浏览器插件 UI 重设计方案（MD 设计文档）

## 1. 设计目标
- 减少顶部按钮拥挤感
- 区分高频 / 低频 / 危险操作
- 提升 storage 浏览与编辑效率
- 风格偏开发者工具（DevTools-like）

---

## 2. 整体布局结构

```
┌──────────────────────────────┐
│ Header（Tabs + 主操作）       │ 48px
├──────────────────────────────┤
│ Toolbar（搜索 + 次级操作）    │ 44px
├──────────────────────────────┤
│ Content                      │
│ ┌────────────┬────────────┐ │
│ │ Key 列表     │ Value 详情 │ │
│ │ 280px       │ 自适应     │ │
│ └────────────┴────────────┘ │
├──────────────────────────────┤
│ Footer（快照状态）            │ 32px
└──────────────────────────────┘
```

---

## 3. Header 区域

### 尺寸
- 高度：48px
- Padding：0 16px

### 左侧：Storage Tabs
- localStorage / sessionStorage
- 高度：32px
- 圆角：6px
- 间距：12px

**激活态**
- 背景：#1677FF
- 文字：#FFFFFF

**默认态**
- 背景：transparent
- 文字：#1F1F1F

### 右侧：主操作按钮
- 「+ 添加」
- 尺寸：80 × 32px
- 背景：#1677FF
- 文字：#FFFFFF
- 圆角：6px

---

## 4. Toolbar 区域

### 尺寸
- 高度：44px
- Padding：0 16px
- 背景：#FAFAFA
- 下边框：1px solid #F0F0F0

### 搜索框
- 高度：32px
- 圆角：6px
- 边框：#D9D9D9
- Placeholder：搜索键名或值...

### 次级操作（Icon Buttons）
- 导入
- 导出
- 刷新
- 更多（⋯）

Icon Button：
- 尺寸：32 × 32px
- Hover：#F5F5F5

#### 更多菜单
- 清空（危险，#FF4D4F）
- 创建快照
- 高级设置

---

## 5. Content 区域

### 左侧 Key 列表
- 宽度：280px
- 背景：#FFFFFF
- 右边框：#F0F0F0

Key Item：
- 最小高度：56px
- Padding：8px 12px
- Hover：#F5F7FA
- 选中：#E6F4FF

### 右侧 Value 详情
- Padding：16px
- 空状态文案：选择一个项目查看详情
- 文案颜色：#8C8C8C

---

## 6. Footer 区域
- 高度：32px
- 背景：#FAFAFA
- 字号：12px
- 文案示例：快照：暂无快照

---

## 7. 颜色规范（Design Tokens）

```css
--primary: #1677FF;
--danger: #FF4D4F;
--text-main: #1F1F1F;
--text-secondary: #8C8C8C;
--border: #F0F0F0;
--bg-light: #FAFAFA;
--hover: #F5F7FA;
```

---

## 8. 设计说明
- Header 只保留最核心操作，降低压迫感
- 清空等危险操作统一收纳
- 搜索作为核心能力突出
- 整体结构贴近 Chrome DevTools，学习成本低
