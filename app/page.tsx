"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Papa from "papaparse";
import { 
  Trash2, Users, Trophy, Play, RefreshCw, X, 
  FileSpreadsheet, Maximize2, Minimize2, Volume2, VolumeX 
} from "lucide-react";

type Winner = {
  id: string;
  name: string;
  timestamp: Date;
};

type CsvRow = Record<string, string>;

export default function SpinWheelApp() {
  const [inputNames, setInputNames] = useState<string>("");
  const [names, setNames] = useState<string[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerCount, setWinnerCount] = useState(1);
  const [currentSpinName, setCurrentSpinName] = useState("READY");
  
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tickAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load Audio saat komponen di-mount
  useEffect(() => {
    tickAudioRef.current = new Audio("/sounds/win1.mp3");
    winAudioRef.current = new Audio("/sounds/win2.mp3");
    
    tickAudioRef.current.load();
    winAudioRef.current.load();
  }, []);

  // Parse Input
  useEffect(() => {
    const cleanNames = inputNames
      .split(/\n/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    setNames(cleanNames);
  }, [inputNames]);

  // Handle CSV Upload
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as CsvRow[];
        const formattedNames = rows.map((row) => {
          const keys = Object.keys(row);
          const getValue = (keyword: string) => {
             const key = keys.find(k => k.toLowerCase().includes(keyword));
             return key ? row[key] : "";
          };
          const id = getValue('inv') || getValue('id') || Object.values(row)[0] || "NoID";
          const name = getValue('pelanggan') || getValue('nama') || getValue('name') || Object.values(row)[1] || "NoName";
          const instansi = getValue('instansi') || getValue('kampus') || getValue('univ') || Object.values(row)[2] || "-";
          return `${id}-${name}-${instansi}`;
        });
        setInputNames(formattedNames.join("\n"));
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      error: (error) => {
        alert("Gagal membaca file CSV: " + error.message);
      }
    });
  };

  // Helper: Play Sound
  const playSound = (type: 'tick' | 'win') => {
    if (isMuted) return;
    
    if (type === 'tick' && tickAudioRef.current) {
      tickAudioRef.current.currentTime = 0; 
      tickAudioRef.current.play().catch(() => {});
    }
    
    if (type === 'win' && winAudioRef.current) {
      winAudioRef.current.currentTime = 0;
      winAudioRef.current.play().catch(() => {});
    }
  };

  const handleSpin = async () => {
    if (names.length === 0 || isSpinning) return;
    if (names.length < winnerCount) {
      alert(`Hanya tersisa ${names.length} nama!`);
      return;
    }

    setIsSpinning(true);
    const duration = 3000; 
    const intervalTime = 50;
    let tempNamesForPicking = [...names]; 
    const currentBatchWinners: Winner[] = [];

    for (let i = 0; i < winnerCount; i++) {
        const endTime = Date.now() + duration;
        
        await new Promise<void>((resolve) => {
            const interval = setInterval(() => {
                const randomVisualIdx = Math.floor(Math.random() * tempNamesForPicking.length);
                setCurrentSpinName(tempNamesForPicking[randomVisualIdx]);
                
                // MAIN SOUND: Tick setiap kali nama berubah
                playSound('tick');

                if (Date.now() > endTime) {
                    clearInterval(interval);
                    resolve();
                }
            }, intervalTime);
        });

        const randomBuffer = new Uint32Array(1);
        window.crypto.getRandomValues(randomBuffer);
        const winnerIndex = randomBuffer[0] % tempNamesForPicking.length;
        const winningName = tempNamesForPicking[winnerIndex];
        
        playSound('win');

        currentBatchWinners.push({
            id: Math.random().toString(36).substr(2, 9),
            name: winningName,
            timestamp: new Date()
        });
        tempNamesForPicking.splice(winnerIndex, 1);
        
        if (winnerCount > 1) await new Promise(r => setTimeout(r, 1000));
    }

    setCurrentSpinName(currentBatchWinners[currentBatchWinners.length - 1].name);
    setWinners(prev => [...prev, ...currentBatchWinners]); 
    
    const newWinnerNames = new Set(currentBatchWinners.map(w => w.name));
    const remainingNames = names.filter(n => !newWinnerNames.has(n));
    setNames(remainingNames);
    setInputNames(remainingNames.join('\n')); 
    setIsSpinning(false);
    triggerConfetti();
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#a855f7', '#ec4899']
    });
  };

  const removeWinner = (id: string) => {
    setWinners(winners.filter(w => w.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white transition-all duration-500">
      
      <main className={`mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8 min-h-screen transition-all duration-500 ${isFullScreen ? 'max-w-full px-12' : 'max-w-7xl'}`}>
        
        {/* --- LEFT PANEL --- */}
        <div className={`flex flex-col gap-4 order-2 md:order-1 transition-all duration-500 ease-in-out ${isFullScreen ? 'w-0 opacity-0 overflow-hidden hidden' : 'w-full md:w-1/3 opacity-100'}`}>
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col h-[85vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
                <Users size={20} /> Data Peserta
              </h2>
              <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Total:</span>
                  <span className="text-sm bg-indigo-600 px-3 py-1 rounded-full text-white font-bold">
                    {names.length}
                  </span>
              </div>
            </div>

            <div className="mb-4">
                <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} hidden />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 border-2 border-dashed border-slate-600 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:border-indigo-500 hover:bg-slate-700/50 transition-all group"
                >
                    <FileSpreadsheet className="group-hover:text-green-400 transition-colors" />
                    <span>Upload CSV</span>
                </button>
            </div>
            
            <textarea
              value={inputNames}
              onChange={(e) => setInputNames(e.target.value)}
              placeholder="Data..."
              className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-xs md:text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none transition-all placeholder:text-slate-600 whitespace-pre"
              spellCheck={false}
            />
            
             <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => setInputNames('')} className="text-slate-400 hover:text-red-400 text-sm flex items-center gap-1 transition-colors px-2 py-1">
                <Trash2 size={14} /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* --- RIGHT PANEL --- */}
        <div className={`flex flex-col items-center justify-center order-1 md:order-2 gap-8 relative transition-all duration-500 ${isFullScreen ? 'w-full' : 'w-full md:w-2/3'}`}>
          
          {/* HEADER CONTROLS (Fullscreen & Mute) */}
          <div className="absolute top-0 right-0 flex gap-2 z-50">
            {/* Tombol Mute */}
            <button 
                onClick={() => setIsMuted(!isMuted)}
                className="p-3 bg-slate-800 hover:bg-indigo-600 rounded-full text-slate-300 hover:text-white transition-all shadow-lg border border-slate-700"
                title={isMuted ? "Unmute Sound" : "Mute Sound"}
            >
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>

            {/* Tombol Fullscreen */}
            <button 
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-3 bg-slate-800 hover:bg-indigo-600 rounded-full text-slate-300 hover:text-white transition-all shadow-lg border border-slate-700 group"
            >
                {isFullScreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
            </button>
          </div>

          <div className="text-center space-y-2 mt-12 md:mt-0">
            <h1 className={`font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 transition-all ${isFullScreen ? 'text-6xl md:text-8xl' : 'text-4xl md:text-6xl'}`}>
              SUPER SPIN
            </h1>
            <p className="text-slate-400">Who's the Lucky One?</p>
          </div>

          {/* THE ROLLER */}
          <div className={`relative w-full aspect-video flex flex-col items-center justify-center transition-all ${isFullScreen ? 'max-w-4xl' : 'max-w-lg'}`}>
            <div className={`absolute inset-0 rounded-3xl border-2 border-indigo-500/30 blur-xl transition-all duration-500 ${isSpinning ? 'scale-110 opacity-100' : 'opacity-50'}`}></div>
            
            <div className="relative z-10 w-full h-full min-h-[12rem] bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-600 shadow-2xl overflow-hidden flex items-center justify-center">
               <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 z-20"></div>
               
               <AnimatePresence mode="wait">
                 <motion.div
                   key={currentSpinName} 
                   initial={{ y: 50, opacity: 0, filter: "blur(10px)" }}
                   animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                   exit={{ y: -50, opacity: 0, filter: "blur(10px)" }}
                   transition={{ duration: 0.08 }}
                   className={`font-bold text-white text-center px-8 break-words leading-tight ${isFullScreen ? 'text-4xl md:text-6xl' : 'text-2xl md:text-4xl'}`}
                 >
                   {currentSpinName}
                 </motion.div>
               </AnimatePresence>
               
               <div className="absolute top-0 w-full h-16 bg-gradient-to-b from-slate-900 to-transparent z-10 pointer-events-none"></div>
               <div className="absolute bottom-0 w-full h-16 bg-gradient-to-t from-slate-900 to-transparent z-10 pointer-events-none"></div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-6 w-full max-w-md">
            <div className="flex items-center gap-4 bg-slate-800 p-2 rounded-xl border border-slate-700">
                <span className="text-sm text-slate-400 pl-2">Jml Pemenang:</span>
                <div className="flex items-center gap-2">
                    <button onClick={() => setWinnerCount(Math.max(1, winnerCount - 1))} className="btn-counter">-</button>
                    <input type="number" min="1" value={winnerCount} onChange={(e) => setWinnerCount(Number(e.target.value))} className="w-12 text-center bg-transparent font-bold focus:outline-none" />
                    <button onClick={() => setWinnerCount(winnerCount + 1)} className="btn-counter">+</button>
                </div>
            </div>

            <button
              onClick={handleSpin}
              disabled={isSpinning || names.length === 0}
              className={`
                group relative px-8 py-4 rounded-full font-bold text-lg tracking-wider transition-all w-full
                ${isSpinning || names.length === 0 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-lg hover:scale-105 active:scale-95'}
              `}
            >
              <span className="flex items-center justify-center gap-2">
                {isSpinning ? <RefreshCw className="animate-spin" /> : <Play fill="currentColor" />}
                {isSpinning ? 'MENGUNDI...' : 'PUTAR SEKARANG'}
              </span>
            </button>
          </div>

          {/* Results */}
          {winners.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full mt-4">
                <h3 className="text-center text-lg font-bold mb-3 flex items-center justify-center gap-2 text-yellow-400">
                    <Trophy size={18} /> Daftar Pemenang
                </h3>
                <div className={`grid gap-3 max-h-64 overflow-y-auto custom-scrollbar ${isFullScreen ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                    {winners.map((winner, idx) => (
                        <motion.div 
                          key={winner.id} 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="bg-slate-800 border border-indigo-500/30 p-3 rounded-lg flex gap-3 items-center hover:bg-slate-700 transition-colors"
                        >
                            <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                                #{idx + 1}
                            </span>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm md:text-base font-bold text-white truncate">{winner.name.split('-')[1] || winner.name}</span>
                                <span className="text-[10px] md:text-xs text-slate-400 truncate">{winner.name}</span>
                            </div>
                            <button onClick={() => removeWinner(winner.id)} className="ml-auto text-slate-600 hover:text-red-400">
                                <X size={16} />
                            </button>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
          )}
        </div>
      </main>
      
      <style jsx global>{`
        .btn-counter { @apply w-8 h-8 flex items-center justify-center bg-slate-700 rounded hover:bg-slate-600 transition-colors; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
      `}</style>
    </div>
  );
}