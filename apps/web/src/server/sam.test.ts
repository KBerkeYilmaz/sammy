import { parseSamJson, type SamOpportunity } from "~/server/sam";

describe("parseSamJson", () => {
  const validInput: SamOpportunity = {
    noticeId: "abc123",
    title: "Cybersecurity Assessment Services",
    solicitationNumber: "W911NF-24-R-0001",
    department: "DEPT OF DEFENSE",
    fullParentPathName: "DEPT OF DEFENSE.ARMY",
    subTier: "Army",
    office: "ACC-Aberdeen",
    postedDate: "2024-01-15",
    type: "Solicitation",
    baseType: "Solicitation",
    responseDeadLine: "2024-02-15",
    naicsCode: "541512",
    classificationCode: "D",
    active: "Yes",
    state: "active",
    typeOfSetAside: "SBA",
    pointOfContact: [{ email: "john@army.mil", fullName: "John Doe" }],
    award: { amount: "500000", awardee: { name: "Acme Corp" } },
  };

  it("should return a typed SamOpportunity from valid input", () => {
    const result = parseSamJson(validInput);
    expect(result).toBeDefined();
    expect(result.noticeId).toBe("abc123");
  });

  it("should preserve all fields from the raw JSON", () => {
    const result = parseSamJson(validInput);

    expect(result.noticeId).toBe("abc123");
    expect(result.title).toBe("Cybersecurity Assessment Services");
    expect(result.solicitationNumber).toBe("W911NF-24-R-0001");
    expect(result.department).toBe("DEPT OF DEFENSE");
    expect(result.fullParentPathName).toBe("DEPT OF DEFENSE.ARMY");
    expect(result.subTier).toBe("Army");
    expect(result.office).toBe("ACC-Aberdeen");
    expect(result.postedDate).toBe("2024-01-15");
    expect(result.type).toBe("Solicitation");
    expect(result.baseType).toBe("Solicitation");
    expect(result.responseDeadLine).toBe("2024-02-15");
    expect(result.naicsCode).toBe("541512");
    expect(result.classificationCode).toBe("D");
    expect(result.active).toBe("Yes");
    expect(result.state).toBe("active");
    expect(result.typeOfSetAside).toBe("SBA");
    expect(result.pointOfContact).toEqual([
      { email: "john@army.mil", fullName: "John Doe" },
    ]);
    expect(result.award).toEqual({
      amount: "500000",
      awardee: { name: "Acme Corp" },
    });
  });

  it("should handle undefined optional fields", () => {
    const minimal = {
      noticeId: "min-001",
      title: "Minimal Opportunity",
      postedDate: "2024-03-01",
      type: "Presolicitation",
      active: "Yes",
    };

    const result = parseSamJson(minimal);

    expect(result.noticeId).toBe("min-001");
    expect(result.title).toBe("Minimal Opportunity");
    expect(result.solicitationNumber).toBeUndefined();
    expect(result.department).toBeUndefined();
    expect(result.naicsCode).toBeUndefined();
    expect(result.typeOfSetAside).toBeUndefined();
    expect(result.pointOfContact).toBeUndefined();
    expect(result.award).toBeUndefined();
  });
});
