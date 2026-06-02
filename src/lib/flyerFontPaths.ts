import fs from "fs";
import path from "path";

const FONT_ROOT = path.join(process.cwd(), "node_modules", "@fontsource");

/** All directories that may contain bundled flyer woff2 files at runtime. */
export function getFlyerFontSearchDirs(): string[] {
  const dirs = [
    path.join(process.cwd(), "src", "assets", "fonts"),
    path.join(process.cwd(), "assets", "fonts"),
  ];

  if (typeof __dirname !== "undefined") {
    dirs.push(
      path.join(__dirname, "..", "assets", "fonts"),
      path.join(__dirname, "assets", "fonts"),
      path.join(__dirname, "..", "..", "src", "assets", "fonts")
    );
  }

  return [...new Set(dirs)];
}

/** Resolve a flyer font file on disk (bundled src/assets/fonts first). */
export function resolveBundledFontPath(pkg: string, file: string): string | null {
  for (const dir of getFlyerFontSearchDirs()) {
    const p = path.join(dir, file);
    if (fs.existsSync(p)) return p;
  }

  const fromPkg = path.join(FONT_ROOT, pkg, "files", file);
  if (fs.existsSync(fromPkg)) return fromPkg;

  return null;
}
