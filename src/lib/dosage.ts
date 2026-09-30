export const LB_PER_GAL_WATER = 8.34;
export const ML_PER_GAL = 3785.41;
export const MIN_PER_DAY = 1440;

export type FlowUnit = "mgd" | "gpm" | "gpd";

export const flowUnits: Record<FlowUnit, { label: string; toMgd: (v: number) => number }> = {
  mgd: { label: "MGD", toMgd: (v) => v },
  gpm: { label: "gpm", toMgd: (v) => (v * MIN_PER_DAY) / 1_000_000 },
  gpd: { label: "gal/day", toMgd: (v) => v / 1_000_000 },
};

export interface ChemicalPreset {
  id: string;
  name: string;
  use: string;
  /** Percent active, by weight, as a typical delivered product. */
  strength: number;
  specificGravity: number;
}

// Typical delivered strengths; SG values are approximate and vary by supplier.
export const chemicalPresets: ChemicalPreset[] = [
  { id: "hypo", name: "Sodium hypochlorite 12.5%", use: "Disinfection", strength: 12.5, specificGravity: 1.2 },
  { id: "bisulfite", name: "Sodium bisulfite 38%", use: "Dechlorination", strength: 38, specificGravity: 1.36 },
  { id: "ferric", name: "Ferric chloride 40%", use: "Phosphorus removal", strength: 40, specificGravity: 1.42 },
  { id: "alum", name: "Liquid alum 48.5%", use: "Phosphorus removal", strength: 48.5, specificGravity: 1.33 },
  { id: "caustic", name: "Sodium hydroxide 25%", use: "pH / alkalinity", strength: 25, specificGravity: 1.27 },
  { id: "pure", name: "Pure chemical (gas or dry)", use: "Chlorine gas, dry feed", strength: 100, specificGravity: 1 },
];

export interface DosageInput {
  dose: number;
  flow: number;
  flowUnit: FlowUnit;
  strength: number;
  specificGravity: number;
}

export interface DosageResult {
  flowMgd: number;
  activeLbPerDay: number;
  productLbPerDay: number;
  productLbPerGal: number;
  productGalPerDay: number;
  productGalPerHour: number;
  productMlPerMin: number;
}

export type DosageOutcome = { ok: true; result: DosageResult } | { ok: false; message: string };

export function calculateDosage(input: DosageInput): DosageOutcome {
  const { dose, flow, flowUnit, strength, specificGravity } = input;
  if (![dose, flow, strength, specificGravity].every(Number.isFinite)) {
    return { ok: false, message: "Fill in every field to see the feed rate." };
  }
  if (dose <= 0 || flow <= 0) {
    return { ok: false, message: "Dose and flow need to be greater than zero." };
  }
  if (strength <= 0 || strength > 100) {
    return { ok: false, message: "Product strength must be between 0 and 100%." };
  }
  if (specificGravity <= 0) {
    return { ok: false, message: "Specific gravity must be greater than zero." };
  }

  const flowMgd = flowUnits[flowUnit].toMgd(flow);
  const activeLbPerDay = dose * flowMgd * LB_PER_GAL_WATER;
  const productLbPerDay = activeLbPerDay / (strength / 100);
  const productLbPerGal = LB_PER_GAL_WATER * specificGravity;
  const productGalPerDay = productLbPerDay / productLbPerGal;

  return {
    ok: true,
    result: {
      flowMgd,
      activeLbPerDay,
      productLbPerDay,
      productLbPerGal,
      productGalPerDay,
      productGalPerHour: productGalPerDay / 24,
      productMlPerMin: (productGalPerDay * ML_PER_GAL) / MIN_PER_DAY,
    },
  };
}

/** Rounds for display: fewer decimals as numbers grow, never scientific notation. */
export function formatNumber(value: number, fixedDigits?: number): string {
  const abs = Math.abs(value);
  const digits = fixedDigits ?? (abs >= 1000 ? 0 : abs >= 10 ? 1 : abs >= 1 ? 2 : 3);
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}
