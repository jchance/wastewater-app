import { expect, test } from "@playwright/test";
import { calculateClarifier, effectiveTank, showsSlr, type ClarifierInput } from "../../src/lib/clarifier";
import { calculateConversions, unitOptionsMap } from "../../src/lib/conversions";
import { calculateDosage, flowUnits, type DosageInput } from "../../src/lib/dosage";
import { calculateLoading, type LoadingInput } from "../../src/lib/loading";
import { calculatePipe, type PipeInput } from "../../src/lib/pipeFlow";
import { calculateProcess, type ProcessInput } from "../../src/lib/processControl";
import { calculatePumping, maxStartsFor, type PumpingInput } from "../../src/lib/pumping";
import { calculateStank, levelFor, type StankInput } from "../../src/lib/stank";
import { sectionFor } from "../../src/lib/appSections";

const dosageInput: DosageInput = {
  dose: 6,
  flow: 4,
  flowUnit: "mgd",
  strength: 12.5,
  specificGravity: 1.2,
};

const clarifierInput: ClarifierInput = {
  shape: "circular",
  diameter: 20,
  length: 20,
  width: 10,
  depth: 10,
  units: 1,
  clarifierType: "secondary",
  dtTank: "primary",
  basis: "average",
  flow: 1,
  flowUnit: "mgd",
  weirLength: Number.NaN,
  ras: 0.1,
  rasUnit: "mgd",
  mlss: 3000,
};

const loadingInput: LoadingInput = {
  flow: 1,
  flowUnit: "mgd",
  parameter: "BOD",
  conc: 100,
  influent: 200,
  primaryEff: 100,
  secondaryEff: 50,
  finalEff: 10,
  removalFlow: 1,
  removalFlowUnit: "mgd",
  media: "tf",
  tfDiameter: 20,
  tfDepth: 10,
  rbcArea: 1000,
  pondAcres: 5,
  bod: 100,
  perCapita: 0.17,
};

const pipeInput: PipeInput = {
  diameter: 12,
  flow: 448.83,
  flowUnit: "gpm",
  depth: 6,
  slope: 1,
  n: 0.013,
  length: 1000,
  c: 140,
};

const processInput: ProcessInput = {
  flow: 1,
  flowUnit: "mgd",
  bod: 100,
  aerationVolume: 1,
  aerationUnit: "mg",
  mlss: 3000,
  mlvss: 2500,
  clarifierVolume: 1,
  clarifierUnit: "mg",
  clarifierTss: 3000,
  wasFlow: 0.01,
  wasFlowUnit: "mgd",
  wasTss: 8000,
  effluentTss: 10,
  ssv30: 100,
  targetMcrt: 10,
};

const pumpingInput: PumpingInput = {
  shape: "rectangular",
  length: 10,
  width: 10,
  diameter: 10,
  depthMethod: "depth",
  drawdown: 2,
  pumpOn: 3,
  pumpOff: 1,
  minutes: 10,
  seconds: 0,
  influent: 0,
  cycleInflow: 10,
  pumpCapacity: 20,
  motorHp: 5,
  flowGpm: 100,
  head: 100,
  pumpEff: 70,
  motorEff: 90,
  showCost: true,
  rate: 0.1,
  hoursPerDay: 12,
};

const stankInput: StankInput = {
  sniffs: 1,
  temp: 60,
  wind: "across",
  days: 0,
  trucks: 0,
  grease: "no",
  visitors: 0,
  years: 5,
  coffee: 4,
  hours: 2,
  exposure: "rounds",
};

test.describe("chemical dosage", () => {
  test("calculates an independently checkable default dose", () => {
    const outcome = calculateDosage(dosageInput);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.flowMgd).toBe(4);
    expect(outcome.result.activeLbPerDay).toBeCloseTo(200.16, 2);
    expect(outcome.result.productLbPerDay).toBeCloseTo(1601.28, 2);
    expect(outcome.result.productGalPerDay).toBeCloseTo(160, 0);
  });

  test("normalizes gpm and rejects invalid inputs", () => {
    expect(flowUnits.gpm.toMgd(694.444444)).toBeCloseTo(1, 5);
    expect(calculateDosage({ ...dosageInput, dose: 0 })).toMatchObject({ ok: false });
    expect(calculateDosage({ ...dosageInput, strength: 101 })).toMatchObject({ ok: false });
    expect(calculateDosage({ ...dosageInput, flow: Number.NaN })).toMatchObject({ ok: false });
  });
});

test.describe("clarifier", () => {
  test("computes a circular secondary clarifier and inferred weir", () => {
    const outcome = calculateClarifier("all", clarifierInput);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.surfaceFt2).toBeCloseTo(314, 0);
    expect(outcome.result.weirFromDiameter).toBe(true);
    expect(outcome.result.weirFt).toBeCloseTo(62.8, 1);
    expect(outcome.result.sor).toBeCloseTo(1_000_000 / 314, 0);
    expect(outcome.result.slr).toBeGreaterThan(0);
  });

  test("uses rectangular area, selected detention tank, and validates unit count", () => {
    const rectangular = calculateClarifier("dt", {
      ...clarifierInput,
      shape: "rectangular",
      units: 2,
      dtTank: "chlorine",
    });
    expect(rectangular.ok).toBe(true);
    if (rectangular.ok) {
      expect(rectangular.result.surfaceFt2).toBe(200);
      expect(rectangular.result.tank).toBe("chlorine");
    }
    expect(effectiveTank("slr", clarifierInput)).toBe("secondary");
    expect(showsSlr("all", clarifierInput)).toBe(true);
    expect(calculateClarifier("dt", { ...clarifierInput, units: 1.5 })).toMatchObject({ ok: false });
  });
});

test.describe("loading and removal", () => {
  test("calculates pounds/day, staged removal, organic rate, and population equivalent", () => {
    const pounds = calculateLoading("pounds", loadingInput);
    const removal = calculateLoading("removal", loadingInput);
    const organic = calculateLoading("organic", loadingInput);
    const population = calculateLoading("pe", loadingInput);
    expect(pounds.ok && pounds.result.lbPerDay).toBeCloseTo(834, 0);
    expect(removal.ok && removal.result.overallPercent).toBe(95);
    expect(removal.ok && removal.result.stages).toHaveLength(3);
    expect(organic.ok && organic.result.mediaSize).toBeCloseTo(3140, 0);
    expect(population.ok && population.result.population).toBeCloseTo(834 / 0.17, 0);
  });

  test("rejects samples that increase through a removal train", () => {
    expect(
      calculateLoading("removal", { ...loadingInput, primaryEff: 250 })
    ).toMatchObject({ ok: false });
  });
});

test.describe("pipe flow", () => {
  test("converts flow to velocity using pipe area", () => {
    const outcome = calculatePipe("velocity", pipeInput);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.flowCfs).toBeCloseTo(1, 4);
    expect(outcome.result.areaFt2).toBeCloseTo(Math.PI / 4, 4);
    expect(outcome.result.velocity).toBeCloseTo(4 / Math.PI, 3);
  });

  test("covers Manning and Hazen-Williams modes and rejects invalid depth", () => {
    const manning = calculatePipe("manning", { ...pipeInput, diameter: 24, depth: 12 });
    const hazen = calculatePipe("hazen", pipeInput);
    expect(manning.ok && manning.result.manningCfs).toBeGreaterThan(0);
    expect(hazen.ok && hazen.result.headLossFt).toBeGreaterThan(0);
    expect(
      calculatePipe("manning", { ...pipeInput, diameter: 12, depth: 13 })
    ).toMatchObject({ ok: false });
  });
});

test.describe("process control", () => {
  test("calculates F/M, MCRT, SVI, and target WAS modes", () => {
    const fm = calculateProcess("fm", processInput);
    const mcrt = calculateProcess("mcrt", processInput);
    const svi = calculateProcess("svi", processInput);
    const was = calculateProcess("was", processInput);
    expect(fm.ok && fm.result.bodLbPerDay).toBeCloseTo(834, 0);
    expect(fm.ok && fm.result.fm).toBeCloseTo(834 / (2500 * 8.34), 4);
    expect(mcrt.ok && mcrt.result.inventoryLb).toBeCloseTo(50040, 0);
    expect(svi.ok && svi.result.svi).toBeCloseTo(100 / 3, 2);
    expect(was.ok && was.result.targetWasGpd).toBeGreaterThan(0);
  });

  test("rejects negative values and an infeasible target WAS rate", () => {
    expect(calculateProcess("fm", { ...processInput, bod: -1 })).toMatchObject({ ok: false });
    expect(
      calculateProcess("was", { ...processInput, effluentTss: 1000 })
    ).toMatchObject({ ok: false });
  });
});

test.describe("pumping", () => {
  test("calculates pump rate, cycle timing, and horsepower/cost", () => {
    const rate = calculatePumping("rate", pumpingInput);
    const cycle = calculatePumping("cycle", pumpingInput);
    const hp = calculatePumping("hp", pumpingInput);
    expect(rate.ok && rate.result.grossGpm).toBeCloseTo(149.6, 1);
    expect(cycle.ok && cycle.result.cycleMinutes).toBeGreaterThan(0);
    expect(hp.ok && hp.result.whp).toBeCloseTo(10000 / 3960, 4);
    expect(hp.ok && hp.result.costPerDay).toBeGreaterThan(0);
  });

  test("supports negative float elevations and enforces their order and efficiency limits", () => {
    const floats = calculatePumping("rate", {
      ...pumpingInput,
      depthMethod: "floats",
      pumpOn: -1,
      pumpOff: -3,
    });
    expect(floats.ok && floats.result.depthFt).toBe(2);
    expect(
      calculatePumping("rate", {
        ...pumpingInput,
        depthMethod: "floats",
        pumpOn: -3,
        pumpOff: -1,
      })
    ).toMatchObject({ ok: false });
    expect(calculatePumping("hp", { ...pumpingInput, pumpEff: 101 })).toMatchObject({ ok: false });
    expect(maxStartsFor(30)?.maxStarts).toBe(10);
    expect(maxStartsFor(0)).toBeNull();
  });
});

test.describe("stank calculator", () => {
  test("covers stank, nose-blind, and break-room results", () => {
    const stank = calculateStank("stank", stankInput);
    const noseblind = calculateStank("noseblind", stankInput);
    const breakroom = calculateStank("breakroom", stankInput);
    expect(stank.ok && stank.result.stankLb).toBeCloseTo(8.34, 2);
    expect(noseblind.ok && noseblind.result.noseBlindMin).toBe(30);
    expect(breakroom.ok && breakroom.result.clearanceFt).toBe(3);
    expect(levelFor(25).index).toBe(2);
  });

  test("enforces sniff range and day-length limit", () => {
    expect(calculateStank("stank", { ...stankInput, sniffs: 0 })).toMatchObject({ ok: false });
    expect(calculateStank("stank", { ...stankInput, sniffs: 11 })).toMatchObject({ ok: false });
    expect(calculateStank("breakroom", { ...stankInput, hours: 25 })).toMatchObject({ ok: false });
  });
});

test.describe("conversion data and native sections", () => {
  test("converts values using the published factors and handles invalid requests", () => {
    const horsepower = unitOptionsMap.get("horsepower");
    expect(horsepower).toBeDefined();
    expect(horsepower?.targets.find((target) => target.unit === "kW")?.factor).toBe(0.746);
    expect(calculateConversions(2, "horsepower").find((target) => target.unit === "kW")?.value).toBe(1.492);
    expect(calculateConversions(Number.NaN, "horsepower")).toEqual([]);
    expect(calculateConversions(1, "not-a-unit")).toEqual([]);
  });

  test("maps app routes to tabs and leaves About untabbed", () => {
    expect(sectionFor("/")).toBe("");
    expect(sectionFor("/calculators/chemical-dosage/")).toBe("calculators");
    expect(sectionFor("/about/")).toBeNull();
  });
});
