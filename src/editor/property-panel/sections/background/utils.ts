import { DEFAULT_LINEAR_GRADIENT } from "./constants";

export interface GradientOption {
  id: string;
  baseValue: string;
  value: string;
}

export function parseLinearGradient(gradientValue: string): {
  angle: number;
  colors: string[];
} | null {
  if (
    !gradientValue.startsWith("linear-gradient(") ||
    !gradientValue.endsWith(")")
  )
    return null;
  const gradientBody = gradientValue.slice("linear-gradient(".length, -1);
  const parts = splitByTopLevelComma(gradientBody);
  if (parts.length < 3) return null;
  const angleMatch = parts[0].trim().match(/(-?\d+(\.\d+)?)deg/);
  const angle = angleMatch
    ? Number.parseFloat(angleMatch[1])
    : DEFAULT_LINEAR_GRADIENT.angle;
  const colors = parts
    .slice(1)
    .map((part) => part.trim().replace(/\s+\d+%$/g, ""))
    .filter(Boolean);
  if (colors.length < 2) return null;
  return { angle, colors };
}

function splitByTopLevelComma(value: string): string[] {
  const parts: string[] = [];
  let currentValue = "";
  let depth = 0;
  for (const char of value) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(currentValue);
      currentValue = "";
      continue;
    }
    currentValue += char;
  }
  if (currentValue.trim()) parts.push(currentValue);
  return parts;
}

export function normalizeGradientColors(
  colors: string[],
  targetLength: number,
): string[] {
  const safeColors =
    colors.length > 0
      ? colors.slice(0, targetLength)
      : [...DEFAULT_LINEAR_GRADIENT.colors];
  while (safeColors.length < targetLength) {
    safeColors.push(
      safeColors[safeColors.length - 1] ?? DEFAULT_LINEAR_GRADIENT.colors[0],
    );
  }
  return safeColors;
}

export function buildLinearGradient({
  angle,
  colors,
}: {
  angle: number;
  colors: string[];
}): string {
  return `linear-gradient(${Math.round(angle)}deg, ${colors.join(", ")})`;
}

export function withGradientOptions({
  values,
  valuePrefix,
  overrides,
}: {
  values: string[];
  valuePrefix: string;
  overrides: Record<string, string>;
}): GradientOption[] {
  return values.map((value, index) => {
    const id = `${valuePrefix}-${index}`;
    return {
      id,
      baseValue: value,
      value: overrides[id] ?? value,
    };
  });
}
