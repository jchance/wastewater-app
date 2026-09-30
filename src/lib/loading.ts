import { LB_PER_GAL_WATER, flowUnits, formatNumber as f, type FlowUnit } from "./dosage";
import type { Step } from "./processControl";

export type LoadingMode = "pounds" | "removal" | "organic" | "pe";
export type MediaType = "tf" | "rbc" | "pond";

export const DEFAULT_LB_BOD_PER_PERSON = 0.17;

export const loadingModes: { id: LoadingMode; label: string; long: string }[] = [
  { id: "removal", label: "Removal", long: "Percent removal" },
  { id: "pounds", label: "Pounds", long: "Pounds per day" },
  { id: "organic", label: "Organic load", long: "Organic loading rate" },
  { id: "pe", label: "Pop. equiv.", long: "Population equivalent" },
];

export const parameters = ["BOD", "TSS", "NH₃-N", "Total P", "COD"] as const;

export const mediaTypes: Record<MediaType, { label: string; rateUnit: string }> = {
  tf: { label: "Trickling filter", rateUnit: "lb BOD/day per 1,000 ft³" },
  rbc: { label: "RBC", rateUnit: "lb SBOD/day per 1,000 ft²" },
  pond: { label: "Pond / lagoon", rateUnit: "lb BOD/day per acre" },
};

export interface LoadingInput {
  flow: number;
  flowUnit: FlowUnit;
  parameter: string;
  conc: number;
  influent: number;
  /** Optional sample points between influent and final effluent. Blank = skipped. */
  primaryEff: number;
  secondaryEff: number;
  finalEff: number;
  /** Optional in removal mode: blank = no pounds shown. */
  removalFlow: number;
  removalFlowUnit: FlowUnit;
  media: MediaType;
  tfDiameter: number;
  tfDepth: number;
  rbcArea: number;
  pondAcres: number;
  bod: number;
  perCapita: number;
}

export interface Stage {
  from: string;
  to: string;
  inConc: number;
  outConc: number;
  percent: number;
  lbRemoved: number;
}

export interface LoadingResult {
  flowMgd: number;
  lbPerDay: number;
  removalMgd: number;
  stages: Stage[];
  overallPercent: number;
  overallLbRemoved: number;
  bodLbPerDay: number;
  mediaSize: number;
  mediaDivisor: number;
  organicRate: number;
  population: number;
}

export type LoadingOutcome = { ok: true; result: LoadingResult } | { ok: false; message: string };

export const modeFields: Record<LoadingMode, (keyof LoadingInput)[]> = {
  pounds: ["flow", "parameter", "conc"],
  removal: ["parameter", "influent", "primaryEff", "secondaryEff", "finalEff", "removalFlow"],
  organic: ["flow", "bod", "media", "tfDiameter", "tfDepth", "rbcArea", "pondAcres"],
  pe: ["flow", "bod", "perCapita"],
};

export const optionalFields: (keyof LoadingInput)[] = ["primaryEff", "secondaryEff", "removalFlow"];

const mediaFields: Record<MediaType, (keyof LoadingInput)[]> = {
  tf: ["tfDiameter", "tfDepth"],
  rbc: ["rbcArea"],
  pond: ["pondAcres"],
};
const allMediaFields = Object.values(mediaFields).flat();

/** Fields the current mode and media choice actually read. */
export function activeFields(mode: LoadingMode, media: MediaType): (keyof LoadingInput)[] {
  return modeFields[mode].filter((k) => !allMediaFields.includes(k) || mediaFields[media].includes(k));
}

const lbs = (mgL: number, mgd: number) => mgL * mgd * LB_PER_GAL_WATER;

export function calculateLoading(mode: LoadingMode, input: LoadingInput): LoadingOutcome {
  for (const key of activeFields(mode, input.media)) {
    const v = input[key];
    if (typeof v !== "number") continue;
    const optional = optionalFields.includes(key);
    if (Number.isNaN(v) && optional) continue;
    if (!Number.isFinite(v)) return { ok: false, message: "Fill in every field to see the answer." };
    if (v < 0) return { ok: false, message: "Values can't be negative." };
    if (v === 0 && !optional && key !== "finalEff" && key !== "conc") {
      return { ok: false, message: "Required values need to be greater than zero." };
    }
  }

  const flowMgd = flowUnits[input.flowUnit].toMgd(input.flow || 0);
  const removalMgd = Number.isFinite(input.removalFlow)
    ? flowUnits[input.removalFlowUnit].toMgd(input.removalFlow)
    : 0;

  const points = [
    { name: "Influent", conc: input.influent },
    { name: "Primary effluent", conc: input.primaryEff },
    { name: "Secondary effluent", conc: input.secondaryEff },
    { name: "Final effluent", conc: input.finalEff },
  ].filter((p) => Number.isFinite(p.conc));

  if (mode === "removal") {
    for (let i = 1; i < points.length; i++) {
      if (points[i].conc > points[i - 1].conc) {
        return {
          ok: false,
          message: `${points[i].name} is higher than ${points[i - 1].name.toLowerCase()}. Check the order of the samples; a stage that adds load shows as negative removal.`,
        };
      }
    }
  }

  const stages: Stage[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    stages.push({
      from: a.name,
      to: b.name,
      inConc: a.conc,
      outConc: b.conc,
      percent: ((a.conc - b.conc) / a.conc) * 100,
      lbRemoved: lbs(a.conc - b.conc, removalMgd),
    });
  }

  const bodLbPerDay = lbs(input.bod, flowMgd);
  let mediaSize = 0;
  let mediaDivisor = 1;
  if (input.media === "tf") {
    mediaSize = 0.785 * input.tfDiameter ** 2 * input.tfDepth;
    mediaDivisor = mediaSize / 1000;
  } else if (input.media === "rbc") {
    mediaSize = input.rbcArea;
    mediaDivisor = mediaSize / 1000;
  } else {
    mediaSize = input.pondAcres;
    mediaDivisor = mediaSize;
  }

  return {
    ok: true,
    result: {
      flowMgd,
      lbPerDay: lbs(input.conc, flowMgd),
      removalMgd,
      stages,
      overallPercent: ((input.influent - input.finalEff) / input.influent) * 100,
      overallLbRemoved: lbs(input.influent - input.finalEff, removalMgd),
      bodLbPerDay,
      mediaSize,
      mediaDivisor,
      organicRate: bodLbPerDay / mediaDivisor,
      population: bodLbPerDay / input.perCapita,
    },
  };
}

const flowStep = (value: number, unit: FlowUnit, mgd: number): Step | null =>
  unit === "mgd"
    ? null
    : {
        what: "Convert flow to MGD",
        math:
          unit === "gpm"
            ? `${f(value)} gpm × 1,440 ÷ 1,000,000 = <b>${f(mgd, 4)} MGD</b>`
            : `${f(value)} gal/day ÷ 1,000,000 = <b>${f(mgd, 4)} MGD</b>`,
      };

export function loadingSteps(mode: LoadingMode, i: LoadingInput, r: LoadingResult): Step[] {
  let steps: (Step | null)[] = [];
  if (mode === "pounds") {
    steps = [
      flowStep(i.flow, i.flowUnit, r.flowMgd),
      {
        what: `${i.parameter} load`,
        math: `${f(i.conc)} mg/L × ${f(r.flowMgd, 4)} MGD × 8.34 = <b>${f(r.lbPerDay)} lb/day</b>`,
      },
    ];
  } else if (mode === "removal") {
    const withPounds = r.removalMgd > 0;
    steps = [withPounds ? flowStep(i.removalFlow, i.removalFlowUnit, r.removalMgd) : null];
    for (const s of r.stages) {
      steps.push({
        what: `${s.from} → ${s.to.toLowerCase()}`,
        math:
          `(${f(s.inConc)} − ${f(s.outConc)}) ÷ ${f(s.inConc)} × 100 = <b>${f(s.percent, 1)}%</b>` +
          (withPounds
            ? `<br>${f(s.inConc - s.outConc)} mg/L × ${f(r.removalMgd, 4)} MGD × 8.34 = <b>${f(s.lbRemoved)} lb/day</b>`
            : ""),
      });
    }
    if (r.stages.length > 1) {
      steps.push({
        what: "Overall, influent → final effluent",
        math:
          `(${f(i.influent)} − ${f(i.finalEff)}) ÷ ${f(i.influent)} × 100 = <b>${f(r.overallPercent, 1)}%</b>` +
          (withPounds
            ? `<br>${f(i.influent - i.finalEff)} mg/L × ${f(r.removalMgd, 4)} MGD × 8.34 = <b>${f(r.overallLbRemoved)} lb/day</b>`
            : ""),
      });
    }
  } else if (mode === "organic") {
    const bodName = i.media === "rbc" ? "Soluble BOD" : "BOD";
    steps = [
      flowStep(i.flow, i.flowUnit, r.flowMgd),
      {
        what: `${bodName} load`,
        math: `${f(i.bod)} mg/L × ${f(r.flowMgd, 4)} MGD × 8.34 = <b>${f(r.bodLbPerDay)} lb/day</b>`,
      },
    ];
    if (i.media === "tf") {
      steps.push(
        {
          what: "Media volume",
          math: `0.785 × ${f(i.tfDiameter)} ft × ${f(i.tfDiameter)} ft × ${f(i.tfDepth)} ft = <b>${f(r.mediaSize)} ft³</b>`,
        },
        { what: "In thousands of ft³", math: `${f(r.mediaSize)} ÷ 1,000 = <b>${f(r.mediaDivisor, 2)}</b>` },
        {
          what: "Organic loading",
          math: `${f(r.bodLbPerDay)} ÷ ${f(r.mediaDivisor, 2)} = <b>${f(r.organicRate, 1)} lb/day per 1,000 ft³</b>`,
        },
      );
    } else if (i.media === "rbc") {
      steps.push(
        { what: "Media area in thousands of ft²", math: `${f(r.mediaSize)} ÷ 1,000 = <b>${f(r.mediaDivisor, 1)}</b>` },
        {
          what: "Organic loading",
          math: `${f(r.bodLbPerDay)} ÷ ${f(r.mediaDivisor, 1)} = <b>${f(r.organicRate, 2)} lb/day per 1,000 ft²</b>`,
        },
      );
    } else {
      steps.push({
        what: "Organic loading",
        math: `${f(r.bodLbPerDay)} ÷ ${f(i.pondAcres)} acres = <b>${f(r.organicRate, 1)} lb/day per acre</b>`,
      });
    }
  } else {
    steps = [
      flowStep(i.flow, i.flowUnit, r.flowMgd),
      {
        what: "BOD load",
        math: `${f(i.bod)} mg/L × ${f(r.flowMgd, 4)} MGD × 8.34 = <b>${f(r.bodLbPerDay)} lb/day</b>`,
      },
      {
        what: "Population equivalent",
        math: `${f(r.bodLbPerDay)} ÷ ${f(i.perCapita)} lb/person·day = <b>${f(r.population, 0)} people</b>`,
      },
    ];
  }
  return steps.filter((s): s is Step => s !== null);
}

/** Per-stage removal rows for the results panel. */
export const renderStages = (r: LoadingResult) =>
  r.stages
    .map(
      (s) =>
        `<li><span>${s.from} → ${s.to.toLowerCase()}</span><b>${f(s.percent, 1)}%</b>${
          r.removalMgd > 0 ? `<span class="stage-lb">${f(s.lbRemoved)} lb/day</span>` : ""
        }</li>`,
    )
    .join("");
