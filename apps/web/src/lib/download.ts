import { parseTreeDocument, type TreeDocument } from "@knowledge-tree/schema";

export function downloadTree(treeDocument: TreeDocument): void {
  const blob = new Blob([JSON.stringify(treeDocument, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${treeDocument.tree.title || "knowledge-tree"}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function readTreeFile(file: File): Promise<TreeDocument> {
  const text = await file.text();
  return parseTreeDocument(JSON.parse(text));
}
