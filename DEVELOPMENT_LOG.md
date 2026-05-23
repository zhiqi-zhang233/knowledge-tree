# 开发日志

## 2026-05-23

### 摘要

- 建立项目启动文档基线。
- 新增面向外部用户的 `README.md`。
- 新增内部架构说明 `ARCHITECTURE.md`。
- 新增 AI 协作规则 `AI_SYSTEM_PROMPT.md`。
- 新增本开发日志 `DEVELOPMENT_LOG.md`。

### 涉及文件

- `README.md`
- `ARCHITECTURE.md`
- `AI_SYSTEM_PROMPT.md`
- `DEVELOPMENT_LOG.md`

### 验证

- 确认四个文档文件已创建。

### 后续

- 后续任何 AI 修改代码后，都需要继续追加日志条目。

## 2026-05-23

### 摘要

- 将静态原型迁移为正式工程目录。
- 新增 Vite + React + TypeScript 前端应用。
- 新增 `packages/schema`，集中定义知识树 JSON schema、类型和校验逻辑。
- 新增 IndexedDB 本地持久化、JSON 导入导出、树集操作、节点画布和节点资料卡。
- 删除旧的根目录静态原型文件 `index.html`、`styles.css`、`app.js`。
- 更新架构文档和 AI 协作规则，明确第一版技术栈、目录边界和数据模型。

### 涉及文件

- `README.md`
- `ARCHITECTURE.md`
- `AI_SYSTEM_PROMPT.md`
- `DEVELOPMENT_LOG.md`
- `package.json`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `tsconfig.base.json`
- `.gitignore`
- `apps/web`
- `packages/schema`
- `data/examples/ai-tree.json`

### 验证

- 运行 `pnpm --filter @knowledge-tree/web typecheck`，通过。
- 运行 `pnpm --filter @knowledge-tree/web build`，通过；当前首包大小有 Vite 警告，后续可通过代码拆分优化。
- 使用浏览器打开 `http://127.0.0.1:5173/`，页面加载正常，无控制台错误。
- 验证横向视图、纵向视图和双击返回上一层画布视图可用。

### 后续

- 可以补充节点关系删除、撤销重做、关系编辑面板和导入数据迁移测试。
- AI 自动整理节点功能应按 `ARCHITECTURE.md` 的结构化操作建议流程开发。

## 2026-05-23

### 摘要

- 修复资料卡输入框打字频闪和中文输入法组合输入容易被重渲染打断的问题。
- 节点标题、简介、笔记链接和外部资源链接改为本地草稿输入，500ms 后自动保存，失焦立即保存。
- 横向画布工具栏新增“新建节点”按钮，可创建未连接的独立节点。
- 横向视图会额外显示未连接的独立节点，方便用户从独立节点拖线建立前置或后置关系。
- 节点右键菜单新增“新增前置节点”和“新增后置节点”。
- README 新增发布到 GitHub 的基础流程。

### 涉及文件

- `README.md`
- `DEVELOPMENT_LOG.md`
- `apps/web/src/components/Inspector.tsx`
- `apps/web/src/components/GraphCanvas.tsx`
- `apps/web/src/lib/graphSelectors.ts`
- `apps/web/src/store/knowledgeStore.ts`

### 验证

- 运行 `pnpm --filter @knowledge-tree/web typecheck`，通过。
- 运行 `pnpm --filter @knowledge-tree/web build`，通过；仍有 Vite 首包大小警告。
- 使用浏览器在 `http://localhost:5173/` 验证输入保存、新建独立节点、右键新增前置节点，未发现控制台错误。

### 后续

- 可以继续补充关系删除、批量重排、撤销重做和 GitHub Actions 自动构建检查。

## 2026-05-23

### 摘要

- 将 `README.md` 调整为 GitHub 首页展示型说明。
- 删除 README 中的 GitHub 发布命令和过多开发流程说明。
- README 现在聚焦项目简介、核心功能、设计原则、技术栈和当前状态。

### 涉及文件

- `README.md`
- `DEVELOPMENT_LOG.md`

### 验证

- 参考 GitHub 官方 README 说明和常见 README 结构后完成内容调整。
- 本次只修改文档，未重新构建前端。

### 后续

- 远程 GitHub 仓库创建需要确认仓库名和公开性，或先安装 GitHub CLI。

## 2026-05-23

### 摘要

- 新增 Electron 桌面应用壳 `apps/desktop`。
- Web 构建改为相对资源路径，保证桌面应用从本地文件加载静态资源。
- 新增 Windows NSIS 安装包配置，支持生成用户可安装的 `.exe`。
- 构建生成 `apps/desktop/release/知识树画布 Setup 0.1.0.exe`。
- 验证未安装版桌面程序可打开，窗口标题为“知识树画布”，进程正常响应。
- 更新 README、架构文档和 AI 协作规则中的桌面应用说明。

### 涉及文件

- `README.md`
- `ARCHITECTURE.md`
- `AI_SYSTEM_PROMPT.md`
- `DEVELOPMENT_LOG.md`
- `.gitignore`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `apps/web/vite.config.ts`
- `apps/desktop/package.json`
- `apps/desktop/src/main.cjs`

### 验证

- 运行 `pnpm --filter @knowledge-tree/web typecheck`，通过。
- 运行 `pnpm --filter @knowledge-tree/web build`，通过；仍有 Vite 首包大小警告。
- 运行 Electron Builder 生成 Windows NSIS 安装包，通过。
- 启动 `apps/desktop/release/win-unpacked/知识树画布.exe`，窗口正常打开并响应。

### 后续

- 后续可补应用图标、代码签名、自动更新和 GitHub Releases 发布流程。

## 2026-05-23

### 摘要

- 修复横向前置/后置关系只按单向边读取的问题。
- 现在 `successor` 边在目标节点视角会被识别为前置关系，`prerequisite` 边在来源节点视角会被识别为后置关系。
- 补充 `graphSelectors` 单元测试，覆盖新增后置节点、新增前置节点和双关系去重。
- 新增 `test` 命令，方便每次关系逻辑修改后自动回归。
- 更新 AI 协作规则，要求功能修改交付前必须做对应自动化或浏览器回归验证。
- 版本号更新为 `0.1.1`，用于生成修复后的桌面安装包。

### 涉及文件

- `AI_SYSTEM_PROMPT.md`
- `DEVELOPMENT_LOG.md`
- `package.json`
- `pnpm-lock.yaml`
- `apps/web/package.json`
- `apps/web/src/lib/graphSelectors.ts`
- `apps/web/src/lib/graphSelectors.test.ts`
- `apps/desktop/package.json`

### 验证

- 运行 `pnpm --filter @knowledge-tree/web test`，3 个单元测试通过。
- 运行 `pnpm --filter @knowledge-tree/web typecheck`，通过。
- 运行 `pnpm --filter @knowledge-tree/web build`，通过；仍有 Vite 首包大小警告。
- 浏览器回归验证：右键“机器学习”新增后置节点后，进入“新后置节点”，资料卡显示 `前置：机器学习`。
- 浏览器回归验证：右键“机器学习”新增前置节点后，进入“新前置节点”，资料卡显示 `后置：机器学习`。
- 运行 Electron Builder 生成 Windows 安装包，通过。
- 启动 `apps/desktop/release/win-unpacked/知识树画布.exe`，窗口正常打开并响应。

### 后续

- 可以继续补充拖拽连线建立关系的端到端测试。
