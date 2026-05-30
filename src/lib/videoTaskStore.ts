export type VideoTaskStatus = "RUNNING" | "SUCCEEDED" | "FAILED";

export type VideoTaskRecord = {
  status: VideoTaskStatus;
  outputUrl?: string | null;
  error?: string;
  provider?: string;
};

const store = new Map<string, VideoTaskRecord>();

export function setVideoTask(id: string, record: VideoTaskRecord): void {
  store.set(id, record);
}

export function getVideoTask(id: string): VideoTaskRecord | undefined {
  return store.get(id);
}

export function updateVideoTask(
  id: string,
  patch: Partial<VideoTaskRecord>
): void {
  const prev = store.get(id) ?? { status: "RUNNING" };
  store.set(id, { ...prev, ...patch });
}
