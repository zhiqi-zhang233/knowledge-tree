import {
  Background,
  ConnectionLineType,
  Controls,
  ReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import { Plus } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { edgeLabel, visibleGraph } from "@/lib/graphSelectors";
import { useKnowledgeStore } from "@/store/knowledgeStore";

import { KnowledgeNode } from "./KnowledgeNode";

const nodeTypes = { knowledge: KnowledgeNode };

interface NodeMenu {
  nodeId: string;
  x: number;
  y: number;
}

export function GraphCanvas() {
  const [nodeMenu, setNodeMenu] = useState<NodeMenu | null>(null);
  const clickTimer = useRef<number | undefined>(undefined);
  const document = useKnowledgeStore((state) => state.activeDocument());
  const selectedNodeId = useKnowledgeStore((state) => state.selectedNodeId);
  const viewMode = useKnowledgeStore((state) => state.viewMode);
  const relationMode = useKnowledgeStore((state) => state.relationMode);
  const setRelationMode = useKnowledgeStore((state) => state.setRelationMode);
  const openHorizontal = useKnowledgeStore((state) => state.openHorizontal);
  const openVertical = useKnowledgeStore((state) => state.openVertical);
  const goBack = useKnowledgeStore((state) => state.goBack);
  const updateNodePosition = useKnowledgeStore((state) => state.updateNodePosition);
  const createEdge = useKnowledgeStore((state) => state.createEdge);
  const addNode = useKnowledgeStore((state) => state.addNode);
  const addAdjacentNode = useKnowledgeStore((state) => state.addAdjacentNode);
  const deleteSubtree = useKnowledgeStore((state) => state.deleteSubtree);

  const graph = useMemo(() => {
    if (!document || !selectedNodeId) return { nodes: [], edges: [] };
    return visibleGraph(document, selectedNodeId, viewMode);
  }, [document, selectedNodeId, viewMode]);

  const nodes: Node[] = useMemo(() => {
    if (!document) return [];
    return graph.nodes.map((node) => {
      const position = document.layout.nodes[node.id] ?? { x: 0, y: 0 };
      const relationCount = document.edges.filter(
        (edge) => edge.sourceNodeId === node.id || edge.targetNodeId === node.id,
      ).length;
      return {
        id: node.id,
        type: "knowledge",
        position,
        data: { title: node.title, status: node.status, relationCount },
      };
    });
  }, [document, graph.nodes]);

  const edges: Edge[] = useMemo(
    () =>
      graph.edges.map((edge) => ({
        id: edge.id,
        source: edge.sourceNodeId,
        target: edge.targetNodeId,
        label: edgeLabel(edge),
        type: "smoothstep",
        animated: edge.type === "prerequisite",
        className: `edge-${edge.type}`,
      })),
    [graph.edges],
  );

  function handleNodesChange(changes: NodeChange[]) {
    for (const change of changes) {
      if (change.type === "position" && change.position && !change.dragging) {
        void updateNodePosition(change.id, change.position.x, change.position.y);
      }
    }
  }

  function handleConnect(connection: Connection) {
    if (!connection.source || !connection.target) return;
    void createEdge(connection.source, connection.target);
  }

  function handleNodeClick(nodeId: string) {
    if (clickTimer.current) window.clearTimeout(clickTimer.current);
    clickTimer.current = window.setTimeout(() => {
      openVertical(nodeId, true);
      clickTimer.current = undefined;
    }, 180);
  }

  function handleNodeDoubleClick() {
    if (clickTimer.current) {
      window.clearTimeout(clickTimer.current);
      clickTimer.current = undefined;
    }
    goBack();
  }

  if (!document) {
    return <section className="canvas-panel empty-panel">暂无知识树</section>;
  }

  return (
    <section className="canvas-panel">
      <div className="canvas-toolbar">
        <div>
          <p className="eyebrow">{viewMode === "horizontal" ? "横向关系" : "纵向页面"}</p>
          <h2>{document.tree.title}</h2>
        </div>
        <div className="toolbar-actions">
          <button type="button" onClick={() => void addNode(undefined, { select: false })}>
            <Plus size={16} />
            新建节点
          </button>
          <button className={viewMode === "horizontal" ? "active" : ""} type="button" onClick={() => openHorizontal()}>
            横向关系
          </button>
          <button className={viewMode === "vertical" ? "active" : ""} type="button" onClick={() => openVertical()}>
            纵向页面
          </button>
          <select value={relationMode} onChange={(event) => setRelationMode(event.target.value as typeof relationMode)}>
            <option value="prerequisite">连接为前置</option>
            <option value="successor">连接为后置</option>
            <option value="parent_child">连接为子节点</option>
            <option value="related">连接为相关</option>
          </select>
        </div>
      </div>

      <div className="flow-shell">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.28 }}
          connectionLineType={ConnectionLineType.SmoothStep}
          onNodesChange={handleNodesChange}
          onConnect={handleConnect}
          onNodeClick={(_, node) => handleNodeClick(node.id)}
          onNodeDoubleClick={(event) => {
            event.preventDefault();
            handleNodeDoubleClick();
          }}
          onNodeContextMenu={(event, node) => {
            event.preventDefault();
            setNodeMenu({ nodeId: node.id, x: event.clientX, y: event.clientY });
          }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      <div className="canvas-status">
        {graph.nodes.length} 个节点 · 当前视图只显示
        {viewMode === "horizontal" ? "前置、当前、后置和独立节点" : "母节点、当前、子节点"}
      </div>

      {nodeMenu && (
        <div className="context-menu" style={{ left: nodeMenu.x, top: nodeMenu.y }} onMouseLeave={() => setNodeMenu(null)}>
          <button
            type="button"
            onClick={() => {
              void addAdjacentNode(nodeMenu.nodeId, "prerequisite");
              setNodeMenu(null);
            }}
          >
            <Plus size={15} />
            新增前置节点
          </button>
          <button
            type="button"
            onClick={() => {
              void addAdjacentNode(nodeMenu.nodeId, "successor");
              setNodeMenu(null);
            }}
          >
            <Plus size={15} />
            新增后置节点
          </button>
          <button
            className="danger"
            type="button"
            onClick={() => {
              const node = document.nodes.find((item) => item.id === nodeMenu.nodeId);
              if (node && window.confirm(`删除“${node.title}”和它的所有子节点？`)) void deleteSubtree(nodeMenu.nodeId);
              setNodeMenu(null);
            }}
          >
            删除节点和所有子节点
          </button>
        </div>
      )}
    </section>
  );
}
