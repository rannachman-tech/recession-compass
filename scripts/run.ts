/**
 * Orchestrator. Runs one or all regions in dependency order:
 *
 *   us → eu → uk → global
 *
 * Global must run last because it consumes the just-written US and EU JSON.
 */

import { ALL_REGIONS, runRegion } from "./fetch-region";
import type { RegionId } from "@/lib/types";

async function main() {
  const arg = process.argv[2] as RegionId | undefined;
  const regions: RegionId[] = arg
    ? ([arg] as RegionId[])
    : (ALL_REGIONS as RegionId[]);

  // Always honour the dependency chain: ensure global runs after the others.
  const order = [...regions].sort((a, b) => {
    if (a === "global" && b !== "global") return 1;
    if (b === "global" && a !== "global") return -1;
    return 0;
  });

  for (const r of order) {
    await runRegion(r);
  }
  console.log("[run] done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
