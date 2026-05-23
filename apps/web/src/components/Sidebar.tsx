import { Copy, Download, FileUp, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { downloadTree, readTreeFile } from "@/lib/download";
import { useKnowledgeStore } from "@/store/knowledgeStore";

interface MenuState {
  treeId: string;
  x: number;
  y: number;
}

export function Sidebar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const documents = useKnowledgeStore((state) => state.documents);
  const activeTreeId = useKnowledgeStore((state) => state.activeTreeId);
  const selectTree = useKnowledgeStore((state) => state.selectTree);
  const createTree = useKnowledgeStore((state) => state.createTree);
  const importTree = useKnowledgeStore((state) => state.importTree);
  const duplicateTree = useKnowledgeStore((state) => state.duplicateTree);
  const renameTree = useKnowledgeStore((state) => state.renameTree);
  const deleteTree = useKnowledgeStore((state) => state.deleteTree);
  const activeDocument = useKnowledgeStore((state) => state.activeDocument());

  async function handleImport(file: File | undefined) {
    if (!file) return;
    const document = await readTreeFile(file);
    await importTree(document);
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">知</div>
        <div>
          <h1>知识树</h1>
          <p>轻量管理知识关系和资料链接</p>
        </div>
      </div>

      <div className="sidebar-actions">
        <button className="primary" type="button" onClick={() => void createTree()}>
          <Plus size={16} />
          新建树
        </button>
        <button className="ghost icon-button" type="button" onClick={() => activeDocument && downloadTree(activeDocument)}>
          <Download size={16} />
        </button>
        <button className="ghost icon-button" type="button" onClick={() => fileInputRef.current?.click()}>
          <FileUp size={16} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(event) => void handleImport(event.target.files?.[0])}
        />
      </div>

      <nav className="tree-list" aria-label="知识树列表">
        {documents.map((document) => (
          <button
            key={document.tree.id}
            className={`tree-list-item ${document.tree.id === activeTreeId ? "active" : ""}`}
            type="button"
            onClick={() => selectTree(document.tree.id)}
            onContextMenu={(event) => {
              event.preventDefault();
              setMenu({ treeId: document.tree.id, x: event.clientX, y: event.clientY });
            }}
          >
            <span>{document.tree.title}</span>
            <span>{document.nodes.length}</span>
            <MoreHorizontal size={15} />
          </button>
        ))}
      </nav>

      {menu && (
        <div className="context-menu" style={{ left: menu.x, top: menu.y }} onMouseLeave={() => setMenu(null)}>
          <button
            type="button"
            onClick={() => {
              void duplicateTree(menu.treeId);
              setMenu(null);
            }}
          >
            <Copy size={15} />
            复制树
          </button>
          <button
            type="button"
            onClick={() => {
              const current = documents.find((document) => document.tree.id === menu.treeId);
              const title = window.prompt("重命名知识树", current?.tree.title ?? "");
              if (title?.trim()) void renameTree(menu.treeId, title.trim());
              setMenu(null);
            }}
          >
            重命名
          </button>
          <button
            className="danger"
            type="button"
            disabled={documents.length <= 1}
            onClick={() => {
              const current = documents.find((document) => document.tree.id === menu.treeId);
              if (current && window.confirm(`删除“${current.tree.title}”？`)) void deleteTree(menu.treeId);
              setMenu(null);
            }}
          >
            <Trash2 size={15} />
            删除
          </button>
        </div>
      )}
    </aside>
  );
}
