import { cn } from "@/lib/utils/cn";

describe("cn", () => {
  it("merges tailwind classes predictably", () => {
    expect(cn("px-2", "px-4", "text-sm")).toBe("px-4 text-sm");
  });
});

