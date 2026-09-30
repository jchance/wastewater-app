import { LB_PER_GAL_WATER, flowUnits, formatNumber as f, type FlowUnit } from "./dosage";
import type { Step } from "./processControl";

export const GAL_PER_CUFT = 7.48;

export type ClarifierMode = "all" | "dt" | "sor" | "wor" | "slr";
export type Shape = "circular" | "rectangular";
export type TankType = "primary" | "secondary" | "aeration" | "chlorine" | "digester" | "other";
export type FlowBasis = "average" | "peak";
export type Metric = "dt" | "sor" | "wor" | "slr";

export const clarifierModes: { id: ClarifierMode; label: string; long: string }[] = [
  { id: "all", label: "All checks", long: "Every clarifier number at once" },
  { id: "dt", label: "Detention", long: "Detention time, any tank" },
  { id: "sor", label: "Surface", long: "Surface overflow rate" },
  { id: "wor", label: "Weir", long: "Weir overflow rate" },
  { id: "slr", label: "Solids", long: "Solids loading rate" },
];

export const tankTypes: Record<TankType, string> = {
  primary: "Primary clarifier",
  secondary: "Secondary clarifier",
  aeration: "Aeration basin",
  chlorine: "Chlorine contact tank",
  digester: "Digester",
  other: "Other tank",
};

export interface ClarifierInput {
  shape: Shape;
  diameter: number;
  length: number;
  width: number;
  depth: number;
  units: number;
  clarifierType: "primary" | "secondary";
  dtTank: TankType;
  basis: FlowBasis;
  flow: number;
  flowUnit: FlowUnit;
  /** Optional for circular tanks: blank = one peripheral weir, 3.14 × diameter. */
  weirLength: number;
  ras: number;
  rasUnit: FlowUnit;
  mlss: number;
}

export interface ClarifierResult {
  tank: TankType;
  flowMgd: number;
  flowPerUnitMgd: number;
  flowPerUnitGpd: number;
  surfaceFt2: number;
  volumeFt3: number;
  volumeGal: number;
  gph: number;
  dtHours: number;
  dtMinutes: number;
  dtDays: number;
  sor: number;
  weirFt: number;
  weirFromDiameter: boolean;
  wor: number;
  rasMgd: number;
  rasPerUnitMgd: number;
  solidsLbPerDay: number;
  slr: number;
}

export type ClarifierOutcome = { ok: true; result: ClarifierResult } | { ok: false; message: string };

/** The tank the numbers describe: SLR is secondary-only, detention can be any tank. */
export function effectiveTank(mode: ClarifierMode, i: Pick<ClarifierInput, "clarifierType" | "dtTank">): TankType {
  if (mode === "slr") return "secondary";
  if (mode === "dt") return i.dtTank;
  return i.clarifierType;
}

export const showsSlr = (mode: ClarifierMode, i: Pick<ClarifierInput, "clarifierType">) =>
  mode === "slr" || (mode === "all" && i.clarifierType === "secondary");

/** Which inputs a mode reads, given the shape and clarifier type. */
export function activeFields(mode: ClarifierMode, i: ClarifierInput): (keyof ClarifierInput)[] {
  const keys: (keyof ClarifierInput)[] = ["shape", "units", "flow", "basis"];
  keys.push(...(i.shape === "circular" ? (["diameter"] as const) : (["length", "width"] as const)));
  if (mode === "all" || mode === "dt") keys.push("depth");
  if (mode === "all" || mode === "sor" || mode === "wor") keys.push("clarifierType");
  if (mode === "dt") keys.push("dtTank");
  if (mode === "all" || mode === "wor") keys.push("weirLength");
  if (showsSlr(mode, i)) keys.push("ras", "mlss");
  return keys;
}

const optional = (key: keyof ClarifierInput, i: ClarifierInput) => key === "weirLength" && i.shape === "circular";

export function calculateClarifier(mode: ClarifierMode, i: ClarifierInput): ClarifierOutcome {
  for (const key of activeFields(mode, i)) {
    const v = i[key];
    if (typeof v !== "number") continue;
    if (Number.isNaN(v) && optional(key, i)) continue;
    if (!Number.isFinite(v)) return { ok: false, message: "Fill in every field to see the answer." };
    if (v < 0) return { ok: false, message: "Values can't be negative." };
    if (v === 0 && !optional(key, i)) return { ok: false, message: "Required values need to be greater than zero." };
  }
  if (!Number.isInteger(i.units)) return { ok: false, message: "Units in service should be a whole number." };

  const flowMgd = flowUnits[i.flowUnit].toMgd(i.flow);
  const flowPerUnitMgd = flowMgd / i.units;
  const flowPerUnitGpd = flowPerUnitMgd * 1_000_000;
  const surfaceFt2 = i.shape === "circular" ? 0.785 * i.diameter ** 2 : i.length * i.width;
  const volumeFt3 = surfaceFt2 * i.depth;
  const volumeGal = volumeFt3 * GAL_PER_CUFT;
  const gph = flowPerUnitGpd / 24;
  const dtHours = volumeGal / gph;

  const weirFromDiameter = i.shape === "circular" && !(i.weirLength > 0);
  const weirFt = weirFromDiameter ? 3.14 * i.diameter : i.weirLength;

  const rasMgd = Number.isFinite(i.ras) ? flowUnits[i.rasUnit].toMgd(i.ras) : 0;
  const rasPerUnitMgd = rasMgd / i.units;
  const solidsLbPerDay = (flowPerUnitMgd + rasPerUnitMgd) * i.mlss * LB_PER_GAL_WATER;

  return {
    ok: true,
    result: {
      tank: effectiveTank(mode, i),
      flowMgd,
      flowPerUnitMgd,
      flowPerUnitGpd,
      surfaceFt2,
      volumeFt3,
      volumeGal,
      gph,
      dtHours,
      dtMinutes: dtHours * 60,
      dtDays: dtHours / 24,
      sor: flowPerUnitGpd / surfaceFt2,
      weirFt,
      weirFromDiameter,
      wor: flowPerUnitGpd / weirFt,
      rasMgd,
      rasPerUnitMgd,
      solidsLbPerDay,
      slr: solidsLbPerDay / surfaceFt2,
    },
  };
}

/* ------------------------------------------------------------ typical ranges */

interface Range {
  min?: number;
  max?: number;
  /** Detention ranges are stored in hours; this picks the display unit. */
  unit: string;
  scale?: number;
  /** Extra context appended to the note. */
  note?: string;
}

const H: Omit<Range, "min" | "max"> = { unit: "hours" };
const MIN: Omit<Range, "min" | "max"> = { unit: "minutes", scale: 60 };
const DAYS: Omit<Range, "min" | "max"> = { unit: "days", scale: 1 / 24 };

/**
 * Broad textbook ranges for catching typos, not design criteria.
 * Stored in the result's own unit (detention in hours).
 */
export const typicalRanges: Partial<Record<TankType, Record<FlowBasis, Partial<Record<Metric, Range>>>>> = {
  primary: {
    average: {
      dt: { min: 1.5, max: 2.5, ...H },
      sor: { min: 800, max: 1200, unit: "gpd/ft²" },
      wor: { max: 10000, unit: "gpd/ft" },
    },
    peak: {
      sor: { max: 3000, unit: "gpd/ft²" },
      wor: { max: 30000, unit: "gpd/ft" },
    },
  },
  secondary: {
    average: {
      dt: { min: 2, max: 4, ...H },
      sor: { min: 400, max: 800, unit: "gpd/ft²" },
      wor: { max: 10000, unit: "gpd/ft" },
      slr: { min: 20, max: 30, unit: "lb/day/ft²" },
    },
    peak: {
      sor: { max: 1200, unit: "gpd/ft²" },
      wor: { max: 30000, unit: "gpd/ft" },
      slr: { max: 50, unit: "lb/day/ft²" },
    },
  },
  aeration: {
    average: { dt: { min: 4, max: 8, ...H, note: "for conventional; extended aeration runs about 18–36 hours" } },
    peak: {},
  },
  chlorine: {
    average: { dt: { min: 0.5, ...MIN } },
    peak: { dt: { min: 0.25, ...MIN } },
  },
  digester: {
    average: { dt: { min: 15 * 24, max: 30 * 24, ...DAYS } },
    peak: {},
  },
};

export interface RangeNote {
  text: string;
  level: "ok" | "high" | "low";
  /** Worth a second look: a high rate, or a detention time off either end. */
  concern: boolean;
}

export function rangeNote(metric: Metric, tank: TankType, basis: FlowBasis, value: number): RangeNote | null {
  const range = typicalRanges[tank]?.[basis]?.[metric];
  if (!range) return null;
  const s = range.scale ?? 1;
  const show = (n: number) => f(n * s, n * s < 10 ? 2 : 0);
  const span =
    range.min !== undefined && range.max !== undefined
      ? `${show(range.min)}–${show(range.max)}`
      : range.max !== undefined
        ? `up to ${show(range.max)}`
        : `at least ${show(range.min!)}`;
  const level = range.max !== undefined && value > range.max ? "high" : range.min !== undefined && value < range.min ? "low" : "ok";
  const verdict = level === "high" ? "Above typical" : level === "low" ? "Below typical" : "Within typical";
  const note = range.note ? ` (${range.note})` : "";
  const concern = metric === "dt" ? level !== "ok" : level === "high";
  return { text: `${verdict}. At ${basis} flow: ${span} ${range.unit}${note}.`, level, concern };
}

/* --------------------------------------------------------------------- steps */

const flowStep = (label: string, value: number, unit: FlowUnit, mgd: number): Step | null =>
  unit === "mgd"
    ? null
    : {
        what: `Convert ${label} to MGD`,
        math:
          unit === "gpm"
            ? `${f(value)} gpm × 1,440 ÷ 1,000,000 = <b>${f(mgd, 4)} MGD</b>`
            : `${f(value)} gal/day ÷ 1,000,000 = <b>${f(mgd, 4)} MGD</b>`,
      };

function commonSteps(mode: ClarifierMode, i: ClarifierInput, r: ClarifierResult): (Step | null)[] {
  const needsSurface = mode !== "wor" && mode !== "dt";
  const needsVolume = mode === "all" || mode === "dt";
  const surface: Step =
    i.shape === "circular"
      ? {
          what: "Surface area",
          math: `0.785 × ${f(i.diameter)} ft × ${f(i.diameter)} ft = <b>${f(r.surfaceFt2)} ft²</b>`,
        }
      : { what: "Surface area", math: `${f(i.length)} ft × ${f(i.width)} ft = <b>${f(r.surfaceFt2)} ft²</b>` };
  return [
    flowStep("flow", i.flow, i.flowUnit, r.flowMgd),
    i.units > 1
      ? {
          what: `Flow to each of ${i.units} units`,
          math: `${f(r.flowMgd, 4)} MGD ÷ ${i.units} = <b>${f(r.flowPerUnitMgd, 4)} MGD</b>`,
        }
      : null,
    i.flowUnit === "gpd" && i.units === 1
      ? null
      : { what: "Flow in gal/day", math: `${f(r.flowPerUnitMgd, 4)} × 1,000,000 = <b>${f(r.flowPerUnitGpd)} gal/day</b>` },
    needsSurface || needsVolume ? surface : null,
    needsVolume
      ? {
          what: "Volume",
          math: `${f(r.surfaceFt2)} ft² × ${f(i.depth)} ft = ${f(r.volumeFt3)} ft³ × 7.48 = <b>${f(r.volumeGal)} gal</b>`,
        }
      : null,
  ];
}

function dtSteps(r: ClarifierResult): Step[] {
  const steps: Step[] = [
    { what: "Flow per hour", math: `${f(r.flowPerUnitGpd)} gal/day ÷ 24 = <b>${f(r.gph)} gal/hr</b>` },
    { what: "Detention time", math: `${f(r.volumeGal)} gal ÷ ${f(r.gph)} gal/hr = <b>${f(r.dtHours, r.dtHours < 10 ? 2 : 1)} hours</b>` },
  ];
  if (r.dtHours < 2) steps.push({ what: "In minutes", math: `${f(r.dtHours, 2)} × 60 = <b>${f(r.dtMinutes, 0)} minutes</b>` });
  if (r.dtHours >= 48) steps.push({ what: "In days", math: `${f(r.dtHours, 1)} ÷ 24 = <b>${f(r.dtDays, 1)} days</b>` });
  return steps;
}

const sorStep = (r: ClarifierResult): Step => ({
  what: "Surface overflow rate",
  math: `${f(r.flowPerUnitGpd)} gal/day ÷ ${f(r.surfaceFt2)} ft² = <b>${f(r.sor, 0)} gpd/ft²</b>`,
});

function worSteps(i: ClarifierInput, r: ClarifierResult): Step[] {
  return [
    r.weirFromDiameter
      ? { what: "Weir length, one peripheral weir", math: `3.14 × ${f(i.diameter)} ft = <b>${f(r.weirFt, 1)} ft</b>` }
      : null,
    {
      what: "Weir overflow rate",
      math: `${f(r.flowPerUnitGpd)} gal/day ÷ ${f(r.weirFt, 1)} ft = <b>${f(r.wor, 0)} gpd/ft</b>`,
    },
  ].filter((s): s is Step => s !== null);
}

function slrSteps(i: ClarifierInput, r: ClarifierResult): Step[] {
  return [
    r.rasMgd > 0 ? flowStep("RAS flow", i.ras, i.rasUnit, r.rasMgd) : null,
    r.rasMgd > 0 && i.units > 1
      ? {
          what: `RAS to each of ${i.units} units`,
          math: `${f(r.rasMgd, 4)} MGD ÷ ${i.units} = <b>${f(r.rasPerUnitMgd, 4)} MGD</b>`,
        }
      : null,
    {
      what: "Solids applied",
      math: `(${f(r.flowPerUnitMgd, 4)} + ${f(r.rasPerUnitMgd, 4)}) MGD × ${f(i.mlss)} mg/L × 8.34 = <b>${f(r.solidsLbPerDay)} lb/day</b>`,
    },
    {
      what: "Solids loading rate",
      math: `${f(r.solidsLbPerDay)} lb/day ÷ ${f(r.surfaceFt2)} ft² = <b>${f(r.slr, 1)} lb/day/ft²</b>`,
    },
  ].filter((s): s is Step => s !== null);
}

export function clarifierSteps(mode: ClarifierMode, i: ClarifierInput, r: ClarifierResult): Step[] {
  const steps: (Step | null)[] = commonSteps(mode, i, r);
  if (mode === "all" || mode === "dt") steps.push(...dtSteps(r));
  if (mode === "all" || mode === "sor") steps.push(sorStep(r));
  if (mode === "all" || mode === "wor") steps.push(...worSteps(i, r));
  if (showsSlr(mode, i)) steps.push(...slrSteps(i, r));
  return steps.filter((s): s is Step => s !== null);
}
