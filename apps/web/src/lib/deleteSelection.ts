import { type TreeDocument } from "@knowledge-tree/schema";

import { parentOf, type ViewMode } from "./graphSelectors";

interface DeleteSelectionInput {
  document: TreeDocument;
  deletedNodeId: string;
  deletedIds: Set<string>;
  previousSelectedNodeId: string;
  previousViewMode: ViewMode;
}

interface DeleteSelectionResult {
  selectedNodeId: string;
  viewMode: ViewMode;
  clearHistory: boolean;
}

export function resolveSelectionAfterSubtreeDelete({
  document,
  deletedNodeId,
  deletedIds,
  previousSelectedNodeId,
  previousViewMode,
}: DeleteSelectionInput): DeleteSelectionResult {
  if (!deletedIds.has(previousSelectedNodeId)) {
    return {
      selectedNodeId: previousSelectedNodeId,
      viewMode: previousViewMode,
      clearHistory: false,
    };
  }

  const fallback = parentOf(document, deletedNodeId)?.id ?? document.nodes.find((node) => !deletedIds.has(node.id))?.id ?? "";

  return {
    selectedNodeId: fallback,
    viewMode: fallback ? previousViewMode : "horizontal",
    clearHistory: true,
  };
}
