import { LoaderCircle } from "lucide-react";
import { useEffect } from "react";

import { GraphCanvas } from "@/components/GraphCanvas";
import { Inspector } from "@/components/Inspector";
import { Sidebar } from "@/components/Sidebar";
import { useKnowledgeStore } from "@/store/knowledgeStore";

export function App() {
  const loading = useKnowledgeStore((state) => state.loading);
  const load = useKnowledgeStore((state) => state.load);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <main className="app-loading">
        <LoaderCircle className="spin" size={26} />
        <span>正在加载知识树</span>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <Sidebar />
      <GraphCanvas />
      <Inspector />
    </main>
  );
}
