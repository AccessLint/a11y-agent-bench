import { describe, bench } from "vitest";
import { JSDOM } from "jsdom";
import axe from "axe-core";
import { runAudit } from "@accesslint/core";
import { generateHtml, SMALL_SIZE, MEDIUM_SIZE, LARGE_SIZE } from "./fixtures";

// Generate HTML strings once
const smallHtml = generateHtml(SMALL_SIZE);
const mediumHtml = generateHtml(MEDIUM_SIZE);
const largeHtml = generateHtml(LARGE_SIZE);

// Create jsdom documents (same document used by both libraries)
const smallDoc = new JSDOM(smallHtml).window.document;
const mediumDoc = new JSDOM(mediumHtml).window.document;
const largeDoc = new JSDOM(largeHtml).window.document;

describe("audit – 100 elements", () => {
  bench("axe-core", async () => {
    axe.setup(smallDoc);
    await axe.run(smallDoc);
    axe.teardown();
  }, { time: 1000, warmupIterations: 1 });

  bench("@accesslint/core", () => {
    runAudit(smallDoc);
  }, { time: 1000, warmupIterations: 1 });
});

describe("audit – 500 elements", () => {
  bench("axe-core", async () => {
    axe.setup(mediumDoc);
    await axe.run(mediumDoc);
    axe.teardown();
  }, { time: 1000, warmupIterations: 1 });

  bench("@accesslint/core", () => {
    runAudit(mediumDoc);
  }, { time: 1000, warmupIterations: 1 });
});

describe("audit – 2k elements", () => {
  bench("axe-core", async () => {
    axe.setup(largeDoc);
    await axe.run(largeDoc);
    axe.teardown();
  }, { time: 1000, iterations: 3, warmupIterations: 1 });

  bench("@accesslint/core", () => {
    runAudit(largeDoc);
  }, { time: 1000, iterations: 3, warmupIterations: 1 });
});
