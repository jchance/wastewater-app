export interface WheelPart {
  /** Bold label, one entry per rendered line. */
  lines: string[];
  /** Small caption under the label, usually units. */
  sub?: string;
}

export interface PieWheel {
  id: string;
  name: string;
  /** The quantity above the horizontal line. */
  top: WheelPart;
  /** The wedges below the line, left to right. */
  wedges: WheelPart[];
  /** Formula ids on the Formulas page that this wheel serves. */
  formulaIds: string[];
}

export const pieWheelRules: string[] = [
  "Multiply the wedges underneath the line to get the quantity on top.",
  "Need one of the bottom wedges instead? Put your thumb over it, then divide whatever is still showing below the line into the quantity on top.",
  "Your numbers have to already be in the units printed on the wheel — convert first.",
  "Metric appears in parentheses wherever it differs from the US value, like (m²).",
];

export const pieWheels: PieWheel[] = [
  {
    id: "area-of-circle",
    name: "Area of Circle",
    top: { lines: ["Area"], sub: "Circle" },
    wedges: [{ lines: ["0.785"] }, { lines: ["Diameter²"] }],
    formulaIds: ["area-of-circle"],
  },
  {
    id: "area-of-rectangle",
    name: "Area of Rectangle",
    top: { lines: ["Area"], sub: "Rectangle" },
    wedges: [{ lines: ["Length"] }, { lines: ["Width"] }],
    formulaIds: ["area-of-rectangle"],
  },
  {
    id: "area-of-right-triangle",
    name: "Area of Right Triangle",
    top: { lines: ["Area"], sub: "Right Triangle" },
    wedges: [{ lines: ["1/2"] }, { lines: ["Base"] }, { lines: ["Height"] }],
    formulaIds: ["area-of-right-triangle"],
  },
  {
    id: "electromotive-force",
    name: "Electromotive Force (EMF), Volts",
    top: { lines: ["EMF"], sub: "Volts" },
    wedges: [
      { lines: ["Current"], sub: "Amps" },
      { lines: ["Resistance"], sub: "Ohms" },
    ],
    formulaIds: ["electromotive-force"],
  },
  {
    id: "feed-rate",
    name: "Feed Rate, lbs/day (kg/day)",
    top: { lines: ["Chemical Feed,", "100% Purity"], sub: "lbs/day (kg/day)" },
    wedges: [
      { lines: ["Flow"], sub: "MGD (m³/day)" },
      { lines: ["8.34 lbs/gal"], sub: "(0.001)" },
      { lines: ["Dose"], sub: "mg/L" },
    ],
    formulaIds: ["feed-rate"],
  },
  {
    id: "flow-rate",
    name: "Flow Rate, ft³/sec (m³/sec)",
    top: { lines: ["Flow Rate"], sub: "ft³/sec (m³/sec)" },
    wedges: [
      { lines: ["Area"], sub: "ft² (m²)" },
      { lines: ["Velocity"], sub: "ft/sec (m/sec)" },
    ],
    formulaIds: ["flow-rate"],
  },
  {
    id: "force",
    name: "Force, lbs (Newtons)",
    top: { lines: ["Force"], sub: "lbs (Newtons)" },
    wedges: [
      { lines: ["Pressure"], sub: "psi (pascals)" },
      { lines: ["Area"], sub: "in² (m²)" },
    ],
    formulaIds: ["force"],
  },
  {
    id: "loading-rate",
    name: "Loading Rate, lbs/day (kg/day)",
    top: { lines: ["Loading Rate"], sub: "lbs/day (kg/day)" },
    wedges: [
      { lines: ["Flow"], sub: "MGD (m³/day)" },
      { lines: ["8.34 lbs/gal"], sub: "(0.001)" },
      { lines: ["Concentration"], sub: "mg/L" },
    ],
    formulaIds: ["loading-rate"],
  },
  {
    id: "mass",
    name: "Mass, lbs (kg)",
    top: { lines: ["Mass"], sub: "lbs (kg)" },
    wedges: [
      { lines: ["Volume"], sub: "MG (m³)" },
      { lines: ["8.34 lbs/gal"], sub: "(0.001)" },
      { lines: ["Concentration"], sub: "mg/L" },
    ],
    formulaIds: ["mass"],
  },
  {
    id: "volume-of-cone",
    name: "Volume of Cone",
    top: { lines: ["Volume"], sub: "Cone" },
    wedges: [
      { lines: ["1/3"] },
      { lines: ["0.785"] },
      { lines: ["Diameter²"] },
      { lines: ["Height"] },
    ],
    formulaIds: ["volume-of-cone"],
  },
  {
    id: "volume-of-cylinder",
    name: "Volume of Cylinder",
    top: { lines: ["Volume"], sub: "Cylinder" },
    wedges: [{ lines: ["0.785"] }, { lines: ["Diameter²"] }, { lines: ["Height"] }],
    formulaIds: ["volume-of-cylinder"],
  },
  {
    id: "volume-of-rectangular-tank",
    name: "Volume of Rectangular Tank",
    top: { lines: ["Volume"], sub: "Rectangle" },
    wedges: [{ lines: ["Length"] }, { lines: ["Width"] }, { lines: ["Height"] }],
    formulaIds: ["volume-of-rectangular-tank"],
  },
];
