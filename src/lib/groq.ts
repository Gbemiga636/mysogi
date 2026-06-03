import "server-only";

import OpenAI from "openai";

import { buildCampaignMessagePrimaryBlock } from "./campaignMessagePrompt";
import {
  applyCampaignTypeToCopyFallback,
  buildCampaignTypeCopyHints,
  buildCampaignTypePromptLead,
  withCampaignTypePromptLead,
} from "./campaignTypeEngine";
import {
  derivePromptStyleFromBusiness,
  formatBusinessCampaignBrief,
  getCampaignVisualStyle,
} from "./businessCampaign";
import {
  flattenErrorMessage,
  isTransientNetworkError,
  withNetworkRetry,
} from "./networkRetry";
import { formatBusinessContext } from "./businessPrompt";
import {
  formatBrandPaletteForImagenVisual,
  formatBrandPaletteForPrompt,
} from "./brandColors";
import {
  AD_AGENCY_VISUAL_LANGUAGE,
  analyzeCampaignCreative,
  formatCreativeDirectorBrief,
} from "./creativeDirector";
import {
  buildEliteAgencyImagenPrompt,
  describeHeroSubject,
  ELITE_CREATIVE_DIRECTOR_SYSTEM,
  ELITE_VISUAL_MARKETING_LANGUAGE,
  formatEliteDirectorBriefForGroq,
  getNicheVisualAdaptation,
} from "./eliteCreativeDirector";
import { buildBusinessFlyerVisualPrompt } from "./flyerImagenVisualPrompt";
import { buildSceneElementsProse } from "./flyerSceneElements";
import {
  buildFlyerVisualPrompt,
  strengthenFlyerPromptForImagen,
} from "./flyerPrompt";
import { FLYER_ZERO_TEXT_POLICY } from "./flyerTextGuard";
import { flyerFormatLabel } from "./flyerVisualCommon";
import {
  buildBusinessContactLine,
  buildContactFooterDirective,
  buildContactFooterReserveDirective,
  buildNoContactTextInImageBlock,
  CONTACT_TEXT_NEGATIVE_PROMPT,
  ensureBusinessContactOnCopy,
} from "./businessContact";
import {
  analyzeAdAgencyDirection,
  formatAdAgencyDirectionBlock,
} from "./adAgencyEngine";
import {
  ELITE_AD_CREATIVE_DIRECTOR_SYSTEM,
  buildRulesBasedEliteAdPackage,
  formatEliteAdBriefForGroq,
  formatElitePackageForDisplay,
  gatherEliteAdBriefInputs,
  parseEliteAdCreativePackageJson,
  PREMIUM_COMMERCIAL_GRAPHIC_MOTIFS,
  type EliteAdCreativePackage,
} from "./eliteAdCreativeDirector";
import {
  buildMobilePosterPromptBlocks,
} from "./mobileAdInImageLayout";
import {
  buildCreativeConcept,
  analyzeBusinessForDesign,
  isFinishedFlyerDesignEnabled,
  isPremiumHybridFlyerEnabled,
  LOGO_ZONE_RULES,
  SENIOR_DESIGNER_PERSONA,
  SENIOR_SCENE_PERSONA,
} from "./seniorDesignerEngine";
import { buildPremiumInImageTypographyBlock } from "./premiumInImageTypography";
import {
  buildPrintReadyAdvertisingBlock,
  formatCompleteStep1Profile,
  PRINT_READY_FLYER_SYSTEM,
} from "./printReadyFlyerBrief";
import {
  isTrendingSocialFlyerEnabled,
  TRENDING_SOCIAL_FLYER_SYSTEM,
} from "./trendingSocialFlyerSystem";
import { isSvgFlyerFooterMode } from "./flyerSvgFooterMode";
import {
  buildEliteBusinessFields,
  ELITE_MASTER_PERSONA,
  formatEliteBusinessBlock,
} from "./eliteFlyerMasterPrompt";
import {
  formatPremiumFlyerBriefForGroq,
  PREMIUM_FLYER_ENGINE_SYSTEM,
  resolvePremiumAdStyle,
  stripTextFreeLanguage,
} from "./premiumFlyerEngine";
import {
  getProfessionalShotRecipe,
  PRO_AGENCY_COMPOSITION_RULES,
} from "./professionalFlyerVisuals";

import { MYSOGI_MARKETING_SYSTEM } from "./types";

import {
  mergeCampaignCopyWithBusiness,
  parseCampaignCopyJson,
} from "./campaignCopyAi";
import { sanitizeCampaignCopyForFlyer } from "./campaignCopySanitize";
import { buildCampaignCopy, type CampaignCopy } from "./campaignTextLayers";
import type { BusinessProfile, VideoFormat } from "./types";



/** Groq model routing — https://console.groq.com/docs/models */

export const GROQ_MODELS = {

  /** Best overall marketing & captions */

  marketing: "llama-3.3-70b-versatile",

  /** Fast + cheap headlines & one-liners */

  fast: "llama-3.1-8b-instant",

  /** Advanced reasoning — Runway / image prompts */

  reasoning: "openai/gpt-oss-120b",

  /** Multilingual & social-platform copy */

  social: "mistral-saba-24b",

  /** Read text on flyer images (vision OCR) */

  vision: "llama-3.2-90b-vision-preview",

} as const;



let client: OpenAI | null = null;



function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      throw new Error(
        "GROQ_API_KEY is not set. Add it to .env.local and restart npm run dev."
      );
    }
    client = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
      timeout: 120_000,
      maxRetries: 0,
    });
  }
  return client;
}

/** User-friendly Groq / connection errors */
export function parseGroqError(error: unknown): string {
  const raw = flattenErrorMessage(error);

  if (!process.env.GROQ_API_KEY?.trim()) {
    return "GROQ_API_KEY is missing. Add it to .env.local and restart npm run dev.";
  }

  if (
    /Connection error|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|fetch failed|getaddrinfo|socket hang up|ERR_NETWORK/i.test(
      raw
    )
  ) {
    return "Could not reach Groq (api.groq.com). This is usually internet or DNS — check Wi‑Fi, turn off VPN, run ipconfig /flushdns in PowerShell, wait 20 seconds, then try again.";
  }

  if (/401|invalid.*api.*key|incorrect api key|unauthorized/i.test(raw)) {
    return "Invalid GROQ_API_KEY. Copy a new key from console.groq.com → API Keys, update .env.local, restart npm run dev.";
  }

  if (/429|rate limit|too many requests/i.test(raw)) {
    return "Groq rate limit reached. Wait about a minute and try again.";
  }

  if (/model.*not found|does not exist|decommissioned/i.test(raw)) {
    return "Groq model unavailable. Restart the dev server — the app will use a supported model.";
  }

  return raw.length > 200 ? `${raw.slice(0, 200)}…` : raw || "Groq request failed";
}

export async function testGroqConnection(): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    await withNetworkRetry(
      async () => {
        await getClient().chat.completions.create({
          model: GROQ_MODELS.fast,
          messages: [{ role: "user", content: "Reply with OK only." }],
          max_tokens: 8,
        });
      },
      { retries: 4, label: "groq.ping" }
    );
    return { ok: true };
  } catch (e) {
    return { ok: false, error: parseGroqError(e) };
  }
}



function businessContext(b: BusinessProfile): string {

  return formatBusinessContext(b);

}

/** Shared context for senior designer Groq calls */
function formatSeniorDesignerGroqContext(
  business: BusinessProfile,
  idea: string,
  format: VideoFormat
): string {
  const analysis = analyzeBusinessForDesign(business);
  const fields = buildEliteBusinessFields(business, idea);
  const scene = buildSceneElementsProse(business);
  const hero = describeHeroSubject(business);
  const shot = getProfessionalShotRecipe(business, format);
  const fmt = flyerFormatLabel(format);

  return [
    formatEliteBusinessBlock(fields),
    formatBusinessCampaignBrief(business, format),
    `Industry: ${analysis.industry} | Audience: ${analysis.audience} | Angle: ${analysis.marketingAngle} | Luxury: ${analysis.luxuryLevel}`,
    `Scene seed: ${scene.slice(0, 380)} | Hero: ${hero}`,
    `Camera: ${shot.slice(0, 220)} | Format: ${fmt}`,
    business.imageProps?.trim()
      ? `MANDATORY items in frame: ${business.imageProps.trim().slice(0, 320)}`
      : "",
    idea.trim() ? `Client creative note: ${idea.trim().slice(0, 400)}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}



async function chatWithSystem(
  system: string,
  userPrompt: string,
  options?: { maxTokens?: number; temperature?: number; model?: string }
): Promise<string> {
  const model = options?.model ?? GROQ_MODELS.marketing;
  return withNetworkRetry(
    async () => {
      const groq = getClient();
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        max_tokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.7,
      });

      const text = completion.choices[0]?.message?.content?.trim();
      if (!text) throw new Error("Groq returned an empty response");
      return text;
    },
    { retries: 5, label: `groq.chat.${model.split("/").pop()}` }
  );
}

async function chat(
  model: string,
  userPrompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  return withNetworkRetry(
    async () => {
      const groq = getClient();
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: "system", content: MYSOGI_MARKETING_SYSTEM },
          { role: "user", content: userPrompt },
        ],
        max_tokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.7,
      });

      const text = completion.choices[0]?.message?.content?.trim();
      if (!text) throw new Error("Groq returned an empty response");
      return text;
    },
    { retries: 5, label: `groq.chat.${model.split("/").pop()}` }
  );
}

/** Prefer marketing model if reasoning model fails (non-network errors) */
async function chatWithFallback(
  primaryModel: string,
  fallbackModel: string,
  userPrompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  try {
    return await chat(primaryModel, userPrompt, options);
  } catch (e) {
    if (isTransientNetworkError(e)) throw e;
    return chat(fallbackModel, userPrompt, options);
  }
}



/** Trim reasoning artifacts from OSS / reasoning models */

function cleanOutput(text: string): string {

  return text

    .replace(/[\s\S]*?<\/think>/gi, "")

    .replace(/^\s*reasoning:[\s\S]*?(?=\n\n|\n[A-Z])/im, "")

    .trim();

}



export async function generateScript(

  business: BusinessProfile,

  durationSeconds: number,

  tone: string

): Promise<string> {

  const prompt = `Write a ${durationSeconds}-second video ad script for this business.

Tone: ${tone}

Format: scene-by-scene with timestamps (0-2s hook, middle proof/benefit, end CTA).

Include voiceover lines and on-screen text suggestions.



${businessContext(business)}`;



  return chat(GROQ_MODELS.marketing, prompt, { maxTokens: 4096 });

}



export async function generateCaption(

  business: BusinessProfile,

  platform: string,

  options?: { multilingual?: boolean }

): Promise<string> {

  const model = options?.multilingual

    ? GROQ_MODELS.social

    : GROQ_MODELS.marketing;



  const prompt = options?.multilingual

    ? `Write 3 ad caption variants for ${platform} (label Variant A/B/C).

Include Nigerian English, Pidgin, or Hausa/Yoruba/Igbo phrases where natural.

Emojis sparingly, hashtags (5-8), strong CTA. Max 2200 chars total.



${businessContext(business)}`

    : `Write 3 ad caption variants for ${platform} (label Variant A/B/C).

Include emojis sparingly, hashtags (5-8), and CTA. Max 2200 chars total.



${businessContext(business)}`;



  return chat(model, prompt, { maxTokens: 2048 });

}



export async function enhanceRunwayPrompt(

  business: BusinessProfile,

  userPrompt: string,

  format: string

): Promise<string> {

  const idea =
    userPrompt.trim() ||
    business.campaignGoal?.trim() ||
    `brand awareness for ${business.businessName || "the brand"}`;

  const prompt = `You are an elite commercial director. Transform the client idea into ONE powerful MiniMax video-01 prompt (one paragraph, 200–280 words, English).

Aspect ratio: ${format}

${businessContext(business)}

${business.imageProps?.trim() ? `Feature in scenes: ${business.imageProps.trim().slice(0, 240)}` : ""}

Client idea to elevate: ${idea}

MANDATORY:
- This is an advertisement for THIS exact business — name the trade, location vibe, and audience desire
- Real people, authentic ${business.industry || "business"} environment, hero product or service moment
- Cinematic lighting, shallow depth of field, premium color grade, Nigerian market energy where natural
- No readable text, fake logos, or watermarks in the video frame (logo added in post)
- End with energy that supports CTA: ${business.callToAction || "act now"}

Output ONLY the final video prompt paragraph. No labels or bullet lists.`;



  const raw = await chatWithFallback(
    GROQ_MODELS.reasoning,
    GROQ_MODELS.marketing,
    prompt,
    { maxTokens: 1024, temperature: 0.4 }
  );

  return cleanOutput(raw);

}



/**

 * High-energy marketing FLYER background prompt — thumb-stopping paid social visual.

 */

export async function generateFlyerPrompt(
  business: BusinessProfile,
  userPrompt: string,
  format: VideoFormat,
  style?: string,
  campaignMessage = ""
): Promise<string> {
  const idea =
    userPrompt.trim() ||
    business.campaignGoal ||
    `launch campaign for ${business.businessName || "the brand"}`;

  const finish = (text: string) =>
    withCampaignTypePromptLead(text, business, userPrompt, campaignMessage);

  if (isPremiumHybridFlyerEnabled()) {
    const [concept, visual] = await Promise.all([
      generateSeniorDesignerConceptBrief(business, idea),
      generateSeniorDesignerSceneVisualBrief(business, idea, format),
    ]);
    return finish([concept, visual].filter(Boolean).join("\n\n"));
  }

  if (isFinishedFlyerDesignEnabled()) {
    const copy = buildCampaignCopy(business);
    const pkg = await generateEliteAdCreativePackage(
      business,
      copy,
      format,
      idea,
      userPrompt.trim()
    );
    return finish(formatElitePackageForDisplay(pkg));
  }

  const analysis = analyzeCampaignCreative(business, idea, format);
  const directorBrief = formatCreativeDirectorBrief(analysis, business, format);
  const eliteBrief = formatEliteDirectorBriefForGroq(business, format);

  const campaignLead = buildCampaignTypePromptLead(
    business,
    userPrompt,
    campaignMessage
  );

  const prompt = `${ELITE_CREATIVE_DIRECTOR_SYSTEM}

${campaignLead}

Write ONE Google Imagen 4 prompt for a STRICTLY TEXT-FREE luxury marketing ad BACKGROUND PLATE.

Think through all 6 layers (brand analysis, ad strategy, visual language, composition, industry adaptation, agency brief). Visuals MUST match this exact client — never generic stock art.

${eliteBrief}

${directorBrief}

${formatBusinessCampaignBrief(business, format)}

Style: ${style?.trim() || derivePromptStyleFromBusiness(business)}

MANDATORY VISUAL LANGUAGE:
${ELITE_VISUAL_MARKETING_LANGUAGE}
${AD_AGENCY_VISUAL_LANGUAGE}

${FLYER_ZERO_TEXT_POLICY}

RULES:
- One vivid cinematic paragraph, 180–260 words
- MUST match this exact industry: ${business.industry || "general business"} — unmistakable trade-specific visuals
- Campaign: ${business.campaignGoal || "conversions"} | Audience: ${business.targetAudience || "customers"} | Market: ${business.location || "local"}
- No floating shapes, stickers, pills, badges, or abstract geometry — real photography only
- Include: real people, buildings, props, environment for that industry
- Describe lighting and mood only — NEVER use words: zone, colour, color, palette, headline, overlay, hex, layout, CTA
- No section headers, no bullet lists, no quotes, no business name spelled in the image
- Industry goal: ${business.campaignGoal || "conversions"}
- Blank signs, blank screens, no readable writing anywhere

Output ONLY the paragraph. No preamble.`;

  const raw = await chatWithFallback(
    GROQ_MODELS.reasoning,
    GROQ_MODELS.marketing,
    prompt,
    { maxTokens: 2000, temperature: 0.74 }
  );
  const cleaned = strengthenFlyerPromptForImagen(cleanOutput(raw), business, format);
  if (
    cleaned.length > 400 &&
    /no text|text-free|zero readable|commercial|agency|hero/i.test(cleaned)
  ) {
    return finish(cleaned);
  }
  return finish(buildBusinessFlyerVisualPrompt(business, format, idea));
}

/**
 * Groq scene paragraph for AI Ad Agency Engine — cinematic visual only, no text in image.
 */
export async function generateAdAgencySceneBrief(
  business: BusinessProfile,
  userPrompt: string,
  format: VideoFormat
): Promise<string> {
  const idea =
    userPrompt.trim() ||
    business.campaignGoal?.trim() ||
    `premium campaign for ${business.businessName || business.industry || "the brand"}`;

  const direction = analyzeAdAgencyDirection(business, format, idea);
  const fields = buildEliteBusinessFields(business, idea);
  const scene = buildSceneElementsProse(business);
  const hero = describeHeroSubject(business);
  const shot = getProfessionalShotRecipe(business, format);
  const fmt = flyerFormatLabel(format);

  const prompt = `${ELITE_MASTER_PERSONA}

You are the AI AD AGENCY ENGINE cinematographer. Write ONE scene paragraph (280–380 words).

Deliverable: cinematic luxury MARKETING ADVERTISEMENT photograph only — never a business flyer or generic poster.
Typography (headline, CTA, contact) is added later via SVG overlay. NO readable text in the photograph.

${formatAdAgencyDirectionBlock(direction, business)}

${formatEliteBusinessBlock(fields)}

CLIENT IDEA: ${idea.slice(0, 500)}

INCLUDE as flowing prose:
- ${scene.slice(0, 400)} | Hero: ${hero}
- Camera & lighting: ${shot.slice(0, 260)} | ${fmt}
- ${direction.campaignStyle.aesthetic} | ${direction.luxuryLevel}
- Foreground, midground, background, asymmetrical balance
- People and environment unmistakably ${direction.businessType}
- Calm negative-space bands for headline (top), CTA (mid-lower), contact (bottom)
- Octane-quality commercial photography, expensive agency-made, NOT generic AI

FORBIDDEN: flyer, poster template, readable words, text-free plate language, lorem, warped objects, cheap glow.

One paragraph only.`;

  const raw = await chatWithFallback(
    GROQ_MODELS.reasoning,
    GROQ_MODELS.marketing,
    prompt,
    { maxTokens: 1600, temperature: 0.82 }
  );

  const cleaned = stripTextFreeLanguage(cleanOutput(raw));

  if (
    cleaned.length >= 240 &&
    /cinematic|photograph|lighting|campaign|luxury|depth/i.test(cleaned)
  ) {
    return cleaned.slice(0, 1400);
  }

  return stripTextFreeLanguage(
    [direction.sceneDirection, shot, `Creative: ${idea.slice(0, 200)}.`].join(" ")
  );
}

/**
 * Groq elevates client idea for elite cinematic ad visual — typography added via Sharp overlay.
 */
export async function generateEliteFlyerVisualBrief(
  business: BusinessProfile,
  userPrompt: string,
  format: VideoFormat
): Promise<string> {
  const idea =
    userPrompt.trim() ||
    business.campaignGoal?.trim() ||
    `premium campaign for ${business.businessName || business.industry || "the brand"}`;

  const fields = buildEliteBusinessFields(business, idea);
  const scene = buildSceneElementsProse(business);
  const hero = describeHeroSubject(business);
  const shot = getProfessionalShotRecipe(business, format);
  const niche = getNicheVisualAdaptation(business);
  const adStyle = resolvePremiumAdStyle(business);
  const palette = formatBrandPaletteForImagenVisual(business);
  const fmt = flyerFormatLabel(format);

  const prompt = `${ELITE_MASTER_PERSONA}

Enhance the client idea into ONE cinematic scene paragraph (260–360 words) for a WORLD-CLASS LUXURY MARKETING ADVERTISEMENT photograph.

The image will receive premium typography overlay (headline, CTA, contact) in post — your paragraph describes ONLY the visual photograph and reserved negative-space zones. Do NOT write headline, CTA, phone, or email text content.

${formatEliteBusinessBlock(fields)}

CLIENT IDEA: ${idea.slice(0, 500)}

INCLUDE (woven as flowing prose):
- Scene: ${scene.slice(0, 450)}
- Hero: ${hero}
- Camera: ${shot.slice(0, 300)} | Format: ${fmt}
- Foreground, midground, background depth, asymmetrical balance
- Real people matching ${fields.targetAudience}
- Industry-authentic environment for ${fields.industry}
- Lighting: ${adStyle.lighting} | Style: ${adStyle.aesthetic}
- ${niche} | Color grade: ${palette}
- Reserve calm upper band for headline overlay, mid-lower for CTA overlay, bottom for contact — soft bokeh or gradient veil, NO readable words anywhere in the photo
- Ultra-realistic advertising photography, octane-quality materials, cinematic grade, masterpiece agency commercial

FORBIDDEN: text-free, zero-text, generic AI poster, flat layout, random neon, readable signage, spelling any marketing copy, cheap glow, cluttered composition.

Output ONE paragraph only.`;

  const raw = await chatWithFallback(
    GROQ_MODELS.reasoning,
    GROQ_MODELS.marketing,
    prompt,
    { maxTokens: 1500, temperature: 0.82 }
  );

  const cleaned = stripTextFreeLanguage(cleanOutput(raw));

  if (
    cleaned.length >= 220 &&
    /cinematic|photograph|lighting|foreground|luxury|campaign|depth/i.test(cleaned)
  ) {
    return cleaned.slice(0, 1400);
  }

  return stripTextFreeLanguage(
    [adStyle.aesthetic, scene, hero, shot, `Creative: ${idea.slice(0, 200)}.`].join(" ")
  );
}

/**
 * Groq enhances the client idea for OpenAI — finished agency flyer only (optional integrated mode).
 */
export async function generateOpenAIIntegratedVisualBrief(
  business: BusinessProfile,
  userPrompt: string,
  format: VideoFormat
): Promise<string> {
  const idea =
    userPrompt.trim() ||
    business.campaignGoal?.trim() ||
    `premium launch for ${business.businessName || business.industry || "the brand"}`;

  const scene = buildSceneElementsProse(business);
  const hero = describeHeroSubject(business);
  const shot = getProfessionalShotRecipe(business, format);
  const niche = getNicheVisualAdaptation(business);
  const style = getCampaignVisualStyle(business);
  const adStyle = resolvePremiumAdStyle(business);
  const palette = formatBrandPaletteForImagenVisual(business);
  const fmt = flyerFormatLabel(format);
  const fields = buildEliteBusinessFields(business, idea);
  const contactFooter = isSvgFlyerFooterMode()
    ? buildContactFooterReserveDirective(business)
    : buildContactFooterDirective(business);

  const prompt = `${ELITE_MASTER_PERSONA}

Enhance the client idea into ONE vivid paragraph (260–360 words) describing a FINISHED luxury marketing advertisement — photography AND premium typography integrated in one artwork.

OpenAI will render the full ad including elite typesetting. A separate system supplies exact headline, tagline, CTA, phone, and email — describe layout zones and typography quality (bold headline, glass CTA button, footer contact strip), not the literal words.

CLIENT IDEA: ${idea.slice(0, 500)}

${formatEliteBusinessBlock(fields)}

${contactFooter}

INCLUDE (flowing prose):
- Scene: ${scene.slice(0, 450)} | Hero: ${hero}
- Camera: ${shot.slice(0, 280)} | ${fmt}
- Depth layers, ${adStyle.composition}, ${adStyle.lighting}
- People matching audience, ${fields.industry} environment
- ${niche} | Grade: ${palette} | Mood: ${style}
- Typography design: ${adStyle.typographyMood} — magazine-quality integrated type, premium button CTA${
    isSvgFlyerFooterMode()
      ? ", empty footer band for SVG contact overlay (no phone/email/URL in image)"
      : ", readable footer for phone and email"
  }
- Octane-quality commercial finish, masterpiece agency ad

FORBIDDEN: text-free, zero-text, background plate, post overlay, empty text zones, generic AI poster, warped type, random neon.

Output ONE paragraph only.`;

  const raw = await chatWithFallback(
    GROQ_MODELS.reasoning,
    GROQ_MODELS.marketing,
    prompt,
    { maxTokens: 1400, temperature: 0.8 }
  );

  const cleaned = stripTextFreeLanguage(cleanOutput(raw));

  if (
    cleaned.length >= 200 &&
    /flyer|campaign|photograph|lighting|headline|composition|foreground/i.test(
      cleaned
    )
  ) {
    return cleaned.slice(0, 1300);
  }

  return stripTextFreeLanguage(
    [
      adStyle.aesthetic,
      scene,
      hero,
      shot,
      adStyle.composition,
      adStyle.lighting,
      `Creative angle: ${idea.slice(0, 220)}.`,
    ].join(" ")
  );
}

/**
 * Elite agency creative package — full CD phases → JSON → master image prompt.
 */
export async function generateEliteAdCreativePackage(
  business: BusinessProfile,
  copy: CampaignCopy,
  format: VideoFormat,
  userIdea: string,
  rawClientPrompt?: string
): Promise<EliteAdCreativePackage> {
  const clientPrompt = (rawClientPrompt ?? userIdea).trim();
  const idea =
    userIdea.trim() ||
    business.campaignGoal?.trim() ||
    business.tagline?.trim() ||
    "";
  const inputs = gatherEliteAdBriefInputs(business, copy, format, idea);
  const safe = ensureBusinessContactOnCopy(copy, business);
  const fallback = buildRulesBasedEliteAdPackage(business, copy, format, idea);
  const mobile = buildMobilePosterPromptBlocks(business, safe, format);

  const clientLock = clientPrompt
    ? `
CRITICAL — CLIENT PROMPT IS LAW:
The client wrote this creative direction. Your finalImagePrompt MUST implement it faithfully. Do NOT substitute a generic ${inputs.industry} stock scene.
CLIENT PROMPT (implement every detail):
"${clientPrompt.replace(/"/g, "'")}"
`
    : "";

  const prompt = `${ELITE_AD_CREATIVE_DIRECTOR_SYSTEM}

Complete ALL creative phases. Return ONE valid JSON object only (no markdown fences).
${clientLock}

${formatEliteAdBriefForGroq(inputs, business, copy, format)}

${isTrendingSocialFlyerEnabled() ? TRENDING_SOCIAL_FLYER_SYSTEM : PRINT_READY_FLYER_SYSTEM}

Use EVERY Step 1 field above to design a ${isTrendingSocialFlyerEnabled() ? "trending viral social media" : "print-ready commercial"} flyer for ${inputs.brandName}. Center-aligned hierarchy, cinematic depth, professional overlays — not a generic ${inputs.industry} template.

${mobile.zoneBlueprint}
${mobile.typography}
${mobile.contrast}

EXACT COPY (center-aligned typeset INSIDE the image — spell perfectly, never hand-drawn):
- HERO HEADLINE (business name EXACT, largest type): ${inputs.brandName}
- Subheadline: ${safe.tagline || ""}
- CTA button label: ${safe.cta}
${
  isSvgFlyerFooterMode()
    ? `- Contact: NOT in image — ${buildNoContactTextInImageBlock(business, format, safe).slice(0, 400)}`
    : `- Contact footer: ${safe.contact}`
}

${isSvgFlyerFooterMode() ? buildContactFooterReserveDirective(business, format, safe) : ""}

finalImagePrompt MUST describe a ${isTrendingSocialFlyerEnabled() ? "TRENDING VIRAL SOCIAL MEDIA" : "PRINT-READY"} professional advertising flyer:
- Center-aligned vertical stack: business name hero headline → subhead → glowing CTA on center axis
- Cinematic subject lower frame — blur/darken behind text; never type over faces
- ${PREMIUM_COMMERCIAL_GRAPHIC_MOTIFS}
- Glassmorphism panels, gradient scrims, depth blur, ambient CTA glow — designed poster not pasted text
- Cinematic ${inputs.referenceStyle} | Preset: ${mobile.preset.label}
- Headline and CTA typeset in-image; small logo + contact footer lines added via SVG overlay after generation when applicable

JSON schema:
{
  "creativeConcept": "2-3 sentences: visual story and conversion hook",
  "artDirection": {
    "lighting": "",
    "environment": "",
    "composition": "",
    "mood": "",
    "camera": "",
    "colorPalette": ""
  },
  "typographyStrategy": {
    "headlinePlacement": "editorial position — not required center",
    "fontStyle": "Inter/Poppins/SF Pro typeset — never hand-drawn",
    "ctaTreatment": "pill button with typeset label, brand-aware colors",
    "hierarchy": "brand small, headline XL, subhead M, CTA button, footer S"
  },
  "finalImagePrompt": "320-400 words — print-ready ad art: exact placement of photo, shapes, panels, and typeset copy; must reflect ALL Step 1 business details",
  "negativePrompt": "comma-separated — must include: ${CONTACT_TEXT_NEGATIVE_PROMPT}, ignoring client brief, wrong subject, wrong mood, contact text in image"
}`;

  try {
    const raw = await chatWithFallback(
      GROQ_MODELS.reasoning,
      GROQ_MODELS.marketing,
      prompt,
      {
        maxTokens: 2400,
        temperature: clientPrompt.length >= 12 ? 0.52 : 0.65,
      }
    );
    const partial = parseEliteAdCreativePackageJson(cleanOutput(raw));
    if (
      partial?.finalImagePrompt &&
      partial.finalImagePrompt.length >= 200 &&
      /cinematic|lighting|composition|premium|luxury|foreground/i.test(
        partial.finalImagePrompt
      )
    ) {
      return {
        creativeConcept: partial.creativeConcept || fallback.creativeConcept,
        artDirection: {
          ...fallback.artDirection,
          ...partial.artDirection,
        },
        typographyStrategy: {
          ...fallback.typographyStrategy,
          ...partial.typographyStrategy,
        },
        finalImagePrompt: partial.finalImagePrompt.slice(0, 2100),
        negativePrompt: partial.negativePrompt || fallback.negativePrompt,
      };
    }
  } catch (e) {
    console.warn("[elite-ad-creative-package]", e);
  }

  return fallback;
}

/**
 * Step 2 — elite creative direction the flyer engine will execute.
 */
export async function enhanceCreativeIdea(
  business: BusinessProfile,
  userPrompt: string,
  format: VideoFormat
): Promise<string> {
  const idea =
    userPrompt.trim() ||
    business.campaignGoal?.trim() ||
    business.tagline?.trim() ||
    `premium campaign for ${business.businessName || business.industry || "the brand"}`;

  const copy = buildCampaignCopy(business);

  try {
    const pkg = await generateEliteAdCreativePackage(
      business,
      copy,
      format,
      idea,
      userPrompt.trim()
    );
    const ad = pkg.artDirection;
    return [
      pkg.creativeConcept,
      "",
      `Setting: ${ad.environment.slice(0, 200)}`,
      `Mood & light: ${ad.mood}. ${ad.lighting.slice(0, 160)}`,
      `Hero composition: ${ad.composition.slice(0, 180)}`,
      `Typography: ${pkg.typographyStrategy.headlinePlacement.slice(0, 140)}`,
      business.imageProps?.trim()
        ? `Must show: ${business.imageProps.trim().slice(0, 160)}`
        : "",
    ]
      .filter(Boolean)
      .join("\n")
      .slice(0, 1200);
  } catch {
    /* fallback below */
  }

  return [
    idea,
    business.imageProps?.trim()
      ? `Feature: ${business.imageProps.trim().slice(0, 160)}.`
      : "",
    `Premium ${business.industry || "brand"} campaign for ${business.targetAudience || "customers"}.`,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Finished ad — Groq scene paragraph (people, props, typeset layout zones) */
export async function generateSeniorDesignerVisualBrief(
  business: BusinessProfile,
  userIdea: string,
  format: VideoFormat
): Promise<string> {
  const idea =
    userIdea.trim() ||
    business.campaignGoal?.trim() ||
    `premium launch for ${business.businessName || business.industry || "the brand"}`;

  const adStyle = resolvePremiumAdStyle(business);
  const palette = formatBrandPaletteForImagenVisual(business);
  const niche = getNicheVisualAdaptation(business);

  const prompt = `${SENIOR_DESIGNER_PERSONA}

Write ONE cinematic creative-direction paragraph (240–320 words) for a FINISHED luxury marketing advertisement rendered in a single image.

The image generator will typeset exact headline, CTA, phone, and email — you describe ONLY:
- Cast, environment, props, lighting, camera, composition
- Where typography zones sit (headline band, CTA button, footer) and that type must look PRINTED/TYPESET — never hand-drawn

${formatSeniorDesignerGroqContext(business, idea, format)}

${LOGO_ZONE_RULES}

${buildPremiumInImageTypographyBlock(business)}

INCLUDE as flowing prose:
- Real people with natural emotion; hero product/service interaction
- Foreground / midground / background depth, asymmetrical balance
- ${adStyle.aesthetic} | Lighting: ${adStyle.lighting} | Composition: ${adStyle.composition}
- ${niche} | Color grade: ${palette}
- Octane-quality commercial photography, agency masterpiece, scroll-stopping paid social

FORBIDDEN: text-free, zero-text, background plate, SVG overlay, hand-drawn letters, painted typography, sketchy text, fake logo in image, generic AI poster, empty scene, unrelated industry props.

One paragraph only. No preamble.`;

  const raw = await chatWithFallback(
    GROQ_MODELS.reasoning,
    GROQ_MODELS.marketing,
    prompt,
    { maxTokens: 1500, temperature: 0.78 }
  );

  const cleaned = stripTextFreeLanguage(cleanOutput(raw));

  if (
    cleaned.length >= 200 &&
    /cinematic|photograph|lighting|people|campaign|luxury|foreground/i.test(cleaned)
  ) {
    return cleaned.slice(0, 1200);
  }

  const scene = buildSceneElementsProse(business);
  return stripTextFreeLanguage(
    [
      adStyle.aesthetic,
      scene,
      describeHeroSubject(business),
      getProfessionalShotRecipe(business, format).slice(0, 200),
      `Creative: ${idea.slice(0, 200)}.`,
    ].join(" ")
  ).slice(0, 1200);
}

/** Hybrid mode — scene plate only (no readable text in image) */
export async function generateSeniorDesignerSceneVisualBrief(
  business: BusinessProfile,
  userIdea: string,
  format: VideoFormat
): Promise<string> {
  const idea =
    userIdea.trim() ||
    business.campaignGoal?.trim() ||
    `premium campaign for ${business.businessName || business.industry || "the brand"}`;

  const adStyle = resolvePremiumAdStyle(business);
  const palette = formatBrandPaletteForImagenVisual(business);

  const prompt = `${SENIOR_SCENE_PERSONA}

Write ONE scene paragraph (260–340 words) for a luxury advertising KEY VISUAL photograph.

Typography is added after generation — ABSOLUTELY NO readable words, numbers, or logos in the photograph.

${formatSeniorDesignerGroqContext(business, idea, format)}

INCLUDE: cast, mandatory items, environment, foreground/midground/background, camera, ${adStyle.lighting}, ${palette}, upper-third negative space for headline overlay, octane commercial quality.

FORBIDDEN: readable text, signage copy, hand-drawn words, fake brand marks, text-free plate jargon, generic stock.

One paragraph only.`;

  const raw = await chatWithFallback(
    GROQ_MODELS.reasoning,
    GROQ_MODELS.marketing,
    prompt,
    { maxTokens: 1500, temperature: 0.8 }
  );

  const cleaned = stripTextFreeLanguage(cleanOutput(raw));

  if (
    cleaned.length >= 220 &&
    /cinematic|photograph|lighting|people|depth|luxury/i.test(cleaned)
  ) {
    return cleaned.slice(0, 1200);
  }

  try {
    return await generateAdAgencySceneBrief(business, idea, format);
  } catch {
    const scene = buildSceneElementsProse(business);
    return stripTextFreeLanguage(
      [adStyle.aesthetic, scene, `Creative: ${idea.slice(0, 200)}.`].join(" ")
    ).slice(0, 1200);
  }
}

/** Step 2 boost — cinematic campaign concept (1–2 sentences) */
export async function generateSeniorDesignerConceptBrief(
  business: BusinessProfile,
  userIdea: string
): Promise<string> {
  const analysis = analyzeBusinessForDesign(business);
  const base = buildCreativeConcept(business, analysis);
  const idea = userIdea.trim() || business.campaignGoal?.trim() || "";

  const prompt = `${SENIOR_DESIGNER_PERSONA}

Write 1–2 sentences (max 45 words total) naming the campaign concept for a luxury advertisement.
Never say: create a flyer, generate image, AI art.

${formatSeniorDesignerGroqContext(business, idea, "1:1")}

Seed title: ${base.title}

Output only the concept lines. Name the emotion, hero subject, and setting.`;

  try {
    const raw = await chatWithFallback(
      GROQ_MODELS.reasoning,
      GROQ_MODELS.marketing,
      prompt,
      { maxTokens: 120, temperature: 0.76 }
    );
    const line = cleanOutput(raw).replace(/^["']|["']$/g, "").trim();
    if (line.length >= 16) return line.slice(0, 280);
  } catch {
    /* fallback */
  }
  return base.narrative.slice(0, 280);
}

/** @deprecated Use generateFlyerPrompt */

export async function generateImagePrompt(

  business: BusinessProfile,

  style: string,

  userPrompt?: string,

  format: VideoFormat = "1:1"

): Promise<string> {

  return generateFlyerPrompt(

    business,

    userPrompt ?? "",

    format,

    style

  );

}



/** Quick lightweight copy (headlines, CTAs, one-liners) */

export async function generateFastResponse(

  business: BusinessProfile,

  instruction: string

): Promise<string> {

  const prompt = `${instruction}



${businessContext(business)}`;



  return chat(GROQ_MODELS.fast, prompt, { maxTokens: 512, temperature: 0.6 });

}

/**
 * High-converting flyer copy — headline, tagline, CTA (used for compose + editable polish layers).
 */
export async function generateCampaignFlyerCopy(
  business: BusinessProfile,
  creativeBrief?: string,
  format: VideoFormat = "9:16",
  campaignMessage = ""
): Promise<CampaignCopy> {
  const fallback = applyCampaignTypeToCopyFallback(
    business,
    creativeBrief,
    campaignMessage
  );
  const name = business.businessName?.trim() || "the brand";
  const step1 = formatCompleteStep1Profile(business, fallback, format);
  const typeHints = buildCampaignTypeCopyHints(
    business,
    creativeBrief,
    campaignMessage
  );

  const messageBlock = buildCampaignMessagePrimaryBlock(campaignMessage, business);

  const prompt = `You are a senior copywriter for premium social media flyers. Write conversion copy as JSON ONLY (no markdown).

${step1}

${messageBlock}

${typeHints}

The HERO HEADLINE is always the business name "${name}" — already set. Do NOT generate headline.

Schema:
{"tagline":"...","cta":"...","location":"...","contact":"..."}

Rules:
- tagline: ${
    business.tagline?.trim()
      ? `use EXACTLY: "${business.tagline.trim()}"`
      : campaignMessage.trim()
        ? `8–14 words — MUST reflect the campaign message above (promo, opening, event, launch mood)`
        : "8–14 words — reflect campaign type in subhead NOT headline"
  }
- cta: punchy button 2–4 words — prefer "${business.callToAction || "Start Free Today"}"
- location: "${business.location || ""}" exactly if set, else ""
- contact: REQUIRED — "${buildBusinessContactLine(business) || "phone · email"}"
- NEVER hex codes, #, RGB, or words: logo, palette, hex
- Short, premium, mobile-readable
- No emojis, no quotes inside strings
${
  campaignMessage?.trim()
    ? `\nPRIMARY: tagline and CTA must match this campaign message: ${campaignMessage.trim().slice(0, 160)}`
    : ""
}
${
  creativeBrief?.trim() && !campaignMessage?.trim()
    ? `\nCREATIVE NOTE (secondary): ${creativeBrief.trim().slice(0, 480)}`
    : ""
}
${
  business.imageProps?.trim()
    ? `\nVisual elements the ad must suggest: ${business.imageProps.trim().slice(0, 240)}`
    : ""
}

Output valid JSON only.`;

  try {
    const raw = await chat(GROQ_MODELS.marketing, prompt, {
      maxTokens: 400,
      temperature: 0.42,
    });
    const parsed = parseCampaignCopyJson(raw);
    if (parsed?.tagline || parsed?.cta) {
      return sanitizeCampaignCopyForFlyer(
        mergeCampaignCopyWithBusiness(parsed, business),
        business
      );
    }
  } catch {
    /* use fallback */
  }
  return sanitizeCampaignCopyForFlyer(fallback, business);
}

/** Three distinct campaign messages within the configured character range. */
export async function generateCampaignMessagesGroq(
  business: BusinessProfile,
  userPrompt = "",
  existingMessage = "",
  limits?: import("./campaignMessageGenerator").CampaignMessageLimits
): Promise<string[]> {
  const {
    ensureFullLengthMessage,
    DEFAULT_CAMPAIGN_MESSAGE_LIMITS,
  } = await import("./campaignMessageGenerator");
  const resolved = limits ?? DEFAULT_CAMPAIGN_MESSAGE_LIMITS;
  const { minLength: min, maxLength: max } = resolved;
  const fallback = buildCampaignCopy(business);
  const step1 = formatCompleteStep1Profile(business, fallback, "9:16");
  const { detectCampaignType, buildCampaignTypeCopyHints } = await import(
    "./campaignTypeEngine"
  );
  const profile = detectCampaignType(business, userPrompt, existingMessage);
  const typeHints = buildCampaignTypeCopyHints(
    business,
    userPrompt,
    existingMessage
  );

  const lengthGoal =
    max <= 100
      ? `AIM for ${max} characters — tight, punchy copy`
      : max >= 200
        ? `AIM for ${max} characters — use the full allowed length`
        : `AIM for ${max} characters; use nearly the full character budget`;

  const channelHint =
    max === 160
      ? "ready to send as SMS or short billboard copy"
      : max <= 120
        ? "ready for short SMS, push notification, or headline-style billboard"
        : "ready for social post, billboard, or multi-line campaign copy";

  const prompt = `You are a Nigerian performance marketing copywriter for SMS, billboard, and digital campaigns.

${step1}

${typeHints}

Campaign type: ${profile.label}.

Write exactly 3 DIFFERENT campaign messages for this business. Each message must:
- Be between ${min} and ${max} characters (including spaces) — ${lengthGoal}
- NEVER write short messages under ${min} characters — one-liners are rejected
- Pack in offer, benefit, urgency, location, and CTA where natural
- Be punchy, conversion-focused, ${channelHint}
- Include business name naturally
- Reflect campaign type and target audience
- Use Nigerian English where natural; ₦ only if pricing is mentioned
- No emojis, no hashtags, no quotes inside the text
- Each message must use a DIFFERENT angle (urgency, benefit, social proof, offer, local pride)

Return JSON ONLY:
{"messages":["message one at full length","message two at full length","message three at full length"]}`;

  const raw = await chat(GROQ_MODELS.marketing, prompt, {
    maxTokens: Math.min(1200, Math.max(400, max * 5)),
    temperature: 0.65,
  });

  const normalize = (m: string) => ensureFullLengthMessage(m, business, resolved);

  try {
    const parsed = JSON.parse(raw.trim()) as { messages?: string[] };
    if (Array.isArray(parsed.messages)) {
      return parsed.messages
        .map((m) => normalize(String(m).replace(/\s+/g, " ").trim()))
        .filter(Boolean)
        .slice(0, 3);
    }
  } catch {
    /* parse lines */
  }

  const lines = raw
    .split(/\n+/)
    .map((l) => l.replace(/^[\d.)\-"'\s]+/, "").trim())
    .filter((l) => l.length >= min - 10)
    .map((l) => normalize(l))
    .filter((l) => l.length >= min - 5)
    .slice(0, 3);

  if (lines.length >= 2) return lines;
  throw new Error("Could not parse campaign messages");
}

/** Mysogi Ad Brain — returns AD_BRAIN_OUTPUT JSON block */
export async function generateAdBrainGroq(
  params: import("./adBrainEngine").AdBrainParams & {
    userPrompt: string;
    campaignMessage: string;
  }
): Promise<string> {
  const { AD_BRAIN_SYSTEM } = await import("./adBrainEngine");
  const { buildReferenceFlyerPromptBlock } = await import("./referenceFlyerStyle");
  const business = params.business;
  const copy = params.copy;
  const format = params.format;
  const fallback = buildCampaignCopy(business);
  const step1 = formatCompleteStep1Profile(business, fallback, format);

  const presetBlock = params.referenceStyleOverride
    ? buildReferenceFlyerPromptBlock(
        business,
        copy,
        format,
        params.referenceStyleOverride
      )
    : "";

  const { buildIndustryLockedVisualBlock } = await import("./flyerBusinessBinding");
  const {
    buildForbiddenContactInImageBlock,
    buildFooterVerificationBookend,
  } = await import("./flyerFooterLock");
  const { shouldForbidContactInAiImage } = await import("./flyerExactContactMode");
  const { buildFlyerTypographyAuthorityBlock } = await import(
    "./flyerTypographyAuthority"
  );
  const { buildBusinessContactParts } = await import("./businessContact");
  const { phone, email, website } = buildBusinessContactParts(business);

  const userBlock = [
    buildIndustryLockedVisualBlock(business),
    "",
    buildFlyerTypographyAuthorityBlock(business),
    "",
    shouldForbidContactInAiImage()
      ? buildForbiddenContactInImageBlock(business, format)
      : (await import("./flyerFooterLock")).buildMandatoryExactContactBlock(
          business,
          format
        ),
    "",
    step1,
    "",
    "Campaign copy seed (marketing lines only — NOT contact):",
    `Headline: ${copy.headline}`,
    `Tagline: ${copy.tagline}`,
    `CTA: ${copy.cta}`,
    params.campaignMessage
      ? `PRIMARY MESSAGE: ${params.campaignMessage}`
      : "",
    params.userPrompt ? `CLIENT BRIEF: ${params.userPrompt}` : "",
    "",
    "CONTACT (added to finished flyer AFTER image — exact Step 1 values only — do NOT put in image_prompt):",
    phone ? `Phone: ${phone}` : "Phone: (none)",
    email ? `Email: ${email}` : "Email: (none)",
    website ? `Website: ${website}` : "Website: (none)",
    presetBlock ? `\nVisual preset:\n${presetBlock.slice(0, 1000)}` : "",
    "",
    `Aspect format: ${format}.`,
    "image_prompt must describe VISUALS ONLY — no phone, email, or website text inside image_prompt.",
    buildFooterVerificationBookend(business),
    "Return ONLY AD_BRAIN_OUTPUT: { ... } as specified in system instructions.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    return await chatWithSystem(AD_BRAIN_SYSTEM, userBlock, {
      maxTokens: 2800,
      temperature: 0.62,
      model: GROQ_MODELS.reasoning,
    });
  } catch {
    return chatWithSystem(AD_BRAIN_SYSTEM, userBlock, {
      maxTokens: 2800,
      temperature: 0.62,
      model: GROQ_MODELS.marketing,
    });
  }
}

/** World-class flyer: Groq returns IMAGE_PROMPT: """...""" only */
export async function generateWorldClassFlyerImagePromptGroq(
  params: import("./worldClassFlyerEngine").WorldClassFlyerPromptParams & {
    userPrompt: string;
    campaignMessage: string;
  }
): Promise<string> {
  const { WORLD_CLASS_FLYER_SYSTEM } = await import("./worldClassFlyerEngine");
  const { buildReferenceFlyerPromptBlock } = await import("./referenceFlyerStyle");
  const business = params.business;
  const copy = params.copy;
  const format = params.format;
  const fallback = buildCampaignCopy(business);
  const step1 = formatCompleteStep1Profile(business, fallback, format);

  const presetBlock = params.referenceStyleOverride
    ? buildReferenceFlyerPromptBlock(
        business,
        copy,
        format,
        params.referenceStyleOverride
      )
    : "";

  const { buildIndustryLockedVisualBlock } = await import("./flyerBusinessBinding");
  const {
    buildForbiddenContactInImageBlock,
    buildFooterVerificationBookend,
  } = await import("./flyerFooterLock");
  const { shouldForbidContactInAiImage } = await import("./flyerExactContactMode");
  const { buildFlyerTypographyAuthorityBlock } = await import(
    "./flyerTypographyAuthority"
  );
  const { buildBusinessContactParts } = await import("./businessContact");
  const { phone, email, website } = buildBusinessContactParts(business);

  const userBlock = [
    buildIndustryLockedVisualBlock(business),
    "",
    shouldForbidContactInAiImage()
      ? buildForbiddenContactInImageBlock(business, format)
      : (await import("./flyerFooterLock")).buildMandatoryExactContactBlock(
          business,
          format
        ),
    "",
    step1,
    "",
    "Approved campaign copy (marketing only):",
    `HEADLINE: ${copy.headline}`,
    `SUBTEXT / TAGLINE: ${copy.tagline}`,
    `CTA: ${copy.cta}`,
    params.campaignMessage
      ? `PRIMARY CAMPAIGN MESSAGE (must inform headline/offer): ${params.campaignMessage}`
      : "",
    params.userPrompt ? `CLIENT BRIEF: ${params.userPrompt}` : "",
    "",
    "CONTACT (Cloudinary horizontal footer after generation — not in image_prompt):",
    phone ? `Phone: ${phone}` : "Phone: (none)",
    email ? `Email: ${email}` : "Email: (none)",
    website ? `Website: ${website}` : "Website: (none)",
    presetBlock ? `\nCreative preset direction:\n${presetBlock.slice(0, 1200)}` : "",
    "",
    `Output format: ${format}.`,
    buildFooterVerificationBookend(business),
    "Return ONLY IMAGE_PROMPT: \"\"\"...\"\"\" per system instructions. Visual scene only in the prompt body.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    return await chatWithSystem(WORLD_CLASS_FLYER_SYSTEM, userBlock, {
      maxTokens: 2200,
      temperature: 0.55,
      model: GROQ_MODELS.reasoning,
    });
  } catch {
    return chatWithSystem(WORLD_CLASS_FLYER_SYSTEM, userBlock, {
      maxTokens: 2200,
      temperature: 0.55,
      model: GROQ_MODELS.marketing,
    });
  }
}

/**
 * Vision-based text read for composed/baked flyers — pre-fills editable copy fields.
 */
export async function detectFlyerTextFromImage(
  imageUrl: string,
  business?: BusinessProfile
): Promise<CampaignCopy> {
  const fallback = business
    ? buildCampaignCopy(business)
    : {
        headline: "",
        tagline: "",
        cta: "",
        location: "",
        contact: "",
      };

  const groq = getClient();
  const context = business ? businessContext(business) : "";

  const completion = await groq.chat.completions.create({
    model: GROQ_MODELS.vision,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this marketing flyer image. Extract visible text into JSON ONLY:
{"headline":"...","tagline":"...","cta":"...","location":"...","contact":"..."}

- Map the largest top text to headline, subtitle to tagline, button-like text to cta.
- If text is garbled or AI-generated nonsense, replace with improved ad copy that fits the visual and business context.
- location and contact: only if visible or known from profile.
${context}

Output JSON only.`,
          },
          {
            type: "image_url",
            image_url: { url: imageUrl },
          },
        ],
      },
    ],
    max_tokens: 450,
    temperature: 0.2,
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "";
  const parsed = parseCampaignCopyJson(raw);
  if (!parsed) return fallback;
  return business
    ? mergeCampaignCopyWithBusiness(parsed, business)
    : {
        headline: parsed.headline || fallback.headline,
        tagline: parsed.tagline || fallback.tagline,
        cta: parsed.cta || fallback.cta,
        location: parsed.location || fallback.location,
        contact: parsed.contact || fallback.contact,
      };
}

const CREATIVE_AGENCY_SCENE_SYSTEM = `You are the Art Director at a top advertising agency (Behance/Dribbble level).

Output ONE vivid paragraph (280–420 words) describing the FINISHED ADVERTISEMENT — Trial-4 Nexora Exchange density.

You MUST describe every zone:
1) empty top band — NO logo (client logo overlaid after)
2) massive headline upper-left with one gradient keyword
3) subhead
4) center 3D hero on glowing pedestal (coins for crypto, food hero for restaurants, industry-authentic subject otherwise)
5) background depth (charts for fintech, warm bokeh for food)
6) right frosted glass data/menu panel
7) left feature icon row (3 items)
8) left promo glass card
9) horizontal stats/trust bar (4 cells)
10) wide glowing gradient CTA pill
11) QR/badge decorative lower row
12) security/trust footer badges

Match industry exactly. Crisp digital typeset only. No phone/email/URL text. Output ONLY the scene paragraph.`;

/** Refine agency scene paragraph with Groq reasoning model */
export async function refineCreativeAgencySceneWithGroq(
  input: import("./creativeAgency/types").CreativeAgencyInput,
  brief: import("./creativeAgency/types").CreativeAgencyBrief
): Promise<string> {
  const name = input.business.businessName?.trim() || "the brand";
  const userBlock = [
    brief.leadNote,
    "",
    brief.expandedBrief.slice(0, 2000),
    "",
    "Draft scene:",
    brief.imageSceneParagraph,
    "",
    `Business: ${name}. Industry: ${input.business.industry || "general"}.`,
    input.userPrompt?.trim() ? `Client said: ${input.userPrompt.trim()}` : "",
    input.campaignMessage?.trim()
      ? `Campaign message: ${input.campaignMessage.trim()}`
      : "",
    "",
    "Rewrite as ONE premium image-generation paragraph. Industry-authentic. Trial-4 quality for fintech/crypto only.",
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await chatWithFallback(
    GROQ_MODELS.reasoning,
    GROQ_MODELS.marketing,
    `${CREATIVE_AGENCY_SCENE_SYSTEM}\n\n${userBlock}`,
    { maxTokens: 900, temperature: 0.72 }
  );
  const cleaned = cleanOutput(raw).replace(/^["']|["']$/g, "").trim();
  return cleaned.length >= 180 ? cleaned.slice(0, 2400) : brief.imageSceneParagraph;
}


