import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const mode = process.argv[2] ?? "prebuild";
const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, "public");
const distDir = path.join(projectRoot, "dist", "public");

const requiredIndexAssets = [
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icons/favicon-16x16.png",
  "/icons/favicon-32x32.png",
  "/icons/apple-touch-icon.png",
  "/splash-mobile.png",
];

function toFilePath(assetPath, baseDir) {
  const normalized = assetPath.startsWith("/") ? assetPath.slice(1) : assetPath;
  return path.join(baseDir, normalized);
}

function assertFilesExist(assetPaths, baseDir, label) {
  const missing = assetPaths.filter((assetPath) => !existsSync(toFilePath(assetPath, baseDir)));
  if (missing.length > 0) {
    throw new Error(
      `${label} missing required asset(s):\n${missing.map((file) => `- ${file}`).join("\n")}`,
    );
  }
}

function getManifestIconPaths() {
  const manifestPath = path.join(publicDir, "manifest.webmanifest");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const iconPaths = Array.isArray(manifest.icons)
    ? manifest.icons
        .map((icon) => icon?.src)
        .filter((src) => typeof src === "string" && src.trim().length > 0)
    : [];

  return ["/manifest.webmanifest", ...iconPaths];
}

const manifestAssets = getManifestIconPaths();
const allAssets = [...new Set([...requiredIndexAssets, ...manifestAssets])];

if (mode === "prebuild") {
  assertFilesExist(allAssets, publicDir, "Public directory");
  console.log(`PWA asset check (prebuild) passed: ${allAssets.length} assets verified.`);
  process.exit(0);
}

if (mode === "postbuild") {
  assertFilesExist(allAssets, distDir, "Built output");
  console.log(`PWA asset check (postbuild) passed: ${allAssets.length} assets verified.`);
  process.exit(0);
}

throw new Error(`Unknown mode: ${mode}. Use 'prebuild' or 'postbuild'.`);