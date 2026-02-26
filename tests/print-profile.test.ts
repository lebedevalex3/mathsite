import test from "node:test";
import assert from "node:assert/strict";

import {
  defaultOrientationForLayout,
  normalizePrintProfile,
  parsePrintOrientation,
} from "@/src/lib/variants/print-profile";

test("defaultOrientationForLayout maps two -> landscape", () => {
  assert.equal(defaultOrientationForLayout("single"), "portrait");
  assert.equal(defaultOrientationForLayout("two"), "landscape");
  assert.equal(defaultOrientationForLayout("two_dup"), "landscape");
});

test("normalizePrintProfile is backward compatible when orientation is missing", () => {
  assert.deepEqual(normalizePrintProfile({ layout: "single" }), {
    layout: "single",
    orientation: "portrait",
  });
  assert.deepEqual(normalizePrintProfile({ layout: "two" }), {
    layout: "two",
    orientation: "landscape",
  });
  assert.deepEqual(normalizePrintProfile({ layout: "two_cut" }), {
    layout: "two_cut",
    orientation: "landscape",
  });
  assert.deepEqual(normalizePrintProfile({ layout: "two_dup" }), {
    layout: "two_dup",
    orientation: "landscape",
  });
});

test("parsePrintOrientation falls back safely", () => {
  assert.equal(parsePrintOrientation("landscape"), "landscape");
  assert.equal(parsePrintOrientation("portrait"), "portrait");
  assert.equal(parsePrintOrientation("weird", "landscape"), "landscape");
});
