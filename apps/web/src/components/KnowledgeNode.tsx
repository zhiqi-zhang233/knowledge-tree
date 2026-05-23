import { Handle, Position, type NodeProps } from "@xyflow/react";

interface KnowledgeNodeData extends Record<string, unknown> {
  title: string;
  status: string;
  relationCount: number;
}

export function KnowledgeNode({ data, selected }: NodeProps) {
  const nodeData = data as KnowledgeNodeData;
  return (
    <div className={`knowledge-node ${selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Top} id="top-target" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" />
      <strong>{nodeData.title}</strong>
      <span>
        {statusLabel(nodeData.status)} · 关联 {nodeData.relationCount}
      </span>
    </div>
  );
}

function statusLabel(status: string) {
  if (status === "learning") return "正在学习";
  if (status === "mastered") return "已掌握";
  return "计划学习";
}
