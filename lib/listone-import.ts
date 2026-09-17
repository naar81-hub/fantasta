import * as XLSX from "xlsx";

import type { ListPlayer, Role } from "@/lib/auction-context";

export type ListoneImportResult = {
  players: ListPlayer[];
  fileName: string;
  sheetName: string;
  importedAt: string;
};

type Field = "name" | "team" | "role" | "price" | "fvm";
type ColumnMap = Partial<Record<Field, number>>;

const aliases: Record<Field, string[]> = {
  name: ["nome", "nominativo", "calciatore", "giocatore", "player", "name"],
  team: ["squadra", "club", "team"],
  role: ["r", "ruolo", "role", "ruoloclassic", "ruoloclassico"],
  price: ["qta", "quotazione", "quota", "quot", "prezzo", "price", "valore"],
  fvm: ["fvm", "fvm1000", "valorefvm", "fantavalue"],
};

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getColumnMap(row: unknown[]): ColumnMap {
  const map: ColumnMap = {};
  row.forEach((cell, index) => {
    const normalized = normalizeHeader(cell);
    (Object.keys(aliases) as Field[]).forEach((field) => {
      if (map[field] === undefined && aliases[field].includes(normalized)) map[field] = index;
    });
  });
  return map;
}

function parseNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const normalized = String(value ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".")
    .replace(/[^0-9.-]/g, "");
  const number = Number.parseFloat(normalized);
  return Number.isFinite(number) ? number : 0;
}

function parseRole(value: unknown): Role | null {
  const normalized = normalizeHeader(value).toUpperCase();
  if (normalized === "P" || normalized.startsWith("POR")) return "P";
  if (normalized === "D" || normalized.startsWith("DIF")) return "D";
  if (normalized === "C" || normalized.startsWith("CEN")) return "C";
  if (normalized === "A" || normalized.startsWith("ATT")) return "A";
  return null;
}

function findHeader(rows: unknown[][]) {
  for (let index = 0; index < Math.min(rows.length, 25); index += 1) {
    const map = getColumnMap(rows[index]);
    if (map.name !== undefined && map.team !== undefined && map.role !== undefined && map.price !== undefined) {
      return { index, map };
    }
  }
  return null;
}

export function parseListoneWorkbook(data: ArrayBuffer | Uint8Array, fileName: string): ListoneImportResult {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension !== "xls" && extension !== "xlsx") {
    throw new Error("Seleziona un file Excel in formato .xls o .xlsx.");
  }

  const workbook = XLSX.read(data, { type: "array" });
  const sheetName = workbook.SheetNames.find((name) => {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name], { header: 1, defval: "", raw: true });
    return Boolean(findHeader(rows));
  });
  if (!sheetName) {
    throw new Error("Colonne non riconosciute. Servono almeno Nome, Squadra, Ruolo e Quotazione (o Qt.A).");
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: "", raw: true });
  const header = findHeader(rows);
  if (!header) throw new Error("Intestazione del listone non trovata.");

  const errors: string[] = [];
  const players: ListPlayer[] = [];
  const seen = new Set<string>();

  rows.slice(header.index + 1).forEach((row, offset) => {
    const rowNumber = header.index + offset + 2;
    const name = String(row[header.map.name!] ?? "").trim();
    const team = String(row[header.map.team!] ?? "").trim().toUpperCase();
    const role = parseRole(row[header.map.role!]);
    const price = parseNumber(row[header.map.price!]);
    const fvm = header.map.fvm === undefined ? 0 : parseNumber(row[header.map.fvm]);

    if (!name && !team && !String(row[header.map.role!] ?? "").trim()) return;
    if (!name || !team || !role || price < 0) {
      if (errors.length < 5) errors.push(`Riga ${rowNumber}: controlla nome, squadra, ruolo e quotazione.`);
      return;
    }

    const key = `${name.toLocaleLowerCase("it")}|${team}|${role}`;
    if (seen.has(key)) return;
    seen.add(key);
    players.push({ name, team, role, price, fvm });
  });

  if (errors.length) throw new Error(`Importazione interrotta. ${errors.join(" ")}`);
  if (!players.length) throw new Error("Il file non contiene calciatori validi.");

  return {
    players,
    fileName,
    sheetName,
    importedAt: new Date().toISOString(),
  };
}
