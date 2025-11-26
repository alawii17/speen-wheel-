"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Papa from "papaparse";
import { 
  Trash2, Users, Trophy, Play, RefreshCw, X, 
  FileSpreadsheet, Maximize2, Minimize2, Volume2, VolumeX, CheckCircle 
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
  const [allWinners, setAllWinners] = useState<Winner[]>([]);
  
  const [lastBatchWinners, setLastBatchWinners] = useState<Winner[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);

  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerCount, setWinnerCount] = useState(1);
  const [currentSpinName, setCurrentSpinName] = useState("READY");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- SOUND SYSTEM ---
  const playSound = (type: 'tick' | 'win' | 'pop') => {
    if (isMuted) return;
    const audio = new Audio(`/sounds/${type}.mp3`);
    if (type === 'pop') audio.volume = 0.3; 
    else audio.volume = 0.5;
    
    audio.play().catch(() => {});
  };

  // --- PARSING DATA ---
  useEffect(() => {
    const cleanNames = inputNames
      .split(/\n/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    setNames(cleanNames);
  }, [inputNames]);

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

  // --- LOGIKA SPIN BARU (BULK/BATCH) ---
  const handleSpin = async () => {
    if (names.length === 0 || isSpinning) return;
    if (names.length < winnerCount) {
      alert(`Hanya tersisa ${names.length} nama!`);
      return;
    }

    setIsSpinning(true);
    setShowBatchModal(false);
    setLastBatchWinners([]);

    // 1. ANIMASI ROLLING (Visual Only)
    const duration = 3000;
    const endTime = Date.now() + duration;
    
    await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
            // Tampilkan acak
            const randomIdx = Math.floor(Math.random() * names.length);
            setCurrentSpinName(names[randomIdx]);
            
            if (Math.random() > 0.7) playSound('tick');

            if (Date.now() > endTime) {
                clearInterval(interval);
                resolve();
            }
        }, 50);
    });

    // 2. KALKULASI PEMENANG (Matematika Cepat)
    let tempNames = [...names];
    const newWinners: Winner[] = [];
    
    for (let i = 0; i < winnerCount; i++) {
        const randomBuffer = new Uint32Array(1);
        window.crypto.getRandomValues(randomBuffer);
        const winIdx = randomBuffer[0] % tempNames.length;
        
        newWinners.push({
            id: Math.random().toString(36).substr(2, 9),
            name: tempNames[winIdx],
            timestamp: new Date()
        });
        
        tempNames.splice(winIdx, 1);
    }

    // 3. UPDATE STATE UTAMA
    playSound('win');
    setCurrentSpinName(`Ready!`);
    setAllWinners(prev => [...prev, ...newWinners]);
    setLastBatchWinners(newWinners);
    
    // Update List Input (Hapus pemenang)
    const newWinnerNamesSet = new Set(newWinners.map(w => w.name));
    const remainingNames = names.filter(n => !newWinnerNamesSet.has(n));
    setNames(remainingNames);
    setInputNames(remainingNames.join('\n'));

    // 4. TRIGGER MODAL & SELESAI
    setIsSpinning(false);
    setShowBatchModal(true);
    triggerConfetti();
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#a855f7', '#ec4899', '#fbbf24']
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white transition-all duration-500 overflow-hidden">
      
      {/* MAIN CONTAINER */}
      <main className={`mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8 min-h-screen transition-all duration-500 ${isFullScreen ? 'max-w-full px-12' : 'max-w-7xl'}`}>
        
        {/* --- LEFT PANEL: INPUT --- */}
        <div className={`flex flex-col gap-4 order-2 md:order-1 transition-all duration-500 ease-in-out ${isFullScreen ? 'w-0 opacity-0 overflow-hidden hidden' : 'w-full md:w-1/3 opacity-100'}`}>
           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col h-[85vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
                <Users size={20} /> Data Peserta
              </h2>
              <span className="text-sm bg-indigo-600 px-3 py-1 rounded-full text-white font-bold">{names.length}</span>
            </div>
            
            <div className="mb-4">
                <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} hidden />
                <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 border-2 border-dashed border-slate-600 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:border-indigo-500 transition-all">
                    <FileSpreadsheet /> <span>Upload CSV</span>
                </button>
            </div>

            <textarea
              value={inputNames}
              onChange={(e) => setInputNames(e.target.value)}
              className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-xs font-mono focus:ring-2 focus:ring-indigo-500 resize-none whitespace-pre"
              spellCheck={false}
              placeholder="Data..."
            />
            <button onClick={() => setInputNames('')} className="mt-4 text-slate-400 hover:text-red-400 text-sm flex items-center gap-1 self-end"><Trash2 size={14} /> Reset</button>
          </div>
        </div>

        {/* --- RIGHT PANEL: SPINNER --- */}
        <div className={`flex flex-col items-center justify-center order-1 md:order-2 gap-8 relative transition-all duration-500 ${isFullScreen ? 'w-full' : 'w-full md:w-2/3'}`}>
          
          {/* Header Buttons */}
          <div className="absolute top-0 right-0 flex gap-2 z-40">
            <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-slate-800 hover:bg-indigo-600 rounded-full text-slate-300 hover:text-white shadow-lg border border-slate-700">
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
            <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-3 bg-slate-800 hover:bg-indigo-600 rounded-full text-slate-300 hover:text-white shadow-lg border border-slate-700">
                {isFullScreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
            </button>
          </div>

          <div className="text-center space-y-2 mt-12 md:mt-0">
            <h1 className={`font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 transition-all ${isFullScreen ? 'text-6xl md:text-8xl' : 'text-4xl md:text-6xl'}`}>
              SPINNER
            </h1>
            <p className="text-slate-400">Who's the Lucky?</p>
          </div>

          {/* THE ROLLER (Visual Only) */}
          <div className={`relative w-full aspect-video flex flex-col items-center justify-center transition-all ${isFullScreen ? 'max-w-4xl' : 'max-w-lg'}`}>
            <div className={`absolute inset-0 rounded-3xl border-2 border-indigo-500/30 blur-xl transition-all duration-500 ${isSpinning ? 'scale-110 opacity-100' : 'opacity-50'}`}></div>
            <div className="relative z-10 w-full h-full min-h-[12rem] bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-600 shadow-2xl overflow-hidden flex items-center justify-center">
               <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 z-20"></div>
               <motion.div
                   key={currentSpinName} 
                   initial={{ y: 50, opacity: 0, filter: "blur(10px)" }}
                   animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                   className={`font-bold text-white text-center px-8 leading-tight ${isFullScreen ? 'text-5xl' : 'text-3xl'}`}
               >
                   {currentSpinName}
               </motion.div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-6 w-full max-w-md">
            <div className="flex items-center gap-4 bg-slate-800 p-2 rounded-xl border border-slate-700">
                <span className="text-sm text-slate-400 pl-2">Ambil Pemenang:</span>
                <div className="flex items-center gap-2">
                    <button onClick={() => setWinnerCount(Math.max(1, winnerCount - 1))} className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded hover:bg-slate-600">-</button>
                    <input type="number" min="1" value={winnerCount} onChange={(e) => setWinnerCount(Number(e.target.value))} className="w-12 text-center bg-transparent font-bold focus:outline-none" />
                    <button onClick={() => setWinnerCount(winnerCount + 1)} className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded hover:bg-slate-600">+</button>
                </div>
            </div>

            <button
              onClick={handleSpin}
              disabled={isSpinning || names.length === 0}
              className={`
                group relative px-8 py-4 rounded-full font-bold text-lg tracking-wider transition-all w-full
                ${isSpinning || names.length === 0 ? 'bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-lg hover:scale-105 active:scale-95'}
              `}
            >
              <span className="flex items-center justify-center gap-2">
                {isSpinning ? <RefreshCw className="animate-spin" /> : <Play fill="currentColor" />}
                {isSpinning ? 'SPINNING...' : `SPIN NOW`}
              </span>
            </button>
          </div>

        </div>
      </main>

      {/* --- MODAL OVERLAY KHUSUS BATCH REVEAL --- 
          Ini UI rahasia agar terlihat mewah saat pemenang > 1 
      */}
      <AnimatePresence>
        {showBatchModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-10"
          >
            <div className="w-full max-w-6xl max-h-full flex flex-col items-center">
                
                {/* Title */}
                <motion.div 
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="mb-8 text-center"
                >
                  <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 mb-2">
                    SELAMAT KEPADA
                  </h2>
                  <p className="text-white text-xl">{lastBatchWinners.length} Pemenang Terpilih</p>
                </motion.div>

                {/* Grid Cards Container with Stagger Effect */}
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full overflow-y-auto custom-scrollbar p-2"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.15 // Delay antar kartu muncul (efek bup-bup-bup)
                      }
                    }
                  }}
                  initial="hidden"
                  animate="show"
                >
                  {lastBatchWinners.map((winner, idx) => (
                    <motion.div
                      key={winner.id}
                      variants={{
                        hidden: { scale: 0, opacity: 0 },
                        show: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 200 } }
                      }}
                      onViewportEnter={() => playSound('pop')}
                      // PERBAIKAN: Ubah padding (p-6 jadi p-5 pb-8) untuk memberi ruang lebih di bawah
                      className="bg-gradient-to-br from-slate-800 to-slate-900 border border-indigo-500/50 p-5 pb-8 rounded-xl relative overflow-hidden group hover:border-yellow-400 transition-colors shadow-2xl flex flex-col justify-between min-h-[160px]"
                    >
                      {/* Dekorasi Glowing */}
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                        <Trophy size={60} />
                      </div>

                      <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold shadow-inner border border-indigo-400 z-10">
                        {idx + 1}
                      </div>

                      {/* Konten Kartu */}
                      <div className="text-center flex-grow flex flex-col justify-center mt-2 z-10 relative">
                        <div className="text-xl md:text-2xl font-bold text-white break-words leading-tight mb-2 px-1">
                          {winner.name.split('-')[1] || winner.name}
                        </div>
                        
                        {/* ID Badge */}
                        <div className="mb-2">
                            <span className="text-xs text-indigo-200 font-mono bg-indigo-900/70 px-3 py-1.5 rounded-full inline-block border border-indigo-500/30">
                            {winner.name.split('-')[0] !== winner.name ? winner.name.split('-')[0] : 'ID: -'}
                            </span>
                        </div>

                        {/* Instansi */}
                        <div className="text-xs text-slate-400 truncate px-2">
                           {winner.name.split('-')[2] || ''}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Close Button */}
                <motion.button
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
                  onClick={() => setShowBatchModal(false)}
                  className="mt-8 bg-white text-indigo-900 hover:bg-indigo-50 px-8 py-3 rounded-full font-bold text-lg flex items-center gap-2 shadow-xl hover:scale-105 transition-transform"
                >
                  <CheckCircle /> Selesai & Lanjut
                </motion.button>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
      `}</style>
    </div>
  );
}