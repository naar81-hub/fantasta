import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const dataset = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), "shared/players.json"), "utf8"),
) as {
  source: string;
  season: string;
  players: Array<{ name: string; team: string; role: string; price: number; fvm: number }>;
};

describe("official Fantacalcio listone", () => {
  it("contains the expected official season and a complete player set", () => {
    expect(dataset.source).toBe("Fantacalcio.it");
    expect(dataset.season).toBe("2026/27");
    expect(dataset.players.length).toBeGreaterThan(500);
  });

  it("keeps every player assigned to a Classic role with a valid quotation", () => {
    const validRoles = new Set(["P", "D", "C", "A"]);
    for (const player of dataset.players) {
      expect(player.name.length).toBeGreaterThan(0);
      expect(player.team.length).toBeGreaterThan(0);
      expect(validRoles.has(player.role)).toBe(true);
      expect(player.price).toBeGreaterThanOrEqual(1);
      expect(player.fvm).toBeGreaterThanOrEqual(1);
    }
  });

  it("includes every role in the listone", () => {
    const roles = new Set(dataset.players.map((player) => player.role));
    expect([...roles].sort()).toEqual(["A", "C", "D", "P"]);
  });
});
