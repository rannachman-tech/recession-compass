import type { RegionId } from "./types";

/**
 * Recession bands per region. Hand-curated from official sources (NBER for the
 * US, CEPR for the eurozone, ONS for the UK). The dates are first-of-month
 * peak / trough. We update this list manually when a new recession is dated.
 */

interface Band {
  start: string; // YYYY-MM-01
  end: string; // YYYY-MM-01
  label?: string;
}

const NBER_US: Band[] = [
  { start: "1973-11-01", end: "1975-03-01" },
  { start: "1980-01-01", end: "1980-07-01" },
  { start: "1981-07-01", end: "1982-11-01" },
  { start: "1990-07-01", end: "1991-03-01" },
  { start: "2001-03-01", end: "2001-11-01", label: "Dot-com" },
  { start: "2007-12-01", end: "2009-06-01", label: "GFC" },
  { start: "2020-02-01", end: "2020-04-01", label: "COVID" },
];

const CEPR_EU: Band[] = [
  { start: "1974-09-01", end: "1975-03-01" },
  { start: "1980-01-01", end: "1982-11-01" },
  { start: "1992-02-01", end: "1993-09-01" },
  { start: "2008-02-01", end: "2009-06-01", label: "GFC" },
  { start: "2011-09-01", end: "2013-03-01", label: "Sovereign-debt" },
  { start: "2020-01-01", end: "2020-06-01", label: "COVID" },
];

const ONS_UK: Band[] = [
  { start: "1973-09-01", end: "1974-03-01" },
  { start: "1975-03-01", end: "1975-09-01" },
  { start: "1980-01-01", end: "1981-03-01" },
  { start: "1990-09-01", end: "1991-09-01" },
  { start: "2008-04-01", end: "2009-09-01", label: "GFC" },
  { start: "2020-01-01", end: "2020-06-01", label: "COVID" },
];

const GLOBAL_BANDS: Band[] = [
  // OECD-dated global slowdowns. These are approximate.
  { start: "1974-01-01", end: "1975-06-01", label: "Oil shock" },
  { start: "1980-01-01", end: "1982-12-01", label: "Stagflation" },
  { start: "1991-01-01", end: "1992-12-01" },
  { start: "2001-01-01", end: "2001-12-01", label: "Dot-com" },
  { start: "2008-01-01", end: "2009-09-01", label: "GFC" },
  { start: "2020-01-01", end: "2020-06-01", label: "COVID" },
];

export function recessionBands(region: RegionId): Band[] {
  switch (region) {
    case "us":
      return NBER_US;
    case "eu":
      return CEPR_EU;
    case "uk":
      return ONS_UK;
    case "global":
      return GLOBAL_BANDS;
  }
}
