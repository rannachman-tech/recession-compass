import { notFound } from "next/navigation";

// Methodology is no longer published on the live site.
// The one-pager (METHODOLOGY.md / METHODOLOGY.pdf) ships in the repo root
// for internal/compliance distribution. This route now 404s.
export default function MethodologyPage(): never {
  notFound();
}
