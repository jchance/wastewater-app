export type Tier = "rule" | "guidance" | "practice";

export interface SafetyItem {
  /** Short label shown in bold at the start of the row. */
  term: string;
  /** The explanation. Plain text. */
  detail: string;
  tier: Tier;
  /** Citation shown as a badge, e.g. "1910.146(d)(5)(iii)". */
  cite?: string;
  /** Verbatim quoted text from the source, rendered as a blockquote. */
  quote?: string;
}

export interface SafetySection {
  id: string;
  name: string;
  intro?: string;
  items: SafetyItem[];
}

export const tierLabels: Record<Tier, string> = {
  rule: "RULE",
  guidance: "GUIDANCE",
  practice: "PRACTICE",
};

export const tierMeanings: { tier: Tier; meaning: string }[] = [
  {
    tier: "rule",
    meaning:
      "Enforceable text from the Code of Federal Regulations. If OSHA has jurisdiction over your employer, this is law.",
  },
  {
    tier: "guidance",
    meaning:
      "Non-mandatory CFR appendices and NIOSH publications. Authoritative and worth following, but not enforceable on its own.",
  },
  {
    tier: "practice",
    meaning:
      "Common industry practice with no specific citation behind it. Sensible, widely taught, but check it against your own program.",
  },
];

/* ---------------------------------------------------------------------- */
/* Gas limits                                                              */
/* ---------------------------------------------------------------------- */

export interface GasRow {
  gas: string;
  formula?: string;
  generalIndustry: string;
  construction: string;
  niosh: string;
  sewerAlarm: string;
}

export const gasRows: GasRow[] = [
  {
    gas: "Hydrogen sulfide",
    formula: "H\u2082S",
    generalIndustry:
      "20 ppm ceiling; 50 ppm peak for one 10-min period per shift, only if no other measurable exposure occurs. No 8-hr TWA.",
    construction: "10 ppm as an 8-hour TWA",
    niosh: "REL 10 ppm ceiling [10-min] \u00b7 IDLH 100 ppm",
    sewerAlarm: "Alarm at \u2265 10 ppm",
  },
  {
    gas: "Carbon monoxide",
    formula: "CO",
    generalIndustry: "50 ppm as an 8-hour TWA",
    construction: "50 ppm as an 8-hour TWA (same)",
    niosh: "\u2014",
    sewerAlarm: "Alarm at \u2265 35 ppm",
  },
  {
    gas: "Oxygen",
    formula: "O\u2082",
    generalIndustry:
      "Acceptable range 19.5% \u2013 23.5%. Outside that, the space is a permit space.",
    construction: "Must be at least 19.5%",
    niosh: "\u2014",
    sewerAlarm: "Alarm below 19.5%",
  },
  {
    gas: "Methane",
    formula: "CH\u2084",
    generalIndustry:
      "No PEL. Treated as a simple asphyxiant \u2014 controlled through the oxygen minimum and the explosion limits.",
    construction: "No PEL. Simple asphyxiant.",
    niosh: "Flammable range 5.0% \u2013 15.0% in air",
    sewerAlarm: "Alarm at \u2265 10% LFL (\u2248 0.5% by volume)",
  },
];

export const gasNotes: SafetyItem[] = [
  {
    term: "Your nose is not a gas detector",
    detail:
      "H\u2082S smells like rotten eggs at low concentration and then stops smelling like anything. NIOSH puts it plainly in the Pocket Guide entry for hydrogen sulfide, where the listed synonyms include \u201cSewer gas\u201d.",
    tier: "guidance",
    cite: "NIOSH Pocket Guide",
    quote:
      "Sense of smell becomes rapidly fatigued & can NOT be relied upon to warn of the continuous presence of H\u2082S.",
  },
  {
    term: "General industry and construction differ in structure",
    detail:
      "For H\u2082S the two standards are not just different numbers. General industry sets a ceiling you may never exceed plus a short peak allowance, and sets no 8-hour average at all. Construction sets an 8-hour average and no ceiling. A capital project \u2014 building a new lift station \u2014 may fall under the construction rules instead of the ones you work under day to day.",
    tier: "rule",
    cite: "1910.1000 Table Z-2 \u00b7 1926.55 Table 1",
  },
  {
    term: "The sewer alarm settings are more conservative on purpose",
    detail:
      "Appendix E to 1910.146 recommends monitors that sound an audible alarm \u2014 not just show a reading \u2014 at these thresholds. They sit well below the enforceable exposure limits because a sewer atmosphere can change without warning. These are recommendations, not requirements.",
    tier: "guidance",
    cite: "1910.146 App. E",
  },
];

/* ---------------------------------------------------------------------- */
/* Jurisdiction                                                            */
/* ---------------------------------------------------------------------- */

export const publicOnlyStatePlans = [
  "Connecticut",
  "Illinois",
  "Maine",
  "Massachusetts",
  "New Jersey",
  "New York",
  "Virgin Islands",
];

/* ---------------------------------------------------------------------- */
/* Sections                                                                */
/* ---------------------------------------------------------------------- */

export const sections: SafetySection[] = [
  {
    id: "permit-space",
    name: "Is it a permit space?",
    intro:
      "Two questions, in order. First, is it a confined space at all? Then, does it have any of the four characteristics that make it permit-required? A wet well, a digester, a manhole and a valve vault are all usually yes on both counts.",
    items: [
      {
        term: "A confined space is all three of these",
        detail:
          "Large enough that you can bodily enter it and perform work; has limited or restricted means of entry or exit; and is not designed for continuous employee occupancy. All three must be true.",
        tier: "rule",
        cite: "1910.146(b)",
      },
      {
        term: "It becomes permit-required with any one of these",
        detail:
          "Contains or has the potential to contain a hazardous atmosphere; contains a material with the potential to engulf an entrant; has an internal configuration that could trap or asphyxiate an entrant by inwardly converging walls or a floor that slopes and tapers to a smaller cross-section; or contains any other recognized serious safety or health hazard. Only one is needed.",
        tier: "rule",
        cite: "1910.146(b)",
      },
      {
        term: "Hazardous atmosphere includes the oxygen range",
        detail:
          "An atmosphere below 19.5% or above 23.5% oxygen is a hazardous atmosphere. So is a flammable gas at or above 10% of its lower flammable limit, or airborne combustible dust at or above its LFL \u2014 which the rule notes can be approximated as a concentration that obscures vision at five feet.",
        tier: "rule",
        cite: "1910.146(b)",
      },
      {
        term: "This page covers general industry, not construction",
        detail:
          "29 CFR 1910.146 governs the operations and maintenance work most municipal wastewater staff do. Construction work \u2014 building or substantially rebuilding a station \u2014 falls under 29 CFR 1926 Subpart AA instead, which has different requirements. Know which one applies to the job in front of you.",
        tier: "rule",
        cite: "1910.146 \u00b7 1926 Subpart AA",
      },
    ],
  },
  {
    id: "testing",
    name: "Atmospheric testing",
    intro:
      "The order is not a suggestion and it is not arbitrary. It is written into the rule, and there is a physical reason for it.",
    items: [
      {
        term: "Test in this order: oxygen, then combustible gas, then toxics",
        detail:
          "This sequence is mandatory rule text, not an appendix recommendation. Test for oxygen content first, then for flammable gases and vapors, then for potential toxic air contaminants.",
        tier: "rule",
        cite: "1910.146(d)(5)(iii)",
      },
      {
        term: "Why oxygen comes first",
        detail:
          "Most combustible-gas sensors are catalytic bead type \u2014 they burn a sample of the gas to measure it, and that reaction needs ambient oxygen. In an oxygen-deficient atmosphere they read low, so a space can look safe for flammables when it is not. Reading oxygen first tells you whether to trust the combustible reading at all. The explanation lives in the non-mandatory appendix; the ordering requirement itself is in the rule.",
        tier: "guidance",
        cite: "1910.146 App. B",
      },
      {
        term: "Sewers get continuous monitoring, not a single pre-entry test",
        detail:
          "The standard singles out sewers by name as the example of a space that cannot be isolated because it is part of a continuous system. Where isolation is infeasible, pre-entry testing is done to the extent feasible and then conditions must be continuously monitored in the areas where entrants are working.",
        tier: "rule",
        cite: "1910.146(d)(5)(i)",
        quote:
          "if isolation of the space is infeasible because the space is large or is part of a continuous system (such as a sewer), pre-entry testing shall be performed to the extent feasible before entry is authorized and, if entry is authorized, entry conditions shall be continuously monitored in the areas where authorized entrants are working.",
      },
      {
        term: "Entrants may watch the test",
        detail:
          "Authorized entrants or their representatives must be given an opportunity to observe the pre-entry and any subsequent testing. If you are going in the hole, you are entitled to watch the meter.",
        tier: "rule",
        cite: "1910.146(c)(5)(ii)",
      },
    ],
  },
  {
    id: "ventilation-trap",
    name: "The ventilation trap",
    intro:
      "This is the single most common way a wastewater crew gets a permit space wrong. Two different provisions get blurred together in the field, and the difference between them is the difference between a controlled hazard and an eliminated one.",
    items: [
      {
        term: "Ventilation controls a hazard. It does not eliminate it.",
        detail:
          "The regulation says this outright in a note under the reclassification paragraph. You can run a blower all day and the space is still a permit space.",
        tier: "rule",
        cite: "1910.146(c)(7)(ii)",
        quote:
          "Control of atmospheric hazards through forced air ventilation does not constitute elimination of the hazards.",
      },
      {
        term: "Alternate entry under (c)(5) \u2014 what crews actually use",
        detail:
          "If the only hazard is atmospheric and continuous forced air ventilation alone is enough to keep the space safe, you may use a lighter procedure instead of a full permit: no written permit and no attendant required. But you owe monitoring data supporting both of those conditions, testing in the mandatory order with a calibrated direct-reading instrument, ventilation from a clean source running the entire time, periodic testing during entry, immediate evacuation and investigation if a hazardous atmosphere shows up, and a signed dated written certification before entry begins.",
        tier: "rule",
        cite: "1910.146(c)(5)",
      },
      {
        term: "(c)(5) is off the table the moment there is a second hazard",
        detail:
          "Engulfment from rising wastewater. A pump that could restart. An unguarded impeller. A converging or tapering configuration. Any one of those means the hazard is not purely atmospheric, and the full permit program applies \u2014 attendant, permit, the whole thing. This is where wet wells most often get mishandled.",
        tier: "rule",
        cite: "1910.146(c)(5)(i)(A)",
      },
      {
        term: "Reclassification under (c)(7) is a different thing entirely",
        detail:
          "Reclassifying a space to non-permit status requires that it pose no actual or potential atmospheric hazard and that every hazard inside be eliminated \u2014 not controlled. If entry is needed to eliminate those hazards, that entry happens under the full permit program first. Requires a written, signed, dated certification. If a hazard comes back, everyone exits and the space is reevaluated.",
        tier: "rule",
        cite: "1910.146(c)(7)",
      },
    ],
  },
  {
    id: "attendant",
    name: "The attendant",
    intro:
      "Attendant duties are widely misunderstood, and the misunderstanding is usually in the direction that gets a second person killed.",
    items: [
      {
        term: "The attendant stays outside until relieved",
        detail:
          "The attendant remains outside the permit space during entry operations until relieved by another attendant. Not until the job looks finished, and not until something goes wrong \u2014 until another attendant takes over.",
        tier: "rule",
        cite: "1910.146(i)(4)",
      },
      {
        term: "An attendant may only enter to rescue under narrow conditions",
        detail:
          "All of the following must be true: the employer's permit space program allows attendants to participate in rescue, the attendant is trained and equipped as a rescuer under the rescue paragraph, and the attendant has been relieved by another attendant first. Absent all three, the attendant does not go in.",
        tier: "rule",
        cite: "1910.146(i)(4) \u00b7 (k)(1)",
      },
      {
        term: "More than 60% of confined space deaths are would-be rescuers",
        detail:
          "This figure comes from a 1986 NIOSH Alert that documented 16 confined space deaths. It is the reason the attendant rules read the way they do.",
        tier: "guidance",
        cite: "NIOSH Pub. 86-110",
        quote:
          "More than 60% of confined space fatalities occur among would-be rescuers.",
      },
    ],
  },
  {
    id: "rescue",
    name: "Rescue",
    items: [
      {
        term: "Retrieval systems are required for vertical spaces over 5 feet",
        detail:
          "A mechanical device must be available to retrieve personnel from vertical type permit spaces more than five feet deep. That covers most wet wells and most manholes. The only exception is where the retrieval equipment would increase the overall risk of entry or would not contribute to rescuing the entrant.",
        tier: "rule",
        cite: "1910.146(k)(3)(ii)",
      },
      {
        term: "Chest or full body harness, line attached at the center of the back",
        detail:
          "Each authorized entrant wears a chest or full body harness with a retrieval line attached at the center of the back near shoulder level, above the head, or at another point which the employer can establish presents a profile small enough for successful removal.",
        tier: "rule",
        cite: "1910.146(k)(3)(i)",
      },
      {
        term: "You cannot simply assume the fire department is your rescue plan",
        detail:
          "The standard does not forbid using an outside service, but it requires the employer to evaluate a prospective rescue service's ability to respond in a timely manner and to actually perform the rescue, and to inform them of the hazards they may face. An unevaluated phone call is not a rescue plan.",
        tier: "rule",
        cite: "1910.146(k)(1)(i)",
      },
      {
        term: "Rescue teams practice at least every 12 months",
        detail:
          "Affected employees must practice permit space rescues at least once every 12 months, by means of simulated rescue operations in which they remove dummies, manikins or actual persons from the actual permit spaces or from representative spaces.",
        tier: "rule",
        cite: "1910.146(k)(2)(iv)",
      },
    ],
  },
  {
    id: "loto-sequence",
    name: "Lockout/tagout: the sequence",
    intro:
      "29 CFR 1910.147 states these steps must be done in this order. Step 6 is the one that gets skipped.",
    items: [
      {
        term: "1. Prepare for shutdown",
        detail:
          "The authorized employee knows the type and magnitude of the energy, the hazards it presents, and the method of controlling it.",
        tier: "rule",
        cite: "1910.147(d)(1)",
      },
      {
        term: "2. Shut the equipment down",
        detail:
          "Use the established procedure for an orderly shutdown, so that stopping the equipment does not itself create a hazard.",
        tier: "rule",
        cite: "1910.147(d)(2)",
      },
      {
        term: "3. Isolate it",
        detail:
          "Physically locate and operate the energy isolating devices so the equipment is isolated from every energy source.",
        tier: "rule",
        cite: "1910.147(d)(3)",
      },
      {
        term: "4. Apply the locks or tags",
        detail:
          "Affixed by authorized employees. A lockout device holds the isolating device in the safe or off position. A tagout device is attached at the same point the lock would have gone, or as close as safely possible in an obvious position.",
        tier: "rule",
        cite: "1910.147(d)(4)",
      },
      {
        term: "5. Release stored energy",
        detail:
          "All potentially hazardous stored or residual energy must be relieved, disconnected, restrained, or otherwise rendered safe. If it can re-accumulate to a hazardous level, verification of isolation continues until the work is done or the possibility no longer exists.",
        tier: "rule",
        cite: "1910.147(d)(5)",
      },
      {
        term: "6. Verify isolation before starting work",
        detail:
          "This is its own mandatory step, separate from and after releasing stored energy. The rule does not prescribe how \u2014 try-start, voltage tester, pressure gauge at zero \u2014 only that verification happens and that the method fits the energy type. Trusting the lock without verifying is the common field failure.",
        tier: "rule",
        cite: "1910.147(d)(6)",
      },
    ],
  },
  {
    id: "loto-rules",
    name: "Lockout/tagout: the rules people get wrong",
    items: [
      {
        term: "Lockout is the default; tagout is the justified exception",
        detail:
          "If an energy isolating device is capable of being locked out, the employer must use lockout unless they can demonstrate that tagout will provide full employee protection. Tagout on a lockable device requires additional physical measures \u2014 removing an isolating circuit element, blocking a controlling switch, opening an extra disconnect, removing a valve handle \u2014 because the rule treats a tag as inherently weaker than a lock.",
        tier: "rule",
        cite: "1910.147(c)(2)(ii) \u00b7 (c)(3)",
      },
      {
        term: "\u201cOne employee, one lock, one key\u201d is a shorthand, not a citation",
        detail:
          "The phrase does not appear in the regulation. What the regulation actually requires for group work is that each authorized employee affix a personal lockout or tagout device to the group lockout device, group lockbox or comparable mechanism when they begin work, and remove it when they stop. Same principle, different wording \u2014 worth knowing if someone asks you to cite it.",
        tier: "rule",
        cite: "1910.147(f)(3)(ii)(D)",
      },
      {
        term: "Group lockout needs an accountable person",
        detail:
          "Primary responsibility is vested in one authorized employee for a set number of workers under a group device. That person must be able to determine the exposure status of each individual group member. When multiple crews or departments are involved, an overall job-associated coordinator is assigned.",
        tier: "rule",
        cite: "1910.147(f)(3)(ii)",
      },
      {
        term: "Removing an absent employee's lock takes a written procedure",
        detail:
          "The device is removed by the employee who applied it. If that person is unavailable, removal by the employer requires a documented procedure already in the energy control program, and it must include verifying the employee is not at the facility, making all reasonable efforts to contact them, and ensuring they know before resuming work at that facility. All three are minimums. You do not cut a forgotten lock on the fly.",
        tier: "rule",
        cite: "1910.147(e)(3)",
      },
      {
        term: "Shift change needs an orderly transfer",
        detail:
          "Specific procedures must ensure continuity of protection during shift or personnel changes, including provision for the orderly transfer of device protection between off-going and oncoming employees. The rule requires the procedure to exist but leaves the mechanics to the employer.",
        tier: "rule",
        cite: "1910.147(f)(4)",
      },
      {
        term: "The cord-and-plug exception requires exclusive control",
        detail:
          "Unplugging the equipment only counts if the plug stays under the exclusive control of the employee doing the work. In their pocket, in their sight, tagged as theirs. A cord pulled and left lying on the floor is not covered.",
        tier: "rule",
        cite: "1910.147(a)(3)(iii)(A)",
      },
      {
        term: "The procedure gets inspected annually",
        detail:
          "At least annually, by an authorized employee other than the ones using the procedure being inspected \u2014 no self-inspection. Deviations must be corrected, and the employer certifies the inspection identifying the equipment, the date, the employees included, and who performed it.",
        tier: "rule",
        cite: "1910.147(c)(6)",
      },
    ],
  },
  {
    id: "stored-energy",
    name: "Stored energy in a wastewater plant",
    intro:
      "The regulation's stored-energy language is generic and names none of these. Applying it to specific plant equipment is interpretation, so treat the list as a prompt for your own walkdown rather than a citation.",
    items: [
      {
        term: "VFD and drive capacitors",
        detail:
          "DC bus capacitors in a variable frequency drive can hold a lethal charge after the disconnect is locked. Wait the manufacturer's specified discharge time or verify zero voltage by measurement before opening the enclosure. This also intersects NFPA 70E, a separate consensus standard.",
        tier: "practice",
      },
      {
        term: "Trapped pressure in a force main",
        detail:
          "A force main segment isolated by closed valves can still hold pressurized wastewater. Double block and bleed \u2014 closing and locking or tagging two in-line valves, then opening and locking or tagging a drain or vent valve between them \u2014 is the standard method. That phrase is defined in the confined space rule and the concept carries directly across.",
        tier: "practice",
        cite: "concept per 1910.146(b)",
      },
      {
        term: "Hydraulic and pneumatic systems",
        detail:
          "Bleed and vent to atmosphere, then confirm at a gauge reading zero. Do not infer pressure from valve position.",
        tier: "practice",
      },
      {
        term: "Gravity and elevated components",
        detail:
          "Block or chock anything that can fall or swing \u2014 a raised slide gate, a bar screen, a lifted pump. Restrain it mechanically rather than relying on the hoist.",
        tier: "practice",
      },
      {
        term: "Springs and tensioned assemblies",
        detail: "De-tension or mechanically block before disassembly.",
        tier: "practice",
      },
    ],
  },
];

/* ---------------------------------------------------------------------- */
/* Further reading                                                         */
/* ---------------------------------------------------------------------- */

export interface SafetyLink {
  label: string;
  note: string;
  url: string;
}

export const links: SafetyLink[] = [
  {
    label: "29 CFR 1910.146 \u2014 Permit-Required Confined Spaces",
    note: "The full rule, including Appendix C's worked sample program titled \u201cSewer entry\u201d and Appendix E on sewer system entry.",
    url: "https://www.ecfr.gov/current/title-29/subtitle-B/chapter-XVII/part-1910/subpart-J/section-1910.146",
  },
  {
    label: "29 CFR 1910.147 \u2014 The Control of Hazardous Energy",
    note: "Lockout/tagout in full.",
    url: "https://www.ecfr.gov/current/title-29/subtitle-B/chapter-XVII/part-1910/subpart-J/section-1910.147",
  },
  {
    label: "OSHA State Plans",
    note: "Find out whether your state covers public employees, and who enforces it.",
    url: "https://www.osha.gov/stateplans",
  },
  {
    label: "NIOSH Pocket Guide \u2014 Hydrogen sulfide",
    note: "Exposure limits, IDLH, and the note about smell fatigue.",
    url: "https://www.cdc.gov/niosh/npg/npgd0337.html",
  },
  {
    label: "NIOSH Alert 86-110 \u2014 Fatalities in Confined Spaces",
    note: "The 1986 Alert behind the rescuer statistic. Sixteen case studies.",
    url: "https://archive.cdc.gov/www_cdc_gov/niosh/docs/86-110/default.html",
  },
];
