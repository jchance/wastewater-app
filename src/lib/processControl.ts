import { LB_PER_GAL_WATER, flowUnits, formatNumber as f, type FlowUnit } from "./dosage";

export type ProcessMode = "fm" | "mcrt" | "svi" | "was";
export type VolumeUnit = "mg" | "gal";

export const volumeUnits: Record<VolumeUnit, { label: string; toMg: (v: number) => number }> = {
  mg: { label: "MG", toMg: (v) => v },
  gal: { label: "gal", toMg: (v) => v / 1_000_000 },
};

export const processModes: { id: ProcessMode; label: string; long: string }[] = [
  { id: "fm", label: "F/M", long: "Food to microorganism ratio" },
  { id: "mcrt", label: "MCRT", long: "Mean cell residence time" },
  { id: "svi", label: "SVI", long: "Sludge volume index" },
  { id: "was", label: "WAS rate", long: "Waste rate for a target MCRT" },
];

export interface ProcessInput {
  flow: number;
  flowUnit: FlowUnit;
  bod: number;
  aerationVolume: number;
  aerationUnit: VolumeUnit;
  mlss: number;
  mlvss: number;
  /** Optional: blank counts as zero. */
  clarifierVolume: number;
  clarifierUnit: VolumeUnit;
  /** Optional: blank counts as zero. */
  clarifierTss: number;
  wasFlow: number;
  wasFlowUnit: FlowUnit;
  wasTss: number;
  effluentTss: number;
  ssv30: number;
  targetMcrt: number;
}

export interface ProcessResult {
  flowMgd: number;
  aerationMg: number;
  clarifierMg: number;
  wasMgd: number;
  bodLbPerDay: number;
  mlvssLb: number;
  fm: number;
  aerationLb: number;
  clarifierLb: number;
  inventoryLb: number;
  wasLbPerDay: number;
  effluentLbPerDay: number;
  solidsOutLbPerDay: number;
  mcrt: number;
  svi: number;
  targetOutLbPerDay: number;
  targetWasLbPerDay: number;
  targetWasMgd: number;
  targetWasGpd: number;
  targetWasGpm: number;
}

export type ProcessOutcome = { ok: true; result: ProcessResult } | { ok: false; message: string };

/** Fields each mode reads. Drives which inputs are shown and validated. */
export const modeFields: Record<ProcessMode, (keyof ProcessInput)[]> = {
  fm: ["flow", "bod", "aerationVolume", "mlvss"],
  mcrt: ["aerationVolume", "mlss", "clarifierVolume", "clarifierTss", "wasFlow", "wasTss", "flow", "effluentTss"],
  svi: ["ssv30", "mlss"],
  was: ["targetMcrt", "aerationVolume", "mlss", "clarifierVolume", "clarifierTss", "wasTss", "flow", "effluentTss"],
};

export const optionalFields: (keyof ProcessInput)[] = ["clarifierVolume", "clarifierTss", "effluentTss"];

const lbs = (mgL: number, millionGal: number) => mgL * millionGal * LB_PER_GAL_WATER;

export function calculateProcess(mode: ProcessMode, raw: ProcessInput): ProcessOutcome {
  const input = { ...raw };
  for (const key of optionalFields) {
    if (Number.isNaN(input[key] as number)) (input[key] as number) = 0;
  }
  const needed = modeFields[mode];
  for (const key of needed) {
    const v = input[key] as number;
    if (!Number.isFinite(v)) return { ok: false, message: "Fill in every field to see the answer." };
    if (v < 0) return { ok: false, message: "Values can't be negative." };
    if (v === 0 && !optionalFields.includes(key)) {
      return { ok: false, message: "Required values need to be greater than zero." };
    }
  }

  const flowMgd = flowUnits[input.flowUnit].toMgd(input.flow || 0);
  const aerationMg = volumeUnits[input.aerationUnit].toMg(input.aerationVolume || 0);
  const clarifierMg = volumeUnits[input.clarifierUnit].toMg(input.clarifierVolume || 0);
  const wasMgd = flowUnits[input.wasFlowUnit].toMgd(input.wasFlow || 0);

  const bodLbPerDay = lbs(input.bod, flowMgd);
  const mlvssLb = lbs(input.mlvss, aerationMg);
  const aerationLb = lbs(input.mlss, aerationMg);
  const clarifierLb = lbs(input.clarifierTss, clarifierMg);
  const inventoryLb = aerationLb + clarifierLb;
  const wasLbPerDay = lbs(input.wasTss, wasMgd);
  const effluentLbPerDay = lbs(input.effluentTss, flowMgd);
  const solidsOutLbPerDay = wasLbPerDay + effluentLbPerDay;

  const targetOutLbPerDay = input.targetMcrt > 0 ? inventoryLb / input.targetMcrt : NaN;
  const targetWasLbPerDay = targetOutLbPerDay - effluentLbPerDay;
  if (mode === "was" && targetWasLbPerDay <= 0) {
    return {
      ok: false,
      message:
        "Effluent solids alone already remove more than the target allows. Check the effluent TSS, or the target MCRT is longer than this system can hold.",
    };
  }
  const targetWasMgd = targetWasLbPerDay / (input.wasTss * LB_PER_GAL_WATER);

  return {
    ok: true,
    result: {
      flowMgd,
      aerationMg,
      clarifierMg,
      wasMgd,
      bodLbPerDay,
      mlvssLb,
      fm: bodLbPerDay / mlvssLb,
      aerationLb,
      clarifierLb,
      inventoryLb,
      wasLbPerDay,
      effluentLbPerDay,
      solidsOutLbPerDay,
      mcrt: inventoryLb / solidsOutLbPerDay,
      svi: (input.ssv30 * 1000) / input.mlss,
      targetOutLbPerDay,
      targetWasLbPerDay,
      targetWasMgd,
      targetWasGpd: targetWasMgd * 1_000_000,
      targetWasGpm: (targetWasMgd * 1_000_000) / 1440,
    },
  };
}

export interface Step {
  what: string;
  math: string;
}

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

const volumeStep = (label: string, value: number, unit: VolumeUnit, mg: number): Step | null =>
  unit === "mg" ? null : { what: `Convert ${label} to MG`, math: `${f(value)} gal ÷ 1,000,000 = <b>${f(mg, 4)} MG</b>` };

function inventorySteps(i: ProcessInput, r: ProcessResult): (Step | null)[] {
  const hasClarifier = r.clarifierLb > 0;
  return [
    volumeStep("aeration volume", i.aerationVolume, i.aerationUnit, r.aerationMg),
    {
      what: "Solids under aeration",
      math: `${f(i.mlss)} mg/L × ${f(r.aerationMg, 4)} MG × 8.34 = <b>${f(r.aerationLb)} lb</b>`,
    },
    hasClarifier ? volumeStep("clarifier volume", i.clarifierVolume, i.clarifierUnit, r.clarifierMg) : null,
    hasClarifier
      ? {
          what: "Solids in the clarifiers",
          math: `${f(i.clarifierTss)} mg/L × ${f(r.clarifierMg, 4)} MG × 8.34 = <b>${f(r.clarifierLb)} lb</b>`,
        }
      : null,
    hasClarifier
      ? {
          what: "Total solids inventory",
          math: `${f(r.aerationLb)} + ${f(r.clarifierLb)} = <b>${f(r.inventoryLb)} lb</b>`,
        }
      : null,
  ];
}

function effluentSteps(i: ProcessInput, r: ProcessResult): (Step | null)[] {
  return [
    flowStep("plant flow", i.flow, i.flowUnit, r.flowMgd),
    {
      what: "Solids lost over the weirs",
      math: `${f(i.effluentTss)} mg/L × ${f(r.flowMgd, 4)} MGD × 8.34 = <b>${f(r.effluentLbPerDay)} lb/day</b>`,
    },
  ];
}

export function processSteps(mode: ProcessMode, i: ProcessInput, r: ProcessResult): Step[] {
  let steps: (Step | null)[] = [];
  if (mode === "fm") {
    steps = [
      flowStep("plant flow", i.flow, i.flowUnit, r.flowMgd),
      {
        what: "Food: pounds of BOD entering aeration",
        math: `${f(i.bod)} mg/L × ${f(r.flowMgd, 4)} MGD × 8.34 = <b>${f(r.bodLbPerDay)} lb/day</b>`,
      },
      volumeStep("aeration volume", i.aerationVolume, i.aerationUnit, r.aerationMg),
      {
        what: "Microorganisms: pounds of MLVSS",
        math: `${f(i.mlvss)} mg/L × ${f(r.aerationMg, 4)} MG × 8.34 = <b>${f(r.mlvssLb)} lb</b>`,
      },
      { what: "F/M ratio", math: `${f(r.bodLbPerDay)} ÷ ${f(r.mlvssLb)} = <b>${f(r.fm, 2)}</b>` },
    ];
  } else if (mode === "mcrt") {
    steps = [
      ...inventorySteps(i, r),
      flowStep("WAS flow", i.wasFlow, i.wasFlowUnit, r.wasMgd),
      {
        what: "Solids wasted",
        math: `${f(i.wasTss)} mg/L × ${f(r.wasMgd, 4)} MGD × 8.34 = <b>${f(r.wasLbPerDay)} lb/day</b>`,
      },
      ...effluentSteps(i, r),
      {
        what: "Solids leaving the system",
        math: `${f(r.wasLbPerDay)} + ${f(r.effluentLbPerDay)} = <b>${f(r.solidsOutLbPerDay)} lb/day</b>`,
      },
      { what: "MCRT", math: `${f(r.inventoryLb)} ÷ ${f(r.solidsOutLbPerDay)} = <b>${f(r.mcrt, 1)} days</b>` },
    ];
  } else if (mode === "svi") {
    steps = [
      {
        what: "SVI",
        math: `${f(i.ssv30)} mL/L × 1,000 ÷ ${f(i.mlss)} mg/L = <b>${f(r.svi, 0)} mL/g</b>`,
      },
    ];
  } else {
    steps = [
      ...inventorySteps(i, r),
      {
        what: "Solids that must leave each day",
        math: `${f(r.inventoryLb)} lb ÷ ${f(i.targetMcrt)} days = <b>${f(r.targetOutLbPerDay)} lb/day</b>`,
      },
      ...effluentSteps(i, r),
      {
        what: "Solids to waste",
        math: `${f(r.targetOutLbPerDay)} − ${f(r.effluentLbPerDay)} = <b>${f(r.targetWasLbPerDay)} lb/day</b>`,
      },
      {
        what: "WAS flow",
        math: `${f(r.targetWasLbPerDay)} ÷ (${f(i.wasTss)} mg/L × 8.34) = <b>${f(r.targetWasMgd, 5)} MGD</b>`,
      },
      {
        what: "In gallons",
        math: `${f(r.targetWasMgd, 5)} × 1,000,000 = <b>${f(r.targetWasGpd)} gal/day</b> ÷ 1,440 = <b>${f(r.targetWasGpm)} gpm</b>`,
      },
    ];
  }
  return steps.filter((s): s is Step => s !== null);
}

export const renderSteps = (steps: Step[]) =>
  steps
    .map((s) => `<li><span class="step-what">${s.what}</span><span class="step-math">${s.math}</span></li>`)
    .join("");
