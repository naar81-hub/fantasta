import { describe, expect, it } from "vitest";

import type { ListPlayer, Purchase, StrategySlot } from "../lib/auction-context";
import {
  createListoneImportUpdate,
  getTeamPurchaseSummary,
  isValidHexColor,
  sortPurchasesByRole,
} from "../lib/auction-utils";

const purchases: Purchase[] = [
  { player: "Malen", team: "ROM", role: "A", owner: "Luca", amount: 80 },
  { player: "Dimarco", team: "INT", role: "D", owner: "Io", amount: 35 },
  { player: "Svilar", team: "ROM", role: "P", owner: "io", amount: 20 },
  { player: "Barella", team: "INT", role: "C", owner: "Io", amount: 40 },
];

describe("auction utilities", () => {
  it("calculates totals only for the selected participant", () => {
    expect(getTeamPurchaseSummary(purchases, "Io", 1000)).toMatchObject({
      spent: 95,
      remaining: 905,
      count: 3,
    });
  });

  it("orders purchases by goalkeeper, defender, midfielder, forward", () => {
    expect(sortPurchasesByRole(purchases).map((item) => item.role)).toEqual([
      "P",
      "D",
      "C",
      "A",
    ]);
  });

  it("accepts only full six-digit HEX colors", () => {
    expect(isValidHexColor("#FF0000")).toBe(true);
    expect(isValidHexColor("#a7f3d0")).toBe(true);
    expect(isValidHexColor("red")).toBe(false);
    expect(isValidHexColor("#FFF")).toBe(false);
  });

  it("clears purchases and player tiers while preserving Strategy on list import", () => {
    const strategy: StrategySlot[] = [
      { id: 1, role: "P", player: "", tier: "TOP", budget: "20" },
    ];
    const players: ListPlayer[] = [
      { name: "Nuovo", team: "ROM", role: "A", price: 12, fvm: 100 },
    ];
    const update = createListoneImportUpdate(
      players,
      { source: "File Excel", season: "Personalizzato", updatedAt: "2026-09-16" },
      strategy,
    );

    expect(update.players).toBe(players);
    expect(update.purchases).toEqual([]);
    expect(update.tiers).toEqual({});
    expect(update.strategy).toBe(strategy);
  });
});
