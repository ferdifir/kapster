"use client";

import { useState, useRef, useEffect } from "react";

export default function AdminTerminalPage() {
  const [commands, setCommands] = useState<{ input: string; output: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cwd, setCwd] = useState("~");
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    outputRef.current?.scrollTo(0, outputRef.current.scrollHeight);
  }, [commands]);

  const execute = async (cmd: string) => {
    if (!cmd.trim()) return;
    setLoading(true);
    setCommands((prev) => [...prev, { input: cmd, output: "" }]);
    try {
      const res = await fetch("/admin/api/terminal/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });
      const json = await res.json();
      setCommands((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { input: cmd, output: json.output || json.error || "" };
        return updated;
      });
    } catch (err) {
      setCommands((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { input: cmd, output: String(err) };
        return updated;
      });
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      execute(input);
      setInput("");
    }
  };

  const clearTerminal = () => setCommands([]);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-white">Terminal</h1>
        <button onClick={clearTerminal} className="px-3 py-1.5 rounded-lg bg-dark-800 text-dark-400 border border-dark-700 text-sm hover:text-white transition-all">Clear</button>
      </div>

      <div className="bg-dark-900 border border-dark-700/50 rounded-2xl overflow-hidden">
        <div className="px-4 py-2 bg-dark-800/50 border-b border-dark-700/30 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
          <span className="text-dark-500 text-xs ml-2 font-mono">admin@kapster:{cwd}</span>
        </div>

        <div ref={outputRef} className="p-4 h-64 sm:h-96 overflow-y-auto font-mono text-sm space-y-2" onClick={() => inputRef.current?.focus()}>
          {commands.length === 0 && (
            <div className="text-dark-500">
              <p className="mb-2">🚀 Kapster Admin Terminal</p>
              <p className="text-xs">Ketik command untuk menjalankan perintah di server.</p>
              <p className="text-xs mt-1">Contoh: <span className="text-barber-400">ls -la</span>, <span className="text-barber-400">df -h</span>, <span className="text-barber-400">pm2 status</span>, <span className="text-barber-400">docker ps</span></p>
            </div>
          )}
          {commands.map((cmd, i) => (
            <div key={i}>
              <div><span className="text-green-400">$ </span><span className="text-white">{cmd.input}</span></div>
              <div className="text-dark-300 whitespace-pre-wrap">{cmd.output}</div>
            </div>
          ))}
          {loading && <div className="text-dark-500 animate-pulse">▍</div>}
        </div>

        <div className="px-4 py-3 border-t border-dark-700/30 flex items-center gap-2">
          <span className="text-green-400 font-mono text-sm">$</span>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} disabled={loading}
            placeholder="Masukkan command..." className="flex-1 bg-transparent text-white font-mono text-sm outline-none placeholder:text-dark-600" autoFocus />
        </div>
      </div>

      <div className="text-dark-500 text-xs">⚠️ Command dijalankan di server. Hati-hati dengan perintah destruktif.</div>
    </div>
  );
}
