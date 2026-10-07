import { describe, expect, it } from "vitest";
import { avatarOutputSize } from "@/lib/avatar-crop";

describe("avatar output dimensions", () => {
  it("caps large crops at 320px", () => {
    expect(avatarOutputSize({ width: 1600, height: 1200 })).toBe(320);
  });
  it("does not upscale smaller crops", () => {
    expect(avatarOutputSize({ width: 100, height: 100 })).toBe(100);
  });
  it("keeps whole-pixel square dimensions", () => {
    expect(avatarOutputSize({ width: 200.6, height: 200.6 })).toBe(200);
  });
});