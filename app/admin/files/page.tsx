"use client";

import { useState, useEffect } from "react";

interface FileEntry {
  name: string;
  perms: string;
  size: string;
  date: string;
  isDir: boolean;
}

export default function AdminFilesPage() {
  const [currentPath, setCurrentPath] = useState(".");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);
  const [editContent, setEditContent] = useState("");

  const loadFiles = async (path: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/admin/api/files/list?path=${encodeURIComponent(path)}`);
      const json = await res.json();
      if (json.error) { setError(json.error); return; }
      setFiles(json.files);
      setCurrentPath(json.currentPath);
    } catch (err) {
      setError(String(err));
    }
    setLoading(false);
  };

  useEffect(() => { loadFiles("."); }, []);

  const readFile = async (name: string) => {
    const relativePath = `${currentPath === "/" ? "" : currentPath}/${name}`;
    const res = await fetch(`/admin/api/files/read?path=${encodeURIComponent(relativePath)}`);
    const json = await res.json();
    if (json.error) { alert(json.error); return; }
    setSelectedFile({ path: relativePath, content: json.content });
    setEditContent(json.content);
  };

  const saveFile = async () => {
    if (!selectedFile) return;
    const res = await fetch("/admin/api/files/write", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: selectedFile.path, content: editContent }),
    });
    const json = await res.json();
    if (json.success) {
      alert("File tersimpan!");
      setSelectedFile(null);
    } else {
      alert("Error: " + json.error);
    }
  };

  const navigateTo = (name: string) => {
    const newPath = currentPath === "/" ? `/${name}` : `${currentPath}/${name}`;
    loadFiles(newPath);
  };

  const goUp = () => {
    const parent = currentPath.split("/").slice(0, -1).join("/") || ".";
    loadFiles(parent);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-white">File Manager</h1>
      </div>

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-dark-700/30 flex items-center gap-2 text-sm">
          <button onClick={() => loadFiles(".")} className="text-dark-400 hover:text-white">📁 /kapster</button>
          {currentPath.split("/").filter(Boolean).map((part, i, arr) => (
            <span key={i} className="text-dark-600">/<button onClick={() => loadFiles("/" + arr.slice(0, i + 1).join("/"))} className="text-dark-400 hover:text-white ml-1">{part}</button></span>
          ))}
          <button onClick={goUp} className="ml-auto text-dark-400 hover:text-white text-xs px-2 py-1 rounded bg-dark-700/50">▲ Naik</button>
        </div>

        <div className="divide-y divide-dark-700/20">
          {loading ? (
            <div className="p-8 text-center text-dark-500">Loading...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-400">{error}</div>
          ) : (
            files.map((file) => (
              <div key={file.name} className="flex items-center px-4 py-2.5 hover:bg-dark-700/20 transition-colors text-sm">
                <button onClick={() => file.isDir ? navigateTo(file.name) : readFile(file.name)} className="flex items-center gap-3 flex-1 text-left">
                  <span className="text-lg">{file.isDir ? "📁" : "📄"}</span>
                  <span className="text-white">{file.name}</span>
                </button>
                <span className="text-dark-500 w-20 text-right">{file.size}</span>
                <span className="text-dark-500 w-36 text-right">{file.date}</span>
                <span className="text-dark-600 w-24 text-right font-mono text-xs">{file.perms}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedFile && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-dark-700/50 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-dark-700/30 flex items-center justify-between">
              <h3 className="text-white font-medium truncate">{selectedFile.path}</h3>
              <button onClick={() => setSelectedFile(null)} className="text-dark-400 hover:text-white">✕</button>
            </div>
            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 p-4 bg-dark-950 text-white font-mono text-sm outline-none resize-none" spellCheck={false} />
            <div className="px-6 py-4 border-t border-dark-700/30 flex justify-end gap-3">
              <button onClick={() => setSelectedFile(null)} className="px-4 py-2 rounded-xl bg-dark-800 text-dark-300 border border-dark-700 text-sm hover:text-white">Cancel</button>
              <button onClick={saveFile} className="px-4 py-2 rounded-xl bg-barber-400/10 text-barber-400 border border-barber-400/20 text-sm hover:bg-barber-400/20">💾 Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
