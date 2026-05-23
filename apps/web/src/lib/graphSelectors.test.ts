import { describe, expect, it } from "vitest";
import { type TreeDocument } from "@knowledge-tree/schema";

import { relatedByType, visibleGraph } from "./graphSelectors";

const timestamp = "2026-05-23T00:00:00.000Z";

describe("graphSelectors horizontal relation semantics", () => {
  it("reads a successor edge as prerequisite information from the target node", () => {
    const document = createDocument([
      edge("edge_a_b_successor", "a", "b", "successor"),
    ]);

    expect(relatedByType(document, "b", "prerequisite").map((node) => node.id)).toEqual(["a"]);
    expect(visibleGraph(document, "b", "horizontal").nodes.map((node) => node.id).sort()).toEqual(["a", "b"]);
    expect(visibleGraph(document, "b", "horizontal").edges.map((item) => item.id)).toEqual(["edge_a_b_successor"]);
  });

  it("reads a prerequisite edge as successor information from the source node", () => {
    const document = createDocument([
      edge("edge_a_b_prerequisite", "a", "b", "prerequisite"),
    ]);

    expect(relatedByType(document, "a", "successor").map((node) => node.id)).toEqual(["b"]);
    expect(visibleGraph(document, "a", "horizontal").nodes.map((node) => node.id).sort()).toEqual(["a", "b"]);
    expect(visibleGraph(document, "a", "horizontal").edges.map((item) => item.id)).toEqual(["edge_a_b_prerequisite"]);
  });

  it("deduplicates reciprocal prerequisite and successor edges", () => {
    const document = createDocument([
      edge("edge_a_b_successor", "a", "b", "successor"),
      edge("edge_a_b_prerequisite", "a", "b", "prerequisite"),
    ]);

    expect(relatedByType(document, "b", "prerequisite").map((node) => node.id)).toEqual(["a"]);
    expect(relatedByType(document, "a", "successor").map((node) => node.id)).toEqual(["b"]);
  });
});

function createDocument(edges: TreeDocument["edges"]): TreeDocument {
  return {
    schemaVersion: "1.0.0",
    tree: {
      id: "tree_test",
      title: "Test Tree",
      description: "",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    nodes: [
      node("a", "A"),
      node("b", "B"),
    ],
    edges,
    resources: [],
    layout: {
      nodes: {
        a: { nodeId: "a", x: 0, y: 0 },
        b: { nodeId: "b", x: 200, y: 0 },
      },
    },
  };
}

function node(id: string, title: string): TreeDocument["nodes"][number] {
  return {
    id,
    treeId: "tree_test",
    title,
    summary: "",
    status: "planned",
    tags: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function edge(
  id: string,
  sourceNodeId: string,
  targetNodeId: string,
  type: TreeDocument["edges"][number]["type"],
): TreeDocument["edges"][number] {
  return {
    id,
    treeId: "tree_test",
    sourceNodeId,
    targetNodeId,
    type,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
