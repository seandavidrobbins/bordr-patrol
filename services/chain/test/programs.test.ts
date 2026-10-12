import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PROGRAM_IDS } from "@bordrless/shared";
import { programId } from "../src/index.ts";

describe("Bordrless program ids", () => {
  it("reads the token program from the SDK and from shared", () => {
    assert.equal(programId("token"), PROGRAM_IDS.token);
  });

  it("reads the DEX program from the SDK and from shared", () => {
    assert.equal(programId("swap"), PROGRAM_IDS.swap);
  });
});
