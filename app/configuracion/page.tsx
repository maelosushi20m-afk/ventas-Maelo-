"use client";
import { AppShell } from "@/components/layout/AppShell";
import { useSound, SOUND_OPTIONS, SoundId } from "@/stores/soundStore";
import { Volume2, VolumeX, Play, Bell } from "lucide-react";

export default function ConfiguracionPage() {
  const enabled = useSound((s) => s.enabled);
  const volume = useSound((s) => s.volume);
  const sound = useSound((s) => s.sound);
  const setEnabled = useSound((s) => s.setEnabled);
  const setVolume = useSound((s) => s.setVolume);
  const setSound = useSound((s) => s.setSound);
  const unlock = useSound((s) => s.unlock);
  const play = useSound((s) => s.play);

  const probar = () => {
    unlock(); // gesto del usuario: desbloquea audio en iOS
    play();
  };

  return (
    <AppShell title="Configuración">
      <div className="max-w-xl space-y-4">
        <div className="card space-y-4">
          <div className="flex items-center gap-2 text-brand-gold font-semibold">
            <Bell size={18} /> Notificaciones de pedidos
          </div>

          {/* Interruptor activar/desactivar */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Sonido de pedidos nuevos</div>
              <div className="text-xs text-gray-400">Reproduce una alerta al llegar cada pedido nuevo.</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled(!enabled)}
              className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
                enabled ? "bg-brand-gold" : "bg-brand-gray"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform ${
                  enabled ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {/* Volumen */}
          <div className={enabled ? "" : "opacity-40 pointer-events-none"}>
            <div className="flex items-center gap-2 mb-1">
              {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              <span className="text-sm font-medium">Volumen</span>
              <span className="text-xs text-gray-400 ml-auto">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full accent-brand-gold"
            />
          </div>

          {/* Selector de sonido (preparado para futuros) */}
          <div className={enabled ? "" : "opacity-40 pointer-events-none"}>
            <label className="label">Tipo de sonido</label>
            <select
              className="input"
              value={sound}
              onChange={(e) => setSound(e.target.value as SoundId)}
            >
              {SOUND_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Probar */}
          <button type="button" onClick={probar} className="btn-gold w-full justify-center">
            <Play size={16} /> Probar sonido
          </button>

          <p className="text-[11px] text-gray-500">
            En iPhone, el audio se activa tras tu primer toque. Pulsa «Probar sonido» una vez
            para habilitarlo en esta sesión.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
