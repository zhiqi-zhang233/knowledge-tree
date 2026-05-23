import { type EdgeType, type KnowledgeEdge, type KnowledgeNode, type TreeDocument } from "@knowledge-tree/schema";

export type ViewMode = "horizontal" | "vertical";

export function getNode(document: TreeDocument | undefined, nodeId: string | undefined): KnowledgeNode | undefined {
  if (!document || !nodeId) return undefined;
  return document.nodes.find((node) => node.id === nodeId);
}

export function parentOf(document: TreeDocument, nodeId: string): KnowledgeNode | undefined {
  const edge = document.edges.find((item) => item.type === "parent_child" && item.targetNodeId === nodeId);
  return edge ? getNode(document, edge.sourceNodeId) : undefined;
}

export function childrenOf(document: TreeDocument, nodeId: string): KnowledgeNode[] {
  const childIds = document.edges
    .filter((edge) => edge.type === "parent_child" && edge.sourceNodeId === nodeId)
    .map((edge) => edge.targetNodeId);
  return childIds.map((id) => getNode(document, id)).filter(Boolean) as KnowledgeNode[];
}

export function relatedByType(document: TreeDocument, nodeId: string, type: EdgeType): KnowledgeNode[] {
  if (type === "prerequisite") {
    return document.edges
      .filter((edge) => edge.type === "prerequisite" && edge.targetNodeId === nodeId)
      .map((edge) => getNode(document, edge.sourceNodeId))
      .filter(Boolean) as KnowledgeNode[];
  }
  if (type === "successor") {
    return document.edges
      .filter((edge) => edge.type === "successor" && edge.sourceNodeId === nodeId)
      .map((edge) => getNode(document, edge.targetNodeId))
      .filter(Boolean) as KnowledgeNode[];
  }
  return [];
}

export function visibleGraph(document: TreeDocument, selectedNodeId: string, viewMode: ViewMode) {
  const selected = getNode(document, selectedNodeId) ?? document.nodes[0];
  if (!selected) return { nodes: [], edges: [] };

  if (viewMode === "vertical") {
    const parent = parentOf(document, selected.id);
    const children = childrenOf(document, selected.id);
    const ids = new Set([parent?.id, selected.id, ...children.map((node) => node.id)].filter(Boolean) as string[]);
    const edges = document.edges.filter(
      (edge) => edge.type === "parent_child" && ids.has(edge.sourceNodeId) && ids.has(edge.targetNodeId),
    );
    return { nodes: document.nodes.filter((node) => ids.has(node.id)), edges };
  }

  const prerequisites = relatedByType(document, selected.id, "prerequisite");
  const successors = relatedByType(document, selected.id, "successor");
  const connectedNodeIds = new Set<string>();
  for (const edge of document.edges) {
    connectedNodeIds.add(edge.sourceNodeId);
    connectedNodeIds.add(edge.targetNodeId);
  }
  const orphanNodes = document.nodes.filter((node) => !connectedNodeIds.has(node.id));
  const ids = new Set([
    selected.id,
    ...prerequisites.map((node) => node.id),
    ...successors.map((node) => node.id),
    ...orphanNodes.map((node) => node.id),
  ]);
  const edges = document.edges.filter(
    (edge) =>
      ((edge.type === "prerequisite" && edge.targetNodeId === selected.id) ||
        (edge.type === "successor" && edge.sourceNodeId === selected.id)) &&
      ids.has(edge.sourceNodeId) &&
      ids.has(edge.targetNodeId),
  );
  return { nodes: document.nodes.filter((node) => ids.has(node.id)), edges };
}

export function edgeLabel(edge: KnowledgeEdge): string {
  if (edge.type === "parent_child") return "子节点";
  if (edge.type === "prerequisite") return "前置";
  if (edge.type === "successor") return "后置";
  return "相关";
}
