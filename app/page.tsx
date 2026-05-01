import type { Metadata } from "next";
import { RegionView } from "@/components/RegionView";
import data from "@/data/recession-us.json";
import type { RegionData } from "@/lib/types";

export const metadata: Metadata = {
  title: "United States",
  description:
    "Is a recession coming for the US? Live 0–100 score from yield curve, Sahm rule, jobless claims, ISM proxy, LEI, unemployment, GDP and consumer sentiment.",
};

export default function USPage() {
  return <RegionView data={data as RegionData} />;
}
