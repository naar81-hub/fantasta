import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

import { parseListoneWorkbook } from "../lib/listone-import";

function workbookBuffer(rows: unknown[][]) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "Quotazioni");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

describe("Excel listone import", () => {
  it("maps Fantacalcio-style columns and normalizes roles", () => {
    const result = parseListoneWorkbook(
      workbookBuffer([
        ["Listone aggiornato"],
        ["Nome", "Squadra", "Ruolo", "Qt.A", "FVM"],
        ["Svilar", "rom", "Portiere", 19, 90],
        ["Dimarco", "int", "D", 30, 250],
        ["Paz N.", "com", "Centrocampista", 30, 257],
        ["Malen", "rom", "Attaccante", 37, 450],
      ]),
      "listone.xlsx",
    );

    expect(result.sheetName).toBe("Quotazioni");
    expect(result.players).toEqual([
      { name: "Svilar", team: "ROM", role: "P", price: 19, fvm: 90 },
      { name: "Dimarco", team: "INT", role: "D", price: 30, fvm: 250 },
      { name: "Paz N.", team: "COM", role: "C", price: 30, fvm: 257 },
      { name: "Malen", team: "ROM", role: "A", price: 37, fvm: 450 },
    ]);
  });

  it("rejects spreadsheets without the required columns", () => {
    expect(() =>
      parseListoneWorkbook(workbookBuffer([["Giocatore", "Valore"], ["Svilar", 19]]), "listone.xlsx"),
    ).toThrow("Colonne non riconosciute");
  });

  it("rejects non-Excel extensions", () => {
    expect(() => parseListoneWorkbook(new Uint8Array(), "listone.csv")).toThrow(".xls o .xlsx");
  });
});
