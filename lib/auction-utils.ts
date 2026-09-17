import type { ListoneMeta, ListPlayer, Purchase, Role, StrategySlot, Tier } from "@/lib/auction-context";

export const roleOrder: Record<Role, number> = { P: 0, D: 1, C: 2, A: 3 };

export function sortPurchasesByRole(purchases: Purchase[]) {
  return [...purchases].sort(
    (a, b) => roleOrder[a.role] - roleOrder[b.role] || a.player.localeCompare(b.player),
  );
}

export function getTeamPurchaseSummary(
  purchases: Purchase[],
  participant: string,
  totalCredits: number,
) {
  const items = purchases.filter(
    (item) => item.owner.toLowerCase() === participant.toLowerCase(),
  );
  const spent = items.reduce((sum, item) => sum + item.amount, 0);

  return {
    items,
    spent,
    remaining: totalCredits - spent,
    count: items.length,
  };
}

export function isValidHexColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value.trim());
}

export function createListoneImportUpdate(
  players: ListPlayer[],
  listoneMeta: ListoneMeta,
  strategy: StrategySlot[],
) {
  return {
    players,
    listoneMeta,
    purchases: [] as Purchase[],
    tiers: {} as Record<string, Tier>,
    strategy,
  };
}
