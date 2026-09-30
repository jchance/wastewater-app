export type FormulaExpression =
  | {
      /** Factors multiplied together on top of the bar. */
      num: string[];
      /** Factors multiplied together below the bar. Omit for a plain product. */
      den?: string[];
      /** Trailing operator such as "× 100%". */
      suffix?: string;
      raw?: undefined;
    }
  | {
      /** A literal expression used when the shape is not a product or fraction. */
      raw: string;
      num?: undefined;
      den?: undefined;
      suffix?: string;
    };

export interface FormulaVariant {
  /** Unit system badge. Omit when a formula has only one form. */
  label?: string;
  /** Left hand side, including its units. */
  result: string;
  expr: FormulaExpression;
  /** Qualifier printed under this variant. */
  note?: string;
}

export interface Formula {
  id: string;
  name: string;
  domain: DomainId;
  /** Slug of the matching wheel on the Pie Wheels page. */
  pieWheel?: string;
  note?: string;
  variants: FormulaVariant[];
  /** Extra search terms that do not appear in the rendered text. */
  keywords?: string[];
}

export type DomainId =
  | "geometry"
  | "lab"
  | "process"
  | "hydraulics"
  | "pumps"
  | "chemical"
  | "general";

export interface Domain {
  id: DomainId;
  name: string;
  blurb: string;
}

export const domains: Domain[] = [
  {
    id: "general",
    name: "General & Everyday Math",
    blurb: "Averages, percent removal, temperature and detention time.",
  },
  {
    id: "geometry",
    name: "Area & Volume",
    blurb: "Tank and channel geometry — the starting point for most volume math.",
  },
  {
    id: "hydraulics",
    name: "Flow & Hydraulics",
    blurb: "Velocity, flow rate, force and pump cycle timing.",
  },
  {
    id: "process",
    name: "Process Control",
    blurb: "Loading rates, sludge age, SVI, return rates and filter performance.",
  },
  {
    id: "lab",
    name: "Lab & Chemistry",
    blurb: "Titrations, solids, BOD, normality and molarity.",
  },
  {
    id: "chemical",
    name: "Chemical Feed",
    blurb: "Feed rate and chemical feed pump settings.",
  },
  {
    id: "pumps",
    name: "Pumps & Electrical",
    blurb: "Horsepower, efficiency, watts and amps.",
  },
];

export const formulas: Formula[] = [
  // ---------------------------------------------------------------- general
  {
    id: "average-arithmetic",
    name: "Average (arithmetic mean)",
    domain: "general",
    variants: [
      { result: "Average", expr: { num: ["Sum of All Terms"], den: ["Number of Terms"] } },
    ],
  },
  {
    id: "average-geometric",
    name: "Average (geometric mean)",
    domain: "general",
    note: "The nth root of the product of n numbers.",
    variants: [
      {
        result: "Average",
        expr: { raw: "[(X₁)(X₂)(X₃)(X₄)(Xₙ)]^(1/n)" },
      },
    ],
  },
  {
    id: "degrees-celsius",
    name: "Degrees Celsius",
    domain: "general",
    keywords: ["temperature", "convert"],
    variants: [{ result: "°C", expr: { num: ["°F − 32"], den: ["1.8"] } }],
  },
  {
    id: "degrees-fahrenheit",
    name: "Degrees Fahrenheit",
    domain: "general",
    keywords: ["temperature", "convert"],
    variants: [{ result: "°F", expr: { num: ["°C", "1.8"], suffix: "+ 32" } }],
  },
  {
    id: "removal-percent",
    name: "Removal, %",
    domain: "general",
    keywords: ["efficiency", "percent removal"],
    variants: [
      { result: "Removal, %", expr: { num: ["In − Out"], den: ["In"], suffix: "× 100%" } },
    ],
  },
  {
    id: "slope-percent",
    name: "Slope, %",
    domain: "general",
    keywords: ["grade", "collections"],
    variants: [
      { result: "Slope, %", expr: { num: ["Drop or Rise"], den: ["Distance"], suffix: "× 100%" } },
    ],
  },
  {
    id: "water-use",
    name: "Water Use",
    domain: "general",
    variants: [
      {
        label: "US",
        result: "Water Use, gpcd",
        expr: { num: ["Volume of Water Produced, gpd"], den: ["Population"] },
      },
      {
        label: "Metric",
        result: "Water Use, Lpcd",
        expr: { num: ["Volume of Water Produced, Lpd"], den: ["Population"] },
      },
    ],
  },

  // --------------------------------------------------------------- geometry
  {
    id: "area-of-circle",
    name: "Area of Circle",
    domain: "geometry",
    pieWheel: "area-of-circle",
    variants: [
      { label: "From diameter", result: "Area of Circle", expr: { num: ["0.785", "Diameter²"] } },
      { label: "From radius", result: "Area of Circle", expr: { num: ["3.14", "Radius²"] } },
    ],
  },
  {
    id: "area-of-cone-lateral",
    name: "Area of Cone (lateral area)",
    domain: "geometry",
    variants: [
      {
        result: "Lateral Area of Cone",
        expr: { num: ["3.14", "Radius", "√(Radius² + Height²)"] },
      },
    ],
  },
  {
    id: "area-of-cone-total",
    name: "Area of Cone (total surface area)",
    domain: "geometry",
    variants: [
      {
        result: "Total Surface Area of Cone",
        expr: { num: ["3.14", "Radius", "Radius + √(Radius² + Height²)"] },
      },
    ],
  },
  {
    id: "area-of-cylinder",
    name: "Area of Cylinder (total exterior surface area)",
    domain: "geometry",
    note: "Where SA = surface area.",
    variants: [
      {
        result: "Total Exterior Surface Area",
        expr: { raw: "[End #1 SA] + [End #2 SA] + [(3.14)(Diameter)(Height or Depth)]" },
      },
    ],
  },
  {
    id: "area-of-rectangle",
    name: "Area of Rectangle",
    domain: "geometry",
    pieWheel: "area-of-rectangle",
    variants: [{ result: "Area of Rectangle", expr: { num: ["Length", "Width"] } }],
  },
  {
    id: "area-of-right-triangle",
    name: "Area of Right Triangle",
    domain: "geometry",
    pieWheel: "area-of-right-triangle",
    variants: [
      { result: "Area of Right Triangle", expr: { num: ["Base", "Height"], den: ["2"] } },
    ],
  },
  {
    id: "circumference-of-circle",
    name: "Circumference of Circle",
    domain: "geometry",
    variants: [{ result: "Circumference", expr: { num: ["3.14", "Diameter"] } }],
  },
  {
    id: "volume-of-cone",
    name: "Volume of Cone",
    domain: "geometry",
    pieWheel: "volume-of-cone",
    variants: [
      { result: "Volume of Cone", expr: { num: ["1/3", "0.785", "Diameter²", "Height"] } },
    ],
  },
  {
    id: "volume-of-cylinder",
    name: "Volume of Cylinder",
    domain: "geometry",
    pieWheel: "volume-of-cylinder",
    variants: [
      { result: "Volume of Cylinder", expr: { num: ["0.785", "Diameter²", "Height"] } },
    ],
  },
  {
    id: "volume-of-rectangular-tank",
    name: "Volume of Rectangular Tank",
    domain: "geometry",
    pieWheel: "volume-of-rectangular-tank",
    variants: [
      { result: "Volume of Rectangular Tank", expr: { num: ["Length", "Width", "Height"] } },
    ],
  },

  // ------------------------------------------------------------- hydraulics
  {
    id: "detention-time",
    name: "Detention Time",
    domain: "hydraulics",
    note: "Units must be compatible.",
    keywords: ["dt", "residence"],
    variants: [{ result: "Detention Time", expr: { num: ["Volume"], den: ["Flow"] } }],
  },
  {
    id: "cycle-time",
    name: "Cycle Time",
    domain: "hydraulics",
    keywords: ["wet well", "lift station"],
    variants: [
      {
        label: "US",
        result: "Cycle Time, min",
        expr: {
          num: ["Storage Volume, gal"],
          den: ["(Pump Capacity, gpm) − (Wet Well Inflow, gpm)"],
        },
      },
      {
        label: "Metric",
        result: "Cycle Time, min",
        expr: {
          num: ["Storage Volume, m³"],
          den: ["(Pump Capacity, m³/min) − (Wet Well Inflow, m³/min)"],
        },
      },
    ],
  },
  {
    id: "flow-rate",
    name: "Flow Rate",
    domain: "hydraulics",
    pieWheel: "flow-rate",
    variants: [
      {
        label: "US",
        result: "Flow Rate, ft³/sec",
        expr: { num: ["Area, ft²", "Velocity, ft/sec"] },
      },
      {
        label: "Metric",
        result: "Flow Rate, m³/sec",
        expr: { num: ["Area, m²", "Velocity, m/sec"] },
      },
    ],
  },
  {
    id: "force",
    name: "Force",
    domain: "hydraulics",
    pieWheel: "force",
    variants: [
      { label: "US", result: "Force, lb", expr: { num: ["Pressure, psi", "Area, in²"] } },
      {
        label: "Metric",
        result: "Force, newtons",
        expr: { num: ["Pressure, pascals", "Area, m²"] },
      },
    ],
  },
  {
    id: "velocity",
    name: "Velocity",
    domain: "hydraulics",
    variants: [
      {
        label: "US · from flow",
        result: "Velocity, ft/sec",
        expr: { num: ["Flow Rate, ft³/sec"], den: ["Area, ft²"] },
      },
      {
        label: "US · from distance",
        result: "Velocity, ft/sec",
        expr: { num: ["Distance, ft"], den: ["Time, sec"] },
      },
      {
        label: "Metric · from flow",
        result: "Velocity, m/sec",
        expr: { num: ["Flow Rate, m³/sec"], den: ["Area, m²"] },
      },
      {
        label: "Metric · from distance",
        result: "Velocity, m/sec",
        expr: { num: ["Distance, m"], den: ["Time, sec"] },
      },
    ],
  },

  // ---------------------------------------------------------------- process
  {
    id: "filter-backwash-rate",
    name: "Filter Backwash Rate",
    domain: "process",
    variants: [
      {
        label: "US",
        result: "Filter Backwash Rate, gpm/ft²",
        expr: { num: ["Flow, gpm"], den: ["Filter Area, ft²"] },
      },
      {
        label: "Metric",
        result: "Filter Backwash Rate, L/sec/m²",
        expr: { num: ["Flow, L/sec"], den: ["Filter Area, m²"] },
      },
    ],
  },
  {
    id: "filter-backwash-rise-rate",
    name: "Filter Backwash Rise Rate",
    domain: "process",
    variants: [
      {
        label: "US",
        result: "Filter Backwash Rise Rate, in/min",
        expr: { num: ["Backwash Rate, gpm/ft²", "12 in/ft"], den: ["7.48 gal/ft³"] },
      },
      {
        label: "Metric",
        result: "Filter Backwash Rise Rate, cm/min",
        expr: { num: ["Water Rise, cm"], den: ["Time, min"] },
      },
    ],
  },
  {
    id: "filter-yield",
    name: "Filter Yield",
    domain: "process",
    variants: [
      {
        label: "US",
        result: "Filter Yield, lb/hr/ft²",
        expr: {
          num: ["Solids Loading, lb/day", "Recovery, % expressed as a decimal"],
          den: ["Filter Operation, hr/day", "Area, ft²"],
        },
      },
      {
        label: "Metric",
        result: "Filter Yield, kg/hr/m²",
        expr: {
          num: [
            "Solids Concentration, % expressed as a decimal",
            "Sludge Feed Rate, L/hr",
            "10",
          ],
          den: ["Surface Area of Filter, m²"],
        },
      },
    ],
  },
  {
    id: "food-microorganism-ratio",
    name: "Food/Microorganism Ratio",
    domain: "process",
    keywords: ["f/m", "fm ratio"],
    variants: [
      {
        label: "US",
        result: "F/M Ratio",
        expr: { num: ["BOD₅, lb/day"], den: ["MLVSS, lb"] },
      },
      {
        label: "Metric",
        result: "F/M Ratio",
        expr: { num: ["BOD₅, kg/day"], den: ["MLVSS, kg"] },
      },
    ],
  },
  {
    id: "hydraulic-loading-rate",
    name: "Hydraulic Loading Rate",
    domain: "process",
    variants: [
      {
        label: "US",
        result: "Hydraulic Loading Rate, gpd/ft²",
        expr: { num: ["Total Flow Applied, gpd"], den: ["Area, ft²"] },
      },
      {
        label: "Metric",
        result: "Hydraulic Loading Rate, m³/day/m²",
        expr: { num: ["Total Flow Applied, m³/day"], den: ["Area, m²"] },
      },
    ],
  },
  {
    id: "loading-rate",
    name: "Loading Rate",
    domain: "process",
    pieWheel: "loading-rate",
    variants: [
      {
        label: "US",
        result: "Loading Rate, lb/day",
        expr: { num: ["Flow, MGD", "Concentration, mg/L", "8.34 lb/gal"] },
      },
      {
        label: "Metric",
        result: "Loading Rate, kg/day",
        expr: { num: ["Flow, m³/day", "Concentration, mg/L"], den: ["1,000"] },
      },
    ],
  },
  {
    id: "mass",
    name: "Mass",
    domain: "process",
    pieWheel: "mass",
    variants: [
      {
        label: "US",
        result: "Mass, lb",
        expr: { num: ["Volume, MG", "Concentration, mg/L", "8.34 lb/gal"] },
      },
      {
        label: "Metric",
        result: "Mass, kg",
        expr: { num: ["Volume, m³", "Concentration, mg/L"], den: ["1,000"] },
      },
    ],
  },
  {
    id: "mean-cell-residence-time",
    name: "Mean Cell Residence Time / Solids Retention Time",
    domain: "process",
    keywords: ["MCRT", "SRT", "sludge age", "solids retention time"],
    variants: [
      {
        label: "US",
        result: "MCRT or SRT, days",
        expr: {
          num: ["(Aeration Tank TSS, lb) + (Clarifier TSS, lb)"],
          den: ["(TSS Wasted, lb/day) + (Effluent TSS, lb/day)"],
        },
      },
      {
        label: "Metric",
        result: "MCRT or SRT, days",
        expr: {
          num: ["(Aeration Tank TSS, kg) + (Clarifier TSS, kg)"],
          den: ["(TSS Wasted, kg/day) + (Effluent TSS, kg/day)"],
        },
      },
    ],
  },
  {
    id: "organic-loading-rate-rbc",
    name: "Organic Loading Rate — RBC",
    domain: "process",
    keywords: ["rotating biological contactor"],
    variants: [
      {
        label: "US",
        result: "Organic Loading Rate, lb SBOD₅/day/1,000 ft²",
        expr: {
          num: ["Organic Load, lb SBOD₅/day"],
          den: ["Surface Area of Media, 1,000 ft²"],
        },
      },
      {
        label: "Metric",
        result: "Organic Loading Rate, kg SBOD₅/m²·day",
        expr: { num: ["Organic Load, kg SBOD₅/day"], den: ["Surface Area of Media, m²"] },
      },
    ],
  },
  {
    id: "organic-loading-rate-trickling-filter",
    name: "Organic Loading Rate — Trickling Filter",
    domain: "process",
    variants: [
      {
        label: "US",
        result: "Organic Loading Rate, lb BOD₅/day/1,000 ft³",
        expr: { num: ["Organic Load, lb BOD₅/day"], den: ["Volume, 1,000 ft³"] },
      },
      {
        label: "Metric",
        result: "Organic Loading Rate, kg/m³·day",
        expr: { num: ["Organic Load, kg BOD₅/day"], den: ["Volume, m³"] },
      },
    ],
  },
  {
    id: "population-equivalent-organic",
    name: "Population Equivalent, Organic",
    domain: "process",
    keywords: ["PE"],
    variants: [
      {
        label: "US",
        result: "Population Equivalent",
        expr: {
          num: ["Flow, MGD", "BOD, mg/L", "8.34 lb/gal"],
          den: ["0.17 lb BOD/day/person"],
        },
      },
      {
        label: "Metric",
        result: "Population Equivalent",
        expr: {
          num: ["Flow, m³/day", "BOD, mg/L"],
          den: ["1,000", "0.077 kg BOD/day/person"],
        },
      },
    ],
  },
  {
    id: "recirculation-ratio-trickling-filter",
    name: "Recirculation Ratio — Trickling Filter",
    domain: "process",
    variants: [
      {
        result: "Recirculation Ratio",
        expr: { num: ["Recirculated Flow"], den: ["Primary Effluent Flow"] },
      },
    ],
  },
  {
    id: "return-rate",
    name: "Return Rate, %",
    domain: "process",
    keywords: ["RAS"],
    variants: [
      {
        result: "Return Rate, %",
        expr: { num: ["Return Flow Rate"], den: ["Influent Flow Rate"], suffix: "× 100%" },
      },
    ],
  },
  {
    id: "return-sludge-rate-solids-balance",
    name: "Return Sludge Rate — Solids Balance",
    domain: "process",
    keywords: ["RAS"],
    variants: [
      {
        result: "Return Sludge Rate, MGD",
        expr: {
          num: ["MLSS, mg/L", "Flow Rate, MGD"],
          den: ["(RAS Suspended Solids, mg/L) − (MLSS, mg/L)"],
        },
      },
    ],
  },
  {
    id: "sludge-density-index",
    name: "Sludge Density Index",
    domain: "process",
    keywords: ["SDI"],
    variants: [{ result: "SDI", expr: { num: ["100"], den: ["SVI"] } }],
  },
  {
    id: "sludge-volume-index",
    name: "Sludge Volume Index",
    domain: "process",
    keywords: ["SVI", "settleability"],
    variants: [
      {
        result: "SVI, mL/g",
        expr: { num: ["SSV₃₀, mL/L", "1,000 mg/g"], den: ["MLSS, mg/L"] },
      },
    ],
  },
  {
    id: "solids-loading-rate",
    name: "Solids Loading Rate",
    domain: "process",
    variants: [
      {
        label: "US",
        result: "Solids Loading Rate, lb/day/ft²",
        expr: { num: ["Solids Applied, lb/day"], den: ["Surface Area, ft²"] },
      },
      {
        label: "Metric",
        result: "Solids Loading Rate, kg/day/m²",
        expr: { num: ["Solids Applied, kg/day"], den: ["Surface Area, m²"] },
      },
    ],
  },
  {
    id: "surface-loading-rate",
    name: "Surface Loading Rate / Surface Overflow Rate",
    domain: "process",
    keywords: ["SOR", "overflow"],
    variants: [
      {
        label: "US",
        result: "Surface Overflow Rate, gpd/ft²",
        expr: { num: ["Flow, gpd"], den: ["Area, ft²"] },
      },
      {
        label: "Metric",
        result: "Surface Overflow Rate, Lpd/m²",
        expr: { num: ["Flow, Lpd"], den: ["Area, m²"] },
      },
    ],
  },
  {
    id: "weir-overflow-rate",
    name: "Weir Overflow Rate",
    domain: "process",
    variants: [
      {
        label: "US",
        result: "Weir Overflow Rate, gpd/ft",
        expr: { num: ["Flow, gpd"], den: ["Weir Length, ft"] },
      },
      {
        label: "Metric",
        result: "Weir Overflow Rate, Lpd/m",
        expr: { num: ["Flow, Lpd"], den: ["Weir Length, m"] },
      },
    ],
  },

  // -------------------------------------------------------------------- lab
  {
    id: "alkalinity",
    name: "Alkalinity",
    domain: "lab",
    keywords: ["titration", "CaCO3"],
    variants: [
      {
        result: "Alkalinity, mg/L as CaCO₃",
        expr: {
          num: ["Titrant Volume, mL", "Acid Normality", "50,000"],
          den: ["Sample Volume, mL"],
        },
      },
    ],
  },
  {
    id: "bod-seeded",
    name: "Biochemical Oxygen Demand (seeded)",
    domain: "lab",
    keywords: ["BOD"],
    variants: [
      {
        result: "BOD, mg/L",
        expr: {
          num: [
            "(Initial DO, mg/L) − (Final DO, mg/L) − (Seed Correction, mg/L)",
            "300 mL",
          ],
          den: ["Sample Volume, mL"],
        },
      },
    ],
  },
  {
    id: "bod-unseeded",
    name: "Biochemical Oxygen Demand (unseeded)",
    domain: "lab",
    keywords: ["BOD"],
    variants: [
      {
        result: "BOD, mg/L",
        expr: {
          num: ["(Initial DO, mg/L) − (Final DO, mg/L)", "300 mL"],
          den: ["Sample Volume, mL"],
        },
      },
    ],
  },
  {
    id: "blending-three-normal",
    name: "Blending or Three Normal Equation",
    domain: "lab",
    note: "Where V₁ + V₂ = V₃; C = concentration, V = volume or flow. Concentration units must match and volume units must match.",
    variants: [
      { result: "Blending", expr: { raw: "(C₁ × V₁) + (C₂ × V₂) = (C₃ × V₃)" } },
    ],
  },
  {
    id: "cfu-per-100-ml",
    name: "# CFU/100 mL",
    domain: "lab",
    keywords: ["coliform", "colonies", "bacteria"],
    variants: [
      {
        result: "# CFU/100 mL",
        expr: {
          num: ["# of Colonies on Plate", "100"],
          den: ["Sample Volume, mL"],
        },
      },
    ],
  },
  {
    id: "composite-sample-single-portion",
    name: "Composite Sample Single Portion",
    domain: "lab",
    variants: [
      {
        result: "Single Portion",
        expr: {
          num: ["Instantaneous Flow", "Total Sample Volume"],
          den: ["Number of Portions", "Average Flow"],
        },
      },
    ],
  },
  {
    id: "dilution-two-normal",
    name: "Dilution or Two Normal Equation",
    domain: "lab",
    note: "Where C = concentration, V = volume or flow. Concentration units must match and volume units must match.",
    variants: [{ result: "Dilution", expr: { raw: "(C₁ × V₁) = (C₂ × V₂)" } }],
  },
  {
    id: "hardness",
    name: "Hardness",
    domain: "lab",
    note: "Only when the titration factor is 1.00 of EDTA.",
    variants: [
      {
        result: "Hardness, as mg CaCO₃/L",
        expr: { num: ["Titrant Volume, mL", "1,000"], den: ["Sample Volume, mL"] },
      },
    ],
  },
  {
    id: "milliequivalent",
    name: "Milliequivalent",
    domain: "lab",
    variants: [{ result: "Milliequivalent", expr: { num: ["mL", "Normality"] } }],
  },
  {
    id: "molarity",
    name: "Molarity",
    domain: "lab",
    variants: [
      { result: "Molarity", expr: { num: ["Moles of Solute"], den: ["Liters of Solution"] } },
    ],
  },
  {
    id: "normality",
    name: "Normality",
    domain: "lab",
    variants: [
      {
        result: "Normality",
        expr: {
          num: ["Number of Equivalent Weights of Solute"],
          den: ["Liters of Solution"],
        },
      },
    ],
  },
  {
    id: "number-of-equivalent-weights",
    name: "Number of Equivalent Weights",
    domain: "lab",
    variants: [
      {
        result: "Number of Equivalent Weights",
        expr: { num: ["Total Weight"], den: ["Equivalent Weight"] },
      },
    ],
  },
  {
    id: "number-of-moles",
    name: "Number of Moles",
    domain: "lab",
    variants: [
      {
        result: "Number of Moles",
        expr: { num: ["Total Weight"], den: ["Molecular Weight"] },
      },
    ],
  },
  {
    id: "oxygen-uptake-rate",
    name: "Oxygen Uptake Rate / Oxygen Consumption Rate",
    domain: "lab",
    keywords: ["OUR", "OCR", "respiration"],
    variants: [
      {
        result: "OUR, mg/L/min",
        expr: { num: ["Oxygen Usage, mg/L"], den: ["Time, min"] },
      },
    ],
  },
  {
    id: "specific-oxygen-uptake-rate",
    name: "Specific Oxygen Uptake Rate / Respiration Rate",
    domain: "lab",
    keywords: ["SOUR"],
    variants: [
      {
        result: "SOUR, (mg/g)/hr",
        expr: {
          num: ["OUR, mg/L/min", "60 min"],
          den: ["MLVSS, g/L", "1 hr"],
        },
      },
    ],
  },
  {
    id: "reduction-of-volatile-solids",
    name: "Reduction of Volatile Solids, %",
    domain: "lab",
    note: "All information (in and out) must be in decimal form.",
    variants: [
      {
        result: "Reduction of VS, %",
        expr: {
          num: ["VS in − VS out"],
          den: ["VS in − (VS in × VS out)"],
          suffix: "× 100%",
        },
      },
    ],
  },
  {
    id: "solids-capture-centrifuges",
    name: "Solids Capture, % (Centrifuges)",
    domain: "lab",
    variants: [
      {
        result: "Solids Capture, %",
        expr: {
          raw: "[ Cake TS, % ÷ Feed Sludge TS, % ] × [ ((Feed Sludge TS, %) − (Centrate TSS, %)) ÷ ((Cake TS, %) − (Centrate TSS, %)) ] × 100%",
        },
      },
    ],
  },
  {
    id: "solids-mg-l",
    name: "Solids, mg/L",
    domain: "lab",
    variants: [
      {
        result: "Solids, mg/L",
        expr: { num: ["Dry Solids, g", "1,000,000"], den: ["Sample Volume, mL"] },
      },
    ],
  },
  {
    id: "solids-concentration",
    name: "Solids Concentration, mg/L",
    domain: "lab",
    variants: [
      { result: "Solids Concentration, mg/L", expr: { num: ["Weight, mg"], den: ["Volume, L"] } },
    ],
  },
  {
    id: "specific-gravity",
    name: "Specific Gravity",
    domain: "lab",
    variants: [
      {
        label: "US",
        result: "Specific Gravity",
        expr: { num: ["Specific Weight of Substance, lb/gal"], den: ["8.34 lb/gal"] },
      },
      {
        label: "Metric",
        result: "Specific Gravity",
        expr: { num: ["Specific Weight of Substance, kg/L"], den: ["1.0 kg/L"] },
      },
    ],
  },
  {
    id: "total-solids-percent",
    name: "Total Solids, %",
    domain: "lab",
    keywords: ["TS"],
    variants: [
      {
        result: "Total Solids, %",
        expr: {
          num: ["(Dried Weight, g) − (Tare Weight, g)"],
          den: ["(Wet Weight, g) − (Tare Weight, g)"],
          suffix: "× 100%",
        },
      },
    ],
  },
  {
    id: "volatile-solids-percent",
    name: "Volatile Solids, %",
    domain: "lab",
    keywords: ["VS"],
    variants: [
      {
        result: "Volatile Solids, %",
        expr: {
          num: ["(Dry Solids, g) − (Fixed Solids, g)"],
          den: ["Dry Solids, g"],
          suffix: "× 100%",
        },
      },
    ],
  },

  // --------------------------------------------------------------- chemical
  {
    id: "chemical-feed-pump-setting-stroke",
    name: "Chemical Feed Pump Setting, % Stroke",
    domain: "chemical",
    variants: [
      {
        result: "Pump Setting, % Stroke",
        expr: { num: ["Desired Flow"], den: ["Maximum Flow"], suffix: "× 100%" },
      },
    ],
  },
  {
    id: "chemical-feed-pump-setting-ml-min",
    name: "Chemical Feed Pump Setting, mL/min",
    domain: "chemical",
    variants: [
      {
        label: "US",
        result: "Pump Setting, mL/min",
        expr: {
          num: ["Flow, MGD", "Dose, mg/L", "3.785 L/gal", "1,000,000 gal/MG"],
          den: [
            "Feed Chemical Density, mg/mL",
            "Active Chemical, % expressed as a decimal",
            "1,440 min/day",
          ],
        },
      },
      {
        label: "Metric",
        result: "Pump Setting, mL/min",
        expr: {
          num: ["Flow, m³/day", "Dose, mg/L"],
          den: [
            "Feed Chemical Density, g/cm³",
            "Active Chemical, % expressed as a decimal",
            "1,440 min/day",
          ],
        },
      },
    ],
  },
  {
    id: "feed-rate",
    name: "Feed Rate",
    domain: "chemical",
    pieWheel: "feed-rate",
    keywords: ["dosage", "purity"],
    variants: [
      {
        label: "US",
        result: "Feed Rate, lb/day",
        expr: {
          num: ["Dosage, mg/L", "Flow, MGD", "8.34 lb/gal"],
          den: ["Purity, % expressed as a decimal"],
        },
      },
      {
        label: "Metric",
        result: "Feed Rate, kg/day",
        expr: {
          num: ["Dosage, mg/L", "Flow Rate, m³/day"],
          den: ["Purity, % expressed as a decimal", "1,000"],
        },
      },
    ],
  },

  // ------------------------------------------------------------------ pumps
  {
    id: "amps",
    name: "Amps",
    domain: "pumps",
    keywords: ["ohms law", "current"],
    variants: [{ result: "Amps", expr: { num: ["Volts"], den: ["Ohms"] } }],
  },
  {
    id: "electromotive-force",
    name: "Electromotive Force (EMF)",
    domain: "pumps",
    pieWheel: "electromotive-force",
    keywords: ["voltage", "ohms law"],
    variants: [
      {
        result: "EMF, volts",
        expr: { num: ["Current, amps", "Resistance, ohms"] },
      },
    ],
  },
  {
    id: "horsepower-brake",
    name: "Horsepower, Brake",
    domain: "pumps",
    keywords: ["bhp"],
    variants: [
      {
        label: "US",
        result: "Brake Horsepower, hp",
        expr: {
          num: ["Flow, gpm", "Head, ft"],
          den: ["3,960", "Pump Efficiency, % expressed as a decimal"],
        },
      },
      {
        label: "Metric",
        result: "Brake Power, kW",
        expr: {
          num: ["9.8", "Flow, m³/sec", "Head, m"],
          den: ["Pump Efficiency, % expressed as a decimal"],
        },
      },
    ],
  },
  {
    id: "horsepower-motor",
    name: "Horsepower, Motor",
    domain: "pumps",
    variants: [
      {
        label: "US",
        result: "Motor Horsepower, hp",
        expr: {
          num: ["Flow, gpm", "Head, ft"],
          den: [
            "3,960",
            "Pump Efficiency, % expressed as a decimal",
            "Motor Efficiency, % expressed as a decimal",
          ],
        },
      },
      {
        label: "Metric",
        result: "Motor Power, kW",
        expr: {
          num: ["9.8", "Flow, m³/sec", "Head, m"],
          den: [
            "Pump Efficiency, % expressed as a decimal",
            "Motor Efficiency, % expressed as a decimal",
          ],
        },
      },
    ],
  },
  {
    id: "horsepower-water",
    name: "Horsepower, Water",
    domain: "pumps",
    keywords: ["whp"],
    variants: [
      {
        label: "US",
        result: "Water Horsepower, hp",
        expr: { num: ["Flow, gpm", "Head, ft"], den: ["3,960"] },
      },
      {
        label: "Metric",
        result: "Water Power, kW",
        expr: { num: ["9.8", "Flow, m³/sec", "Head, m"] },
      },
    ],
  },
  {
    id: "motor-efficiency",
    name: "Motor Efficiency, %",
    domain: "pumps",
    variants: [
      {
        result: "Motor Efficiency, %",
        expr: { num: ["Brake hp"], den: ["Motor hp"], suffix: "× 100%" },
      },
    ],
  },
  {
    id: "power-kw",
    name: "Power, kW",
    domain: "pumps",
    variants: [
      {
        result: "Power, kW",
        expr: { num: ["Flow, L/sec", "Head, m", "9.8"], den: ["1,000"] },
      },
    ],
  },
  {
    id: "watts",
    name: "Watts",
    domain: "pumps",
    variants: [
      { label: "AC circuit", result: "Watts", expr: { num: ["Volts", "Amps", "Power Factor"] } },
      { label: "DC circuit", result: "Watts", expr: { num: ["Volts", "Amps"] } },
    ],
  },
  {
    id: "wire-to-water-efficiency",
    name: "Wire-to-Water Efficiency, %",
    domain: "pumps",
    variants: [
      {
        label: "From horsepower",
        result: "Wire-to-Water Efficiency, %",
        expr: { num: ["Water hp"], den: ["Motor hp"], suffix: "× 100%" },
      },
      {
        label: "From electrical demand",
        result: "Wire-to-Water Efficiency, %",
        expr: {
          num: ["Flow, gpm", "Total Dynamic Head, ft", "0.746 kW/hp", "100%"],
          den: ["3,960", "Electrical Demand, kW"],
        },
      },
    ],
  },
];
