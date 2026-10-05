"use client";

// Keys whose contents are bundled into the user-downloadable backup.
// Add new keys here when introducing new persistent state.
const BACKUP_KEYS = [
  "tcf-irn-progress-v2",
  "tcf-irn-mistakes-v1",
  "tcf-irn-mock-exams-v1",
  "tcf-irn-mock-exam-active-v1",
] as const;

const BACKUP_VERSION = 1;
const BACKUP_MAGIC = "tcf-irn-backup";

interface BackupFile {
  magic: typeof BACKUP_MAGIC;
  version: number;
  exportedAt: string;
  data: Record<string, unknown>;
}

export function exportBackup(): BackupFile {
  const data: Record<string, unknown> = {};
  for (const key of BACKUP_KEYS) {
    const raw = window.localStorage.getItem(key);
    if (raw === null) continue;
    try {
      data[key] = JSON.parse(raw);
    } catch {
      data[key] = raw;
    }
  }
  return {
    magic: BACKUP_MAGIC,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function downloadBackup(): void {
  const file = exportBackup();
  const blob = new Blob([JSON.stringify(file, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `tcf-irn-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export class BackupParseError extends Error {}

export function applyBackup(file: unknown): { restored: string[] } {
  if (!file || typeof file !== "object") {
    throw new BackupParseError("Fichier invalide.");
  }
  const candidate = file as Partial<BackupFile>;
  if (candidate.magic !== BACKUP_MAGIC) {
    throw new BackupParseError("Ce fichier n'est pas une sauvegarde TCF IRN.");
  }
  if (typeof candidate.version !== "number" || candidate.version > BACKUP_VERSION) {
    throw new BackupParseError("Version de sauvegarde non prise en charge.");
  }
  if (!candidate.data || typeof candidate.data !== "object") {
    throw new BackupParseError("Données manquantes dans la sauvegarde.");
  }

  const restored: string[] = [];
  for (const key of BACKUP_KEYS) {
    const value = (candidate.data as Record<string, unknown>)[key];
    if (value === undefined) continue;
    window.localStorage.setItem(key, JSON.stringify(value));
    restored.push(key);
  }
  return { restored };
}

export async function readBackupFile(file: File): Promise<unknown> {
  const text = await file.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new BackupParseError("Le fichier n'est pas un JSON valide.");
  }
}
