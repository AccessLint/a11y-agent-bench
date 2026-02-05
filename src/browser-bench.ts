/**
 * Browser benchmark using Playwright.
 * Runs axe-core and @accesslint/core in a real Chromium browser.
 *
 * Usage: npm run bench:browser
 */
import { chromium } from "playwright";
import { resolve } from "node:path";
import { generateHtml, SMALL_SIZE, MEDIUM_SIZE, LARGE_SIZE } from "./fixtures.js";

const AXE_PATH = resolve("node_modules/axe-core/axe.min.js");
const AL_PATH = resolve("node_modules/@accesslint/core/dist/index.iife.js");

interface BenchResult {
  mean: number;
  min: number;
  max: number;
  p75: number;
  samples: number;
}

const formatMs = (ms: number): string =>
  ms < 1 ? `${(ms * 1000).toFixed(0)}µs` : `${ms.toFixed(1)}ms`;

const printRow = (name: string, r: BenchResult) => {
  const hz = (1000 / r.mean).toFixed(2);
  console.log(
    `  ${name.padEnd(20)} ${hz.padStart(10)} ops/s  ` +
      `mean=${formatMs(r.mean)}  min=${formatMs(r.min)}  ` +
      `max=${formatMs(r.max)}  p75=${formatMs(r.p75)}  ` +
      `samples=${r.samples}`,
  );
};

const sizes = [
  { label: "100 elements", n: SMALL_SIZE, iterations: 20 },
  { label: "500 elements", n: MEDIUM_SIZE, iterations: 10 },
  { label: "2k elements", n: LARGE_SIZE, iterations: 5 },
];

const browser = await chromium.launch();
const context = await browser.newContext();

for (const { label, n, iterations } of sizes) {
  const html = generateHtml(n);
  const page = await context.newPage();

  page.on("pageerror", (err) => console.error("  PAGE ERROR:", err.message));

  // Strip meta refresh to prevent page reload during benchmark
  const safeHtml = html.replace(/<meta http-equiv="refresh"[^>]*>/, "");
  await page.setContent(safeHtml, { waitUntil: "domcontentloaded" });

  // Inject both libraries
  await page.addScriptTag({ path: AXE_PATH });
  await page.addScriptTag({ path: AL_PATH });

  // Run benchmarks — use evaluate with a string to avoid tsx __name transforms
  const benchCode = `(async () => {
    var computeStats = (times) => {
      var sorted = times.slice().sort((a, b) => a - b);
      var sum = sorted.reduce((a, b) => a + b, 0);
      return {
        mean: sum / sorted.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p75: sorted[Math.floor(sorted.length * 0.75)],
        samples: sorted.length,
      };
    };

    await window.axe.run(document);
    window.AccessLintCore.runAudit(document);

    var axeTimes = [];
    for (var i = 0; i < ${iterations}; i++) {
      var start = performance.now();
      await window.axe.run(document);
      axeTimes.push(performance.now() - start);
    }

    var alTimes = [];
    for (var i = 0; i < ${iterations}; i++) {
      var start = performance.now();
      window.AccessLintCore.runAudit(document);
      alTimes.push(performance.now() - start);
    }

    return {
      axe: computeStats(axeTimes),
      al: computeStats(alTimes),
    };
  })()`;

  page.setDefaultTimeout(300_000);
  const results: { axe: BenchResult; al: BenchResult } = await page.evaluate(benchCode);

  const faster =
    results.axe.mean < results.al.mean
      ? `axe-core ${(results.al.mean / results.axe.mean).toFixed(1)}x faster`
      : `@accesslint/core ${(results.axe.mean / results.al.mean).toFixed(1)}x faster`;

  console.log(`\n${label} (${iterations} iterations)`);
  printRow("axe-core", results.axe);
  printRow("@accesslint/core", results.al);
  console.log(`  → ${faster}`);

  await page.close();
}

await browser.close();
