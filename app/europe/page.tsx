import type { Metadata } from "next";
import { RegionView } from "@/components/RegionView";
import data from "@/data/recession-eu.json";
import type { RegionData } from "@/lib/types";

export const metadata: Metadata = {
  title: "Europe",
  description:
    "Is a recession coming for the eurozone? Live 0–100 score built from ECB, Eurostat and OECD series.",
};

export default function EuropePage() {
  return <RegionView data={data as RegionData} />;
}
