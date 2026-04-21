import type { CriteriaScores } from "./schemas";

vi.mock("~/server/bedrock", () => ({
  chatModel: {},
}));

import { computeFitScore, deriveRecommendation, WEIGHTS } from "./scoring";

describe("computeFitScore", () => {
  it("returns 100 when all criteria are 100", () => {
    const scores: CriteriaScores = {
      naicsMatch: 100,
      departmentMatch: 100,
      keywordRelevance: 100,
      setAsideMatch: 100,
      contractValue: 100,
      deadlineFeasibility: 100,
    };
    expect(computeFitScore(scores)).toBe(100);
  });

  it("returns 0 when all criteria are 0", () => {
    const scores: CriteriaScores = {
      naicsMatch: 0,
      departmentMatch: 0,
      keywordRelevance: 0,
      setAsideMatch: 0,
      contractValue: 0,
      deadlineFeasibility: 0,
    };
    expect(computeFitScore(scores)).toBe(0);
  });

  it("computes correct weighted average for mixed scores", () => {
    const scores: CriteriaScores = {
      naicsMatch: 100,       // 100 * 0.25 = 25
      departmentMatch: 80,   // 80 * 0.20  = 16
      keywordRelevance: 60,  // 60 * 0.20  = 12
      setAsideMatch: 40,     // 40 * 0.15  = 6
      contractValue: 50,     // 50 * 0.10  = 5
      deadlineFeasibility: 90, // 90 * 0.10 = 9
    };
    // Sum = 25 + 16 + 12 + 6 + 5 + 9 = 73
    expect(computeFitScore(scores)).toBe(73);
  });

  it("rounds to nearest integer", () => {
    const scores: CriteriaScores = {
      naicsMatch: 33,        // 33 * 0.25 = 8.25
      departmentMatch: 33,   // 33 * 0.20 = 6.6
      keywordRelevance: 33,  // 33 * 0.20 = 6.6
      setAsideMatch: 33,     // 33 * 0.15 = 4.95
      contractValue: 33,     // 33 * 0.10 = 3.3
      deadlineFeasibility: 33, // 33 * 0.10 = 3.3
    };
    // Sum = 33.0 → rounds to 33
    expect(computeFitScore(scores)).toBe(33);
  });

  it("weights sum to 1.0", () => {
    const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0);
  });

  it("heavily weights NAICS match (25%)", () => {
    const highNaics: CriteriaScores = {
      naicsMatch: 100,
      departmentMatch: 0,
      keywordRelevance: 0,
      setAsideMatch: 0,
      contractValue: 0,
      deadlineFeasibility: 0,
    };
    const highDeadline: CriteriaScores = {
      naicsMatch: 0,
      departmentMatch: 0,
      keywordRelevance: 0,
      setAsideMatch: 0,
      contractValue: 0,
      deadlineFeasibility: 100,
    };
    // NAICS alone = 25, deadline alone = 10
    expect(computeFitScore(highNaics)).toBeGreaterThan(computeFitScore(highDeadline));
    expect(computeFitScore(highNaics)).toBe(25);
    expect(computeFitScore(highDeadline)).toBe(10);
  });
});

describe("deriveRecommendation", () => {
  it("returns 'pursue' when fitScore >= pursueThreshold", () => {
    expect(deriveRecommendation(70, 70, 40)).toBe("pursue");
    expect(deriveRecommendation(85, 70, 40)).toBe("pursue");
    expect(deriveRecommendation(100, 70, 40)).toBe("pursue");
  });

  it("returns 'watch' when fitScore >= watchThreshold but < pursueThreshold", () => {
    expect(deriveRecommendation(40, 70, 40)).toBe("watch");
    expect(deriveRecommendation(55, 70, 40)).toBe("watch");
    expect(deriveRecommendation(69, 70, 40)).toBe("watch");
  });

  it("returns 'skip' when fitScore < watchThreshold", () => {
    expect(deriveRecommendation(39, 70, 40)).toBe("skip");
    expect(deriveRecommendation(0, 70, 40)).toBe("skip");
    expect(deriveRecommendation(20, 70, 40)).toBe("skip");
  });

  it("works with custom thresholds", () => {
    expect(deriveRecommendation(80, 80, 50)).toBe("pursue");
    expect(deriveRecommendation(79, 80, 50)).toBe("watch");
    expect(deriveRecommendation(49, 80, 50)).toBe("skip");
  });
});
