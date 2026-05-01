import type { Metadata } from "next";
import { RegionView } from "@/components/RegionView";
import data from "@/data/recession-uk.json";
import type { RegionData } from "@/lib/types";

export const metadata: Metadata = {
  title: "United Kingdom",
  description:
    "Is a recession coming for the UK? Live 0–100 score built from ONS, Bank of England and OECD series.",
};

export default function UKPage() {
  return <RegionView data={data as RegionData} />;
}
