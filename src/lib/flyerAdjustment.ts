/** User-requested tweaks to a generated flyer — regenerate with surgical changes. */

export function buildFlyerAdjustmentBlock(
  adjustmentNote: string,
  previousPrompt?: string
): string {
  const note = adjustmentNote.replace(/"/g, "'").trim().slice(0, 800);
  if (!note) return "";

  return [
    "=== AI ADJUSTMENT REQUEST (mandatory — apply precisely) ===",
    `The user selected a generated design and wants this change: "${note}"`,
    "Keep Trial-4 premium layout density, exact marketing copy spelling, industry visuals, empty top logo band, and CTA above footer reserve.",
    "Change ONLY what the user specifies. Do not replace the whole design unless they explicitly ask for a full redesign.",
    "Preserve brand colors, glass UI panels, stats bar, and glowing CTA style unless the adjustment says otherwise.",
    previousPrompt?.trim()
      ? `Previous generation brief (context — keep what still works):\n${previousPrompt.trim().slice(0, 1400)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}
