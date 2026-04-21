import { buildSystemPrompt } from "~/server/chat/system-prompt";

vi.mock("~/server/prompts", () => ({
  SCOUT_SYSTEM_PROMPT:
    "You are Sammy, a government contracting intelligence assistant.",
}));

describe("buildSystemPrompt", () => {
  it("should include the opportunity count in the output", () => {
    const result = buildSystemPrompt({
      totalCount: 200,
      scoredCount: 0,
      activeProfile: null,
    });

    expect(result).toContain("200 federal contract opportunities");
  });

  it("should include scored count when greater than 0", () => {
    const result = buildSystemPrompt({
      totalCount: 500,
      scoredCount: 150,
      activeProfile: null,
    });

    expect(result).toContain("150 of which have been AI-scored");
  });

  it("should not mention scoring when scoredCount is 0", () => {
    const result = buildSystemPrompt({
      totalCount: 100,
      scoredCount: 0,
      activeProfile: null,
    });

    expect(result).not.toContain("AI-scored");
  });

  it("should include profile name and NAICS codes when activeProfile is provided", () => {
    const result = buildSystemPrompt({
      totalCount: 100,
      scoredCount: 0,
      activeProfile: {
        name: "Acme Cyber",
        targetNaics: ["541512", "541519"],
      },
    });

    expect(result).toContain('"Acme Cyber"');
    expect(result).toContain("541512, 541519");
  });

  it('should show "No company profile" message when activeProfile is null', () => {
    const result = buildSystemPrompt({
      totalCount: 100,
      scoredCount: 0,
      activeProfile: null,
    });

    expect(result).toContain("No company profile");
  });

  it("should always include the base SCOUT_SYSTEM_PROMPT content", () => {
    const result = buildSystemPrompt({
      totalCount: 0,
      scoredCount: 0,
      activeProfile: null,
    });

    expect(result).toContain(
      "You are Sammy, a government contracting intelligence assistant.",
    );
  });
});
