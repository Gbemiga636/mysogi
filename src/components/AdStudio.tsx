"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Building2,
  Clapperboard,
  Download,
  ImageIcon,
  Loader2,
  Megaphone,
  MessageSquare,
  Sparkles,
  Type,
  Video,
  Wand2,
  Paintbrush,
  Check,
} from "lucide-react";

const ImageEditor = dynamic(() => import("@/components/ImageEditor"), {
  ssr: false,
});
import { derivePromptStyleFromBusiness } from "@/lib/businessCampaign";
import { listMobileAdPresets } from "@/lib/mobileAdPresets";
import { syncBrandColorsString } from "@/lib/brandColors";
import { enrichPromptWithBusiness } from "@/lib/businessPrompt";
import {
  buildCampaignCopy,
  type CampaignCopy,
} from "@/lib/campaignTextLayers";
import type { BusinessProfile, VideoFormat } from "@/lib/types";
import { FORMAT_RATIOS } from "@/lib/types";
import { CAMPAIGN_TYPE_OPTIONS, getCampaignTypeLabel } from "@/lib/campaignProfile";
import { compressLogoDataUrl } from "@/lib/compressLogoDataUrl";
import { parseJsonResponse } from "@/lib/parseJsonResponse";
import { pollFlyerJobUntilDone } from "@/lib/pollFlyerJob";
import { pickFlyerDisplayUrl } from "@/lib/flyerDisplayUrl";
import { waitForImageUrl } from "@/lib/waitForImageUrl";
import FlyerPreviewImage from "@/components/FlyerPreviewImage";

type FlyerStage = "copy" | "visual" | "logo";

type CreativeEngineMeta = {
  qualityScore: number;
  qualityPassed: boolean;
  fontPairing: string;
  palette: string;
  balanceScore: number;
  referenceStyle?: string;
};

type ExportPresetId =
  | "instagram_story"
  | "instagram_portrait"
  | "instagram_square"
  | "a4_print"
  | "web_banner";

const EXPORT_PRESETS: { id: ExportPresetId; label: string }[] = [
  { id: "instagram_story", label: "Story 9:16" },
  { id: "instagram_portrait", label: "Portrait 4:5" },
  { id: "instagram_square", label: "Square 1:1" },
  { id: "a4_print", label: "A4 Print" },
  { id: "web_banner", label: "Web Banner 16:9" },
];

import {
  CAMPAIGN_MESSAGE_MAX,
  CAMPAIGN_MESSAGE_MIN,
} from "@/lib/campaignMessageGenerator";

type FlyerVariant = {
  id: string;
  label: string;
  referenceStyle?: string;
  imageUrl: string;
  displayUrl?: string;
  exportImageUrl?: string;
  baseImageUrl: string;
  localImageUrl: string;
  localBaseImageUrl: string;
};

function normalizeFlyerVariant(v: FlyerVariant): FlyerVariant {
  const displayUrl = pickFlyerDisplayUrl(v.imageUrl, v.localImageUrl);
  return { ...v, displayUrl };
}

function flyerStepState(
  current: FlyerStage | "ready" | null,
  step: FlyerStage
): "active" | "done" | "pending" {
  if (current === "ready") return "done";
  if (!current) return "pending";
  const order: FlyerStage[] = ["copy", "visual", "logo"];
  const ci = order.indexOf(current as FlyerStage);
  const si = order.indexOf(step);
  if (ci > si) return "done";
  if (ci === si) return "active";
  return "pending";
}

const STEPS = [
  { id: 1, label: "Business", icon: Building2 },
  { id: 2, label: "Creative", icon: Sparkles },
  { id: 3, label: "Generate", icon: Video },
  { id: 4, label: "Polish", icon: Clapperboard },
  { id: 5, label: "Export", icon: Download },
];

const defaultBusiness: BusinessProfile = {
  businessName: "",
  tagline: "",
  phone: "",
  email: "",
  website: "mysogi.com.ng",
  location: "Lagos, Nigeria",
  industry: "",
  targetAudience: "",
  campaignGoal: "",
  campaignType: "",
  brandPrimary: "#0B1F3A",
  brandSecondary: "#F26522",
  brandColors: "#0B1F3A, #F26522",
  callToAction: "Get Started Today",
  imageProps: "",
  adStylePreset: "trending",
};

async function pollTask(
  taskId: string,
  options?: { intervalMs?: number; isVideo?: boolean }
): Promise<string | null> {
  const intervalMs = options?.intervalMs ?? (options?.isVideo ? 10_000 : 4000);
  const maxAttempts = options?.isVideo ? 60 : 75;
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`/api/tasks/${taskId}`);
    const data = await res.json();
    if (data.status === "SUCCEEDED" && data.outputUrl) return data.outputUrl;
    if (data.status === "FAILED") throw new Error(data.error ?? "Generation failed");
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Generation timed out");
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdStudio() {
  const [step, setStep] = useState(1);
  const [business, setBusiness] = useState<BusinessProfile>(defaultBusiness);
  const [format, setFormat] = useState<VideoFormat>("9:16");
  const [tone, setTone] = useState("bold, urgent, conversion-focused");
  const [userPrompt, setUserPrompt] = useState("");
  const [script, setScript] = useState("");
  const [caption, setCaption] = useState("");
  const [runwayPrompt, setRunwayPrompt] = useState("");
  const [overlayText, setOverlayText] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>();
  const [sourceImageDataUrl, setSourceImageDataUrl] = useState<string | undefined>();
  const [audioDataUrl, setAudioDataUrl] = useState<string | undefined>();
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedImageBaseUrl, setGeneratedImageBaseUrl] = useState<string | null>(
    null
  );
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [composedVideoUrl, setComposedVideoUrl] = useState<string | null>(null);
  const [videoMode, setVideoMode] = useState<"text" | "image">("text");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polishImageOpen, setPolishImageOpen] = useState(false);
  const [flyerCampaignCopy, setFlyerCampaignCopy] = useState<CampaignCopy | null>(
    null
  );
  const [flyerBuildStage, setFlyerBuildStage] = useState<
    null | "copy" | "visual" | "logo" | "ready"
  >(null);
  const [flyerLocalPreviewUrl, setFlyerLocalPreviewUrl] = useState<string | null>(
    null
  );
  const [exportImageUrl, setExportImageUrl] = useState<string | null>(null);
  const [creativeEngineMeta, setCreativeEngineMeta] =
    useState<CreativeEngineMeta | null>(null);
  const [enhancedCreativeDirection, setEnhancedCreativeDirection] = useState<
    string | null
  >(null);
  const [exportPreset, setExportPreset] = useState<ExportPresetId>("instagram_story");
  const [exportingFlyer, setExportingFlyer] = useState(false);
  const [flyerVariants, setFlyerVariants] = useState<FlyerVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [campaignMessages, setCampaignMessages] = useState<string[]>([]);
  const [campaignMessage, setCampaignMessage] = useState("");
  const [customMessageMode, setCustomMessageMode] = useState(false);
  const [campaignTypeLabel, setCampaignTypeLabel] = useState<string | null>(null);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const videoGenLock = useRef(false);

  const setBiz = (key: keyof BusinessProfile, value: string) => {
    setBusiness((b) => ({ ...b, [key]: value }));
  };

  const setBrandColor = (which: "brandPrimary" | "brandSecondary", hex: string) => {
    setBusiness((b) => {
      const primary = which === "brandPrimary" ? hex : b.brandPrimary || "#0B1F3A";
      const secondary =
        which === "brandSecondary" ? hex : b.brandSecondary || "#F26522";
      return {
        ...b,
        [which]: hex,
        brandColors: syncBrandColorsString(primary, secondary),
      };
    });
  };

  const apiPost = useCallback(async (url: string, body: object): Promise<Record<string, unknown>> => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await parseJsonResponse<Record<string, unknown>>(res);
    if (!res.ok) throw new Error(String(data.error ?? "Request failed"));
    return data;
  }, []);

  const loadCampaignMessages = useCallback(async () => {
    if (!business.businessName?.trim()) return;
    setLoading("messages");
    setError(null);
    try {
      const data = await apiPost("/api/generate/campaign-messages", {
        business,
        userPrompt: userPrompt.trim(),
      });
      const msgs = (data.messages as string[]) ?? [];
      setCampaignMessages(msgs);
      if (data.campaignType && typeof data.campaignType === "object") {
        const ct = data.campaignType as { label?: string };
        if (ct.label) setCampaignTypeLabel(String(ct.label));
      }
      setMessagesLoaded(true);
      if (!customMessageMode && !campaignMessage && msgs[0]) {
        setCampaignMessage(msgs[0]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate campaign messages");
    } finally {
      setLoading(null);
    }
  }, [apiPost, business, customMessageMode, campaignMessage, userPrompt]);

  useEffect(() => {
    setMessagesLoaded(false);
  }, [business.campaignType, business.businessName]);

  useEffect(() => {
    if (step === 2 && business.businessName?.trim() && !messagesLoaded) {
      loadCampaignMessages();
    }
  }, [step, business.businessName, messagesLoaded, loadCampaignMessages]);

  const selectFlyerVariant = useCallback((variant: FlyerVariant) => {
    const display =
      variant.displayUrl ??
      pickFlyerDisplayUrl(variant.imageUrl, variant.localImageUrl);
    setSelectedVariantId(variant.id);
    setGeneratedImageUrl(display);
    setGeneratedImageBaseUrl(variant.baseImageUrl);
    setFlyerLocalPreviewUrl(display);
    if (variant.exportImageUrl) setExportImageUrl(variant.exportImageUrl);
    setFlyerBuildStage("ready");
    if (videoMode === "image") setSourceImageDataUrl(display);
  }, [videoMode]);

  const ensureFlyerCopy = useCallback(async (): Promise<CampaignCopy> => {
    if (flyerCampaignCopy) return flyerCampaignCopy;
    try {
      const data = await apiPost("/api/generate/flyer-copy", { business });
      const copy = data.copy as CampaignCopy;
      setFlyerCampaignCopy(copy);
      return copy;
    } catch {
      const copy = buildCampaignCopy(business);
      setFlyerCampaignCopy(copy);
      return copy;
    }
  }, [apiPost, business, flyerCampaignCopy]);

  const composeFlyerAd = useCallback(
    async (rawImageUrl: string, copy?: CampaignCopy) => {
      const campaignCopy = copy ?? flyerCampaignCopy ?? buildCampaignCopy(business);
      const body = {
        imageUrl: rawImageUrl,
        business,
        format,
        copy: campaignCopy,
        logoDataUrl,
        skipTextInCompose: false,
        skipLogoInCompose: false,
      };

      let lastError: Error | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const data = await apiPost("/api/media/compose-flyer", body);
          return {
            imageUrl: data.imageUrl as string,
            baseImageUrl: data.baseImageUrl as string,
          };
        } catch (e) {
          lastError = e instanceof Error ? e : new Error("Compose failed");
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 1500));
          }
        }
      }

      throw new Error(
        lastError?.message ??
          "Cloudinary could not add text and logo. Check CLOUDINARY_URL in .env.local and upload a logo in Step 1."
      );
    },
    [apiPost, business, format, logoDataUrl, flyerCampaignCopy]
  );

  const hasPromptSource = Boolean(
    runwayPrompt.trim() ||
      userPrompt.trim() ||
      business.campaignType?.trim() ||
      campaignMessage.trim() ||
      business.businessName.trim() ||
      script.trim()
  );

  const buildFallbackPrompt = useCallback(() => {
    if (script.trim()) return script.slice(0, 900);
    const typeLabel = getCampaignTypeLabel(business);
    const parts = [
      userPrompt.trim(),
      campaignMessage.trim(),
      typeLabel && `Marketing ad for ${business.businessName}: ${typeLabel}`,
      business.industry &&
        `Premium ${business.industry} commercial in ${business.location}`,
      business.businessName &&
        `Professional advertisement for ${business.businessName}, ${business.callToAction}`,
    ].filter(Boolean);
    return (
      parts.join(". ") ||
      `Vibrant Nigerian marketing video for ${business.businessName || "local brand"}, cinematic, high energy, ${business.callToAction}`
    );
  }, [userPrompt, business, script, campaignMessage]);

  const resolvePromptText = useCallback(
    async (kind: "flyer" | "video" = "video"): Promise<string> => {
      const idea =
        userPrompt.trim() ||
        campaignMessage.trim() ||
        getCampaignTypeLabel(business) ||
        business.businessName ||
        "marketing campaign";

      let base = runwayPrompt.trim();
      if (!base && script.trim()) base = script.slice(0, 900);
      if (!base && userPrompt.trim()) base = userPrompt.trim();

      if (!base || (kind === "flyer" ? base.length < 100 : base.length < 60)) {
        try {
          const data = await apiPost("/api/generate/prompt", {
            business,
            type: kind === "flyer" ? "flyer" : "video",
            userPrompt: idea,
            format,
            style: derivePromptStyleFromBusiness(business),
          });
          base = data.prompt as string;
        } catch {
          base =
            kind === "flyer"
              ? enrichPromptWithBusiness(business, idea, "flyer", format)
              : buildFallbackPrompt();
        }
      }

      const enriched = enrichPromptWithBusiness(
        business,
        base,
        kind,
        format
      );
      setRunwayPrompt(enriched);
      return enriched;
    },
    [
      runwayPrompt,
      userPrompt,
      script,
      business,
      format,
      apiPost,
      buildFallbackPrompt,
    ]
  );

  const applyLogoToMedia = useCallback(
    async (media: { imageUrl?: string | null; videoUrl?: string | null }) => {
      if (media.imageUrl) {
        const composed = await composeFlyerAd(media.imageUrl);
        return {
          imageUrl: composed.imageUrl,
          baseImageUrl: composed.baseImageUrl,
          videoUrl: media.videoUrl,
        };
      }
      if (!logoDataUrl || !media.videoUrl) return media;
      const payload: Record<string, unknown> = {
        logoDataUrl,
        format,
        videoUrl: media.videoUrl,
        overlayText: overlayText || business.callToAction,
        businessName: business.businessName,
        phone: business.phone,
      };
      const data = await apiPost("/api/media/apply-logo", payload);
      return {
        imageUrl: media.imageUrl,
        videoUrl: data.videoUrl ?? media.videoUrl,
      };
    },
    [logoDataUrl, format, overlayText, business, apiPost, composeFlyerAd]
  );

  const goToGenerateStep = () => {
    setError(null);
    setStep(3);
  };

  const generateCaption = async () => {
    setLoading("caption");
    setError(null);
    try {
      const data = await apiPost("/api/generate/caption", { business, multilingual: false });
      setCaption(String(data.caption ?? ""));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(null);
    }
  };

  const generatePrompt = async (type: "video" | "flyer" | "image") => {
    setLoading("prompt");
    setError(null);
    try {
      const promptType = type === "image" ? "flyer" : type;
      const data = await apiPost("/api/generate/prompt", {
        business,
        type: promptType,
        userPrompt,
        format,
        style: derivePromptStyleFromBusiness(business),
      });
      setRunwayPrompt(data.prompt as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(null);
    }
  };

  const enhanceCreativeIdeaAction = async () => {
    setLoading("enhance");
    setError(null);
    try {
      const data = await apiPost("/api/generate/prompt", {
        business,
        type: "enhance-idea",
        userPrompt:
          userPrompt.trim() ||
          campaignMessage.trim() ||
          getCampaignTypeLabel(business) ||
          business.tagline?.trim() ||
          "",
        format,
      });
      const enhanced =
        (data.enhancedIdea as string) || (data.prompt as string) || "";
      if (enhanced.trim()) setUserPrompt(enhanced.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not enhance creative idea");
    } finally {
      setLoading(null);
    }
  };

  const generateImage = async () => {
    if (!logoDataUrl) {
      setError("Upload your logo in Step 1 — required for branded flyer preview.");
      return;
    }
    if (!business.businessName?.trim()) {
      setError("Enter your business name in Step 1.");
      return;
    }

    setLoading("image");
    setError(null);
    setFlyerBuildStage("copy");
    setGeneratedImageUrl(null);
    setGeneratedImageBaseUrl(null);
    setFlyerLocalPreviewUrl(null);
    setExportImageUrl(null);
    setCreativeEngineMeta(null);
    setEnhancedCreativeDirection(null);
    setFlyerVariants([]);
    setSelectedVariantId(null);

    const presetForFormat: Record<VideoFormat, ExportPresetId> = {
      "9:16": "instagram_story",
      "4:5": "instagram_portrait",
      "1:1": "instagram_square",
      "16:9": "web_banner",
    };
    setExportPreset(presetForFormat[format] ?? "instagram_story");

    try {
      setFlyerBuildStage("visual");

      const logoForApi = logoDataUrl
        ? await compressLogoDataUrl(logoDataUrl)
        : undefined;

      const start = await apiPost("/api/v1/generate", {
        action: "flyer",
        async: true,
        format,
        business,
        logoDataUrl: logoForApi,
        userPrompt: userPrompt.trim(),
        campaignMessage: campaignMessage.trim(),
      });

      let data: Record<string, unknown>;

      if (start.jobId) {
        const job = await pollFlyerJobUntilDone(String(start.jobId), {
          pollUrl: start.pollUrl as string | undefined,
          intervalMs: Number(start.pollIntervalMs) || 3000,
          onUpdate: (j) => {
            if (j.progress === "messages") setFlyerBuildStage("copy");
            else if (j.progress === "copy") setFlyerBuildStage("copy");
            else if (j.progress === "variants" || j.status === "running") {
              setFlyerBuildStage("visual");
            }
          },
        });
        data = (job.result ?? {}) as Record<string, unknown>;
      } else {
        data = start as Record<string, unknown>;
      }

      if (data.campaignType && typeof data.campaignType === "object") {
        const ct = data.campaignType as { label?: string };
        if (ct.label) setCampaignTypeLabel(String(ct.label));
      }

      const variants = (data.variants as FlyerVariant[] | undefined) ?? [];
      const copy = data.copy as CampaignCopy;
      setFlyerCampaignCopy(copy);
      if (data.creativeEngine) {
        setCreativeEngineMeta(data.creativeEngine as CreativeEngineMeta);
      }
      if (data.enhancedCreativeDirection) {
        setEnhancedCreativeDirection(String(data.enhancedCreativeDirection));
      }

      if (variants.length >= 2) {
        const normalized = variants.map(normalizeFlyerVariant);
        for (const v of normalized) {
          const preview =
            v.displayUrl ?? pickFlyerDisplayUrl(v.imageUrl, v.localImageUrl);
          if (preview.startsWith("http")) {
            try {
              await waitForImageUrl(preview, { maxWaitMs: 45_000 });
            } catch {
              /* FlyerPreviewImage offers reload */
            }
          }
        }
        setFlyerVariants(normalized);
        setFlyerBuildStage("ready");
        return;
      }

      if (data.exportImageUrl) {
        setExportImageUrl(String(data.exportImageUrl));
      }
      const localUrl = (data.localImageUrl as string) || null;
      const localBase = (data.localBaseImageUrl as string) || null;
      setFlyerLocalPreviewUrl(localUrl);
      setGeneratedImageBaseUrl(
        (data.baseImageUrl as string) || localBase || null
      );
      setFlyerBuildStage("logo");
      const finalUrl =
        pickFlyerDisplayUrl(
          data.imageUrl as string | undefined,
          localUrl ?? undefined
        ) || localUrl;
      if (finalUrl) {
        if (finalUrl.startsWith("http")) {
          try {
            await waitForImageUrl(finalUrl, { maxWaitMs: 45_000 });
          } catch {
            /* FlyerPreviewImage reload */
          }
        }
        setGeneratedImageUrl(finalUrl);
        setFlyerLocalPreviewUrl(finalUrl);
        setFlyerBuildStage("ready");
        if (videoMode === "image") setSourceImageDataUrl(finalUrl);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setFlyerBuildStage(null);
    } finally {
      setLoading(null);
    }
  };

  const downloadExportFlyer = async (preset: ExportPresetId) => {
    const sourceUrl = generatedImageUrl;
    if (!sourceUrl) return;

    setExportingFlyer(true);
    setError(null);
    try {
      if (preset === exportPreset && exportImageUrl) {
        const a = document.createElement("a");
        a.href = exportImageUrl;
        a.download = `mysogi-flyer-${preset}.jpg`;
        a.click();
        return;
      }

      const data = await apiPost("/api/media/export-flyer", {
        imageUrl: sourceUrl,
        preset,
      });
      const dataUrl = data.dataUrl as string;
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `mysogi-flyer-${preset}.jpg`;
      a.click();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExportingFlyer(false);
    }
  };

  const generateVideo = async () => {
    if (videoGenLock.current || loading === "video") return;
    if (videoMode === "image" && !sourceImageDataUrl && !generatedImageUrl) {
      setError("Upload an image or generate an AI flyer first for Image → Video mode.");
      return;
    }
    videoGenLock.current = true;
    setLoading("video");
    setError(null);
    try {
      const promptText = await resolvePromptText("video");
      const body: Record<string, unknown> = {
        promptText,
        format,
        duration: 5,
        wait: false,
        mode: videoMode,
        business,
        logoDataUrl,
        userPrompt,
        script,
        overlayText: overlayText || business.callToAction,
      };
      if (videoMode === "image") {
        body.promptImage = sourceImageDataUrl ?? generatedImageUrl;
      }
      const start = await apiPost("/api/generate/video", body);
      let url = await pollTask(String(start.taskId), { isVideo: true, intervalMs: 6000 });
      if (url) {
        const branded = await applyLogoToMedia({ videoUrl: url });
        url = (branded.videoUrl as string | undefined) ?? url;
      }
      setGeneratedVideoUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      videoGenLock.current = false;
      setLoading(null);
    }
  };

  const composeFinal = async () => {
    const source = composedVideoUrl ?? generatedVideoUrl;
    if (!source) return;
    setLoading("compose");
    setError(null);
    try {
      const data = await apiPost("/api/compose", {
        videoSource: source,
        format,
        overlayText,
        logoDataUrl,
        audioDataUrl,
        businessName: business.businessName,
        phone: business.phone,
      });
      setComposedVideoUrl(String(data.outputUrl ?? ""));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(null);
    }
  };

  const finalPreview = composedVideoUrl ?? generatedVideoUrl;
  const flyerChoicePending =
    flyerVariants.length >= 2 && !selectedVariantId;
  const hasExportableMedia = Boolean(
    (finalPreview || generatedImageUrl) && !flyerChoicePending
  );

  return (
    <div className="ad-studio min-h-screen">
      <header className="mysogi-gradient">
        <div className="ad-studio__header-inner">
          <div className="ad-studio__header-row">
            <div>
              <p className="ad-studio__tagline">Mysogi Company Limited</p>
              <h1 className="ad-studio__title">AI Ad Studio</h1>
              <p className="ad-studio__subtitle">
                Advertise. Connect. Convert. — Generate campaign videos, images,
                scripts & captions tuned for Nigerian digital marketing.
              </p>
            </div>
            <a
              href="https://mysogi.com.ng"
              target="_blank"
              rel="noopener noreferrer"
              className="ad-studio__link"
            >
              mysogi.com.ng →
            </a>
          </div>
        </div>
      </header>

      <nav className="ad-studio__nav">
        <div className="ad-studio__nav-inner">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const cls =
              step === s.id
                ? "step-active"
                : step > s.id
                  ? "step-done"
                  : "step-pending";
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                className={`ad-studio__step ${cls}`}
              >
                <Icon size={16} />
                {s.label}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="ad-studio__main">
        {error && <div className="ad-studio__error">{error}</div>}

        {step === 1 && (
          <section className="mysogi-card p-6 md:p-8">
            <h2 className="ad-studio__section-title">
              <Building2 className="ad-studio__icon-orange" size={22} />
              Your business details
            </h2>
            <p className="ad-studio__muted" style={{ marginTop: "0.25rem" }}>
              Creates trending Instagram/TikTok-style flyers — centered layout, cinematic depth,
              glass overlays, glowing CTA. All copy including phone, email, website & location is typeset inside the AI image.
            </p>
            <div className="ad-studio__grid-2" style={{ marginTop: "1.5rem" }}>
              {(
                [
                  ["businessName", "Business name"],
                  ["tagline", "Tagline"],
                  ["phone", "Phone"],
                  ["email", "Email"],
                  ["website", "Website"],
                  ["location", "Location"],
                  ["industry", "Industry"],
                  ["targetAudience", "Target audience"],
                  ["callToAction", "Call to action"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="mysogi-label">{label}</label>
                  <input
                    className="mysogi-input"
                    value={business[key]}
                    onChange={(e) => setBiz(key, e.target.value)}
                    placeholder={label}
                  />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="mysogi-label">Campaign type</label>
                <select
                  className="mysogi-input"
                  value={business.campaignType ?? ""}
                  onChange={(e) => setBiz("campaignType", e.target.value)}
                >
                  {CAMPAIGN_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value || "none"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-[var(--mysogi-muted)]">
                  What kind of ad is this? Grand opening, promo sale, product launch, event, etc.
                  Your Step 2 campaign message drives the flyer creative.
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="mysogi-label">Ad style preset</label>
                <select
                  className="mysogi-input"
                  value={business.adStylePreset ?? ""}
                  onChange={(e) => setBiz("adStylePreset", e.target.value)}
                >
                  <option value="">Auto (from industry)</option>
                  {listMobileAdPresets().map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-[var(--mysogi-muted)]">
                  Controls typography mood, overlays, CTA style, and color grade in the
                  AI poster (all text rendered in the image).
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="mysogi-label">
                  Items & elements to show in the ad
                </label>
                <textarea
                  className="mysogi-input min-h-[88px]"
                  value={business.imageProps ?? ""}
                  onChange={(e) => setBiz("imageProps", e.target.value)}
                  placeholder="e.g. iPhone 15 on marble desk, smiling chef holding signature dish, luxury car keys, shopping bags, team in branded uniforms…"
                />
                <p className="mt-1 text-xs text-[var(--mysogi-muted)]">
                  Our creative director places these in the scene with real people and
                  premium styling — be specific for best results.
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mysogi-label">Primary brand color</label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="color"
                    className="h-11 w-14 cursor-pointer rounded border border-[var(--mysogi-border)] bg-transparent p-1"
                    value={business.brandPrimary || "#0B1F3A"}
                    onChange={(e) => setBrandColor("brandPrimary", e.target.value)}
                    aria-label="Primary brand color"
                  />
                  <input
                    className="mysogi-input flex-1 font-mono text-sm uppercase"
                    value={business.brandPrimary || "#0B1F3A"}
                    onChange={(e) => setBrandColor("brandPrimary", e.target.value)}
                    placeholder="#0B1F3A"
                  />
                </div>
                <p className="mt-1 text-xs text-[var(--mysogi-muted)]">
                  Background glow & dark tones in AI visuals
                </p>
              </div>
              <div>
                <label className="mysogi-label">Accent / CTA color</label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="color"
                    className="h-11 w-14 cursor-pointer rounded border border-[var(--mysogi-border)] bg-transparent p-1"
                    value={business.brandSecondary || "#F26522"}
                    onChange={(e) => setBrandColor("brandSecondary", e.target.value)}
                    aria-label="Accent brand color"
                  />
                  <input
                    className="mysogi-input flex-1 font-mono text-sm uppercase"
                    value={business.brandSecondary || "#F26522"}
                    onChange={(e) => setBrandColor("brandSecondary", e.target.value)}
                    placeholder="#F26522"
                  />
                </div>
                <p className="mt-1 text-xs text-[var(--mysogi-muted)]">
                  CTA button & neon highlights on flyer
                </p>
              </div>
            </div>
            <div className="mt-6">
              <label className="mysogi-label">Logo (PNG/JPG)</label>
              <input
                type="file"
                accept="image/*"
                className="mysogi-input"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) setLogoDataUrl(await compressLogoDataUrl(await readFileAsDataUrl(f)));
                }}
              />
              {logoDataUrl && (
                <img
                  src={logoDataUrl}
                  alt="Logo preview"
                  className="mt-3 h-16 w-auto rounded border"
                />
              )}
              <p className="mt-2 text-xs text-[var(--mysogi-muted)]">
                Logo, brand colors, and business copy from Step 1 are used on every flyer and video.
              </p>
            </div>
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                className="mysogi-btn-primary rounded-lg px-6 py-2.5 font-semibold"
                onClick={() => setStep(2)}
              >
                Continue →
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <div className="relative">
            {(loading === "caption" || loading === "prompt" || loading === "enhance") && (
              <div
                className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/85 backdrop-blur-sm"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="h-11 w-11 animate-spin text-[var(--mysogi-orange)]" />
                <p className="text-sm font-semibold text-[var(--mysogi-navy)]">
                  {loading === "caption"
                    ? "Writing captions…"
                    : loading === "enhance"
                      ? "Perfecting your creative idea…"
                      : "Building your prompt…"}
                </p>
              </div>
            )}
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="mysogi-card p-6">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Megaphone className="text-[var(--mysogi-orange)]" />
                Format & tone
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {(Object.keys(FORMAT_RATIOS) as VideoFormat[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={`rounded-lg border p-3 text-left text-sm transition ${
                      format === f
                        ? "border-[var(--mysogi-orange)] bg-orange-50 font-semibold"
                        : "border-[var(--mysogi-border)] hover:border-orange-200"
                    }`}
                  >
                    <span className="font-bold">{f}</span>
                    <br />
                    <span className="text-[var(--mysogi-muted)]">
                      {FORMAT_RATIOS[f].label}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <label className="mysogi-label">Campaign tone</label>
                <input
                  className="mysogi-input"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                />
              </div>
              <div className="mt-4">
                <label className="mysogi-label">Your creative idea</label>
                <textarea
                  className="mysogi-input min-h-[100px]"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="Be specific — e.g. smiling barista handing latte, marble counter, warm morning light, Lagos café vibe…"
                />
                <button
                  type="button"
                  className="mt-2 flex items-center gap-2 rounded-lg bg-[var(--mysogi-orange)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  disabled={!!loading}
                  onClick={enhanceCreativeIdeaAction}
                >
                  {loading === "enhance" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  Perfect my creative idea (Groq)
                </button>
                <p className="mt-1 text-xs text-[var(--mysogi-muted)]">
                  Your text here is treated as mandatory — the image generator must follow it
                  exactly (plus your Step 1 items and copy).
                </p>
              </div>
            </div>

            <div className="mysogi-card p-6">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Wand2 className="text-[var(--mysogi-orange)]" />
                Creative assistant
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-[var(--mysogi-navy)] px-4 py-2 text-sm font-semibold text-[var(--mysogi-navy)] hover:bg-slate-50 disabled:opacity-50"
                  disabled={!!loading}
                  onClick={generateCaption}
                >
                  {loading === "caption" ? (
                    <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />
                  ) : null}
                  AI Captions
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[var(--mysogi-orange)] px-4 py-2 text-sm font-semibold text-[var(--mysogi-orange)] hover:bg-orange-50 disabled:opacity-50"
                  disabled={!!loading}
                  onClick={() => generatePrompt("video")}
                >
                  {loading === "prompt" ? (
                    <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />
                  ) : null}
                  AI Video Prompt
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[var(--mysogi-sky)] px-4 py-2 text-sm font-semibold text-[var(--mysogi-sky)] hover:bg-sky-50 disabled:opacity-50"
                  disabled={!!loading}
                  onClick={() => generatePrompt("flyer")}
                >
                  AI Flyer Prompt
                </button>
              </div>
              <p className="mt-2 text-xs text-[var(--mysogi-muted)]">
                Groq perfects creative ideas · OpenAI flyers · MiniMax video
              </p>
              {caption && (
                <div className="mt-4">
                  <label className="mysogi-label">Captions</label>
                  <textarea
                    className="mysogi-input min-h-[100px] text-sm"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                  />
                </div>
              )}
              {runwayPrompt && (
                <div className="mt-4">
                  <label className="mysogi-label">Video / flyer prompt</label>
                  <textarea
                    className="mysogi-input min-h-[80px] text-sm"
                    value={runwayPrompt}
                    onChange={(e) => setRunwayPrompt(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="mysogi-card p-6 lg:col-span-2">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <MessageSquare className="text-[var(--mysogi-orange)]" />
                Campaign message ({CAMPAIGN_MESSAGE_MIN}–{CAMPAIGN_MESSAGE_MAX} characters)
              </h2>
              <p className="mt-1 text-xs text-[var(--mysogi-muted)]">
                AI writes full-length SMS copy — aim for {CAMPAIGN_MESSAGE_MAX} characters. This message drives your flyer.
                {getCampaignTypeLabel(business) || campaignTypeLabel ? (
                  <span className="ml-1 font-semibold text-[var(--mysogi-orange)]">
                    Type: {getCampaignTypeLabel(business) || campaignTypeLabel}
                  </span>
                ) : null}
              </p>
              {loading === "messages" && (
                <div className="mt-4 flex items-center gap-2 text-sm text-[var(--mysogi-muted)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Writing campaign messages…
                </div>
              )}
              {!customMessageMode && campaignMessages.length > 0 && (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {campaignMessages.map((msg, i) => {
                    const selected = campaignMessage === msg;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCampaignMessage(msg)}
                        className={`rounded-lg border-2 p-4 text-left text-sm transition ${
                          selected
                            ? "border-[var(--mysogi-orange)] bg-orange-50"
                            : "border-[var(--mysogi-border)] hover:border-orange-200"
                        }`}
                      >
                        <span className="text-xs font-bold text-[var(--mysogi-orange)]">
                          Option {i + 1}
                        </span>
                        <p className="mt-2 leading-relaxed text-[var(--mysogi-navy)]">{msg}</p>
                        <p className={`mt-2 text-[10px] ${
                          msg.length >= CAMPAIGN_MESSAGE_MIN
                            ? "text-[var(--mysogi-muted)]"
                            : "text-amber-600"
                        }`}>
                          {msg.length}/{CAMPAIGN_MESSAGE_MAX} chars
                          {msg.length < CAMPAIGN_MESSAGE_MIN ? " (too short)" : ""}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
              {customMessageMode && (
                <div className="mt-4">
                  <textarea
                    className="mysogi-input min-h-[88px]"
                    value={campaignMessage}
                    onChange={(e) =>
                      setCampaignMessage(e.target.value.slice(0, CAMPAIGN_MESSAGE_MAX))
                    }
                    placeholder="Type your campaign message…"
                    maxLength={CAMPAIGN_MESSAGE_MAX}
                  />
                  <p className={`mt-1 text-xs ${
                    campaignMessage.length >= CAMPAIGN_MESSAGE_MIN
                      ? "text-[var(--mysogi-muted)]"
                      : "text-amber-600"
                  }`}>
                    {campaignMessage.length}/{CAMPAIGN_MESSAGE_MAX} characters
                    {campaignMessage.length < CAMPAIGN_MESSAGE_MIN
                      ? ` — add ${CAMPAIGN_MESSAGE_MIN - campaignMessage.length} more for full SMS length`
                      : ""}
                  </p>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-[var(--mysogi-border)] px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                  disabled={!!loading}
                  onClick={() => {
                    setCustomMessageMode(false);
                    loadCampaignMessages();
                  }}
                >
                  Regenerate 3 options
                </button>
                <button
                  type="button"
                  className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                    customMessageMode
                      ? "mysogi-btn-primary"
                      : "border border-[var(--mysogi-navy)] text-[var(--mysogi-navy)] hover:bg-slate-50"
                  }`}
                  onClick={() => {
                    setCustomMessageMode(true);
                    setCampaignMessage("");
                  }}
                >
                  I have my message
                </button>
                {customMessageMode && (
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--mysogi-sky)] px-4 py-2 text-sm font-semibold text-[var(--mysogi-sky)] hover:bg-sky-50"
                    onClick={() => {
                      setCustomMessageMode(false);
                      if (campaignMessages[0] && !campaignMessage) {
                        setCampaignMessage(campaignMessages[0]);
                      }
                    }}
                  >
                    Back to AI options
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-between lg:col-span-2">
              <button
                type="button"
                className="rounded-lg px-4 py-2 font-semibold text-[var(--mysogi-muted)] hover:bg-slate-100"
                onClick={() => setStep(1)}
              >
                ← Back
              </button>
              <button
                type="button"
                className="mysogi-btn-primary flex items-center gap-2 rounded-lg px-6 py-2.5 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                onClick={goToGenerateStep}
                disabled={!!loading}
              >
                Continue to generate →
              </button>
            </div>
          </section>
          </div>
        )}

        {step === 3 && (
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="mysogi-card p-6 lg:col-span-2">
              <h2 className="ad-studio__section-title">
                <Wand2 className="ad-studio__icon-orange" size={22} />
                Replicate — video prompt (MiniMax video-01)
              </h2>
              <p className="ad-studio__muted" style={{ marginTop: "0.35rem" }}>
                Flyers: trending social ads (Apple/Nike/Spotify style) — centered headline, cinematic
                hero, glowing CTA; phone, email, website & location typeset in the image.
                layout, brand colors, glass panels. Logo at top only. Video: MiniMax.
              </p>
              <textarea
                className="mysogi-input min-h-[90px]"
                style={{ marginTop: "0.75rem" }}
                value={runwayPrompt}
                onChange={(e) => setRunwayPrompt(e.target.value)}
                placeholder={
                  userPrompt ||
                  "e.g. grand opening sale, new menu launch, app download promo — tailored to your industry in Step 1…"
                }
              />
              <div className="ad-studio__btn-row" style={{ marginTop: "0.75rem" }}>
                <button
                  type="button"
                  className="ad-studio__btn-outline ad-studio__btn-outline--sky"
                  disabled={!!loading}
                  onClick={() => generatePrompt("flyer")}
                >
                  Build flyer prompt with AI
                </button>
                <button
                  type="button"
                  className="ad-studio__btn-outline ad-studio__btn-outline--orange"
                  disabled={!!loading}
                  onClick={() => generatePrompt("video")}
                >
                  Build video prompt with AI
                </button>
                {!hasPromptSource && (
                  <span className="ad-studio__muted text-sm">
                    Fill business name or creative idea in Step 2
                  </span>
                )}
              </div>
            </div>

            <div className="mysogi-card p-6">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <ImageIcon className="text-[var(--mysogi-orange)]" />
                AI Campaign Flyer
              </h2>
              <p className="mt-2 text-xs text-[var(--mysogi-muted)]">
                Fill Step 1 including items to show in the ad. Optional idea in Step 2, then
                Generate AI Flyer. Provider:{" "}
                <code className="text-[10px]">FLYER_IMAGE_PROVIDER</code>
              </p>
              <button
                type="button"
                className="ad-studio__btn-outline ad-studio__btn-outline--sky mt-3 w-full rounded-lg py-2 text-sm font-semibold"
                disabled={!!loading}
                onClick={() => generatePrompt("flyer")}
              >
                Preview flyer prompt with AI
              </button>
              <button
                type="button"
                className="mysogi-btn-primary mt-3 w-full rounded-lg py-2.5 font-semibold"
                disabled={!!loading || !hasPromptSource}
                onClick={generateImage}
              >
                {loading === "image" ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" /> Crafting premium flyer…
                  </span>
                ) : (
                  "Generate 2 Flyer Options"
                )}
              </button>
              {loading === "image" && flyerBuildStage && flyerBuildStage !== "ready" && (
                <div
                  className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm"
                  role="status"
                >
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[var(--mysogi-orange)]" />
                    <p className="font-semibold text-[var(--mysogi-navy)]">
                      Creating two distinct designs — this may take a few minutes
                    </p>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-[var(--mysogi-muted)]">
                    {(
                      [
                        ["copy", "Writing campaign copy"],
                        ["visual", "Generating two premium flyer designs in parallel"],
                        ["logo", "Adding logo + contact footer to each"],
                      ] as const
                    ).map(([stepKey, label]) => {
                      const state = flyerStepState(flyerBuildStage, stepKey);
                      return (
                        <li
                          key={stepKey}
                          className={
                            state === "active"
                              ? "font-medium text-[var(--mysogi-orange)]"
                              : state === "done"
                                ? "text-emerald-700"
                                : "opacity-60"
                          }
                        >
                          {state === "active" ? "◉" : state === "done" ? "✓" : "○"} {label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {flyerVariants.length >= 2 && flyerBuildStage === "ready" && (
                <div className="mt-4">
                  <p className="mb-3 text-center text-sm font-semibold text-[var(--mysogi-navy)]">
                    Choose your favorite — tap a design to continue
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {flyerVariants.map((variant) => {
                      const selected = selectedVariantId === variant.id;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => selectFlyerVariant(variant)}
                          className={`group relative overflow-hidden rounded-xl border-2 text-left transition ${
                            selected
                              ? "border-[var(--mysogi-orange)] ring-2 ring-orange-200"
                              : "border-slate-200 hover:border-orange-300"
                          }`}
                        >
                          <FlyerPreviewImage
                            imageUrl={variant.imageUrl}
                            localImageUrl={variant.localImageUrl}
                            alt={`Flyer option ${variant.label}`}
                            className="w-full object-cover"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                            <p className="text-xs font-bold uppercase tracking-wide text-orange-300">
                              Option {variant.id.toUpperCase()}
                            </p>
                            <p className="text-sm font-semibold text-white">{variant.label}</p>
                          </div>
                          {selected && (
                            <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mysogi-orange)] text-white shadow">
                              <Check size={18} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {flyerChoicePending && (
                    <p className="mt-3 text-center text-xs font-medium text-amber-700">
                      Select one design above before exporting
                    </p>
                  )}
                  {selectedVariantId && generatedImageUrl && (
                    <div className="mt-4">
                      <p className="mb-2 text-center text-xs font-medium text-emerald-700">
                        Selected — ready to export or polish
                      </p>
                      <FlyerPreviewImage
                        imageUrl={generatedImageUrl}
                        localImageUrl={flyerLocalPreviewUrl ?? undefined}
                        alt="Selected flyer"
                        className="mx-auto max-h-[420px] rounded-lg border shadow-md object-contain"
                      />
                    </div>
                  )}
                </div>
              )}
              {generatedImageUrl && flyerBuildStage === "ready" && flyerVariants.length < 2 && (
                <div className="mt-4">
                  <FlyerPreviewImage
                    imageUrl={generatedImageUrl}
                    localImageUrl={flyerLocalPreviewUrl ?? undefined}
                    alt="Campaign flyer with headline, CTA and logo"
                    className="w-full rounded-lg border shadow-md object-contain"
                  />
                  <p className="mt-2 text-center text-xs font-medium text-emerald-700">
                    Ready — headline, CTA, and contact details are all typeset inside the AI image
                  </p>
                  {creativeEngineMeta && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-xs">
                      <p className="font-semibold text-slate-800">Elite Creative Engine</p>
                      <ul className="mt-2 space-y-1 text-[var(--mysogi-muted)]">
                        <li>
                          Quality: {creativeEngineMeta.qualityScore}/100
                          {creativeEngineMeta.qualityPassed ? " ✓" : " (auto-fixed)"}
                        </li>
                        <li>Typography: {creativeEngineMeta.fontPairing}</li>
                        <li>Palette: {creativeEngineMeta.palette}</li>
                        <li>Layout balance: {creativeEngineMeta.balanceScore}/100</li>
                        {creativeEngineMeta.referenceStyle && (
                          <li>
                            Reference style: {creativeEngineMeta.referenceStyle}
                          </li>
                        )}
                      </ul>
                      {enhancedCreativeDirection && (
                        <p className="mt-2 line-clamp-3 text-[10px] leading-relaxed text-slate-600">
                          {enhancedCreativeDirection.slice(0, 280)}
                          {enhancedCreativeDirection.length > 280 ? "…" : ""}
                        </p>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[var(--mysogi-orange)] bg-orange-50 py-2.5 font-bold text-[var(--mysogi-orange)] transition hover:bg-orange-100"
                    onClick={() => setPolishImageOpen(true)}
                  >
                    <Paintbrush size={18} />
                    Polish Flyer — fine-tune visual
                  </button>
                  <p className="mt-1 text-center text-xs text-[var(--mysogi-muted)]">
                    Optional: adjust background or cover stray AI letters
                  </p>
                </div>
              )}
              <div className="mt-4">
                <label className="mysogi-label">Or upload source image (image-to-video)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="mysogi-input"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) setSourceImageDataUrl(await readFileAsDataUrl(f));
                  }}
                />
              </div>
            </div>

            <div className="mysogi-card p-6">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Video className="text-[var(--mysogi-orange)]" />
                AI Video
              </h2>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setVideoMode("text")}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
                    videoMode === "text"
                      ? "mysogi-btn-primary"
                      : "border border-[var(--mysogi-border)]"
                  }`}
                >
                  Text → Video
                </button>
                <button
                  type="button"
                  onClick={() => setVideoMode("image")}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
                    videoMode === "image"
                      ? "mysogi-btn-primary"
                      : "border border-[var(--mysogi-border)]"
                  }`}
                >
                  Image → Video
                </button>
              </div>
              <button
                type="button"
                className="mysogi-btn-primary mt-4 w-full rounded-lg py-2.5 font-semibold"
                disabled={
                  !!loading ||
                  !hasPromptSource ||
                  (videoMode === "image" && !sourceImageDataUrl && !generatedImageUrl)
                }
                onClick={generateVideo}
              >
                {loading === "video" ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" /> Generating video (Replicate)…
                  </span>
                ) : (
                  "Generate AI Video"
                )}
              </button>
              {generatedVideoUrl && (
                <video
                  src={generatedVideoUrl}
                  controls
                  className="mt-4 w-full rounded-lg border"
                />
              )}
            </div>

            {(generatedImageUrl || generatedVideoUrl) && (
              <div className="mysogi-card flex flex-wrap items-center justify-between gap-3 p-4 lg:col-span-2">
                <p className="text-sm font-semibold text-[var(--mysogi-navy)]">
                  Continue your campaign
                </p>
                <div className="flex flex-wrap gap-2">
                  {generatedVideoUrl && (
                    <button
                      type="button"
                      className="ad-studio__btn-outline ad-studio__btn-outline--orange rounded-lg px-4 py-2 text-sm font-semibold"
                      onClick={() => setStep(4)}
                    >
                      Polish video →
                    </button>
                  )}
                  <button
                    type="button"
                    className="mysogi-btn-primary rounded-lg px-5 py-2 text-sm font-semibold"
                    disabled={!hasExportableMedia}
                    onClick={() => setStep(5)}
                  >
                    Export & download →
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-between gap-3 lg:col-span-2">
              <button
                type="button"
                className="rounded-lg px-4 py-2 font-semibold text-[var(--mysogi-muted)]"
                onClick={() => setStep(2)}
              >
                ← Back
              </button>
              <div className="flex flex-wrap gap-2">
                {generatedVideoUrl && (
                  <button
                    type="button"
                    className="ad-studio__btn-outline ad-studio__btn-outline--orange rounded-lg px-5 py-2.5 font-semibold"
                    onClick={() => setStep(4)}
                  >
                    Polish video →
                  </button>
                )}
                <button
                  type="button"
                  className="mysogi-btn-primary rounded-lg px-6 py-2.5 font-semibold"
                  disabled={!hasExportableMedia}
                  onClick={() => setStep(5)}
                >
                  Go to Export →
                </button>
              </div>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="mysogi-card p-6 md:p-8">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Type className="text-[var(--mysogi-orange)]" />
              FFmpeg polish — text, logo & audio
            </h2>
            <p className="mt-1 text-[var(--mysogi-muted)]">
              Overlay your headline, logo, contact line, and optional background music.
              Requires FFmpeg installed on your machine.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mysogi-label">On-screen headline</label>
                <input
                  className="mysogi-input"
                  value={overlayText}
                  onChange={(e) => setOverlayText(e.target.value)}
                  placeholder={business.callToAction}
                />
              </div>
              <div>
                <label className="mysogi-label">Background audio (MP3)</label>
                <input
                  type="file"
                  accept="audio/*"
                  className="mysogi-input"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) setAudioDataUrl(await readFileAsDataUrl(f));
                  }}
                />
              </div>
            </div>
            <button
              type="button"
              className="mysogi-btn-primary mt-6 rounded-lg px-6 py-2.5 font-semibold"
              disabled={!!loading || !generatedVideoUrl}
              onClick={composeFinal}
            >
              {loading === "compose" ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" /> Composing with FFmpeg…
                </span>
              ) : (
                "Apply logo, text & audio"
              )}
            </button>
            {composedVideoUrl && (
              <video
                src={composedVideoUrl}
                controls
                className="mt-6 max-h-[480px] w-full rounded-lg border"
              />
            )}
            <div className="mt-8 flex justify-between">
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-[var(--mysogi-muted)]"
                onClick={() => setStep(3)}
              >
                ← Back
              </button>
              <button
                type="button"
                className="mysogi-btn-primary rounded-lg px-6 py-2.5 font-semibold"
                disabled={!finalPreview}
                onClick={() => setStep(5)}
              >
                Export →
              </button>
            </div>
          </section>
        )}

        {step === 5 && (
          <section className="mysogi-card p-6 md:p-8 text-center">
            <h2 className="text-2xl font-bold">Your campaign ad is ready</h2>
            <p className="mt-2 text-[var(--mysogi-muted)]">
              Download and publish to Mysogi billboard, SMS, display, or social channels.
            </p>
            {finalPreview && (
              <video
                src={finalPreview}
                controls
                className="mx-auto mt-6 max-h-[520px] rounded-xl border shadow-lg"
              />
            )}
            {generatedImageUrl && !finalPreview && (
              <div className="mx-auto mt-6 max-w-lg">
                <FlyerPreviewImage
                  imageUrl={generatedImageUrl}
                  localImageUrl={flyerLocalPreviewUrl ?? undefined}
                  alt="Campaign"
                  className="max-h-[520px] w-full rounded-xl border object-contain shadow-lg"
                />
              </div>
            )}
            {generatedImageUrl && finalPreview && (
              <div className="mt-8 text-left">
                <p className="text-center text-sm font-semibold text-[var(--mysogi-muted)]">
                  Campaign flyer
                </p>
                <div className="mx-auto mt-3 max-w-md">
                  <FlyerPreviewImage
                    imageUrl={generatedImageUrl}
                    localImageUrl={flyerLocalPreviewUrl ?? undefined}
                    alt="Polished campaign image"
                    className="max-h-[360px] w-full rounded-xl border object-contain shadow"
                  />
                </div>
              </div>
            )}
            {campaignMessage && (
              <div className="mx-auto mt-6 max-w-lg rounded-lg border border-orange-200 bg-orange-50 p-4 text-left">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--mysogi-orange)]">
                  Campaign message
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--mysogi-navy)]">
                  {campaignMessage}
                </p>
                <p className="mt-2 text-xs text-[var(--mysogi-muted)]">
                  {campaignMessage.length}/{CAMPAIGN_MESSAGE_MAX} characters — ready for SMS / billboard
                </p>
              </div>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {finalPreview && (
                <a
                  href={finalPreview}
                  download="mysogi-ad.mp4"
                  className="mysogi-btn-primary inline-flex items-center gap-2 rounded-lg px-8 py-3 font-bold"
                >
                  <Download size={20} />
                  Download MP4
                </a>
              )}
              {generatedImageUrl && (
                <>
                  <button
                    type="button"
                    disabled={exportingFlyer}
                    onClick={() => downloadExportFlyer(exportPreset)}
                    className="mysogi-btn-primary inline-flex items-center gap-2 rounded-lg px-8 py-3 font-bold disabled:opacity-60"
                  >
                    {exportingFlyer ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Download size={20} />
                    )}
                    Retina JPEG
                  </button>
                  <a
                    href={generatedImageUrl}
                    download="mysogi-flyer.png"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border-2 border-[var(--mysogi-orange)] bg-orange-50 px-8 py-3 font-bold text-[var(--mysogi-orange)]"
                  >
                    <Download size={20} />
                    Original PNG
                  </a>
                </>
              )}
            </div>
            {generatedImageUrl && (
              <div className="mx-auto mt-6 max-w-md text-left">
                <label className="mysogi-label">Export format</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {EXPORT_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setExportPreset(p.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        exportPreset === p.id
                          ? "mysogi-btn-primary"
                          : "border border-[var(--mysogi-border)]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={exportingFlyer}
                  onClick={() => downloadExportFlyer(exportPreset)}
                  className="mt-3 w-full rounded-lg border border-[var(--mysogi-border)] py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
                >
                  {exportingFlyer ? "Exporting…" : `Export ${EXPORT_PRESETS.find((p) => p.id === exportPreset)?.label}`}
                </button>
              </div>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-[var(--mysogi-muted)] hover:bg-slate-100"
                onClick={() => setStep(3)}
              >
                ← Back to Generate
              </button>
              {generatedVideoUrl && (
                <button
                  type="button"
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-[var(--mysogi-muted)] hover:bg-slate-100"
                  onClick={() => setStep(4)}
                >
                  Polish video
                </button>
              )}
            </div>
            <div className="mt-8 rounded-lg bg-slate-50 p-4 text-left text-sm">
              <p className="font-semibold">Included in this project:</p>
              <ul className="mt-2 list-inside list-disc text-[var(--mysogi-muted)]">
                <li>Format: {FORMAT_RATIOS[format].label}</li>
                <li>Business: {business.businessName || "—"}</li>
                <li>Script: {script ? "✓" : "—"}</li>
                <li>Captions: {caption ? "✓" : "—"}</li>
                <li>Campaign flyer: {generatedImageUrl ? "✓" : "—"}</li>
                <li>
                  Campaign message:{" "}
                  {campaignMessage
                    ? `"${campaignMessage.slice(0, 48)}${campaignMessage.length > 48 ? "…" : ""}" (${campaignMessage.length} chars)`
                    : "—"}
                </li>
                <li>FFmpeg polish: {composedVideoUrl ? "✓" : "—"}</li>
              </ul>
            </div>
            <a
              href="https://mysogi.com.ng/create-campaign"
              className="mt-6 inline-block text-[var(--mysogi-orange)] font-semibold hover:underline"
            >
              Launch on Mysogi Ads →
            </a>
          </section>
        )}
      </main>

      {polishImageOpen && generatedImageUrl && (
        <ImageEditor
          imageUrl={generatedImageBaseUrl ?? generatedImageUrl ?? ""}
          format={format}
          business={business}
          logoDataUrl={logoDataUrl}
          initialCampaignCopy={
            flyerCampaignCopy ?? buildCampaignCopy(business)
          }
          composedImageUrl={generatedImageUrl}
          autoApplyEditableText={false}
          onSave={(url) => {
            setGeneratedImageUrl(url);
            setGeneratedImageBaseUrl(url);
            if (videoMode === "image") setSourceImageDataUrl(url);
            setPolishImageOpen(false);
          }}
          onClose={() => setPolishImageOpen(false)}
        />
      )}

      <footer className="ad-studio__footer">
        © Mysogi Company Limited — 9, Adedoyin Ogungbe Crescent, Lekki Phase 1, Lagos
        · info@mysogi.com.ng · +234 812 088 9773
      </footer>
    </div>
  );
}
