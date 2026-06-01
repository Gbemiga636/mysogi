"use client";

import { useCallback, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import {
  buildFlyerImageCandidateUrls,
  cacheBustFlyerUrl,
} from "@/lib/flyerDisplayUrl";

type FlyerPreviewImageProps = {
  imageUrl: string;
  localImageUrl?: string;
  alt: string;
  className?: string;
  showReload?: boolean;
};

export default function FlyerPreviewImage({
  imageUrl,
  localImageUrl,
  alt,
  className = "w-full object-cover",
  showReload = true,
}: FlyerPreviewImageProps) {
  const candidates = useMemo(
    () => buildFlyerImageCandidateUrls(imageUrl, localImageUrl),
    [imageUrl, localImageUrl]
  );

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  const src =
    candidates[candidateIndex] != null
      ? cacheBustFlyerUrl(candidates[candidateIndex], reloadNonce)
      : "";

  const tryNext = useCallback(() => {
    setCandidateIndex((i) => {
      if (i + 1 < candidates.length) {
        setStatus("loading");
        return i + 1;
      }
      setStatus("error");
      return i;
    });
  }, [candidates.length]);

  const reload = useCallback(() => {
    setCandidateIndex(0);
    setReloadNonce(Date.now());
    setStatus("loading");
  }, []);

  if (!candidates.length) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-500">
        No preview URL
      </div>
    );
  }

  return (
    <div className="relative">
      {status === "loading" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100/80">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--mysogi-orange)]" />
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-100/95 p-4 text-center">
          <p className="text-sm text-slate-600">Image did not load</p>
          {showReload && (
            <button
              type="button"
              onClick={reload}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--mysogi-navy)] px-3 py-1.5 text-xs font-semibold text-white"
            >
              <RefreshCw size={14} />
              Reload image
            </button>
          )}
        </div>
      )}
      <img
        key={`${src}-${candidateIndex}`}
        src={src}
        alt={alt}
        className={className}
        onLoad={() => setStatus("loaded")}
        onError={() => tryNext()}
      />
      {showReload && status === "loaded" && (
        <button
          type="button"
          onClick={reload}
          title="Reload preview"
          className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
        >
          <RefreshCw size={14} />
        </button>
      )}
    </div>
  );
}
