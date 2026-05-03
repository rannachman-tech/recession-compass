import { notFound } from "next/navigation";

/**
 * /about route was retired. Returns 404 — search engines will drop it
 * from the index. To fully delete the route, remove this entire
 * `app/about/` directory.
 */
export default function AboutPage() {
  notFound();
}
