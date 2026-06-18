#!/usr/bin/env node

const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const PROJECT_ROOT = process.cwd();
const INPUT_DIR = path.resolve(PROJECT_ROOT, "Front/assets/source-images");
const OUTPUT_DIR = path.resolve(PROJECT_ROOT, "Front/assets/optimized");
const THUMB_WIDTH = 500;
const LARGE_WIDTH = 1000;
const THUMB_QUALITY = 75;
const LARGE_QUALITY = 82;

const SUPPORTED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".avif"]);

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(absolute)));
      continue;
    }

    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (SUPPORTED_EXT.has(ext)) files.push(absolute);
  }

  return files;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function optimizeSingleImage(inputPath) {
  const relative = path.relative(INPUT_DIR, inputPath);
  const parsed = path.parse(relative);
  const outputFolder = path.join(OUTPUT_DIR, parsed.dir);
  const thumbPath = path.join(outputFolder, `${parsed.name}-thumb.webp`);
  const fullPath = path.join(outputFolder, `${parsed.name}.webp`);

  await ensureDir(outputFolder);

  try {
    const image = sharp(inputPath, { failOn: "none" }).rotate();
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) {
      console.warn(`[skip] Invalid image metadata: ${relative}`);
      return { status: "skipped" };
    }

    await image
      .clone()
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true, fit: "inside" })
      .webp({ quality: THUMB_QUALITY, effort: 4 })
      .toFile(thumbPath);

    await image
      .clone()
      .resize({ width: LARGE_WIDTH, withoutEnlargement: true, fit: "inside" })
      .webp({ quality: LARGE_QUALITY, effort: 4 })
      .toFile(fullPath);

    console.log(`[ok] ${relative} -> ${path.relative(PROJECT_ROOT, thumbPath)}, ${path.relative(PROJECT_ROOT, fullPath)}`);
    return { status: "ok" };
  } catch (error) {
    console.warn(`[skip] ${relative} (${error.message})`);
    return { status: "skipped" };
  }
}

async function main() {
  const inputExists = await exists(INPUT_DIR);
  if (!inputExists) {
    console.error(`Input folder not found: ${INPUT_DIR}`);
    process.exitCode = 1;
    return;
  }

  await ensureDir(OUTPUT_DIR);
  const files = await walkFiles(INPUT_DIR);

  if (!files.length) {
    console.log(`No supported images found in: ${INPUT_DIR}`);
    return;
  }

  console.log(`Found ${files.length} source images.`);

  let optimized = 0;
  let skipped = 0;

  for (const filePath of files) {
    const result = await optimizeSingleImage(filePath);
    if (result.status === "ok") optimized += 1;
    else skipped += 1;
  }

  console.log(`Done. optimized=${optimized}, skipped=${skipped}, total=${files.length}`);
  console.log(`Output folder: ${OUTPUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
