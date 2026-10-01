import { conversionGroups, conversions, type ConversionGroupId } from "../data/conversions";

export interface ConversionTarget {
  factor: number;
  unit: string;
  factorDecimals: number;
  originalText: string;
}

export interface UnitOption {
  id: string;
  from: string;
  label: string;
  group: ConversionGroupId;
  groupName: string;
  targets: ConversionTarget[];
}

export interface CalculatedTarget {
  value: number;
  formatted: string;
  unit: string;
}

const groupNames: Record<ConversionGroupId, string> = Object.fromEntries(
  conversionGroups.map((g) => [g.id, g.name])
) as Record<ConversionGroupId, string>;

const unitMetadata: Record<string, { id: string; label: string }> = {
  "1 foot": { id: "foot", label: "foot (ft)" },
  "1 inch": { id: "inch", label: "inch (in)" },
  "1 mile": { id: "mile", label: "mile (mi)" },
  "1 acre": { id: "acre", label: "acre" },
  "1 hectare": { id: "hectare", label: "hectare (ha)" },
  "1 square meter": { id: "square-meter", label: "square meter (m²)" },
  "1 gallon (US)": { id: "gallon-us", label: "gallon (US gal)" },
  "1 cubic foot of water": { id: "cubic-foot-water", label: "cubic foot of water (ft³)" },
  "1 cubic meter of water": { id: "cubic-meter-water", label: "cubic meter of water (m³)" },
  "1 acre foot of water": { id: "acre-foot-water", label: "acre foot of water" },
  "1 pound": { id: "pound", label: "pound (lb)" },
  "1 ton": { id: "ton", label: "ton (short, 2,000 lb)" },
  "1 metric ton": { id: "metric-ton", label: "metric ton (tonne, 1,000 kg)" },
  "1 cubic foot per second": { id: "cfs", label: "cubic foot per second (cfs / ft³/s)" },
  "1 million US gallons per day": { id: "mgd", label: "million US gallons per day (MGD)" },
  "1 liter per second": { id: "lps", label: "liter per second (L/s)" },
  "1 atm": { id: "atm", label: "atmosphere (atm)" },
  "1 foot of water": { id: "foot-water", label: "foot of water (ft H₂O)" },
  "1 meter of water": { id: "meter-water", label: "meter of water (m H₂O)" },
  "1 pound per square inch": { id: "psi", label: "pound per square inch (psi)" },
  "1 horsepower": { id: "horsepower", label: "horsepower (hp)" },
  "1 grain per US gallon": { id: "grain-per-gal", label: "grain per US gallon (gpg)" },
  "1%": { id: "percent", label: "% (percent solids/concentration)" },
  "Population Equivalent, hydraulic": {
    id: "pe-hydraulic",
    label: "Population Equivalent (hydraulic)",
  },
  "Population Equivalent, organic": {
    id: "pe-organic",
    label: "Population Equivalent (organic)",
  },
};

function parseTargets(toList: string[]): ConversionTarget[] {
  const result: ConversionTarget[] = [];
  for (const t of toList) {
    const m = t.match(/^([\d,]+(?:\.\d+)?)\s*(.*)$/);
    if (!m) continue;
    const numStr = m[1].replace(/,/g, "");
    const factor = parseFloat(numStr);
    const decMatch = numStr.match(/\.(\d+)/);
    const factorDecimals = decMatch ? decMatch[1].length : 0;
    result.push({
      factor,
      unit: m[2],
      factorDecimals,
      originalText: t,
    });
  }
  return result;
}

export const unitOptions: UnitOption[] = conversions
  .filter((c) => !c.from.includes("pi"))
  .map((c) => {
    const meta = unitMetadata[c.from] || {
      id: c.from.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      label: c.from.replace(/^1\s+/, ""),
    };
    return {
      id: meta.id,
      from: c.from,
      label: meta.label,
      group: c.group,
      groupName: groupNames[c.group] || c.group,
      targets: parseTargets(c.to),
    };
  });

export const unitOptionsMap = new Map<string, UnitOption>(
  unitOptions.map((u) => [u.id, u])
);

export const fromToUnitIdMap = new Map<string, string>(
  unitOptions.map((u) => [u.from, u.id])
);

export const unitOptionsByGroup = conversionGroups
  .map((g) => ({
    group: g,
    units: unitOptions.filter((u) => u.group === g.id),
  }))
  .filter((g) => g.units.length > 0);

export function formatConversionValue(val: number, factorDecimals = 0): string {
  if (!isFinite(val)) return "—";
  if (val === 0) return "0";

  const abs = Math.abs(val);

  if (abs < 0.0001) {
    return val.toExponential(3);
  }

  let maxDec = Math.max(factorDecimals, 2);
  if (abs >= 100000) {
    maxDec = factorDecimals > 0 ? factorDecimals : 0;
  } else if (abs >= 1000) {
    maxDec = factorDecimals > 0 ? factorDecimals : 1;
  }

  const rounded = Number(val.toPrecision(10));

  return rounded.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.min(maxDec, 5),
  });
}

export function calculateConversions(quantity: number, unitId: string): CalculatedTarget[] {
  const unit = unitOptionsMap.get(unitId);
  if (!unit || isNaN(quantity)) return [];

  return unit.targets.map((t) => {
    const calculated = quantity * t.factor;
    return {
      value: calculated,
      formatted: formatConversionValue(calculated, t.factorDecimals),
      unit: t.unit,
    };
  });
}
