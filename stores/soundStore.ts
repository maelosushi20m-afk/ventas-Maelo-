import { create } from "zustand";

/**
 * Sistema de notificación sonora para pedidos nuevos.
 * - Voz "Nuevo pedido" vía speechSynthesis (iOS/Android/escritorio).
 * - Fallback a beep Web Audio si TTS no disponible.
 * - Volumen y on/off persistidos en localStorage.
 * - Preparado para múltiples sonidos seleccionables a futuro.
 *
 * iOS requiere un gesto del usuario para desbloquear audio: el toggle/prueba
 * en Configuración llama unlock(), que ceba AudioContext y speechSynthesis.
 */

const KEY_ENABLED = "maelo-sonido-enabled";
const KEY_VOLUME = "maelo-sonido-volumen";
const KEY_SOUND = "maelo-sonido-tipo";

export type SoundId = "voz" | "beep" | "campana";

export interface SoundOption {
  id: SoundId;
  label: string;
  /** Texto TTS; si vacío, solo tono. */
  speak?: string;
  /** Frecuencia del tono de respaldo/efecto. */
  freq: number;
}

export const SOUND_OPTIONS: SoundOption[] = [
  { id: "voz", label: "Voz: «Nuevo pedido»", speak: "Nuevo pedido", freq: 880 },
  { id: "beep", label: "Pitido", freq: 880 },
  { id: "campana", label: "Campana", freq: 1320 },
];

interface SoundStore {
  enabled: boolean;
  volume: number; // 0..1
  sound: SoundId;
  /** Verdadero tras un gesto del usuario (necesario en iOS). */
  unlocked: boolean;
  setEnabled: (v: boolean) => void;
  setVolume: (v: number) => void;
  setSound: (id: SoundId) => void;
  unlock: () => void;
  /** Reproduce la notificación según preferencias. */
  play: () => void;
}

// ── AudioContext compartido (cebado en unlock) ──────────────
let audioCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  return audioCtx;
}

function tone(freq: number, volume: number) {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = freq;
    const v = Math.max(0.0001, Math.min(1, volume) * 0.4);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(v, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.42);
  } catch {
    /* sin audio */
  }
}

function speak(text: string, volume: number): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-ES";
    u.volume = Math.max(0, Math.min(1, volume));
    u.rate = 1;
    u.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const es = voices.find((v) => v.lang?.toLowerCase().startsWith("es"));
    if (es) u.voice = es;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

function readBool(key: string, def: boolean): boolean {
  if (typeof window === "undefined") return def;
  const v = localStorage.getItem(key);
  return v === null ? def : v === "1";
}
function readNum(key: string, def: number): number {
  if (typeof window === "undefined") return def;
  const v = localStorage.getItem(key);
  const n = v === null ? def : parseFloat(v);
  return Number.isFinite(n) ? n : def;
}
function readSound(def: SoundId): SoundId {
  if (typeof window === "undefined") return def;
  const v = localStorage.getItem(KEY_SOUND) as SoundId | null;
  return v && SOUND_OPTIONS.some((o) => o.id === v) ? v : def;
}

export const useSound = create<SoundStore>()((set, get) => ({
  enabled: readBool(KEY_ENABLED, false),
  volume: readNum(KEY_VOLUME, 1),
  sound: readSound("voz"),
  unlocked: false,

  setEnabled: (v) => {
    if (typeof window !== "undefined") localStorage.setItem(KEY_ENABLED, v ? "1" : "0");
    set({ enabled: v });
    if (v) get().unlock();
  },
  setVolume: (v) => {
    const vol = Math.max(0, Math.min(1, v));
    if (typeof window !== "undefined") localStorage.setItem(KEY_VOLUME, String(vol));
    set({ volume: vol });
  },
  setSound: (id) => {
    if (typeof window !== "undefined") localStorage.setItem(KEY_SOUND, id);
    set({ sound: id });
  },

  // Desbloqueo de audio por gesto (iOS). Ceba AudioContext y TTS en silencio.
  unlock: () => {
    getCtx();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        const u = new SpeechSynthesisUtterance("");
        u.volume = 0;
        window.speechSynthesis.speak(u);
        // Cargar lista de voces (algunas plataformas la pueblan async).
        window.speechSynthesis.getVoices();
      } catch {
        /* noop */
      }
    }
    set({ unlocked: true });
  },

  play: () => {
    const { enabled, volume, sound } = get();
    if (!enabled) return;
    const opt = SOUND_OPTIONS.find((o) => o.id === sound) || SOUND_OPTIONS[0];
    if (opt.speak) {
      const ok = speak(opt.speak, volume);
      if (!ok) tone(opt.freq, volume); // respaldo si no hay TTS
    } else {
      tone(opt.freq, volume);
    }
  },
}));
