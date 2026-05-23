# 架构文档

## 项目目标

知识树画布的核心目标是用一个轻量、结构化、可导入导出的工具管理知识关系。应用只管理知识节点、关系和资源链接，不直接承载长篇知识内容。用户的笔记、文章、视频、文档等内容通过链接外包到外部系统。

产品体验必须坚持两个视图原则：

- 横向视图：只展示当前节点的前置节点、当前节点和后置节点。
- 纵向视图：只展示当前节点的母节点、当前节点和子节点。

这样可以避免整棵树在画布中无限展开，也能让用户围绕当前知识点分别理解依赖关系和层级关系。

## 技术栈

第一版使用纯前端本地应用，不引入后端服务。

- Vite：开发服务器和前端构建。
- React：组件化 UI。
- TypeScript：约束节点、关系、资源和导入导出数据结构。
- React Flow：节点画布、拖动、连线、缩放和平移。
- Zustand：前端状态管理。
- Dexie：IndexedDB 封装，用于浏览器本地持久化。
- Zod：JSON schema 校验，保护导入数据和后续迁移。
- pnpm workspace：管理 `apps` 和 `packages`。

## 目录结构

```text
E:\知识树
├─ apps/
│  └─ web/
│     ├─ index.html
│     ├─ package.json
│     ├─ vite.config.ts
│     └─ src/
│        ├─ App.tsx
│        ├─ main.tsx
│        ├─ styles.css
│        ├─ components/
│        │  ├─ GraphCanvas.tsx
│        │  ├─ Inspector.tsx
│        │  ├─ KnowledgeNode.tsx
│        │  └─ Sidebar.tsx
│        ├─ data/
│        │  └─ defaultTree.ts
│        ├─ lib/
│        │  ├─ db.ts
│        │  ├─ download.ts
│        │  └─ graphSelectors.ts
│        └─ store/
│           └─ knowledgeStore.ts
├─ packages/
│  └─ schema/
│     └─ src/
│        └─ index.ts
├─ data/
│  └─ examples/
│     └─ ai-tree.json
├─ README.md
├─ ARCHITECTURE.md
├─ AI_SYSTEM_PROMPT.md
└─ DEVELOPMENT_LOG.md
```

## 模块职责

`packages/schema` 是数据契约层。它定义知识树文档、节点、边、资源链接、布局和 schema 版本。所有导入数据必须经过这里校验。

`apps/web/src/store` 是状态和写操作层。它负责读取 IndexedDB、写入 IndexedDB、创建树、导入树、复制树、重命名树、创建节点、更新节点、创建关系、删除子树和维护导航历史。

`apps/web/src/lib` 是无 UI 工具层。`graphSelectors.ts` 根据当前节点和视图模式计算可见节点与边；`download.ts` 负责 JSON 导入导出；`db.ts` 封装 IndexedDB。

`apps/web/src/components` 是交互层。`Sidebar` 管理知识树列表；`GraphCanvas` 管理关系画布；`Inspector` 管理节点资料卡；`KnowledgeNode` 定义画布上的节点外观。

## 数据模型

第一版使用标准化结构，不把子节点、前置节点等关系直接嵌套在节点内部。这样后续更容易移动节点、重组关系、做自动整理和接入 AI。

```ts
type TreeDocument = {
  schemaVersion: "1.0.0";
  tree: TreeMeta;
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  resources: ResourceLink[];
  layout: {
    nodes: Record<string, NodeLayout>;
  };
};
```

节点只保存知识点自身信息：

```ts
type KnowledgeNode = {
  id: string;
  treeId: string;
  title: string;
  summary: string;
  status: "planned" | "learning" | "mastered";
  tags: string[];
  createdAt: string;
  updatedAt: string;
};
```

关系由边保存：

```ts
type KnowledgeEdge = {
  id: string;
  treeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  type: "parent_child" | "prerequisite" | "successor" | "related";
  createdAt: string;
  updatedAt: string;
};
```

资料链接独立保存：

```ts
type ResourceLink = {
  id: string;
  treeId: string;
  nodeId: string;
  type: "note" | "external";
  title: string;
  url: string;
  createdAt: string;
  updatedAt: string;
};
```

## 视图逻辑

横向视图通过 `visibleGraph(document, selectedNodeId, "horizontal")` 计算：

- 前置节点：`prerequisite` 边中指向当前节点的来源节点。
- 当前节点：`selectedNodeId`。
- 后置节点：`successor` 边中由当前节点指向的目标节点。

纵向视图通过 `visibleGraph(document, selectedNodeId, "vertical")` 计算：

- 母节点：`parent_child` 边中指向当前节点的来源节点。
- 当前节点：`selectedNodeId`。
- 子节点：`parent_child` 边中由当前节点指向的目标节点。

画布可以显示的节点是 selector 的结果，不是整棵树的全部节点。

## 持久化和导入导出

浏览器本地数据保存在 IndexedDB 数据库 `knowledge-tree-db` 中。每个知识树作为一个完整 `TreeDocument` 存储。

导出时直接下载当前 `TreeDocument` JSON。导入时先使用 Zod schema 校验，校验通过后生成新的 `treeId` 保存，避免覆盖已有树。

后续 schema 变更必须：

- 提升 `schemaVersion`。
- 在导入层或数据库加载层提供迁移函数。
- 保留旧版本导入能力。

## 后端边界

第一版没有后端。后续如果需要账号、云同步、团队协作或多端同步，可以新增：

```text
apps/api/       API 服务
packages/db/    数据库 schema 和迁移
packages/core/  纯业务逻辑和图操作
```

在后端出现之前，前端不得假设有服务端状态。

## AI 接入预留

未来 AI 整理节点时，不应该直接修改 UI 状态。推荐流程是：

1. AI 读取当前 `TreeDocument`。
2. AI 输出结构化操作列表，例如 `create_node`、`create_edge`、`update_node`、`delete_edge`。
3. 前端用 schema 校验操作。
4. 用户预览变更。
5. 用户确认后由 store 执行变更。

这样可以保留可审计性，避免 AI 随机破坏用户的知识树结构。

## 第一版范围

第一版只实现本地可用的知识关系管理：

- 新建、复制、重命名、删除知识树。
- JSON 导入导出。
- 画布节点拖动、连接、缩放和平移。
- 横向关系视图和纵向层级视图。
- 节点资料卡编辑。
- 笔记链接和外部资源链接管理。
- 右键菜单操作。

暂不实现账号、云同步、多人协作、权限管理和 AI 自动整理。
