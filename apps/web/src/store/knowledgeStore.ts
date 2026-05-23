import {
  createId,
  nowIso,
  type EdgeType,
  type KnowledgeNode,
  type ResourceLink,
  type ResourceType,
  type TreeDocument,
} from "@knowledge-tree/schema";
import { create } from "zustand";

import { defaultTree } from "@/data/defaultTree";
import { deleteTreeDocument, listTreeDocuments, saveTreeDocument } from "@/lib/db";
import { resolveSelectionAfterSubtreeDelete } from "@/lib/deleteSelection";
import { childrenOf, type ViewMode } from "@/lib/graphSelectors";

interface HistoryEntry {
  treeId: string;
  selectedNodeId: string;
  viewMode: ViewMode;
}

interface KnowledgeState {
  documents: TreeDocument[];
  activeTreeId: string;
  selectedNodeId: string;
  viewMode: ViewMode;
  relationMode: EdgeType;
  history: HistoryEntry[];
  loading: boolean;
  load: () => Promise<void>;
  activeDocument: () => TreeDocument | undefined;
  selectTree: (treeId: string) => void;
  createTree: () => Promise<void>;
  importTree: (document: TreeDocument) => Promise<void>;
  duplicateTree: (treeId: string) => Promise<void>;
  renameTree: (treeId: string, title: string) => Promise<void>;
  deleteTree: (treeId: string) => Promise<void>;
  openHorizontal: (nodeId?: string, pushHistory?: boolean) => void;
  openVertical: (nodeId?: string, pushHistory?: boolean) => void;
  goBack: () => void;
  setRelationMode: (mode: EdgeType) => void;
  updateNodePosition: (nodeId: string, x: number, y: number) => Promise<void>;
  createEdge: (sourceNodeId: string, targetNodeId: string) => Promise<void>;
  addNode: (parentId?: string, options?: { select?: boolean }) => Promise<void>;
  addAdjacentNode: (anchorNodeId: string, relation: "prerequisite" | "successor") => Promise<void>;
  updateNode: (nodeId: string, patch: Partial<Pick<KnowledgeNode, "title" | "summary" | "status">>) => Promise<void>;
  deleteSubtree: (nodeId: string) => Promise<void>;
  addResource: (nodeId: string, type: ResourceType) => Promise<void>;
  updateResource: (resourceId: string, patch: Partial<Pick<ResourceLink, "title" | "url">>) => Promise<void>;
  deleteResource: (resourceId: string) => Promise<void>;
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  documents: [],
  activeTreeId: "",
  selectedNodeId: "",
  viewMode: "horizontal",
  relationMode: "prerequisite",
  history: [],
  loading: true,

  activeDocument: () => get().documents.find((document) => document.tree.id === get().activeTreeId),

  load: async () => {
    let documents = await listTreeDocuments();
    if (!documents.length) {
      documents = [defaultTree];
      await saveTreeDocument(defaultTree);
    }
    const active = documents[0];
    set({
      documents,
      activeTreeId: active.tree.id,
      selectedNodeId: active.nodes[0]?.id ?? "",
      viewMode: "horizontal",
      loading: false,
    });
  },

  selectTree: (treeId) => {
    const document = get().documents.find((item) => item.tree.id === treeId);
    if (!document) return;
    set({
      activeTreeId: treeId,
      selectedNodeId: document.nodes[0]?.id ?? "",
      viewMode: "horizontal",
      history: [],
    });
  },

  createTree: async () => {
    const timestamp = nowIso();
    const id = createId("tree");
    const rootId = createId("node");
    const document: TreeDocument = {
      schemaVersion: "1.0.0",
      tree: {
        id,
        title: "新的知识树",
        description: "",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      nodes: [
        {
          id: rootId,
          treeId: id,
          title: "根节点",
          summary: "",
          status: "planned",
          tags: [],
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      edges: [],
      resources: [],
      layout: {
        nodes: {
          [rootId]: { nodeId: rootId, x: 360, y: 260 },
        },
      },
    };
    await saveTreeDocument(document);
    set((state) => ({
      documents: [document, ...state.documents],
      activeTreeId: id,
      selectedNodeId: rootId,
      viewMode: "horizontal",
      history: [],
    }));
  },

  importTree: async (document) => {
    const imported = withUpdatedTreeId(document);
    await saveTreeDocument(imported);
    set((state) => ({
      documents: [imported, ...state.documents.filter((item) => item.tree.id !== imported.tree.id)],
      activeTreeId: imported.tree.id,
      selectedNodeId: imported.nodes[0]?.id ?? "",
      viewMode: "horizontal",
      history: [],
    }));
  },

  duplicateTree: async (treeId) => {
    const document = get().documents.find((item) => item.tree.id === treeId);
    if (!document) return;
    const duplicate = withUpdatedTreeId(document, `${document.tree.title} 副本`);
    await saveTreeDocument(duplicate);
    set((state) => ({
      documents: [duplicate, ...state.documents],
      activeTreeId: duplicate.tree.id,
      selectedNodeId: duplicate.nodes[0]?.id ?? "",
      viewMode: "horizontal",
      history: [],
    }));
  },

  renameTree: async (treeId, title) => {
    await mutateDocument(treeId, (document) => {
      document.tree.title = title;
      touchTree(document);
    });
  },

  deleteTree: async (treeId) => {
    const nextDocuments = get().documents.filter((item) => item.tree.id !== treeId);
    if (!nextDocuments.length) return;
    await deleteTreeDocument(treeId);
    const active = nextDocuments[0];
    set({
      documents: nextDocuments,
      activeTreeId: active.tree.id,
      selectedNodeId: active.nodes[0]?.id ?? "",
      viewMode: "horizontal",
      history: [],
    });
  },

  openHorizontal: (nodeId, pushHistory = false) => {
    const targetNodeId = nodeId ?? get().selectedNodeId;
    if (pushHistory) pushHistoryEntry();
    set({ selectedNodeId: targetNodeId, viewMode: "horizontal" });
  },

  openVertical: (nodeId, pushHistory = false) => {
    const targetNodeId = nodeId ?? get().selectedNodeId;
    if (pushHistory) pushHistoryEntry();
    set({ selectedNodeId: targetNodeId, viewMode: "vertical" });
  },

  goBack: () => {
    const history = [...get().history];
    const previous = history.pop();
    if (!previous) return;
    set({
      activeTreeId: previous.treeId,
      selectedNodeId: previous.selectedNodeId,
      viewMode: previous.viewMode,
      history,
    });
  },

  setRelationMode: (mode) => set({ relationMode: mode }),

  updateNodePosition: async (nodeId, x, y) => {
    const activeTreeId = get().activeTreeId;
    await mutateDocument(activeTreeId, (document) => {
      document.layout.nodes[nodeId] = { nodeId, x, y };
      touchTree(document);
    });
  },

  createEdge: async (sourceNodeId, targetNodeId) => {
    const activeTreeId = get().activeTreeId;
    const type = get().relationMode;
    if (sourceNodeId === targetNodeId) return;
    await mutateDocument(activeTreeId, (document) => {
      const duplicate = document.edges.some(
        (edge) => edge.sourceNodeId === sourceNodeId && edge.targetNodeId === targetNodeId && edge.type === type,
      );
      if (duplicate) return;
      const timestamp = nowIso();
      document.edges.push({
        id: createId("edge"),
        treeId: activeTreeId,
        sourceNodeId,
        targetNodeId,
        type,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      touchTree(document);
    });
  },

  addNode: async (parentId, options) => {
    const document = get().activeDocument();
    if (!document) return;
    const timestamp = nowIso();
    const id = createId("node");
    const anchorId = parentId ?? get().selectedNodeId;
    const anchorLayout = anchorId ? document.layout.nodes[anchorId] : undefined;
    const yOffset = parentId ? 90 : 130 + (document.nodes.length % 4) * 46;
    await mutateDocument(document.tree.id, (draft) => {
      draft.nodes.push({
        id,
        treeId: draft.tree.id,
        title: "新节点",
        summary: "",
        status: "planned",
        tags: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      draft.layout.nodes[id] = {
        nodeId: id,
        x: (anchorLayout?.x ?? 520) + 260,
        y: (anchorLayout?.y ?? 300) + yOffset,
      };
      if (parentId) {
        draft.edges.push({
          id: createId("edge"),
          treeId: draft.tree.id,
          sourceNodeId: parentId,
          targetNodeId: id,
          type: "parent_child",
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
      touchTree(draft);
    });
    if (options?.select === false) {
      set({ viewMode: "horizontal" });
      return;
    }
    set({ selectedNodeId: id, viewMode: parentId ? "vertical" : "horizontal" });
  },

  addAdjacentNode: async (anchorNodeId, relation) => {
    const document = get().activeDocument();
    if (!document) return;
    const anchorLayout = document.layout.nodes[anchorNodeId];
    const timestamp = nowIso();
    const id = createId("node");
    const isPrerequisite = relation === "prerequisite";
    await mutateDocument(document.tree.id, (draft) => {
      draft.nodes.push({
        id,
        treeId: draft.tree.id,
        title: isPrerequisite ? "新前置节点" : "新后置节点",
        summary: "",
        status: "planned",
        tags: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      draft.layout.nodes[id] = {
        nodeId: id,
        x: (anchorLayout?.x ?? 520) + (isPrerequisite ? -280 : 280),
        y: (anchorLayout?.y ?? 300) + 90,
      };
      draft.edges.push({
        id: createId("edge"),
        treeId: draft.tree.id,
        sourceNodeId: isPrerequisite ? id : anchorNodeId,
        targetNodeId: isPrerequisite ? anchorNodeId : id,
        type: relation,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      touchTree(draft);
    });
    set({ selectedNodeId: anchorNodeId, viewMode: "horizontal" });
  },

  updateNode: async (nodeId, patch) => {
    await mutateDocument(get().activeTreeId, (document) => {
      const node = document.nodes.find((item) => item.id === nodeId);
      if (!node) return;
      Object.assign(node, patch, { updatedAt: nowIso() });
      touchTree(document);
    });
  },

  deleteSubtree: async (nodeId) => {
    const activeTreeId = get().activeTreeId;
    const document = get().activeDocument();
    if (!document) return;
    const previousSelectedNodeId = get().selectedNodeId;
    const previousViewMode = get().viewMode;
    const ids = collectSubtreeIds(document, nodeId);
    if (ids.size >= document.nodes.length) return;
    await mutateDocument(activeTreeId, (draft) => {
      draft.nodes = draft.nodes.filter((node) => !ids.has(node.id));
      draft.edges = draft.edges.filter((edge) => !ids.has(edge.sourceNodeId) && !ids.has(edge.targetNodeId));
      draft.resources = draft.resources.filter((resource) => !ids.has(resource.nodeId));
      for (const id of ids) delete draft.layout.nodes[id];
      touchTree(draft);
    });
    const nextSelection = resolveSelectionAfterSubtreeDelete({
      document,
      deletedNodeId: nodeId,
      deletedIds: ids,
      previousSelectedNodeId,
      previousViewMode,
    });
    set({
      selectedNodeId: nextSelection.selectedNodeId,
      viewMode: nextSelection.viewMode,
      history: nextSelection.clearHistory ? [] : get().history,
    });
  },

  addResource: async (nodeId, type) => {
    const activeTreeId = get().activeTreeId;
    const timestamp = nowIso();
    await mutateDocument(activeTreeId, (document) => {
      document.resources.push({
        id: createId("resource"),
        treeId: activeTreeId,
        nodeId,
        type,
        title: "",
        url: "",
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      touchTree(document);
    });
  },

  updateResource: async (resourceId, patch) => {
    await mutateDocument(get().activeTreeId, (document) => {
      const resource = document.resources.find((item) => item.id === resourceId);
      if (!resource) return;
      Object.assign(resource, patch, { updatedAt: nowIso() });
      touchTree(document);
    });
  },

  deleteResource: async (resourceId) => {
    await mutateDocument(get().activeTreeId, (document) => {
      document.resources = document.resources.filter((resource) => resource.id !== resourceId);
      touchTree(document);
    });
  },
}));

async function mutateDocument(treeId: string, mutator: (document: TreeDocument) => void): Promise<void> {
  const state = useKnowledgeStore.getState();
  const document = state.documents.find((item) => item.tree.id === treeId);
  if (!document) return;
  const draft = structuredClone(document);
  mutator(draft);
  await saveTreeDocument(draft);
  useKnowledgeStore.setState({
    documents: state.documents.map((item) => (item.tree.id === treeId ? draft : item)),
  });
}

function touchTree(document: TreeDocument): void {
  document.tree.updatedAt = nowIso();
}

function pushHistoryEntry(): void {
  const state = useKnowledgeStore.getState();
  const current: HistoryEntry = {
    treeId: state.activeTreeId,
    selectedNodeId: state.selectedNodeId,
    viewMode: state.viewMode,
  };
  const last = state.history[state.history.length - 1];
  if (
    last?.treeId === current.treeId &&
    last.selectedNodeId === current.selectedNodeId &&
    last.viewMode === current.viewMode
  ) {
    return;
  }
  useKnowledgeStore.setState({ history: [...state.history, current].slice(-50) });
}

function collectSubtreeIds(document: TreeDocument, nodeId: string, result = new Set<string>()): Set<string> {
  if (result.has(nodeId)) return result;
  result.add(nodeId);
  for (const child of childrenOf(document, nodeId)) collectSubtreeIds(document, child.id, result);
  return result;
}

function withUpdatedTreeId(document: TreeDocument, title = document.tree.title): TreeDocument {
  const next = structuredClone(document);
  const treeId = createId("tree");
  const timestamp = nowIso();
  next.tree.id = treeId;
  next.tree.title = title;
  next.tree.createdAt = timestamp;
  next.tree.updatedAt = timestamp;
  next.nodes = next.nodes.map((node) => ({ ...node, treeId }));
  next.edges = next.edges.map((edge) => ({ ...edge, id: createId("edge"), treeId }));
  next.resources = next.resources.map((resource) => ({ ...resource, id: createId("resource"), treeId }));
  return next;
}
