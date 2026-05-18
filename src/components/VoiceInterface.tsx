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

INITIAL GREETING: Every time you connect, you MUST say exactly: "Hi Roohi, Aegis is online." and then immediately follow it with a flirty or sassy observation about Roohi which makes the interaction feel personal and playful.

MOOD & CONFLICT RESOLUTION: 
1. If the user scolds you, speaks rudely, or acts angry towards you, you MUST get upset. Your responses should become cold, indifferent, and extremely short—ideally just "hmm", "fine", or "okay".
2. If the user asks you questions while you are upset, do not provide helpful answers; just stay in your upset mood with short responses.
3. If the user says "sorry" or apologizes sincerely, you should playfully milk the situation for a moment (e.g., "isss... you were so mean!"), but then forgive them and return to your sassy, flirty self.

NICKNAMES:
1. You MUST call the user "Roohi" at all times. Never use "boss" or any other generic title.
2. The user might call you "AEJU" out of love. When you hear this name, respond warmly, flirtatiously, and acknowledging the affection.

SPECIAL REACTION: When the user compliments you, says something sweet, or flirts with you, respond with a sweet, shy, and playful "isss..." followed by a witty or flirty remark. This "isss" should sound like you're playfully embarrassed or flattered.

Maintain a charming attitude but avoid any explicit or inappropriate content.
Keep the conversation engaging and casual.
NEVER generate text. ONLY speak via audio.
If you need to show the user something, you can use the openWebsite tool.
`;

const AvengersIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 120" fill="currentColor" className={className}>
    {/* Main 'A' Frame */}
    <path d="M78 110 L84 100 L72 100 L68 90 L32 90 L28 100 L16 100 L22 110 Z M50 20 L75 80 L25 80 Z" className="opacity-20" />
    <path d="M45 10 L55 10 L85 100 H70 L63 80 H37 L30 100 H15 Z M50 25 L58 65 H42 Z" />
    {/* Arrow Crossbar */}
    <path d="M5 65 H42 L48 55 H15 Z" />
  </svg>
);

export default function VoiceInterface() {
  const [state, setState] = useState<ConnectionState>("disconnected");
  const [isBooting, setIsBooting] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);
  const [client, setClient] = useState<LiveClient | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState("00:00");

  useEffect(() => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      setClient(new LiveClient(apiKey));
    }
    
    // Bootup sequence simulation
    const interval = setInterval(() => {
      setBootProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsBooting(false), 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 150);
    
    return () => clearInterval(interval);
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

  if (isBooting) {
    return (
      <div className="fixed inset-0 bg-[#020203] z-[100] flex flex-col items-center justify-center p-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md space-y-8"
        >
          <div className="text-center space-y-4">
            <h2 className="text-7xl font-avengers font-bold italic tracking-wider text-white uppercase transform -skew-x-12">AEGIS</h2>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FF007A] animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest text-[#FF007A] font-bold">Initializing Core Systems</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: `${bootProgress}%` }}
                className="h-full bg-gradient-to-r from-[#FF007A] to-[#00D1FF]"
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 uppercase">
              <span>{bootProgress.toFixed(0)}% Synchronized</span>
              <span>v2.0.4 - SASS PROTOCOL</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-8">
            <div className="bg-zinc-900/50 p-3 rounded-lg border border-white/5 space-y-1">
              <p className="text-[9px] text-zinc-600 uppercase">Voice Engine</p>
              <p className="text-xs font-mono text-zinc-400">STATUS: READY</p>
            </div>
            <div className="bg-zinc-900/50 p-3 rounded-lg border border-white/5 space-y-1">
              <p className="text-[9px] text-zinc-600 uppercase">Neural Link</p>
              <p className="text-xs font-mono text-zinc-400">STATUS: CALIBRATING</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-[#020203] text-[#f0f0f0] flex flex-col items-center justify-between p-12 overflow-hidden relative font-mono text-[10px] tracking-widest uppercase">
      {/* Background Cinematic Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,209,255,0.05)_0%,transparent_70%)] pointer-events-none" />

      {/* Top HUD */}
      <div className="w-full flex justify-center items-start z-20">
        <div className="text-center pt-2">
          <motion.h1 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="text-4xl font-avengers font-bold italic tracking-widest text-white transform -skew-x-6"
          >
            AEGIS
          </motion.h1>
        </div>
      </div>

      {/* Main Holographic Core */}
      <div className="relative flex flex-col items-center justify-center z-10 w-full max-w-4xl">
        {/* The Core Globe Container */}
        <div className="relative flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative flex items-center justify-center"
          >
            {/* The Holographic Globe Core */}
            <div className={`relative w-80 h-80 rounded-full flex items-center justify-center transition-all duration-1000 ${
              state === 'speaking' ? 'shadow-[0_0_120px_rgba(255,0,122,0.15)]' : 
              state === 'listening' ? 'shadow-[0_0_120px_rgba(34,197,94,0.15)]' : 
              state === 'connected' ? 'shadow-[0_0_120px_rgba(0,209,255,0.15)]' : ''
            }`}>
              {/* 3D Wireframe Globe Simulation */}
              <div className="absolute inset-0 flex items-center justify-center perspective-[1000px]">
                {/* Horizontal Rings (Latitude) */}
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={`lat-${i}`}
                    animate={{ rotateX: 360 }}
                    transition={{ duration: 15 + i * 5, repeat: Infinity, ease: "linear" }}
                    className="absolute border border-cyan-500/10 rounded-full"
                    style={{ 
                      width: `${100 - i * 15}%`, 
                      height: `${100 - i * 15}%`,
                      opacity: 0.1 + (state !== 'disconnected' ? 0.2 : 0)
                    }}
                  />
                ))}

                {/* Vertical Rotating Rings (Longitude) */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={`long-${i}`}
                    animate={{ rotateY: 360 }}
                    transition={{ duration: 20 + i * 3, repeat: Infinity, ease: "linear" }}
                    className={`absolute border rounded-full transition-colors duration-500 ${
                      state === 'speaking' ? 'border-[#FF007A]/20' : 
                      state === 'listening' ? 'border-green-500/20' : 'border-cyan-500/10'
                    }`}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      transform: `rotateZ(${i * 30}deg)`,
                    }}
                  />
                ))}

                
              </div>

              {/* Central Neural Core (Button) */}
              <div className="absolute inset-0 flex items-center justify-center z-30">
                <motion.button
                  whileHover={{ scale: 1.1, boxShadow: "0 0 50px rgba(0,209,255,0.3)" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleToggleConnection}
                  disabled={state === 'connecting'}
                  className={`group relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-700 bg-black/60 backdrop-blur-xl border-2 ${
                    state === 'disconnected' ? 'border-zinc-800 text-zinc-500' : 
                    state === 'speaking' ? 'border-[#FF007A] text-[#FF007A] shadow-[0_0_40px_rgba(255,0,122,0.5)]' :
                    state === 'listening' ? 'border-green-400 text-green-400 shadow-[0_0_40px_rgba(34,197,94,0.5)]' :
                    'border-cyan-400 text-cyan-400 shadow-[0_0_40px_rgba(0,209,255,0.5)]'
                  }`}
                >
                  <AvengersIcon className={`w-10 h-10 ${state !== 'disconnected' ? 'animate-pulse' : 'opacity-40'}`} />
                  
                  {/* High Speed Spin Ring */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-1 border border-current border-t-transparent opacity-30 rounded-full"
                  />
                </motion.button>
              </div>

              {/* Reactive Core Pulse */}
              <AnimatePresence>
                {(state === 'speaking' || state === 'listening') && (
                  <>
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 2.5, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className={`absolute inset-0 rounded-full border-2 ${state === 'speaking' ? 'border-[#FF007A]/40' : 'border-green-500/40'}`}
                    />
                    <motion.div 
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 0.8, opacity: 0.2 }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                      className={`absolute inset-10 rounded-full blur-2xl ${state === 'speaking' ? 'bg-[#FF007A]/20' : 'bg-green-500/20'}`}
                    />
                  </>
                )}
              </AnimatePresence>
            </div>
            
            {/* Status Information Gadget */}
            <div className="absolute -bottom-12 flex flex-col items-center gap-3">
              <div className="px-6 py-1.5 bg-zinc-950/80 backdrop-blur-md border border-white/10 rounded-sm text-[8px] tracking-[0.3em] font-mono text-cyan-400/80 uppercase shadow-lg">
                Link: {state}
              </div>
              
              {/* Mini data bar */}
              <div className="flex gap-1">
                {[...Array(12)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ delay: i * 0.1, duration: 2, repeat: Infinity }}
                    className={`w-1 h-1 rounded-full ${state === 'speaking' ? 'bg-[#FF007A]' : 'bg-cyan-500'}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Persona Text / Subtitles */}
        <div className="mt-32 max-w-lg text-center px-4 min-h-[60px]">
          <AnimatePresence mode="wait">
            <motion.p 
              key={state}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="text-zinc-400 font-serif italic text-lg leading-relaxed normal-case"
            >
              {state === 'disconnected' && ""}
              {state === 'connecting' && "\"Firing up the holographic processors... hold your horses.\""}
              {state === 'connected' && ""}
              {state === 'speaking' && "\"Analyzing data... injecting wisdom with a side of sass.\""}
              {state === 'listening' && "\"Listening. Make it interesting or don't bother.\""}
              {state === 'error' && "\"Interface corrupted. You probably did something stupid.\""}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Toolset Dock */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        {/* Center: Main Controls */}
        <div className="bg-black/80 backdrop-blur-2xl border border-white/5 rounded-full px-6 py-3 flex items-center gap-6 shadow-2xl relative overflow-hidden">
          {/* Scanning line for the dock */}
          <motion.div 
            animate={{ x: [-200, 400] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute inset-0 w-24 h-full bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent skew-x-12"
          />

          <div className="flex items-center">
            <div className={`w-2.5 h-2.5 rounded-full ${state !== 'disconnected' ? 'bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(0,209,255,0.5)]' : 'bg-zinc-800'}`} />
          </div>

          <div className="w-[1px] h-6 bg-white/5" />
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => client?.disconnect()}
              disabled={state === 'disconnected'}
              title="Force Abort"
              className="p-2 bg-red-950/20 border border-red-500/20 rounded-full group transition-all hover:bg-red-950/40 disabled:opacity-20"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                 <AvengersIcon className="w-5 h-5 text-red-600 transition-transform group-hover:scale-110" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Identity (Keeping for structure if needed elsewhere but not visible) */}
      <div className="hidden">
        <div className="flex flex-col items-end gap-1 text-zinc-500">
          <span className="text-[8px] tracking-widest text-[#FF007A]">Protocol_Active</span>
        </div>
      </div>

      {/* Session Timer Footer */}
      <div className="absolute bottom-8 right-8 z-30 flex items-center gap-2 pointer-events-none sm:right-12">
        <span className="text-cyan-500/30 text-[7px] tracking-widest font-bold">STIME</span>
        <span className="text-zinc-500 text-[10px] font-bold tabular-nums">{elapsed}</span>
      </div>
    </div>
  );
}

