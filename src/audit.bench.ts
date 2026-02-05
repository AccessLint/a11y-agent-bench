import { describe, bench, beforeAll } from "vitest";
import { Window } from "happy-dom";
import axe from "axe-core";
import { runAudit } from "@accesslint/core";
import { generateHtml, SMALL_SIZE, MEDIUM_SIZE, LARGE_SIZE } from "./fixtures";

// Generate HTML strings once
const smallHtml = generateHtml(SMALL_SIZE);
const mediumHtml = generateHtml(MEDIUM_SIZE);
const largeHtml = generateHtml(LARGE_SIZE);

// Create happy-dom documents (same environment for both libraries)
function createDoc(html: string): Document {
  const win = new Window({ url: "https://localhost" });
  win.document.write(html);
  return win.document as unknown as Document;
}

const smallDoc = createDoc(smallHtml);
const mediumDoc = createDoc(mediumHtml);
const largeDoc = createDoc(largeHtml);

describe("audit – 100 elements", () => {
  beforeAll(() => {
    // Warm up both libraries
    axe.run(smallDoc);
    runAudit(smallDoc);
  });

  bench("axe-core", async () => {
    await axe.run(smallDoc);
  });

  bench("@accesslint/core", () => {
    runAudit(smallDoc);
  });
});

describe("audit – 500 elements", () => {
  beforeAll(() => {
    axe.run(mediumDoc);
    runAudit(mediumDoc);
  });

  bench("axe-core", async () => {
    await axe.run(mediumDoc);
  });

  bench("@accesslint/core", () => {
    runAudit(mediumDoc);
  });
});

describe("audit – 2k elements", () => {
  beforeAll(() => {
    axe.run(largeDoc);
    runAudit(largeDoc);
  });

  bench("axe-core", async () => {
    await axe.run(largeDoc);
  }, { time: 1000 });

  bench("@accesslint/core", () => {
    runAudit(largeDoc);
  }, { time: 1000 });
});
