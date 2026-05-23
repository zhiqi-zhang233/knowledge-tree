import { z } from "zod";

export const edgeTypeSchema = z.enum(["parent_child", "prerequisite", "successor", "related"]);
export const resourceTypeSchema = z.enum(["note", "external"]);
export const nodeStatusSchema = z.enum(["planned", "learning", "mastered"]);

export const knowledgeNodeSchema = z.object({
  id: z.string().min(1),
  treeId: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().default(""),
  status: nodeStatusSchema.default("planned"),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const knowledgeEdgeSchema = z.object({
  id: z.string().min(1),
  treeId: z.string().min(1),
  sourceNodeId: z.string().min(1),
  targetNodeId: z.string().min(1),
  type: edgeTypeSchema,
  createdAt: z.string(),
  updatedAt: z.string()
});

export const resourceLinkSchema = z.object({
  id: z.string().min(1),
  treeId: z.string().min(1),
  nodeId: z.string().min(1),
  type: resourceTypeSchema,
  title: z.string().default(""),
  url: z.string().default(""),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const nodeLayoutSchema = z.object({
  nodeId: z.string().min(1),
  x: z.number(),
  y: z.number()
});

export const treeMetaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(""),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const treeDocumentSchema = z.object({
  schemaVersion: z.literal("1.0.0"),
  tree: treeMetaSchema,
  nodes: z.array(knowledgeNodeSchema),
  edges: z.array(knowledgeEdgeSchema),
  resources: z.array(resourceLinkSchema),
  layout: z.object({
    nodes: z.record(z.string(), nodeLayoutSchema)
  })
});

export type EdgeType = z.infer<typeof edgeTypeSchema>;
export type ResourceType = z.infer<typeof resourceTypeSchema>;
export type NodeStatus = z.infer<typeof nodeStatusSchema>;
export type KnowledgeNode = z.infer<typeof knowledgeNodeSchema>;
export type KnowledgeEdge = z.infer<typeof knowledgeEdgeSchema>;
export type ResourceLink = z.infer<typeof resourceLinkSchema>;
export type NodeLayout = z.infer<typeof nodeLayoutSchema>;
export type TreeMeta = z.infer<typeof treeMetaSchema>;
export type TreeDocument = z.infer<typeof treeDocumentSchema>;

export function parseTreeDocument(input: unknown): TreeDocument {
  return treeDocumentSchema.parse(input);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
}
