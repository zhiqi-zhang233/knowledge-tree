import Dexie, { type Table } from "dexie";
import { type TreeDocument } from "@knowledge-tree/schema";

export interface TreeRecord {
  id: string;
  title: string;
  updatedAt: string;
  document: TreeDocument;
}

class KnowledgeTreeDb extends Dexie {
  documents!: Table<TreeRecord, string>;

  constructor() {
    super("knowledge-tree-db");
    this.version(1).stores({
      documents: "id, title, updatedAt",
    });
  }
}

export const db = new KnowledgeTreeDb();

export async function listTreeDocuments(): Promise<TreeDocument[]> {
  const records = await db.documents.orderBy("updatedAt").reverse().toArray();
  return records.map((record) => record.document);
}

export async function saveTreeDocument(document: TreeDocument): Promise<void> {
  await db.documents.put({
    id: document.tree.id,
    title: document.tree.title,
    updatedAt: document.tree.updatedAt,
    document,
  });
}

export async function deleteTreeDocument(treeId: string): Promise<void> {
  await db.documents.delete(treeId);
}
