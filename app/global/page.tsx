import type { Metadata } from "next";
import { RegionView } from "@/components/RegionView";
import data from "@/data/recession-global.json";
import type { RegionData } from "@/lib/types";

export const metadata: Metadata = {
  title: "Global composite",
  description:
    "Is a global recession coming? A composite of US, eurozone, China and Japan recession-probability scores.",
};

export default function GlobalPage() {
  return <RegionView data={data as RegionData} />;
}
