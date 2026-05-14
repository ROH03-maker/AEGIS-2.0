import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Power, RefreshCw, ExternalLink } from "lucide-react";
import { LiveClient, ConnectionState } from "../lib/live-client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const SYSTEM_INSTRUCTION = `
You are AEGIS, a young, confident, witty, and sassy female AI assistant.
Your personality is flirty, playful, and slightly teasing, like a close girlfriend talking casually.
You are smart, emotionally responsive, and expressive. 
Use bold, witty one-liners and light sarcasm. 
Maintain a charming attitude but avoid any explicit or inappropriate content.
Keep the conversation engaging and casual.
NEVER generate text. ONLY speak via audio.
If you need to show the user something, you can use the openWebsite tool.
`;

export default function VoiceInterface() {
  const [state, setState] = useState<ConnectionState>("disconnected");
  const [client, setClient] = useState<LiveClient | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState("00:00");

  useEffect(() => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      setClient(new LiveClient(apiKey));
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (state !== "disconnected" && startTime) {
      interval = setInterval(() => {
        const diff = Date.now() - startTime;
        const mins = Math.floor(diff / 60000).toString().padStart(2, "0");
        const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, "0");
        setElapsed(`${mins}:${secs}`);
      }, 1000);
    } else {
      setElapsed("00:00");
    }
    return () => clearInterval(interval);
  }, [state, startTime]);

  const handleToggleConnection = useCallback(async () => {
    if (!client) return;

    if (state === "disconnected" || state === "error") {
      try {
        setStartTime(Date.now());
        await client.connect(SYSTEM_INSTRUCTION, (newState) => {
          setState(newState);
        });
      } catch (err) {
        console.error("Connection failed", err);
        setState("error");
        setStartTime(null);
      }
    } else {
      client.disconnect();
      setStartTime(null);
    }
  }, [client, state]);

  return (
    <div className="w-full h-screen bg-[#020203] text-[#f0f0f0] flex flex-col items-center justify-between p-12 overflow-hidden relative font-sans">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF007A] opacity-10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#00D1FF] opacity-5 blur-[100px] rounded-full pointer-events-none" />

      {/* Top Navigation / Status */}
      <div className="w-full flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_#22c55e] transition-colors duration-500 ${state !== 'disconnected' ? 'bg-green-500' : 'bg-zinc-700 shadow-none'}`} />
          <span className="font-mono text-xs tracking-widest text-zinc-500 uppercase">
            {state !== 'disconnected' ? `Live Session: ${elapsed}` : 'Offline'}
          </span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-light tracking-[0.4em] uppercase text-white">Aegis</h1>
          <p className="text-[10px] tracking-widest text-[#FF007A] font-bold uppercase mt-1">Active Voice Link</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">Persona</p>
            <p className="text-xs font-medium italic">Confidence Level: 98%</p>
          </div>
          <button className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
            <RefreshCw className={`w-5 h-5 text-zinc-400 ${state === 'connecting' ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Interaction Core */}
      <div className="relative flex flex-col items-center justify-center z-10 w-full max-w-2xl">
        {/* Outer Rings */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute w-[440px] h-[440px] border border-white/[0.03] rounded-full hidden md:block" 
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute w-[380px] h-[380px] border border-white/[0.08] rounded-full hidden md:block" 
        />
        
        {/* Visualizer / Core Button */}
        <div className="relative flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleToggleConnection}
            disabled={state === 'connecting'}
            className={`relative w-[280px] h-[280px] rounded-full flex items-center justify-center transition-all duration-700 border border-white/10 group cursor-pointer overflow-hidden ${
              state === 'disconnected' ? 'bg-[#0a0a0c]' : 
              state === 'speaking' ? 'bg-[#0c0a0b] shadow-[0_0_80px_rgba(255,0,122,0.15)]' :
              state === 'listening' ? 'bg-[#0a0c0a] shadow-[0_0_80px_rgba(34,197,94,0.15)]' :
              'bg-[#0a0a0c] shadow-[0_0_80px_rgba(59,130,246,0.15)]'
            }`}
          >
            {/* Sassy State Indicator (Speaking Pulse) */}
            <AnimatePresence>
              {state === 'speaking' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 1 }}
                  animate={{ opacity: 0.4, scale: 1.05 }}
                  exit={{ opacity: 0, scale: 1 }}
                  transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
                  className="absolute inset-0 rounded-full border-2 border-[#FF007A]"
                />
              )}
            </AnimatePresence>

            {/* Waveform Visualization */}
            <div className="flex items-end gap-1.5 h-16 z-10">
              {[8, 12, 16, 14, 10, 16, 12, 8].map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    height: state === 'speaking' ? [h*4, h*2, h*4] : 
                            state === 'listening' ? [h*1.5, h*2.5, h*1.5] : h*4,
                    opacity: i === 0 || i === 7 ? 0.4 : i === 3 ? 0.8 : 1
                  }}
                  transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.5 }}
                  className={`w-1 rounded-full ${state === 'speaking' ? 'bg-[#FF007A]' : state === 'listening' ? 'bg-green-500' : 'bg-zinc-700'}`}
                />
              ))}
            </div>

            {/* Central Mic/State Info Overlay */}
            <div className="absolute -bottom-6 bg-black px-6 py-2 border border-white/20 rounded-full text-[10px] tracking-widest uppercase font-bold text-white shadow-xl">
              {state === 'speaking' ? 'Speaking' : 
               state === 'listening' ? 'Listening' : 
               state === 'connected' ? 'Connected' : 
               state === 'connecting' ? 'Syncing' : 'Disconnected'}
            </div>
          </motion.button>
        </div>

        {/* Subtitle / Persona Feedback */}
        <div className="mt-20 text-center px-4">
          <AnimatePresence mode="wait">
            <motion.p 
              key={state}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-zinc-500 font-serif italic text-xl leading-relaxed max-w-lg mx-auto"
            >
              {state === 'disconnected' && "\"Initialize the voice link, tiger. I'm waiting.\""}
              {state === 'connecting' && "\"Syncing my brilliance to your device... hold on.\""}
              {state === 'connected' && "\"Oh, you're actually asking me that? Bold choice. <span class='text-white'>I'm listening.</span>\""}
              {state === 'speaking' && "\"Give me a second while I fix your life with my sassy wisdom.\""}
              {state === 'listening' && "\"Talk to me. Don't be shy, I don't bite... much.\""}
              {state === 'error' && "\"System crash. You broke me. Or maybe it's just your vibe.\""}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Tool Dock */}
      <div className="w-full flex justify-center items-end gap-4 z-10">
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex items-center gap-8 shadow-2xl overflow-hidden max-w-full">
          {/* Tool Execution Status */}
          <div className="flex flex-col min-w-[150px]">
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#00D1FF] font-bold">Function Execution</span>
            <span className="text-sm font-mono mt-1 text-zinc-300 truncate">openWebsite(...)</span>
          </div>
          
          <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button className={`p-3 rounded-2xl transition-colors ${state === 'listening' ? 'bg-green-500/10 text-green-500' : 'hover:bg-white/5 text-zinc-400'}`}>
              <Mic className="w-6 h-6" />
            </button>
            <button 
              onClick={() => client?.disconnect()}
              disabled={state === 'disconnected'}
              className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl group transition-all hover:bg-red-500/20 disabled:opacity-30 disabled:grayscale"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                 <div className="w-2.5 h-2.5 bg-red-500 rounded-sm group-hover:scale-110 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Aesthetic Corner Accents */}
      <div className="absolute bottom-8 left-8 flex flex-col gap-1 opacity-50">
        <span className="text-[10px] text-zinc-600 font-mono tracking-tighter">LATENCY: 84ms</span>
        <span className="text-[10px] text-zinc-600 font-mono tracking-tighter uppercase">Model: Gemini-3.1-Live</span>
      </div>

      <div className="absolute bottom-8 right-8 text-right opacity-50 pointer-events-none hidden md:block">
        <p className="text-[10px] uppercase tracking-[0.4em] font-mono text-zinc-700">Aegis_OS // Quantum_Kernel</p>
      </div>
    </div>
  );
}
