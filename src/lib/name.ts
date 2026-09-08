import {
  adjectives,
  animals,
  colors,
  countries,
  languages,
  names,
  starWars,
  uniqueNamesGenerator,
  type Config,
} from "unique-names-generator";

export function randomName() {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: " ",
    length: 3,
  });
}

export type AutoNamePreset =
  | "filename"
  | "adjective-animal"
  | "color-animal"
  | "two-adjectives"
  | "starwars"
  | "place-name"
  | "numbered";

export const AUTO_NAME_PRESETS: {
  id: AutoNamePreset;
  label: string;
  description: string;
}[] = [
  { id: "filename", label: "From filename", description: "Clean up the file name" },
  { id: "adjective-animal", label: "Adjective + animal", description: "e.g. Brave Falcon" },
  { id: "color-animal", label: "Color + animal", description: "e.g. Crimson Fox" },
  { id: "two-adjectives", label: "Two adjectives", description: "e.g. Velvet Amber" },
  { id: "starwars", label: "Star Wars", description: "e.g. Darth Vader" },
  { id: "place-name", label: "Place + name", description: "e.g. Norway Ada" },
  { id: "numbered", label: "Numbered", description: "e.g. Background 1, 2, 3…" },
];

function makeGenerator(
  preset: Exclude<AutoNamePreset, "filename" | "numbered">,
): Config {
  switch (preset) {
    case "adjective-animal":
      return { dictionaries: [adjectives, animals], separator: " ", length: 2 };
    case "color-animal":
      return { dictionaries: [colors, animals], separator: " ", length: 2 };
    case "two-adjectives":
      return {
        dictionaries: [adjectives, colors],
        separator: " ",
        length: 2,
        style: "capital",
      };
    case "starwars":
      return { dictionaries: [starWars], separator: " ", length: 1 };
    case "place-name":
      return { dictionaries: [countries, names], separator: " ", length: 2 };
    default:
      return { dictionaries: [adjectives, colors, animals], separator: " ", length: 3 };
  }
}

/**
 * Generate a background name from a preset. `taken` is a Set of already-used
 * lowercase names so collisions get a numeric suffix (e.g. "Crimson Fox 2").
 */
export function generateNameFromPreset(
  preset: AutoNamePreset,
  fileName: string,
  index: number,
  taken: Set<string>,
  takenSeed: Set<string> = new Set(),
): string {
  let base = "";

  switch (preset) {
    case "filename": {
      base = fileName
        .replace(/\.[^.]+$/, "")
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim();
      if (!base) base = "Background";
      break;
    }
    case "numbered": {
      base = "Background";
      break;
    }
    default: {
      base = uniqueNamesGenerator(makeGenerator(preset));
      break;
    }
  }

  if (preset === "numbered") {
    // Smart numbering: continue after the highest existing "Background N" in
    // the library instead of restarting at 1.
    const allTaken = new Set([...takenSeed, ...taken].map((t) => t.toLowerCase()));
    let highest = 0;
    const baseLower = base.toLowerCase();
    for (const name of allTaken) {
      const m = name.match(new RegExp(`^${baseLower}(?: (\\d+))?$`));
      if (m) highest = Math.max(highest, Number(m[1] ?? 1));
    }
    let n = Math.max(highest + 1, index + 1);
    // If a slot index already bumps past the library (duplicate batch re-run),
    // keep monotonic within this batch too.
    n = Math.max(n, index + 1);
    let candidate = `${base} ${n}`;
    while (allTaken.has(candidate.toLowerCase())) {
      n++;
      candidate = `${base} ${n}`;
    }
    taken.add(candidate.toLowerCase());
    return candidate;
  }

  let name = base;
  let i = 2;
  while (taken.has(name.toLowerCase()) || takenSeed.has(name.toLowerCase())) {
    name = `${base} ${i++}`;
  }
  taken.add(name.toLowerCase());
  return name;
}

export function exampleForPreset(
  preset: AutoNamePreset,
  fileName = "neon-horizon.png",
): string {
  return generateNameFromPreset(preset, fileName, 0, new Set());
}
