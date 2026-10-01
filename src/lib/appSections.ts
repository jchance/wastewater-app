// Top-level sections shown as tabs in the native apps. Each non-home section
// gets an app-only list page at `/<slug>/`.
export interface AppSection {
  slug: "" | "calculators" | "operator-reference" | "operator-math";
  tab: string;
  title: string;
}

export const appSections: AppSection[] = [
  { slug: "", tab: "Home", title: "Wastewater Field Guide" },
  { slug: "calculators", tab: "Calculators", title: "Calculators" },
  { slug: "operator-reference", tab: "Reference", title: "Operator Reference" },
  { slug: "operator-math", tab: "Math", title: "Operator Math" },
];

// Pages reached from the header rather than a tab leave every tab unselected.
const untabbed = new Set(["about"]);

export const sectionFor = (pathname: string): AppSection["slug"] | null => {
  const first = pathname.split("/").filter(Boolean)[0] ?? "";
  if (untabbed.has(first)) return null;
  return appSections.some((s) => s.slug === first) ? (first as AppSection["slug"]) : "";
};
