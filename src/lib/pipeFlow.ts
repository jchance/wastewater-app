import { formatNumber as f } from "./dosage";
import type { Step } from "./processControl";

export type PipeMode = "velocity" | "manning" | "hazen";
export type PipeFlowUnit = "gpm" | "mgd" | "cfs";

export const GPM_PER_CFS = 448.83;
export const MGD_PER_CFS = 0.6463;
export const FT_PER_PSI = 2.31;
export const SCOUR_FPS = 2;

export const pipeFlowUnits: Record<PipeFlowUnit, { label: string; toCfs: (v: number) => number }> = {
  gpm: { label: "gpm", toCfs: (v) => v / GPM_PER_CFS },
  mgd: { label: "MGD", toCfs: (v) => (v * 1_000_000) / 1440 / GPM_PER_CFS },
  cfs: { label: "cfs", toCfs: (v) => v },
};

export const pipeModes: { id: PipeMode; label: string; long: string }[] = [
  { id: "velocity", label: "Velocity", long: "Full pipe, Q = V × A" },
  { id: "manning", label: "Gravity sewer", long: "Manning, partly full" },
  { id: "hazen", label: "Force main", long: "Hazen-Williams head loss" },
];

// Typical design values. Many utilities use n = 0.013 for every material.
export const manningPresets = [
  { id: "pvc", name: "PVC / HDPE", n: 0.011 },
  { id: "concrete", name: "Concrete", n: 0.013 },
  { id: "vcp", name: "Vitrified clay", n: 0.013 },
  { id: "design", name: "Design standard (any)", n: 0.013 },
  { id: "brick", name: "Old brick", n: 0.015 },
];

export const hazenPresets = [
  { id: "pvc", name: "PVC / HDPE", c: 140 },
  { id: "di", name: "Ductile iron, cement lined", c: 120 },
  { id: "old", name: "Old or tuberculated iron", c: 100 },
];

export interface PipeInput {
  diameter: number;
  flow: number;
  flowUnit: PipeFlowUnit;
  depth: number;
  slope: number;
  n: number;
  length: number;
  c: number;
}

export interface PipeResult {
  diameterFt: number;
  areaFt2: number;
  flowCfs: number;
  velocity: number;
  scourCfs: number;
  scourGpm: number;
  // Manning
  depthRatio: number;
  theta: number;
  wetArea: number;
  wetPerimeter: number;
  hydraulicRadius: number;
  manningVelocity: number;
  manningCfs: number;
  manningGpm: number;
  manningMgd: number;
  fullCfs: number;
  fullGpm: number;
  percentFull: number;
  // Hazen-Williams
  flowGpm: number;
  headLossFt: number;
  headLossPsi: number;
  headLossPer1000: number;
}

export type PipeOutcome = { ok: true; result: PipeResult } | { ok: false; message: string };

export const pipeModeFields: Record<PipeMode, (keyof PipeInput)[]> = {
  velocity: ["diameter", "flow"],
  manning: ["diameter", "depth", "slope", "n"],
  hazen: ["diameter", "flow", "length", "c"],
};

const manningVelocity = (n: number, r: number, s: number) => (1.486 / n) * Math.pow(r, 2 / 3) * Math.sqrt(s);

export function calculatePipe(mode: PipeMode, input: PipeInput): PipeOutcome {
  for (const key of pipeModeFields[mode]) {
    const v = input[key] as number;
    if (!Number.isFinite(v)) return { ok: false, message: "Fill in every field to see the answer." };
    if (v <= 0) return { ok: false, message: "Every value needs to be greater than zero." };
  }
  if (mode === "manning" && input.depth > input.diameter) {
    return { ok: false, message: "Depth of flow can't be more than the pipe diameter." };
  }

  const diameterFt = input.diameter / 12;
  const areaFt2 = (Math.PI * diameterFt ** 2) / 4;
  const flowCfs = pipeFlowUnits[input.flowUnit].toCfs(input.flow || 0);
  const scourCfs = SCOUR_FPS * areaFt2;

  const depthRatio = Math.min(input.depth / input.diameter, 1);
  const theta = 2 * Math.acos(1 - 2 * depthRatio);
  const wetArea = (diameterFt ** 2 / 8) * (theta - Math.sin(theta));
  const wetPerimeter = (diameterFt * theta) / 2;
  const hydraulicRadius = wetArea / wetPerimeter;
  const s = input.slope / 100;
  const mv = manningVelocity(input.n, hydraulicRadius, s);
  const manningCfs = mv * wetArea;
  const fullCfs = manningVelocity(input.n, diameterFt / 4, s) * areaFt2;

  const flowGpm = flowCfs * GPM_PER_CFS;
  const headLossFt =
    0.002083 * input.length * Math.pow(100 / input.c, 1.85) * (Math.pow(flowGpm, 1.85) / Math.pow(input.diameter, 4.8655));

  return {
    ok: true,
    result: {
      diameterFt,
      areaFt2,
      flowCfs,
      velocity: flowCfs / areaFt2,
      scourCfs,
      scourGpm: scourCfs * GPM_PER_CFS,
      depthRatio,
      theta,
      wetArea,
      wetPerimeter,
      hydraulicRadius,
      manningVelocity: mv,
      manningCfs,
      manningGpm: manningCfs * GPM_PER_CFS,
      manningMgd: manningCfs * MGD_PER_CFS,
      fullCfs,
      fullGpm: fullCfs * GPM_PER_CFS,
      percentFull: (manningCfs / fullCfs) * 100,
      flowGpm,
      headLossFt,
      headLossPsi: headLossFt / FT_PER_PSI,
      headLossPer1000: (headLossFt / input.length) * 1000,
    },
  };
}

const flowToCfs: Record<PipeFlowUnit, (v: number, cfs: number) => string> = {
  gpm: (v, cfs) => `${f(v)} gpm ÷ 448.83 = <b>${f(cfs, 4)} cfs</b>`,
  mgd: (v, cfs) => `${f(v)} MGD ÷ 0.6463 = <b>${f(cfs, 4)} cfs</b>`,
  cfs: () => "",
};

export function pipeSteps(mode: PipeMode, i: PipeInput, r: PipeResult): Step[] {
  const diameter: Step = { what: "Diameter in feet", math: `${f(i.diameter)} in ÷ 12 = <b>${f(r.diameterFt, 4)} ft</b>` };
  const area: Step = {
    what: "Pipe area",
    math: `0.7854 × ${f(r.diameterFt, 4)}² = <b>${f(r.areaFt2, 4)} ft²</b>`,
  };
  const toCfs: Step | null =
    i.flowUnit === "cfs" ? null : { what: "Flow in cubic feet per second", math: flowToCfs[i.flowUnit](i.flow, r.flowCfs) };
  let steps: (Step | null)[];

  if (mode === "velocity") {
    steps = [
      diameter,
      area,
      toCfs,
      { what: "Velocity", math: `${f(r.flowCfs, 4)} cfs ÷ ${f(r.areaFt2, 4)} ft² = <b>${f(r.velocity, 2)} ft/s</b>` },
      {
        what: "Flow needed to reach 2 ft/s",
        math: `2 ft/s × ${f(r.areaFt2, 4)} ft² = ${f(r.scourCfs, 4)} cfs × 448.83 = <b>${f(r.scourGpm)} gpm</b>`,
      },
    ];
  } else if (mode === "manning") {
    const full = r.depthRatio >= 1;
    steps = [
      diameter,
      { what: "Depth ratio d/D", math: `${f(i.depth)} ÷ ${f(i.diameter)} = <b>${f(r.depthRatio, 3)}</b>` },
      full
        ? null
        : {
            what: "Wetted angle θ (radians)",
            math: `2 × acos(1 − 2 × ${f(r.depthRatio, 3)}) = <b>${f(r.theta, 4)}</b>`,
          },
      full
        ? { what: "Flow area (full pipe)", math: `0.7854 × ${f(r.diameterFt, 4)}² = <b>${f(r.wetArea, 4)} ft²</b>` }
        : {
            what: "Flow area",
            math: `${f(r.diameterFt, 4)}² ÷ 8 × (${f(r.theta, 4)} − sin ${f(r.theta, 4)}) = <b>${f(r.wetArea, 4)} ft²</b>`,
          },
      {
        what: "Wetted perimeter",
        math: `${f(r.diameterFt, 4)} × ${f(r.theta, 4)} ÷ 2 = <b>${f(r.wetPerimeter, 4)} ft</b>`,
      },
      {
        what: "Hydraulic radius",
        math: `${f(r.wetArea, 4)} ÷ ${f(r.wetPerimeter, 4)} = <b>${f(r.hydraulicRadius, 4)} ft</b>`,
      },
      { what: "Slope as a decimal", math: `${f(i.slope, 3)}% ÷ 100 = <b>${f(i.slope / 100, 5)} ft/ft</b>` },
      {
        what: "Velocity (Manning)",
        math: `1.486 ÷ ${f(i.n, 3)} × ${f(r.hydraulicRadius, 4)}<sup>2/3</sup> × ${f(i.slope / 100, 5)}<sup>1/2</sup> = <b>${f(r.manningVelocity, 2)} ft/s</b>`,
      },
      {
        what: "Flow",
        math: `${f(r.manningVelocity, 2)} ft/s × ${f(r.wetArea, 4)} ft² = <b>${f(r.manningCfs, 4)} cfs</b> = <b>${f(r.manningGpm)} gpm</b>`,
      },
      {
        what: "Full-pipe capacity (R = D ÷ 4)",
        math: `1.486 ÷ ${f(i.n, 3)} × ${f(r.diameterFt / 4, 4)}<sup>2/3</sup> × ${f(i.slope / 100, 5)}<sup>1/2</sup> × ${f(r.areaFt2, 4)} = <b>${f(r.fullGpm)} gpm</b>`,
      },
    ];
  } else {
    steps = [
      i.flowUnit === "gpm"
        ? null
        : {
            what: "Flow in gpm",
            math:
              i.flowUnit === "mgd"
                ? `${f(i.flow)} MGD × 1,000,000 ÷ 1,440 = <b>${f(r.flowGpm)} gpm</b>`
                : `${f(i.flow)} cfs × 448.83 = <b>${f(r.flowGpm)} gpm</b>`,
          },
      {
        what: "Friction factor",
        math: `(100 ÷ ${f(i.c)})<sup>1.85</sup> = <b>${f(Math.pow(100 / i.c, 1.85), 4)}</b>`,
      },
      {
        what: "Head loss (Hazen-Williams)",
        math: `0.002083 × ${f(i.length)} ft × ${f(Math.pow(100 / i.c, 1.85), 4)} × ${f(r.flowGpm)}<sup>1.85</sup> ÷ ${f(i.diameter)}<sup>4.8655</sup> = <b>${f(r.headLossFt, 1)} ft</b>`,
      },
      { what: "As pressure", math: `${f(r.headLossFt, 1)} ft ÷ 2.31 = <b>${f(r.headLossPsi, 1)} psi</b>` },
      diameter,
      area,
      toCfs,
      { what: "Velocity", math: `${f(r.flowCfs, 4)} cfs ÷ ${f(r.areaFt2, 4)} ft² = <b>${f(r.velocity, 2)} ft/s</b>` },
    ];
  }
  return steps.filter((s): s is Step => s !== null && s.math !== "");
}
