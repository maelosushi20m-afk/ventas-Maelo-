"use client";
import { ReactNode } from "react";

export function ConfirmDialog({
  open,
  title,
  description,
  onCancel,
  onConfirm,
  confirmLabel = "Confirmar"
}: {
  open: boolean;
  title: string;
  description?: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="card max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-brand-gold mb-2">{title}</h3>
        {description && <p className="text-sm text-gray-300 mb-4">{description}</p>}
        <div className="flex gap-2 justify-end">
          <button className="btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn-primary" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
