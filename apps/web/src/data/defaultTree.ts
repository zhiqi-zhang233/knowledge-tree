import { type TreeDocument, nowIso } from "@knowledge-tree/schema";

const createdAt = nowIso();

export const defaultTree: TreeDocument = {
  schemaVersion: "1.0.0",
  tree: {
    id: "tree_ai",
    title: "人工智能知识树",
    description: "机器学习、深度学习、大语言模型、Agent 等知识路径",
    createdAt,
    updatedAt: createdAt,
  },
  nodes: [
    node("ml", "机器学习", "机器学习关注如何让模型从数据中学习规律，是理解深度学习和大语言模型的前置基础。", "learning"),
    node("statistics", "概率统计", "概率统计用于理解数据分布、不确定性、抽样、估计和假设检验。"),
    node("linear_algebra", "线性代数", "线性代数提供向量、矩阵、张量和空间变换的语言。"),
    node("supervised_learning", "监督学习", "监督学习从带标签数据中学习输入到输出的映射。", "learning"),
    node("unsupervised_learning", "无监督学习", "无监督学习不依赖显式标签，常用于聚类、降维和表示学习。"),
    node("deep_learning", "深度学习", "深度学习通过多层神经网络学习复杂表示。", "learning"),
    node("neural_network", "神经网络基础", "神经网络基础包括前向传播、反向传播、激活函数、损失函数和优化器。", "learning"),
    node("transformer", "Transformer", "Transformer 通过自注意力机制建模序列中不同位置的关系。", "learning"),
    node("llm", "大语言模型", "大语言模型是在大规模语料上训练的生成式模型。", "learning"),
    node("pretraining", "预训练", "预训练让模型在大规模数据上学习通用语言规律。", "learning"),
    node("post_training", "后训练", "后训练让模型更符合人类指令和产品目标。"),
    node("rag", "RAG", "RAG 把检索和生成结合起来，让模型回答时引用外部知识。", "learning"),
    node("evaluation", "模型评估", "模型评估用于判断大语言模型是否可靠。"),
    node("agent", "Agent", "Agent 把模型能力、工具调用、任务规划、记忆和执行反馈组合起来。"),
  ],
  edges: [
    edge("statistics", "ml", "prerequisite"),
    edge("linear_algebra", "ml", "prerequisite"),
    edge("ml", "supervised_learning", "parent_child"),
    edge("ml", "unsupervised_learning", "parent_child"),
    edge("ml", "deep_learning", "parent_child"),
    edge("linear_algebra", "deep_learning", "prerequisite"),
    edge("deep_learning", "neural_network", "parent_child"),
    edge("deep_learning", "transformer", "parent_child"),
    edge("neural_network", "transformer", "prerequisite"),
    edge("ml", "llm", "prerequisite"),
    edge("deep_learning", "llm", "prerequisite"),
    edge("transformer", "llm", "prerequisite"),
    edge("llm", "pretraining", "parent_child"),
    edge("llm", "post_training", "parent_child"),
    edge("llm", "rag", "parent_child"),
    edge("llm", "evaluation", "parent_child"),
    edge("llm", "agent", "successor"),
    edge("rag", "agent", "prerequisite"),
    edge("post_training", "agent", "prerequisite"),
    edge("evaluation", "agent", "prerequisite"),
  ],
  resources: [
    resource("ml", "note", "我的机器学习学习笔记", "https://example.com/ml-notes"),
    resource("llm", "note", "LLM 面试与学习笔记", "https://example.com/llm-notes"),
    resource("llm", "external", "OpenAI Documentation", "https://platform.openai.com/docs"),
    resource("llm", "external", "Hugging Face LLM Course", "https://huggingface.co/learn/llm-course"),
  ],
  layout: {
    nodes: {
      statistics: layout("statistics", 120, 250),
      linear_algebra: layout("linear_algebra", 120, 410),
      ml: layout("ml", 460, 330),
      supervised_learning: layout("supervised_learning", 820, 150),
      unsupervised_learning: layout("unsupervised_learning", 820, 270),
      deep_learning: layout("deep_learning", 820, 430),
      neural_network: layout("neural_network", 1140, 360),
      transformer: layout("transformer", 1140, 500),
      llm: layout("llm", 1460, 410),
      pretraining: layout("pretraining", 1780, 170),
      post_training: layout("post_training", 1780, 300),
      rag: layout("rag", 1780, 430),
      evaluation: layout("evaluation", 1780, 560),
      agent: layout("agent", 2100, 430),
    },
  },
};

function node(id: string, title: string, summary: string, status: TreeDocument["nodes"][number]["status"] = "planned") {
  return {
    id,
    treeId: "tree_ai",
    title,
    summary,
    status,
    tags: [],
    createdAt,
    updatedAt: createdAt,
  };
}

function edge(sourceNodeId: string, targetNodeId: string, type: TreeDocument["edges"][number]["type"]) {
  return {
    id: `edge_${sourceNodeId}_${targetNodeId}_${type}`,
    treeId: "tree_ai",
    sourceNodeId,
    targetNodeId,
    type,
    createdAt,
    updatedAt: createdAt,
  };
}

function resource(nodeId: string, type: TreeDocument["resources"][number]["type"], title: string, url: string) {
  return {
    id: `resource_${nodeId}_${type}_${title.replaceAll(" ", "_")}`,
    treeId: "tree_ai",
    nodeId,
    type,
    title,
    url,
    createdAt,
    updatedAt: createdAt,
  };
}

function layout(nodeId: string, x: number, y: number) {
  return { nodeId, x, y };
}
