// Operator Math bodies use a wider unpadded column; everything else uses the
// padded reference column. See `.page-column` in src/styles/components.css.
export type PageFamily = "math" | "reference";

export const pageFamily = (id: string): PageFamily =>
  id.startsWith("operator-math/") ? "math" : "reference";
