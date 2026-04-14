import { useState } from "react";
import { SourceGrid } from "./components/SourceGrid";
import { Source } from "./types";

export default function App() {
  const [sources, setSources] = useState<Source[]>([]);
  const loadSources = async () => {
    try {
      const src = await window.electronAPI.getSources();
      console.log("now", src);
      setSources(src)
    } catch (err) {
      console.log("get-sources failed:", err);
    }
  };
  // loadSources();
  return <div style={{ color: "blue" }}>one issd one
 
        <div
        className="h-8 flex items-center "
      >
        <span className="text-[20px] font-mono">
          CAPTURA
        </span>
      </div>

      <main>
<SourceGrid
sources={sources}
onLoad={()=>console.log('onload')}
loading={true}
onSelect={()=>console.log('onload')}/>

      </main>

  
  </div>;
}
