import { formatNumber as f } from "./dosage";
import type { Step } from "./processControl";

export const GAL_PER_CUFT = 7.48;
export const FT_PER_PSI = 2.31;
/** gpm × ft ÷ 3960 = water horsepower. 3960 = 33,000 ft·lb/min ÷ 8.34 lb/gal. */
export const HP_CONSTANT = 3960;
export const KW_PER_HP = 0.746;

export type PumpingMode = "rate" | "cycle" | "hp";
export type WellShape = "rectangular" | "circular";
/** Drawdown measured directly, or worked out from pump on/off float elevations. */
export type DepthMethod = "depth" | "floats";

export const pumpingModes: { id: PumpingMode; label: string; long: string }[] = [
  { id: "rate", label: "Pump rate", long: "Pump rate by drawdown test" },
  { id: "cycle", label: "Cycle time", long: "Cycle time and starts per hour" },
  { id: "hp", label: "Horsepower", long: "Horsepower and energy cost" },
];

export interface PumpingInput {
  shape: WellShape;
  length: number;
  width: number;
  diameter: number;
  depthMethod: DepthMethod;
  drawdown: number;
  pumpOn: number;
  pumpOff: number;
  /** Pump-down time, split so operators can enter a stopwatch reading directly. */
  minutes: number;
  seconds: number;
  /** Optional: flow still entering the well during the test, in gpm. */
  influent: number;
  /** Cycle tab: average influent flow, gpm. */
  cycleInflow: number;
  /** Cycle tab: pump capacity, gpm. */
  pumpCapacity: number;
  motorHp: number;
  flowGpm: number;
  head: number;
  pumpEff: number;
  motorEff: number;
  /** Optional energy cost block. */
  showCost: boolean;
  rate: number;
  hoursPerDay: number;
}

export interface PumpingResult {
  areaFt2: number;
  volumeFt3: number;
  volumeGal: number;
  depthFt: number;
  depthFromFloats: boolean;
  totalMinutes: number;
  grossGpm: number;
  netGpm: number;
  hasInfluent: boolean;
  gpd: number;
  mgd: number;
  /* cycle */
  netFillGpm: number;
  fillMinutes: number;
  pumpMinutes: number;
  cycleMinutes: number;
  startsPerHour: number;
  gallonsPerStart: number;
  /* horsepower */
  whp: number;
  bhp: number;
  mhp: number;
  wireToWater: number;
  psi: number;
  kw: number;
  kwhPerDay: number;
  costPerDay: number;
  costPerMg: number;
  volumePerDayGal: number;
  hoursUsed: number;
}

export type PumpingOutcome = { ok: true; result: PumpingResult } | { ok: false; message: string };

/** Which inputs a mode reads, given the shape and depth method. */
export function activeFields(mode: PumpingMode, i: PumpingInput): (keyof PumpingInput)[] {
  const keys: (keyof PumpingInput)[] = [];
  if (mode === "rate" || mode === "cycle") {
    keys.push("shape");
    keys.push(...(i.shape === "circular" ? (["diameter"] as const) : (["length", "width"] as const)));
    keys.push("depthMethod");
    keys.push(...(i.depthMethod === "floats" ? (["pumpOn", "pumpOff"] as const) : (["drawdown"] as const)));
  }
  if (mode === "rate") keys.push("minutes", "seconds", "influent");
  if (mode === "cycle") keys.push("cycleInflow", "pumpCapacity", "motorHp");
  if (mode === "hp") {
    keys.push("flowGpm", "head", "pumpEff", "motorEff", "showCost");
    if (i.showCost) keys.push("rate", "hoursPerDay");
  }
  return keys;
}

/** Fields that may legitimately be left blank. */
const optional = (key: keyof PumpingInput): boolean =>
  key === "influent" || key === "seconds" || key === "motorHp" || key === "rate" || key === "hoursPerDay";

/** Float elevations are read against a site datum, so below-grade levels are negative. */
const signed = (key: keyof PumpingInput): boolean => key === "pumpOn" || key === "pumpOff";

/** Elevations can sit below datum, so negatives get parentheses to stay readable. */
const elev = (n: number) =>
  n < 0 ? `(\u2212${Math.abs(n).toFixed(2)})` : n.toFixed(2);

/** Money always reads better with both cents shown. */
export const money = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function calculatePumping(mode: PumpingMode, i: PumpingInput): PumpingOutcome {
  for (const key of activeFields(mode, i)) {
    const v = i[key];
    if (typeof v !== "number") continue;
    if (Number.isNaN(v) && optional(key)) continue;
    if (!Number.isFinite(v)) return { ok: false, message: "Fill in every field to see the answer." };
    if (signed(key)) continue;
    if (v < 0) return { ok: false, message: "Values can't be negative." };
    if (v === 0 && !optional(key)) return { ok: false, message: "Required values need to be greater than zero." };
  }

  const depthFromFloats = i.depthMethod === "floats";
  const depthFt = depthFromFloats ? i.pumpOn - i.pumpOff : i.drawdown;
  if ((mode === "rate" || mode === "cycle") && depthFromFloats && depthFt <= 0) {
    return { ok: false, message: "The pump-on level has to be above the pump-off level." };
  }

  const areaFt2 = i.shape === "circular" ? 0.785 * i.diameter ** 2 : i.length * i.width;
  const volumeFt3 = areaFt2 * depthFt;
  const volumeGal = volumeFt3 * GAL_PER_CUFT;

  const seconds = Number.isFinite(i.seconds) ? i.seconds : 0;
  const totalMinutes = i.minutes + seconds / 60;
  if (mode === "rate" && totalMinutes <= 0) {
    return { ok: false, message: "Enter how long the pump ran." };
  }

  const grossGpm = volumeGal / totalMinutes;
  const hasInfluent = Number.isFinite(i.influent) && i.influent > 0;
  const netGpm = hasInfluent ? grossGpm + i.influent : grossGpm;
  const gpd = netGpm * 1440;

  /* cycle */
  const netFillGpm = i.cycleInflow;
  const fillMinutes = volumeGal / netFillGpm;
  const drainGpm = i.pumpCapacity - i.cycleInflow;
  const pumpMinutes = volumeGal / drainGpm;
  const cycleMinutes = fillMinutes + pumpMinutes;
  if (mode === "cycle" && drainGpm <= 0) {
    return { ok: false, message: "The pump has to move more than the incoming flow or the well never draws down." };
  }

  /* horsepower */
  const pumpEff = i.pumpEff / 100;
  const motorEff = i.motorEff / 100;
  const whp = (i.flowGpm * i.head) / HP_CONSTANT;
  const bhp = whp / pumpEff;
  const mhp = bhp / motorEff;
  const kw = mhp * KW_PER_HP;
  const hoursPerDay = Number.isFinite(i.hoursPerDay) && i.hoursPerDay > 0 ? i.hoursPerDay : 24;
  const kwhPerDay = kw * hoursPerDay;
  const rate = Number.isFinite(i.rate) ? i.rate : 0;
  const costPerDay = kwhPerDay * rate;
  const volumePerDayGal = i.flowGpm * 60 * hoursPerDay;

  if (mode === "hp" && (i.pumpEff > 100 || i.motorEff > 100)) {
    return { ok: false, message: "Efficiency can't be more than 100%." };
  }

  return {
    ok: true,
    result: {
      areaFt2,
      volumeFt3,
      volumeGal,
      depthFt,
      depthFromFloats,
      totalMinutes,
      grossGpm,
      netGpm,
      hasInfluent,
      gpd,
      mgd: gpd / 1_000_000,
      netFillGpm,
      fillMinutes,
      pumpMinutes,
      cycleMinutes,
      startsPerHour: 60 / cycleMinutes,
      gallonsPerStart: volumeGal,
      whp,
      bhp,
      mhp,
      wireToWater: pumpEff * motorEff * 100,
      psi: i.head / FT_PER_PSI,
      kw,
      kwhPerDay,
      costPerDay,
      costPerMg: volumePerDayGal > 0 ? costPerDay / (volumePerDayGal / 1_000_000) : 0,
      volumePerDayGal,
      hoursUsed: hoursPerDay,
    },
  };
}

/* ------------------------------------------------------------ typical ranges */

/**
 * Typical maximum starts per hour by motor size. These are common manufacturer
 * guidelines, not a substitute for the curve that came with your pump.
 */
export const maxStartsByHp: { label: string; maxStarts: number }[] = [
  { label: "Up to 5 hp", maxStarts: 15 },
  { label: "7.5 – 30 hp", maxStarts: 10 },
  { label: "40 – 100 hp", maxStarts: 6 },
  { label: "Over 100 hp", maxStarts: 4 },
];

export function maxStartsFor(hp: number): { label: string; maxStarts: number } | null {
  if (!Number.isFinite(hp) || hp <= 0) return null;
  if (hp <= 5) return maxStartsByHp[0];
  if (hp <= 30) return maxStartsByHp[1];
  if (hp <= 100) return maxStartsByHp[2];
  return maxStartsByHp[3];
}

export interface RangeNote {
  text: string;
  level: "ok" | "high" | "low";
  concern: boolean;
}

export type PumpingMetric = "startsPerHour" | "wireToWater" | "cycleMinutes";

export function rangeNote(metric: PumpingMetric, value: number, i: PumpingInput): RangeNote | null {
  if (metric === "startsPerHour") {
    const band = maxStartsFor(i.motorHp);
    if (!band) {
      return {
        text: "Enter the motor horsepower to compare this against a typical maximum, then confirm it against your pump curve.",
        level: "ok",
        concern: false,
      };
    }
    const high = value > band.maxStarts;
    return {
      text: `${high ? "Above typical" : "Within typical"}. ${band.label} commonly tops out near ${band.maxStarts} starts per hour. Check the curve or manufacturer data for your pump before acting on this.`,
      level: high ? "high" : "ok",
      concern: high,
    };
  }
  if (metric === "cycleMinutes") {
    const low = value < 5;
    return {
      text: low
        ? "Short cycle. Under about 5 minutes is worth a look at float spacing or pump sizing."
        : "Reasonable cycle length.",
      level: low ? "low" : "ok",
      concern: low,
    };
  }
  const low = value < 45;
  const high = value > 80;
  return {
    text:
      low
        ? "Below typical. Wire-to-water efficiency under about 45% often means a worn impeller, a clogged force main or a pump running off its best efficiency point."
        : high
          ? "Unusually high. Double-check the pump and motor efficiencies you entered."
          : "Within typical. Most lift station pumps land somewhere around 45–80% wire-to-water.",
    level: low ? "low" : high ? "high" : "ok",
    concern: low || high,
  };
}

/* --------------------------------------------------------------------- steps */

function wellSteps(i: PumpingInput, r: PumpingResult): Step[] {
  const steps: Step[] = [];
  if (r.depthFromFloats) {
    steps.push({
      what: "Drawdown from the float elevations",
      math: `${elev(i.pumpOn)} ft − ${elev(i.pumpOff)} ft = <b>${f(r.depthFt, 2)} ft</b>`,
    });
  }
  steps.push(
    i.shape === "circular"
      ? {
          what: "Wet well area",
          math: `0.785 × ${f(i.diameter, 2)} ft × ${f(i.diameter, 2)} ft = <b>${f(r.areaFt2, 1)} ft²</b>`,
        }
      : {
          what: "Wet well area",
          math: `${f(i.length, 2)} ft × ${f(i.width, 2)} ft = <b>${f(r.areaFt2, 1)} ft²</b>`,
        },
  );
  steps.push({
    what: "Volume drawn down",
    math: `${f(r.areaFt2, 1)} ft² × ${f(r.depthFt, 2)} ft = ${f(r.volumeFt3, 1)} ft³ × 7.48 = <b>${f(r.volumeGal)} gal</b>`,
  });
  return steps;
}

function rateSteps(i: PumpingInput, r: PumpingResult): Step[] {
  const steps: Step[] = [];
  const seconds = Number.isFinite(i.seconds) ? i.seconds : 0;
  if (seconds > 0) {
    steps.push({
      what: "Pump-down time in minutes",
      math: `${f(i.minutes, 0)} min + ${f(seconds, 0)} sec ÷ 60 = <b>${f(r.totalMinutes, 2)} min</b>`,
    });
  }
  steps.push({
    what: r.hasInfluent ? "Gross pump rate" : "Pump rate",
    math: `${f(r.volumeGal)} gal ÷ ${f(r.totalMinutes, 2)} min = <b>${f(r.grossGpm, 1)} gpm</b>`,
  });
  if (r.hasInfluent) {
    steps.push({
      what: "Add the flow that kept coming in",
      math: `${f(r.grossGpm, 1)} gpm + ${f(i.influent)} gpm = <b>${f(r.netGpm, 1)} gpm</b>`,
    });
  }
  steps.push({
    what: "Daily volume at that rate",
    math: `${f(r.netGpm, 1)} gpm × 1,440 min = ${f(r.gpd)} gal/day = <b>${f(r.mgd, 3)} MGD</b>`,
  });
  return steps;
}

function cycleSteps(i: PumpingInput, r: PumpingResult): Step[] {
  return [
    {
      what: "Time to fill the well",
      math: `${f(r.volumeGal)} gal ÷ ${f(i.cycleInflow)} gpm in = <b>${f(r.fillMinutes, 2)} min</b>`,
    },
    {
      what: "Net drawdown rate while pumping",
      math: `${f(i.pumpCapacity)} gpm out − ${f(i.cycleInflow)} gpm in = <b>${f(i.pumpCapacity - i.cycleInflow, 1)} gpm</b>`,
    },
    {
      what: "Time to pump it down",
      math: `${f(r.volumeGal)} gal ÷ ${f(i.pumpCapacity - i.cycleInflow, 1)} gpm = <b>${f(r.pumpMinutes, 2)} min</b>`,
    },
    {
      what: "One full cycle",
      math: `${f(r.fillMinutes, 2)} min + ${f(r.pumpMinutes, 2)} min = <b>${f(r.cycleMinutes, 2)} min</b>`,
    },
    {
      what: "Starts per hour",
      math: `60 min ÷ ${f(r.cycleMinutes, 2)} min = <b>${f(r.startsPerHour, 1)} starts/hr</b>`,
    },
  ];
}

function hpSteps(i: PumpingInput, r: PumpingResult): Step[] {
  const steps: Step[] = [
    {
      what: "Water horsepower",
      math: `${f(i.flowGpm)} gpm × ${f(i.head, 2)} ft ÷ 3,960 = <b>${f(r.whp, 2)} whp</b>`,
    },
    {
      what: "Brake horsepower at the pump shaft",
      math: `${f(r.whp, 2)} whp ÷ ${f(i.pumpEff, 0)}% = <b>${f(r.bhp, 2)} bhp</b>`,
    },
    {
      what: "Horsepower the motor draws",
      math: `${f(r.bhp, 2)} bhp ÷ ${f(i.motorEff, 0)}% = <b>${f(r.mhp, 2)} mhp</b>`,
    },
    {
      what: "Wire-to-water efficiency",
      math: `${f(i.pumpEff, 0)}% × ${f(i.motorEff, 0)}% = <b>${f(r.wireToWater, 1)}%</b>`,
    },
    {
      what: "Total head as pressure",
      math: `${f(i.head, 2)} ft ÷ 2.31 = <b>${f(r.psi, 1)} psi</b>`,
    },
  ];
  if (i.showCost && Number.isFinite(i.rate) && i.rate > 0) {
    steps.push(
      {
        what: "Power draw in kilowatts",
        math: `${f(r.mhp, 2)} mhp × 0.746 = <b>${f(r.kw, 2)} kW</b>`,
      },
      {
        what: "Energy used per day",
        math: `${f(r.kw, 2)} kW × ${f(r.hoursUsed, 1)} hr = <b>${f(r.kwhPerDay, 1)} kWh/day</b>`,
      },
      {
        what: "Cost per day",
        math: `${f(r.kwhPerDay, 1)} kWh × $${f(i.rate, 3)} = <b>$${money(r.costPerDay)}</b>`,
      },
      {
        what: "Cost per million gallons pumped",
        math: `$${money(r.costPerDay)} ÷ ${f(r.volumePerDayGal / 1_000_000, 3)} MG = <b>$${money(r.costPerMg)}/MG</b>`,
      },
    );
  }
  return steps;
}

export function pumpingSteps(mode: PumpingMode, i: PumpingInput, r: PumpingResult): Step[] {
  if (mode === "hp") return hpSteps(i, r);
  const steps = wellSteps(i, r);
  return [...steps, ...(mode === "rate" ? rateSteps(i, r) : cycleSteps(i, r))];
}
