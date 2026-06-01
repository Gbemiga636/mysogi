/**
 * Flyer style presets — 50+ creative-director looks.
 * Implementation lives in flyerCreativePresets.ts (re-exported here for compatibility).
 */

export {
  REFERENCE_FLYER_MARKER,
  type ReferenceFlyerStyleId,
  type FlyerCreativePresetId,
  type FlyerCreativePreset,
  type ReferenceFlyerPromptBlocks,
  FLYER_CREATIVE_PRESETS,
  PRESET_COUNT,
  isReferenceFlyerStyleEnabled,
  resolveReferenceFlyerStyle,
  resolveAlternateReferenceStyle,
  resolveFlyerCreativePreset,
  resolveAlternateFlyerPreset,
  getFlyerCreativePreset,
  getPresetLabel,
  normalizePresetId,
  REFERENCE_STYLE_LABELS,
  buildReferenceFlyerPromptBlocks,
  buildReferenceFlyerPromptBlock,
  buildPresetLayoutBlueprint,
  buildPresetVisualSystem,
  buildPresetTypographyBlock,
  buildPresetCopyStructure,
} from "./flyerCreativePresets";
