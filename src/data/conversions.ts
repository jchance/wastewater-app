export interface Conversion {
  /** The base quantity, e.g. "1 atm". */
  from: string;
  /** Every equivalent value the table lists for it. */
  to: string[];
  group: ConversionGroupId;
}

export type ConversionGroupId =
  | "length-area"
  | "volume-weight"
  | "flow"
  | "pressure"
  | "power"
  | "reference";

export interface ConversionGroup {
  id: ConversionGroupId;
  name: string;
}

export const conversionGroups: ConversionGroup[] = [
  { id: "length-area", name: "Length & Area" },
  { id: "volume-weight", name: "Volume & Weight" },
  { id: "flow", name: "Flow" },
  { id: "pressure", name: "Pressure & Head" },
  { id: "power", name: "Power" },
  { id: "reference", name: "Reference Values" },
];

export const conversions: Conversion[] = [
  // Length & area
  { from: "1 foot", to: ["0.305 m"], group: "length-area" },
  { from: "1 inch", to: ["2.54 cm"], group: "length-area" },
  { from: "1 mile", to: ["5,280 ft", "1.61 km"], group: "length-area" },
  { from: "1 acre", to: ["43,560 ft²", "4,046.9 m²"], group: "length-area" },
  { from: "1 hectare", to: ["10,000 m²"], group: "length-area" },
  { from: "1 square meter", to: ["1.19 yd²"], group: "length-area" },

  // Volume & weight
  { from: "1 gallon (US)", to: ["3.785 L", "8.34 lb of water"], group: "volume-weight" },
  { from: "1 cubic foot of water", to: ["7.48 gal", "62.4 lb"], group: "volume-weight" },
  {
    from: "1 cubic meter of water",
    to: ["1,000 kg", "1,000 L", "264 gal"],
    group: "volume-weight",
  },
  { from: "1 acre foot of water", to: ["326,000 gal"], group: "volume-weight" },
  { from: "1 pound", to: ["0.454 kg"], group: "volume-weight" },
  { from: "1 ton", to: ["2,000 lb"], group: "volume-weight" },
  { from: "1 metric ton", to: ["2,205 lb", "1,000 kg"], group: "volume-weight" },

  // Flow
  { from: "1 cubic foot per second", to: ["0.646 MGD", "448.8 gpm"], group: "flow" },
  {
    from: "1 million US gallons per day",
    to: ["694 gpm", "1.55 ft³/sec"],
    group: "flow",
  },
  { from: "1 liter per second", to: ["0.0864 MLD"], group: "flow" },

  // Pressure & head
  {
    from: "1 atm",
    to: ["33.9 ft of water", "10.3 m of water", "14.7 psi", "101.3 kPa"],
    group: "pressure",
  },
  { from: "1 foot of water", to: ["0.433 psi"], group: "pressure" },
  { from: "1 meter of water", to: ["9.8 kPa"], group: "pressure" },
  {
    from: "1 pound per square inch",
    to: ["2.31 ft of water", "6.89 kPa"],
    group: "pressure",
  },

  // Power
  {
    from: "1 horsepower",
    to: ["0.746 kW", "746 W", "33,000 ft lb/min"],
    group: "power",
  },

  // Reference values
  { from: "1 grain per US gallon", to: ["17.1 mg/L"], group: "reference" },
  { from: "1%", to: ["10,000 mg/L"], group: "reference" },
  { from: "π or pi", to: ["3.14"], group: "reference" },
  {
    from: "Population Equivalent, hydraulic",
    to: ["100 gal/person/day", "378.5 L/person/day"],
    group: "reference",
  },
  {
    from: "Population Equivalent, organic",
    to: ["0.17 lb BOD/person/day", "0.077 kg BOD/person/day"],
    group: "reference",
  },
];
