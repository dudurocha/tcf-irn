"use client";

import { useRef, useState } from "react";
import {
  BackupParseError,
  applyBackup,
  downloadBackup,
  readBackupFile,
} from "@/lib/storage/backup";

type Status =
  | { kind: "idle" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function BackupControls() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function handleExport() {
    try {
      downloadBackup();
      setStatus({ kind: "success", message: "Sauvegarde téléchargée." });
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Échec de l'export.",
      });
    }
  }

  async function handleFile(file: File) {
    try {
      const parsed = await readBackupFile(file);
      const ok = window.confirm(
        "Importer cette sauvegarde remplacera votre progression actuelle. Continuer ?"
      );
      if (!ok) return;
      const { restored } = applyBackup(parsed);
      setStatus({
        kind: "success",
        message: `Sauvegarde restaurée (${restored.length} élément${restored.length > 1 ? "s" : ""}). Rechargement…`,
      });
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      const message =
        err instanceof BackupParseError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Échec de l'import.";
      setStatus({ kind: "error", message });
    }
  }

  return (
    <div className="mb-6">
      <div className="text-[11px] text-ink-muted uppercase tracking-wider mb-2 font-sans">
        Sauvegarde
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleExport} className="btn flex-1">
          Exporter ma progression
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="btn flex-1"
        >
          Importer une sauvegarde
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void handleFile(file);
          }}
        />
      </div>
      <p className="text-xs text-ink-muted mt-2 font-sans">
        Téléchargez un fichier JSON contenant vos jours terminés, erreurs et examens blancs. Restaurez-le sur un autre appareil ou après un changement d&apos;URL.
      </p>
      {status.kind !== "idle" && (
        <p
          className={`text-xs mt-2 font-sans ${status.kind === "error" ? "text-red-600" : "text-ink-muted"}`}
        >
          {status.message}
        </p>
      )}
    </div>
  );
}
