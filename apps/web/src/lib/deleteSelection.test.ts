import { type TreeDocument } from "@knowledge-tree/schema";
import { describe, expect, it } from "vitest";

import { resolveSelectionAfterSubtreeDelete } from "./deleteSelection";

const timestamp = "2026-05-23T00:00:00.000Z";

describe("resolveSelectionAfterSubtreeDelete", () => {
  it("keeps the previous horizontal relation page when deleting a non-selected node", () => {
    const document = createDocument();

    expect(
      resolveSelectionAfterSubtreeDelete({
        document,
        deletedNodeId: "prerequisite",
        deletedIds: new Set(["prerequisite"]),
        previousSelectedNodeId: "current",
        previousViewMode: "horizontal",
      }),
    ).toEqual({
      selectedNodeId: "current",
      viewMode: "horizontal",
      clearHistory: false,
    });
  });

  it("keeps the previous view mode when deleting the selected node and falling back to its parent", () => {
    const document = createDocument();

    expect(
      resolveSelectionAfterSubtreeDelete({
        document,
        deletedNodeId: "child",
        deletedIds: new Set(["child"]),
        previousSelectedNodeId: "child",
        previousViewMode: "vertical",
      }),
    ).toEqual({
      selectedNodeId: "current",
      viewMode: "vertical",
      clearHistory: true,
    });
  });
});

function createDocument(): TreeDocument {
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
      node("current", "Current"),
      node("prerequisite", "Prerequisite"),
      node("child", "Child"),
    ],
    edges: [
      edge("edge_prerequisite_current", "prerequisite", "current", "prerequisite"),
      edge("edge_current_child", "current", "child", "parent_child"),
    ],
    resources: [],
    layout: {
      nodes: {
        current: { nodeId: "current", x: 0, y: 0 },
        prerequisite: { nodeId: "prerequisite", x: -200, y: 0 },
        child: { nodeId: "child", x: 0, y: 200 },
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
