import { type NodeStatus, type ResourceLink } from "@knowledge-tree/schema";
import { ExternalLink, FileText, Plus, Trash2, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { childrenOf, getNode, parentOf, relatedByType } from "@/lib/graphSelectors";
import { useKnowledgeStore } from "@/store/knowledgeStore";

interface ResourceMenu {
  resourceId: string;
  x: number;
  y: number;
}

interface NodeDraft {
  title: string;
  summary: string;
  status: NodeStatus;
}

export function Inspector() {
  const [resourceMenu, setResourceMenu] = useState<ResourceMenu | null>(null);
  const [nodeDraft, setNodeDraft] = useState<NodeDraft>({ title: "", summary: "", status: "planned" });
  const nodeSaveTimer = useRef<number | undefined>(undefined);
  const latestNodeDraft = useRef<NodeDraft>(nodeDraft);
  const nodeDirty = useRef(false);

  const document = useKnowledgeStore((state) => state.activeDocument());
  const selectedNodeId = useKnowledgeStore((state) => state.selectedNodeId);
  const updateNode = useKnowledgeStore((state) => state.updateNode);
  const addNode = useKnowledgeStore((state) => state.addNode);
  const addResource = useKnowledgeStore((state) => state.addResource);
  const updateResource = useKnowledgeStore((state) => state.updateResource);
  const deleteResource = useKnowledgeStore((state) => state.deleteResource);
  const openHorizontal = useKnowledgeStore((state) => state.openHorizontal);
  const openVertical = useKnowledgeStore((state) => state.openVertical);

  const selectedNode = useMemo(() => getNode(document, selectedNodeId), [document, selectedNodeId]);

  useEffect(() => {
    if (!selectedNode) return;
    const next = {
      title: selectedNode.title,
      summary: selectedNode.summary,
      status: selectedNode.status,
    };
    latestNodeDraft.current = next;
    nodeDirty.current = false;
    setNodeDraft(next);
  }, [selectedNode?.id]);

  useEffect(() => {
    latestNodeDraft.current = nodeDraft;
  }, [nodeDraft]);

  useEffect(() => {
    return () => {
      if (!selectedNode || !nodeDirty.current) return;
      if (nodeSaveTimer.current) window.clearTimeout(nodeSaveTimer.current);
      void updateNode(selectedNode.id, normalizeNodeDraft(latestNodeDraft.current));
    };
  }, [selectedNode?.id, updateNode]);

  function scheduleNodeSave(next: NodeDraft) {
    if (!selectedNode) return;
    latestNodeDraft.current = next;
    nodeDirty.current = true;
    if (nodeSaveTimer.current) window.clearTimeout(nodeSaveTimer.current);
    nodeSaveTimer.current = window.setTimeout(() => {
      void updateNode(selectedNode.id, normalizeNodeDraft(next));
      nodeDirty.current = false;
      nodeSaveTimer.current = undefined;
    }, 500);
  }

  function updateNodeDraft(patch: Partial<NodeDraft>) {
    const next = { ...latestNodeDraft.current, ...patch };
    setNodeDraft(next);
    scheduleNodeSave(next);
  }

  function commitNodeDraft() {
    if (!selectedNode) return;
    if (nodeSaveTimer.current) window.clearTimeout(nodeSaveTimer.current);
    const normalized = normalizeNodeDraft(latestNodeDraft.current);
    latestNodeDraft.current = normalized;
    setNodeDraft(normalized);
    if (nodeDirty.current) {
      void updateNode(selectedNode.id, normalized);
      nodeDirty.current = false;
    }
  }

  if (!document || !selectedNode) {
    return (
      <aside className="inspector empty-panel">
        <p>请选择一个节点</p>
      </aside>
    );
  }

  const parent = parentOf(document, selectedNode.id);
  const children = childrenOf(document, selectedNode.id);
  const prerequisites = relatedByType(document, selectedNode.id, "prerequisite");
  const successors = relatedByType(document, selectedNode.id, "successor");
  const notes = document.resources.filter((resource) => resource.nodeId === selectedNode.id && resource.type === "note");
  const externals = document.resources.filter(
    (resource) => resource.nodeId === selectedNode.id && resource.type === "external",
  );

  return (
    <aside className="inspector">
      <div className="inspector-header">
        <p className="eyebrow">{document.tree.title}</p>
        <input
          aria-label="节点标题"
          className="title-input"
          value={nodeDraft.title}
          onBlur={commitNodeDraft}
          onChange={(event) => updateNodeDraft({ title: event.target.value })}
        />
        <select
          aria-label="学习状态"
          value={nodeDraft.status}
          onBlur={commitNodeDraft}
          onChange={(event) => updateNodeDraft({ status: event.target.value as NodeStatus })}
        >
          <option value="planned">计划学习</option>
          <option value="learning">正在学习</option>
          <option value="mastered">已掌握</option>
        </select>
      </div>

      <section className="inspector-section">
        <div className="section-title">
          <h3>简介</h3>
        </div>
        <textarea
          aria-label="节点简介"
          value={nodeDraft.summary}
          placeholder="写下这个知识点的简要说明"
          onBlur={commitNodeDraft}
          onChange={(event) => updateNodeDraft({ summary: event.target.value })}
        />
      </section>

      <section className="inspector-section">
        <div className="section-title">
          <h3>纵向层级</h3>
          <button className="mini-button" type="button" onClick={() => void addNode(selectedNode.id)}>
            <Plus size={14} />
            子节点
          </button>
        </div>
        <div className="relation-summary">
          <span>母节点：{parent?.title ?? "无"}</span>
          <span>子节点：{children.length ? children.map((node) => node.title).join("、") : "无"}</span>
        </div>
        <button className="secondary full" type="button" onClick={() => openVertical(selectedNode.id, true)}>
          查看纵向页面
        </button>
      </section>

      <section className="inspector-section">
        <div className="section-title">
          <h3>横向关系</h3>
        </div>
        <div className="relation-summary">
          <span>前置：{prerequisites.length ? prerequisites.map((node) => node.title).join("、") : "无"}</span>
          <span>后置：{successors.length ? successors.map((node) => node.title).join("、") : "无"}</span>
        </div>
        <button className="secondary full" type="button" onClick={() => openHorizontal(selectedNode.id, true)}>
          查看横向关系
        </button>
      </section>

      <ResourceSection
        title="我的笔记"
        icon="note"
        resources={notes}
        onAdd={() => void addResource(selectedNode.id, "note")}
        onUpdate={updateResource}
        onContextMenu={setResourceMenu}
      />

      <ResourceSection
        title="外部资源"
        icon="external"
        resources={externals}
        onAdd={() => void addResource(selectedNode.id, "external")}
        onUpdate={updateResource}
        onContextMenu={setResourceMenu}
      />

      {resourceMenu && (
        <div className="context-menu" style={{ left: resourceMenu.x, top: resourceMenu.y }} onMouseLeave={() => setResourceMenu(null)}>
          <button
            className="danger"
            type="button"
            onClick={() => {
              void deleteResource(resourceMenu.resourceId);
              setResourceMenu(null);
            }}
          >
            <Trash2 size={15} />
            删除链接
          </button>
        </div>
      )}
    </aside>
  );
}

interface ResourceSectionProps {
  title: string;
  icon: "note" | "external";
  resources: ResourceLink[];
  onAdd: () => void;
  onUpdate: (resourceId: string, patch: Partial<Pick<ResourceLink, "title" | "url">>) => Promise<void>;
  onContextMenu: (menu: ResourceMenu) => void;
}

function ResourceSection({ title, icon, resources, onAdd, onUpdate, onContextMenu }: ResourceSectionProps) {
  const Icon = icon === "note" ? FileText : ExternalLink;

  return (
    <section className="inspector-section">
      <div className="section-title">
        <h3>{title}</h3>
        <button className="mini-button" type="button" onClick={onAdd}>
          <Plus size={14} />
          新增
        </button>
      </div>

      <div className="resource-list">
        {resources.length === 0 && <p className="muted">还没有链接</p>}
        {resources.map((resource) => (
          <ResourceRow
            key={resource.id}
            icon={Icon}
            resource={resource}
            title={title}
            onUpdate={onUpdate}
            onContextMenu={onContextMenu}
          />
        ))}
      </div>
    </section>
  );
}

interface ResourceRowProps {
  icon: LucideIcon;
  resource: ResourceLink;
  title: string;
  onUpdate: (resourceId: string, patch: Partial<Pick<ResourceLink, "title" | "url">>) => Promise<void>;
  onContextMenu: (menu: ResourceMenu) => void;
}

function ResourceRow({ icon: Icon, resource, title, onUpdate, onContextMenu }: ResourceRowProps) {
  const [draft, setDraft] = useState({ title: resource.title, url: resource.url });
  const latestDraft = useRef(draft);
  const savedDraft = useRef(draft);
  const saveTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const next = { title: resource.title, url: resource.url };
    latestDraft.current = next;
    savedDraft.current = next;
    setDraft(next);
  }, [resource.id]);

  useEffect(() => {
    latestDraft.current = draft;
  }, [draft]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      commitResourceDraft(latestDraft.current);
    };
  }, [resource.id]);

  function commitResourceDraft(next = latestDraft.current) {
    if (next.title === savedDraft.current.title && next.url === savedDraft.current.url) return;
    savedDraft.current = next;
    void onUpdate(resource.id, next);
  }

  function updateDraft(patch: Partial<typeof draft>) {
    const next = { ...latestDraft.current, ...patch };
    latestDraft.current = next;
    setDraft(next);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      commitResourceDraft(next);
      saveTimer.current = undefined;
    }, 500);
  }

  function commitNow() {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    commitResourceDraft();
  }

  return (
    <div
      className="resource-row"
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu({ resourceId: resource.id, x: event.clientX, y: event.clientY });
      }}
    >
      <Icon size={16} />
      <div>
        <input
          aria-label={`${title}标题`}
          value={draft.title}
          placeholder="标题"
          onBlur={commitNow}
          onChange={(event) => updateDraft({ title: event.target.value })}
        />
        <input
          aria-label={`${title}链接`}
          value={draft.url}
          placeholder="https://"
          onBlur={commitNow}
          onChange={(event) => updateDraft({ url: event.target.value })}
        />
      </div>
    </div>
  );
}

function normalizeNodeDraft(draft: NodeDraft): NodeDraft {
  return {
    ...draft,
    title: draft.title.trim() || "未命名节点",
  };
}
