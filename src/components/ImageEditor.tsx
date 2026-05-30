"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Circle,
  ImagePlus,
  Loader2,
  Minus,
  Plus,
  Shapes,
  Sparkles,
  Trash2,
  Type,
  X,
  Download,
  Layers,
  Eraser,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Square,
  AlignLeft,
  Image as ImageIcon,
} from "lucide-react";
import { getBrandSecondary } from "@/lib/brandColors";
import {
  buildCampaignCopy,
  getCampaignTextSpecs,
  type CampaignCopy,
} from "@/lib/campaignTextLayers";
import { getLogoPlacement, type LogoCorner } from "@/lib/campaignLayout";
import type { BusinessProfile, VideoFormat } from "@/lib/types";
import { FORMAT_RATIOS } from "@/lib/types";

const FONTS = [
  "Inter",
  "Poppins",
  "Montserrat",
  "Oswald",
  "Playfair Display",
  "Bebas Neue",
  "Roboto",
  "Open Sans",
  "Lato",
  "Arial",
];

const SHAPE_COLORS = [
  "#F26522",
  "#0B1F3A",
  "#FFFFFF",
  "#F5A623",
  "#4A9FD4",
  "#22C55E",
  "#EF4444",
  "#A855F7",
  "#000000",
];

const MAIN_IMAGE_KEY = "mysogiMainImage";

type FabricModule = typeof import("fabric");

type ImageEditorProps = {
  imageUrl: string;
  format: VideoFormat;
  business?: BusinessProfile;
  logoDataUrl?: string;
  /** AI-written copy shared with Cloudinary compose */
  initialCampaignCopy?: CampaignCopy;
  /** Full composed flyer URL — used for vision text detect fallback */
  composedImageUrl?: string;
  /** Auto-place editable text layers on open (recommended) */
  autoApplyEditableText?: boolean;
  onSave: (url: string) => void;
  onClose: () => void;
};

async function uploadFlyerAsset(
  source: string
): Promise<{ secureUrl: string; publicId: string }> {
  const isData = source.startsWith("data:");
  const res = await fetch("/api/flyer-image/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      isData ? { dataUrl: source } : { imageUrl: source }
    ),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  const path = data.secureUrl as string;
  return {
    secureUrl: path.startsWith("http") ? path : path,
    publicId: data.publicId as string,
  };
}

/** Prefer PNG delivery URLs so transparency is preserved in the editor */
function ensureEditorImageUrl(url: string): string {
  if (url.includes("f_png") || url.endsWith(".png")) return url;
  if (url.includes("/image/upload/")) {
    return url.replace("/image/upload/", "/image/upload/f_png/");
  }
  return url;
}

const CAMPAIGN_ROLES = [
  "headline",
  "tagline",
  "cta",
  "location",
  "contact",
  "cta-bg",
  "text-cover",
  "brand-logo",
] as const;

const TEXT_SHADOW = {
  color: "rgba(0,0,0,0.85)",
  blur: 12,
  offsetX: 0,
  offsetY: 4,
};

export default function ImageEditor({
  imageUrl,
  format,
  business,
  logoDataUrl,
  initialCampaignCopy,
  composedImageUrl,
  autoApplyEditableText = true,
  onSave,
  onClose,
}: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<import("fabric").Canvas | null>(null);
  const fabricModuleRef = useRef<FabricModule | null>(null);
  const mainImageRef = useRef<import("fabric").FabricImage | null>(null);
  const logoRef = useRef<import("fabric").FabricImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const campaignTextAddedRef = useRef(false);
  const autoAppliedRef = useRef(false);

  const [logoCorner, setLogoCorner] = useState<LogoCorner>("top-right");
  const [logoScale, setLogoScale] = useState(0.14);

  const [ready, setReady] = useState(false);
  const [campaignCopy, setCampaignCopy] = useState<CampaignCopy>(() =>
    business ? buildCampaignCopy(business) : buildCampaignCopy({
      businessName: "",
      tagline: "",
      phone: "",
      email: "",
      website: "",
      location: "",
      industry: "",
      targetAudience: "",
      campaignType: "",
      campaignGoal: "",
      brandColors: "",
      brandPrimary: "#0B1F3A",
      brandSecondary: "#F26522",
      callToAction: "Get Started",
    })
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cloudUrl, setCloudUrl] = useState<string | null>(null);
  const [publicId, setPublicId] = useState<string | null>(null);
  const [displayScale, setDisplayScale] = useState(0.35);

  const accentColor = business ? getBrandSecondary(business) : "#F26522";
  const [fillColor, setFillColor] = useState(accentColor);
  const [fontFamily, setFontFamily] = useState("Montserrat");
  const [copySource, setCopySource] = useState<"profile" | "ai" | "detected">(
    initialCampaignCopy ? "ai" : "profile"
  );
  const [fontSize, setFontSize] = useState(48);
  const [hasSelection, setHasSelection] = useState(false);

  const dims = FORMAT_RATIOS[format];

  const fitZoomToView = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const pad = 48;
    const availW = scroller.clientWidth - pad;
    const availH = scroller.clientHeight - pad;
    const z = Math.min(availW / dims.width, availH / dims.height, 1);
    setDisplayScale(Math.max(0.12, z));
    scroller.scrollTop = 0;
    scroller.scrollLeft = 0;
  }, [dims.width, dims.height]);

  const applyDisplayZoom = useCallback((next: number) => {
    setDisplayScale(Math.min(1.25, Math.max(0.12, next)));
  }, []);

  const syncSelection = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    setHasSelection(!!active);
    if (active && "fontFamily" in active) {
      const t = active as {
        fontFamily?: string;
        fontSize?: number;
        fill?: string;
      };
      if (t.fontFamily) setFontFamily(t.fontFamily);
      if (t.fontSize) setFontSize(t.fontSize);
      if (typeof t.fill === "string") setFillColor(t.fill);
    } else if (active && "fill" in active && typeof active.fill === "string") {
      setFillColor(active.fill);
    }
  }, []);

  const setMainImage = useCallback(
    async (url: string, transparent = false) => {
      const canvas = fabricRef.current;
      const fabric = fabricModuleRef.current;
      if (!canvas || !fabric) return;

      const { FabricImage } = fabric;
      const loadUrl = ensureEditorImageUrl(url);
      const img = await FabricImage.fromURL(loadUrl, {
        crossOrigin: "anonymous",
      });

      if (mainImageRef.current) {
        canvas.remove(mainImageRef.current);
      }

      const cw = canvas.getWidth();
      const ch = canvas.getHeight();
      const scale = Math.min(
        cw / (img.width || 1),
        ch / (img.height || 1)
      );
      img.set({
        scaleX: scale,
        scaleY: scale,
        originX: "center",
        originY: "center",
        left: cw / 2,
        top: ch / 2,
        selectable: true,
        evented: true,
        hasControls: true,
        data: { role: MAIN_IMAGE_KEY, transparent },
      });
      (img as import("fabric").FabricImage & { name?: string }).name =
        MAIN_IMAGE_KEY;

      canvas.backgroundImage = undefined;
      canvas.backgroundColor = "rgba(0,0,0,0)";
      canvas.add(img);
      canvas.sendObjectToBack(img);
      mainImageRef.current = img;
      canvas.requestRenderAll();
      requestAnimationFrame(() => fitZoomToView());
    },
    [fitZoomToView]
  );

  useEffect(() => {
    let disposed = false;

    (async () => {
      try {
        setBusy("loading");

        const statusRes = await fetch("/api/cloudinary/status");
        const status = await statusRes.json();
        if (!status.ok) {
          throw new Error(
            status.error ??
              "Cloudinary is not configured. Fix CLOUDINARY_URL in .env.local and restart the dev server."
          );
        }

        const fabric = await import("fabric");
        if (disposed || !canvasRef.current) return;
        fabricModuleRef.current = fabric;

        const { Canvas } = fabric;
        const canvas = new Canvas(canvasRef.current, {
          width: dims.width,
          height: dims.height,
          backgroundColor: "rgba(0,0,0,0)",
          preserveObjectStacking: true,
        });
        fabricRef.current = canvas;

        canvas.on("selection:created", syncSelection);
        canvas.on("selection:updated", syncSelection);
        canvas.on("selection:cleared", () => setHasSelection(false));

        const isCloudinaryHost = /res\.cloudinary\.com/i.test(imageUrl);
        const hasHeavyTransforms = /\/l_|:l_|fl_layer/i.test(imageUrl);

        if (isCloudinaryHost && !hasHeavyTransforms) {
          setCloudUrl(imageUrl);
          setPublicId(null);
          await setMainImage(imageUrl);
        } else {
          const uploaded = await uploadFlyerAsset(imageUrl);
          if (disposed) return;
          setCloudUrl(uploaded.secureUrl);
          setPublicId(uploaded.publicId);
          await setMainImage(uploaded.secureUrl);
        }
        setReady(true);
      } catch (e) {
        if (!disposed) {
          setError(e instanceof Error ? e.message : "Failed to open editor");
        }
      } finally {
        if (!disposed) setBusy(null);
      }
    })();

    return () => {
      disposed = true;
      fabricRef.current?.dispose();
      fabricRef.current = null;
      mainImageRef.current = null;
    };
  }, [
    imageUrl,
    dims.width,
    dims.height,
    setMainImage,
    syncSelection,
  ]);

  useEffect(() => {
    if (!ready) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onResize = () => fitZoomToView();
    const ro = new ResizeObserver(onResize);
    ro.observe(scroller);
    fitZoomToView();

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setDisplayScale((s) =>
          Math.min(1.25, Math.max(0.12, s - e.deltaY * 0.0015))
        );
      }
    };
    scroller.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      ro.disconnect();
      scroller.removeEventListener("wheel", onWheel);
    };
  }, [ready, fitZoomToView]);

  const applyToSelection = useCallback(
    (props: Record<string, unknown>) => {
      const canvas = fabricRef.current;
      const obj = canvas?.getActiveObject();
      if (!obj) return;
      obj.set(props);
      canvas?.requestRenderAll();
    },
    []
  );

  const removeCampaignLayers = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas
      .getObjects()
      .filter((o) => {
        const role = (o as { data?: { role?: string } }).data?.role;
        return role && CAMPAIGN_ROLES.includes(role as (typeof CAMPAIGN_ROLES)[number]);
      })
      .forEach((o) => canvas.remove(o));
  }, []);

  const addCampaignTextLayers = useCallback(
    (copyOverride?: CampaignCopy) => {
    const fabric = fabricModuleRef.current;
    const canvas = fabricRef.current;
    if (!fabric || !canvas) return;

    const copyToUse = copyOverride ?? campaignCopy;
    const { IText, Rect, Shadow } = fabric;
    const cw = canvas.getWidth();
    const ch = canvas.getHeight();
    const shadow = new Shadow(TEXT_SHADOW);

    removeCampaignLayers();
    if (mainImageRef.current) {
      canvas.sendObjectToBack(mainImageRef.current);
    }

    for (const spec of getCampaignTextSpecs(copyToUse, format, business)) {
      if (!spec.text) continue;
      const maxW = cw * (spec.maxWidthRatio ?? 0.88);

      if (spec.ctaButton) {
        const btnW = Math.min(maxW, Math.max(220, spec.text.length * 20 + 72));
        const btnH = spec.fontSize + 36;
        const rect = new Rect({
          left: (cw - btnW) / 2,
          top: ch * spec.topRatio - 10,
          width: btnW,
          height: btnH,
          fill: spec.ctaFill ?? accentColor,
          rx: 16,
          ry: 16,
          selectable: true,
          shadow,
          data: { role: "cta-bg" },
        });
        canvas.add(rect);
      }

      const text = new IText(spec.text, {
        left: cw / 2,
        top: ch * spec.topRatio,
        originX: "center",
        originY: "top",
        fontFamily,
        fontSize: spec.fontSize,
        fill: spec.fill ?? "#FFFFFF",
        fontWeight: spec.fontWeight ?? "normal",
        textAlign: "center",
        editable: true,
        width: maxW,
        shadow,
        data: { role: spec.role },
      });
      canvas.add(text);
    }

    canvas.requestRenderAll();
    campaignTextAddedRef.current = true;
  },
  [accentColor, business, campaignCopy, fontFamily, format, removeCampaignLayers]);

  const regenerateFlyerCopy = useCallback(async () => {
    if (!business?.businessName && !business?.campaignGoal) return;
    setBusy("copy");
    setError(null);
    try {
      const res = await fetch("/api/generate/flyer-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Copy generation failed");
      const copy = data.copy as CampaignCopy;
      setCampaignCopy(copy);
      setCopySource("ai");
      addCampaignTextLayers(copy);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not regenerate copy");
    } finally {
      setBusy(null);
    }
  }, [addCampaignTextLayers, business]);

  const detectTextFromFlyer = useCallback(async () => {
    const target = composedImageUrl ?? imageUrl;
    setBusy("detect");
    setError(null);
    try {
      const res = await fetch("/api/media/detect-flyer-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: target, business }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Text detection failed");
      const copy = data.copy as CampaignCopy;
      setCampaignCopy(copy);
      setCopySource("detected");
      addCampaignTextLayers(copy);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read text from image");
    } finally {
      setBusy(null);
    }
  }, [addCampaignTextLayers, business, composedImageUrl, imageUrl]);

  const addLogoLayer = useCallback(async () => {
    if (!logoDataUrl) return;
    const fabric = fabricModuleRef.current;
    const canvas = fabricRef.current;
    if (!fabric || !canvas) return;

    const existing = canvas
      .getObjects()
      .filter((o) => (o as { data?: { role?: string } }).data?.role === "brand-logo");
    existing.forEach((o) => canvas.remove(o));

    const lp = getLogoPlacement(logoCorner, logoScale);
    const cw = canvas.getWidth();
    const ch = canvas.getHeight();

    let src = logoDataUrl;
    if (!src.startsWith("data:")) {
      const up = await uploadFlyerAsset(src);
      src = up.secureUrl;
    }

    const { FabricImage } = fabric;
    const img = await FabricImage.fromURL(src, { crossOrigin: "anonymous" });
    const targetW = cw * lp.widthRatio;
    const scale = targetW / (img.width || 1);
    img.set({
      scaleX: scale,
      scaleY: scale,
      left: cw * lp.leftRatio,
      top: ch * lp.topRatio,
      originX: "left",
      originY: "top",
      selectable: true,
      hasControls: true,
      lockRotation: false,
      data: { role: "brand-logo" },
    });
    logoRef.current = img;
    canvas.add(img);
    canvas.bringObjectToFront(img);
    canvas.requestRenderAll();
  }, [logoDataUrl, logoCorner, logoScale]);

  const applyLogoCorner = useCallback(
    (corner: LogoCorner) => {
      setLogoCorner(corner);
    },
    []
  );

  useEffect(() => {
    if (!ready || !logoDataUrl) return;
    addLogoLayer();
  }, [ready, logoDataUrl, logoCorner, logoScale, addLogoLayer]);

  const updateCampaignField = useCallback(
    (field: keyof CampaignCopy, value: string) => {
      setCampaignCopy((c) => {
        const next = { ...c, [field]: value };
        queueMicrotask(() => {
          const canvas = fabricRef.current;
          if (!canvas) return;
          const obj = canvas
            .getObjects()
            .find(
              (o) => (o as { data?: { role?: string } }).data?.role === field
            );
          if (obj && "set" in obj) {
            obj.set("text", value);
            if (field === "cta") {
              const cw = canvas.getWidth();
              const btnW = Math.min(
                cw * 0.75,
                Math.max(200, value.length * 18 + 64)
              );
              const bg = canvas
                .getObjects()
                .find(
                  (o) => (o as { data?: { role?: string } }).data?.role === "cta-bg"
                );
              if (bg && "width" in bg) {
                bg.set({ width: btnW, left: (cw - btnW) / 2 });
              }
            }
            canvas.requestRenderAll();
          } else {
            addCampaignTextLayers(next);
          }
        });
        return next;
      });
    },
    [addCampaignTextLayers]
  );

  useEffect(() => {
    if (!initialCampaignCopy) return;
    setCampaignCopy(initialCampaignCopy);
    setCopySource("ai");
  }, [initialCampaignCopy]);

  useEffect(() => {
    if (!ready || !autoApplyEditableText || autoAppliedRef.current) return;
    autoAppliedRef.current = true;
    addCampaignTextLayers(initialCampaignCopy);
  }, [
    ready,
    autoApplyEditableText,
    initialCampaignCopy,
    addCampaignTextLayers,
  ]);

  const coverBadAiText = useCallback(() => {
    const fabric = fabricModuleRef.current;
    const canvas = fabricRef.current;
    if (!fabric || !canvas) return;

    const { Rect } = fabric;
    const cw = canvas.getWidth();
    const ch = canvas.getHeight();
    const rect = new Rect({
      left: cw * 0.06,
      top: ch * 0.3,
      width: cw * 0.88,
      height: ch * 0.14,
      fill: "rgba(11, 31, 58, 0.93)",
      rx: 8,
      ry: 8,
      selectable: true,
      data: { role: "text-cover" },
    });
    canvas.add(rect);
    if (mainImageRef.current) {
      const idx = canvas.getObjects().indexOf(mainImageRef.current);
      canvas.moveObjectTo(rect, Math.max(0, idx) + 1);
    }
    canvas.setActiveObject(rect);
    canvas.requestRenderAll();
    setHasSelection(true);
  }, []);


  useEffect(() => {
    const canvas = fabricRef.current;
    const logo = logoRef.current;
    if (!canvas || !logo) return;
    const lp = getLogoPlacement(logoCorner, logoScale);
    const cw = canvas.getWidth();
    const ch = canvas.getHeight();
    const targetW = cw * lp.widthRatio;
    const scale = targetW / ((logo.width || 1) * (logo.scaleX || 1));
    logo.set({
      scaleX: scale,
      scaleY: scale,
      left: cw * lp.leftRatio,
      top: ch * lp.topRatio,
    });
    canvas.requestRenderAll();
  }, [logoScale, logoCorner]);

  const addText = async () => {
    const fabric = fabricModuleRef.current;
    const canvas = fabricRef.current;
    if (!fabric || !canvas) return;
    const { IText } = fabric;
    const text = new IText("Your headline", {
      left: canvas.getWidth() / 2 - 120,
      top: canvas.getHeight() * 0.12,
      fontFamily,
      fontSize,
      fill: fillColor,
      fontWeight: "bold",
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
    setHasSelection(true);
  };

  const addShape = (kind: "rect" | "circle" | "triangle") => {
    const fabric = fabricModuleRef.current;
    const canvas = fabricRef.current;
    if (!fabric || !canvas) return;
    const { Rect, Circle, Triangle } = fabric;
    const cx = canvas.getWidth() / 2;
    const cy = canvas.getHeight() / 2;
    let shape;
    if (kind === "rect") {
      shape = new Rect({
        left: cx - 80,
        top: cy - 40,
        width: 160,
        height: 80,
        fill: fillColor,
        opacity: 0.85,
        rx: 8,
        ry: 8,
      });
    } else if (kind === "circle") {
      shape = new Circle({
        left: cx - 50,
        top: cy - 50,
        radius: 50,
        fill: fillColor,
        opacity: 0.85,
      });
    } else {
      shape = new Triangle({
        left: cx - 60,
        top: cy - 50,
        width: 120,
        height: 100,
        fill: fillColor,
        opacity: 0.85,
      });
    }
    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.requestRenderAll();
    setHasSelection(true);
  };

  const addImageLayer = async (file: File) => {
    const fabric = fabricModuleRef.current;
    const canvas = fabricRef.current;
    if (!fabric || !canvas) return;
    setBusy("upload");
    setError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const { secureUrl: url } = await uploadFlyerAsset(dataUrl);
      const { FabricImage } = fabric;
      const img = await FabricImage.fromURL(url, { crossOrigin: "anonymous" });
      const maxW = canvas.getWidth() * 0.4;
      const scale = maxW / (img.width || 1);
      img.set({
        scaleX: scale,
        scaleY: scale,
        left: canvas.getWidth() / 2 - (img.width * scale) / 2,
        top: canvas.getHeight() / 2 - (img.height * scale) / 2,
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
      setHasSelection(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add image");
    } finally {
      setBusy(null);
    }
  };

  const removeBackground = async () => {
    setBusy("bg");
    setError(null);
    try {
      const canvas = fabricRef.current;
      const active = canvas?.getActiveObject();
      const isImage =
        active &&
        active.type === "image" &&
        "getSrc" in active &&
        typeof (active as { getSrc: () => string }).getSrc === "function";

      let body: Record<string, string>;
      if (isImage) {
        const src = (active as { getSrc: () => string }).getSrc();
        body = src.startsWith("data:") ? { dataUrl: src } : { imageUrl: src };
      } else if (publicId) {
        body = { publicId };
      } else if (cloudUrl) {
        body = { imageUrl: cloudUrl };
      } else {
        body = { imageUrl };
      }

      const res = await fetch("/api/cloudinary/remove-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Background removal failed");

      const pngUrl = ensureEditorImageUrl(data.secureUrl as string);

      if (isImage && active && canvas) {
        const { FabricImage } = fabricModuleRef.current!;
        const img = await FabricImage.fromURL(pngUrl, {
          crossOrigin: "anonymous",
        });
        img.set({
          left: active.left,
          top: active.top,
          scaleX: active.scaleX,
          scaleY: active.scaleY,
          angle: active.angle,
          data: { transparent: true },
        });
        canvas.remove(active);
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
      } else {
        setCloudUrl(pngUrl);
        setPublicId(data.publicId);
        await setMainImage(pngUrl, true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Background removal failed");
    } finally {
      setBusy(null);
    }
  };

  const deleteSelected = () => {
    const canvas = fabricRef.current;
    const active = canvas?.getActiveObject();
    if (!canvas || !active) return;
    if (
      (active as { data?: { role?: string } }).data?.role === MAIN_IMAGE_KEY
    ) {
      setError("Cannot delete the main photo — use another layer or re-open.");
      return;
    }
    canvas.remove(active);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    setHasSelection(false);
  };

  const bringForward = () => {
    const canvas = fabricRef.current;
    const active = canvas?.getActiveObject();
    if (canvas && active) {
      canvas.bringObjectForward(active);
      canvas.requestRenderAll();
    }
  };

  const sendBackward = () => {
    const canvas = fabricRef.current;
    const active = canvas?.getActiveObject();
    if (canvas && active) {
      canvas.sendObjectBackwards(active);
      canvas.requestRenderAll();
    }
  };

  const exportImage = async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    setBusy("export");
    setError(null);
    try {
      const prevBg = canvas.backgroundColor;
      canvas.backgroundColor = "rgba(0,0,0,0)";
      const dataUrl = canvas.toDataURL({
        format: "png",
        quality: 1,
        multiplier: 1,
      });
      canvas.backgroundColor = prevBg;
      const { secureUrl: url } = await uploadFlyerAsset(dataUrl);
      onSave(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(null);
    }
  };

  const zoomPercent = Math.round(displayScale * 100);
  const stageW = dims.width * displayScale + 64;
  const stageH = dims.height * displayScale + 64;

  return (
    <div className="image-editor" role="dialog" aria-modal="true">
      <div className="image-editor__backdrop" onClick={onClose} />
      <div className="image-editor__panel">
        <header className="image-editor__header">
          <div>
            <h2 className="image-editor__title">
              <Sparkles size={20} className="text-[var(--mysogi-orange)]" />
              Polish Image
            </h2>
            <p className="image-editor__subtitle">
              Cloudinary placed your campaign text — edit in the right panel or
              double-click on canvas · Ctrl+wheel to zoom · {dims.label}
            </p>
          </div>
          <div className="image-editor__header-actions">
            <button
              type="button"
              className="image-editor__btn image-editor__btn--primary"
              disabled={!ready || !!busy}
              onClick={exportImage}
            >
              {busy === "export" ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Download size={18} />
              )}
              Save polished image
            </button>
            <button
              type="button"
              className="image-editor__btn image-editor__btn--ghost"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {error && <div className="image-editor__error">{error}</div>}

        <div className="image-editor__body">
          <aside className="image-editor__tools">
            <p className="image-editor__tools-label">Zoom</p>
            <div className="image-editor__zoom-row">
              <button
                type="button"
                className="image-editor__size-btn"
                title="Zoom out"
                onClick={() => applyDisplayZoom(displayScale - 0.08)}
              >
                <ZoomOut size={16} />
              </button>
              <span className="image-editor__zoom-label">{zoomPercent}%</span>
              <button
                type="button"
                className="image-editor__size-btn"
                title="Zoom in"
                onClick={() => applyDisplayZoom(displayScale + 0.08)}
              >
                <ZoomIn size={16} />
              </button>
              <button
                type="button"
                className="image-editor__size-btn"
                title="Fit entire canvas in view"
                onClick={fitZoomToView}
              >
                <Maximize2 size={16} />
              </button>
            </div>

            {logoDataUrl && (
              <>
                <p className="image-editor__tools-label">Logo</p>
                <button
                  type="button"
                  className="image-editor__tool image-editor__tool--accent"
                  disabled={!ready}
                  onClick={() => addLogoLayer()}
                >
                  <ImageIcon size={18} /> Refresh logo layer
                </button>
                <label className="image-editor__field">
                  Position
                  <select
                    className="mysogi-input"
                    value={logoCorner}
                    onChange={(e) =>
                      applyLogoCorner(e.target.value as LogoCorner)
                    }
                  >
                    <option value="top-left">Top left</option>
                    <option value="top-right">Top right</option>
                    <option value="bottom-left">Bottom left</option>
                    <option value="bottom-right">Bottom right</option>
                  </select>
                </label>
                <label className="image-editor__field">
                  Size ({Math.round(logoScale * 100)}%)
                  <input
                    type="range"
                    min={0.06}
                    max={0.32}
                    step={0.01}
                    value={logoScale}
                    onChange={(e) => setLogoScale(Number(e.target.value))}
                    className="w-full"
                  />
                </label>
                <p className="image-editor__hint" style={{ marginTop: 0 }}>
                  Drag the logo on canvas or use controls to resize.
                </p>
              </>
            )}

            <p className="image-editor__tools-label">Flyer text</p>
            <button
              type="button"
              className="image-editor__tool image-editor__tool--accent"
              disabled={!ready || !!busy}
              onClick={() => addCampaignTextLayers()}
            >
              <AlignLeft size={18} /> Refresh text layers
            </button>
            <button
              type="button"
              className="image-editor__tool"
              disabled={!ready || busy === "copy"}
              onClick={regenerateFlyerCopy}
            >
              {busy === "copy" ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Sparkles size={18} />
              )}
              Regenerate copy with AI
            </button>
            <button
              type="button"
              className="image-editor__tool"
              disabled={!ready || busy === "detect"}
              onClick={detectTextFromFlyer}
            >
              {busy === "detect" ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Type size={18} />
              )}
              Read text from image (OCR)
            </button>
            <button
              type="button"
              className="image-editor__tool"
              disabled={!ready || !!busy}
              onClick={coverBadAiText}
            >
              <Square size={18} /> Cover stray AI letters
            </button>

            <p className="image-editor__tools-label">Add</p>
            <button
              type="button"
              className="image-editor__tool"
              disabled={!ready || !!busy}
              onClick={addText}
            >
              <Type size={18} /> Custom text
            </button>
            <button
              type="button"
              className="image-editor__tool"
              disabled={!ready || !!busy}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus size={18} /> Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) addImageLayer(f);
                e.target.value = "";
              }}
            />

            <p className="image-editor__tools-label">Shapes</p>
            <button
              type="button"
              className="image-editor__tool"
              disabled={!ready || !!busy}
              onClick={() => addShape("rect")}
            >
              <Shapes size={18} /> Rectangle
            </button>
            <button
              type="button"
              className="image-editor__tool"
              disabled={!ready || !!busy}
              onClick={() => addShape("circle")}
            >
              <Circle size={18} /> Circle
            </button>
            <button
              type="button"
              className="image-editor__tool"
              disabled={!ready || !!busy}
              onClick={() => addShape("triangle")}
            >
              <Shapes size={18} /> Triangle
            </button>

            <p className="image-editor__tools-label">Cloudinary AI</p>
            <button
              type="button"
              className="image-editor__tool image-editor__tool--accent"
              disabled={!ready || busy === "bg"}
              onClick={removeBackground}
            >
              {busy === "bg" ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Eraser size={18} />
              )}
              Remove background
            </button>

            <p className="image-editor__tools-label">Layers</p>
            <button
              type="button"
              className="image-editor__tool"
              disabled={!hasSelection}
              onClick={bringForward}
            >
              <Layers size={18} /> Bring forward
            </button>
            <button
              type="button"
              className="image-editor__tool"
              disabled={!hasSelection}
              onClick={sendBackward}
            >
              <Layers size={18} /> Send back
            </button>
            <button
              type="button"
              className="image-editor__tool image-editor__tool--danger"
              disabled={!hasSelection}
              onClick={deleteSelected}
            >
              <Trash2 size={18} /> Delete
            </button>
          </aside>

          <div
            ref={scrollerRef}
            className="image-editor__viewport image-editor__canvas-wrap--checker"
          >
            {(!ready || busy === "loading") && (
              <div className="image-editor__loading">
                <Loader2 className="animate-spin" size={32} />
                <span>Preparing canvas…</span>
              </div>
            )}
            <div
              className="image-editor__stage"
              style={{ width: stageW, height: stageH }}
            >
              <div
                className="image-editor__canvas-scale"
                style={{
                  width: dims.width,
                  height: dims.height,
                  transform: `scale(${displayScale})`,
                }}
              >
                <canvas ref={canvasRef} />
              </div>
            </div>
          </div>

          <aside className="image-editor__props">
            <p className="image-editor__tools-label">Campaign copy (editable)</p>
            <p className="image-editor__hint" style={{ marginTop: 0 }}>
              Flyer text is added by <strong>Cloudinary</strong> when you generate — not
              by Imagen. Use <strong>Apply copy to flyer</strong> only if you need to
              tweak text on the canvas, or <strong>Cover stray AI letters</strong> if the
              background still has garbage glyphs.
            </p>
            <label className="image-editor__field">
              Headline
              <input
                className="mysogi-input"
                value={campaignCopy.headline}
                onChange={(e) => updateCampaignField("headline", e.target.value)}
              />
            </label>
            <label className="image-editor__field">
              Tagline
              <input
                className="mysogi-input"
                value={campaignCopy.tagline}
                onChange={(e) => updateCampaignField("tagline", e.target.value)}
              />
            </label>
            <label className="image-editor__field">
              CTA button
              <input
                className="mysogi-input"
                value={campaignCopy.cta}
                onChange={(e) => updateCampaignField("cta", e.target.value)}
              />
            </label>
            <label className="image-editor__field">
              Location
              <input
                className="mysogi-input"
                value={campaignCopy.location}
                onChange={(e) => updateCampaignField("location", e.target.value)}
              />
            </label>
            <label className="image-editor__field">
              Contact (phone · email · web)
              <input
                className="mysogi-input"
                value={campaignCopy.contact}
                onChange={(e) => updateCampaignField("contact", e.target.value)}
              />
            </label>
            <button
              type="button"
              className="image-editor__tool image-editor__tool--accent"
              style={{ marginTop: "0.5rem" }}
              disabled={!ready || !!busy}
              onClick={() => addCampaignTextLayers()}
            >
              Apply copy to flyer
            </button>

            <p className="image-editor__tools-label">Style</p>
            <label className="image-editor__field">
              Font
              <select
                className="mysogi-input"
                value={fontFamily}
                onChange={(e) => {
                  setFontFamily(e.target.value);
                  applyToSelection({ fontFamily: e.target.value });
                }}
              >
                {FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <label className="image-editor__field">
              Size
              <div className="image-editor__size-row">
                <button
                  type="button"
                  className="image-editor__size-btn"
                  onClick={() => {
                    const n = Math.max(12, fontSize - 4);
                    setFontSize(n);
                    applyToSelection({ fontSize: n });
                  }}
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  className="mysogi-input"
                  min={12}
                  max={200}
                  value={fontSize}
                  onChange={(e) => {
                    const n = Number(e.target.value) || 48;
                    setFontSize(n);
                    applyToSelection({ fontSize: n });
                  }}
                />
                <button
                  type="button"
                  className="image-editor__size-btn"
                  onClick={() => {
                    const n = Math.min(200, fontSize + 4);
                    setFontSize(n);
                    applyToSelection({ fontSize: n });
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </label>
            <label className="image-editor__field">
              Color
              <div className="image-editor__colors">
                {SHAPE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`image-editor__swatch ${fillColor === c ? "image-editor__swatch--active" : ""}`}
                    style={{ background: c }}
                    onClick={() => {
                      setFillColor(c);
                      applyToSelection({ fill: c });
                    }}
                    aria-label={`Color ${c}`}
                  />
                ))}
                <input
                  type="color"
                  value={fillColor}
                  onChange={(e) => {
                    setFillColor(e.target.value);
                    applyToSelection({ fill: e.target.value });
                  }}
                  className="image-editor__color-input"
                />
              </div>
            </label>
            <p className="image-editor__hint">
              Tip: Use Cover bad AI text over garbled letters, then Add correct
              campaign text. Save as PNG when done.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
