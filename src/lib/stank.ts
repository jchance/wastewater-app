import { formatNumber as f } from "./dosage";
import type { Step } from "./processControl";

/** Pounds of stank per pound of anything, per Standard Methods for the Examination of Nothing. */
export const LB_PER_SNIFF = 8.34;

export type StankMode = "stank" | "noseblind" | "breakroom";
export type Wind = "away" | "across" | "calm" | "office";
export type YesNo = "no" | "yes";
export type Exposure = "office" | "rounds" | "lab" | "headworks" | "septage" | "wetwell";

export const stankModes: { id: StankMode; label: string; long: string }[] = [
  { id: "stank", label: "Stank level", long: "Pounds of stank per day" },
  { id: "noseblind", label: "Nose-blind", long: "How long until you stop noticing" },
  { id: "breakroom", label: "Break room", long: "How far away to eat lunch" },
];

export const windFactors: Record<Wind, { label: string; factor: number }> = {
  away: { label: "Away from the office", factor: 0.5 },
  across: { label: "Across the plant", factor: 1 },
  calm: { label: "Dead calm, it just sits there", factor: 1.5 },
  office: { label: "Straight at the office", factor: 2 },
};

export const greaseFactors: Record<YesNo, { label: string; factor: number }> = {
  no: { label: "No", factor: 1 },
  yes: { label: "Yes, God help us", factor: 1.5 },
};

export const exposureFactors: Record<Exposure, { label: string; factor: number }> = {
  office: { label: "Office and paperwork", factor: 0.5 },
  rounds: { label: "Normal rounds", factor: 1 },
  lab: { label: "Lab, running samples", factor: 1.25 },
  headworks: { label: "Headworks and screenings", factor: 2 },
  septage: { label: "Septage receiving", factor: 3 },
  wetwell: { label: "Down in the wet well", factor: 5 },
};

export interface StankLevel {
  max: number;
  name: string;
  note: string;
}

/** Upper bound in lb of stank/day, name, and what it means. */
export const stankLevels: StankLevel[] = [
  { max: 25, name: "You Eat Mexican?", note: "Barely a whiff. Could be the plant, could be whoever had the burrito." },
  { max: 100, name: "Smells Like Money", note: "A normal Georgia summer day. Smells like job security." },
  { max: 300, name: "Headworks Hug", note: "It's in your hoodie now. It's not coming out." },
  { max: 750, name: "Gas Station Bathroom", note: "Office staff are shutting doors and giving you looks." },
  { max: 2000, name: "Satan's Crock-Pot", note: "The neighbors are calling. The mayor's office is next." },
  { max: Infinity, name: "Holy Shit, Burn Your Clothes", note: "Strip in the garage. Your dog won't make eye contact." },
];

export const levelFor = (lb: number) => {
  const index = stankLevels.findIndex((l) => lb < l.max);
  return { index: index + 1, ...stankLevels[index] };
};

export type LunchSpot = { max: number; name: string };
export const lunchSpots: LunchSpot[] = [
  { max: 10, name: "Sit wherever, you're good" },
  { max: 50, name: "End of the table, by the window" },
  { max: 150, name: "Eat in your truck" },
  { max: 400, name: "Parking lot, downwind" },
  { max: Infinity, name: "Go home. Eat there. Alone." },
];

export interface StankInput {
  sniffs: number;
  temp: number;
  wind: Wind;
  days: number;
  trucks: number;
  grease: YesNo;
  visitors: number;
  years: number;
  coffee: number;
  hours: number;
  exposure: Exposure;
}

export interface StankResult {
  heat: number;
  wind: number;
  crud: number;
  trucks: number;
  grease: number;
  tour: number;
  stankFlow: number;
  stankLb: number;
  level: number;
  levelName: string;
  levelNote: string;
  veteran: number;
  coffee: number;
  noseBlindMin: number;
  spouseHours: number;
  exposure: number;
  clearanceFt: number;
  lunchSpot: string;
  showers: number;
}

export type StankOutcome = { ok: true; result: StankResult } | { ok: false; message: string };

export const modeFields: Record<StankMode, (keyof StankInput)[]> = {
  stank: ["sniffs", "temp", "wind", "days", "trucks", "grease", "visitors"],
  noseblind: ["sniffs", "years", "coffee"],
  breakroom: ["sniffs", "hours", "exposure"],
};

const wholeFields: (keyof StankInput)[] = ["trucks", "visitors", "coffee"];

export function calculateStank(mode: StankMode, i: StankInput): StankOutcome {
  const fields = modeFields[mode];
  for (const key of fields) {
    const v = i[key];
    if (typeof v === "number" && !Number.isFinite(v)) {
      return { ok: false, message: "Fill in every box. The stank doesn't calculate itself." };
    }
  }
  if (i.sniffs > 10) {
    return { ok: false, message: "Sniffs top out at 10. If it's an 11, quit doing math and get the hell out." };
  }
  if (i.sniffs < 1) {
    return { ok: false, message: "Sniffs start at 1. Zero means your nose is broke, or you're in the office." };
  }
  for (const key of fields) {
    if (key !== "temp" && typeof i[key] === "number" && (i[key] as number) < 0) {
      return { ok: false, message: "No negatives. You can't un-stink something." };
    }
  }
  for (const key of wholeFields) {
    if (fields.includes(key) && !Number.isInteger(i[key])) {
      return { ok: false, message: "Trucks, tourists and cups of coffee come in whole numbers, chief." };
    }
  }
  if (mode === "breakroom" && i.hours > 24) {
    return { ok: false, message: "There's only 24 hours in a day, even on a double." };
  }

  const heat = Math.max(0.25, 1 + (i.temp - 60) / 40);
  const wind = windFactors[i.wind].factor;
  const crud = 1 + i.days / 7;
  const trucks = 1 + i.trucks * 0.5;
  const grease = greaseFactors[i.grease].factor;
  const tour = 1 + i.visitors / 10;
  const stankFlow = heat * wind * crud * trucks * grease * tour;
  const stankLb = i.sniffs * LB_PER_SNIFF * stankFlow;
  const lvl = levelFor(stankLb);

  const veteran = 1 + i.years / 5;
  const coffee = 1 + i.coffee / 4;
  const noseBlindMin = 120 / (i.sniffs * veteran * coffee);
  const spouseHours = i.sniffs * (1 + i.years / 10);

  const exposure = exposureFactors[i.exposure].factor;
  const clearanceFt = i.sniffs * i.hours * exposure * 1.5;
  const lunchSpot = lunchSpots.find((s) => clearanceFt < s.max)!.name;
  const showers = Math.max(1, Math.ceil(clearanceFt / 100));

  return {
    ok: true,
    result: {
      heat,
      wind,
      crud,
      trucks,
      grease,
      tour,
      stankFlow,
      stankLb,
      level: lvl.index,
      levelName: lvl.name,
      levelNote: lvl.note,
      veteran,
      coffee,
      noseBlindMin,
      spouseHours,
      exposure,
      clearanceFt,
      lunchSpot,
      showers,
    },
  };
}

export function stankSteps(mode: StankMode, i: StankInput, r: StankResult): Step[] {
  if (mode === "stank") {
    return [
      {
        what: "Heat factor: every 40°F over 60 doubles the funk",
        math: `1 + (${f(i.temp)}°F − 60) ÷ 40 = <b>${f(r.heat, 2)}</b>`,
      },
      { what: "Wind factor", math: `${windFactors[i.wind].label} = <b>${f(r.wind, 2)}</b>` },
      {
        what: "Crud factor: a week of neglect doubles it",
        math: `1 + ${f(i.days)} days ÷ 7 = <b>${f(r.crud, 2)}</b>`,
      },
      {
        what: "Honey wagon factor",
        math: `1 + ${f(i.trucks)} trucks × 0.5 = <b>${f(r.trucks, 2)}</b>`,
      },
      { what: "Grease trap factor", math: `${greaseFactors[i.grease].label} = <b>${f(r.grease, 2)}</b>` },
      {
        what: "Tour Effect: it always peaks when company shows up",
        math: `1 + ${f(i.visitors)} visitors ÷ 10 = <b>${f(r.tour, 2)}</b>`,
      },
      {
        what: "Stank flow, in Million Gallons of Dookie (MGD)",
        math: `${f(r.heat, 2)} × ${f(r.wind, 2)} × ${f(r.crud, 2)} × ${f(r.trucks, 2)} × ${f(r.grease, 2)} × ${f(r.tour, 2)} = <b>${f(r.stankFlow, 2)} MGD</b>`,
      },
      {
        what: "Pounds of stank",
        math: `${f(i.sniffs)} sniffs × 8.34 × ${f(r.stankFlow, 2)} MGD = <b>${f(r.stankLb)} lb/day</b>`,
      },
      { what: "Stank level", math: `Level ${r.level}: <b>${r.levelName}</b>` },
    ];
  }
  if (mode === "noseblind") {
    return [
      {
        what: "Veteran factor: every 5 years in, your nose gives up a little more",
        math: `1 + ${f(i.years)} years ÷ 5 = <b>${f(r.veteran, 2)}</b>`,
      },
      {
        what: "Coffee factor: coffee breath masks it",
        math: `1 + ${f(i.coffee)} cups ÷ 4 = <b>${f(r.coffee, 2)}</b>`,
      },
      {
        what: "Time to nose-blind",
        math: `120 ÷ (${f(i.sniffs)} sniffs × ${f(r.veteran, 2)} × ${f(r.coffee, 2)}) = <b>${f(r.noseBlindMin, 1)} minutes</b>`,
      },
      {
        what: "How long your spouse still smells it",
        math: `${f(i.sniffs)} sniffs × (1 + ${f(i.years)} ÷ 10) = <b>${f(r.spouseHours, 1)} hours</b>`,
      },
    ];
  }
  return [
    { what: "Exposure factor", math: `${exposureFactors[i.exposure].label} = <b>${f(r.exposure, 2)}</b>` },
    {
      what: "Break room clearance",
      math: `${f(i.sniffs)} sniffs × ${f(i.hours)} hours × ${f(r.exposure, 2)} × 1.5 = <b>${f(r.clearanceFt)} ft</b>`,
    },
    { what: "Where you're eating", math: `<b>${r.lunchSpot}</b>` },
    {
      what: "Showers before anyone hugs you",
      math: `${f(r.clearanceFt)} ft ÷ 100, rounded up = <b>${r.showers}</b>`,
    },
  ];
}
