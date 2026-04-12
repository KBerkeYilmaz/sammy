import type { PrismaClient } from "@prisma/client";
import type { z } from "zod";
import { createOnboardingTools } from "./onboarding";

// AI SDK v6 wraps inputSchema in FlexibleSchema — cast back to Zod for assertions
function zodSchema(tool: { inputSchema: unknown }): z.ZodTypeAny {
  return tool.inputSchema as z.ZodTypeAny;
}

function createMockDb() {
  return {
    scoringProfile: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      create: vi.fn().mockResolvedValue({ id: "profile-1", name: "Test Co" }),
    },
    opportunity: {
      count: vi.fn().mockResolvedValue(0),
    },
  } as unknown as PrismaClient;
}

const executeOpts = {
  toolCallId: "test",
  messages: [],
  abortSignal: undefined as never,
};

const sampleInput = {
  companyName: "Acme Defense",
  targetNaics: ["541512", "541519"],
  targetDepartments: ["Department of Defense"],
  preferredSetAsides: ["SBA"],
  keywords: ["cybersecurity", "cloud", "FedRAMP"],
  minContractValue: 100000,
};

describe("createOnboardingTools", () => {
  let db: ReturnType<typeof createMockDb>;
  let tools: ReturnType<typeof createOnboardingTools>;
  const userId = "user-xyz-789";

  beforeEach(() => {
    vi.clearAllMocks();
    db = createMockDb();
    tools = createOnboardingTools(db, userId);
  });

  describe("setup_company_profile", () => {
    it("should deactivate existing profiles before creating new one", async () => {
      const mockUpdateMany = vi.mocked(
        (db as unknown as { scoringProfile: { updateMany: ReturnType<typeof vi.fn> } })
          .scoringProfile.updateMany,
      );

      await tools.setup_company_profile.execute!(sampleInput, executeOpts);

      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { userId: "user-xyz-789", isActive: true },
        data: { isActive: false },
      });
    });

    it("should call deactivate before create", async () => {
      const callOrder: string[] = [];
      const mockUpdateMany = vi.mocked(
        (db as unknown as { scoringProfile: { updateMany: ReturnType<typeof vi.fn> } })
          .scoringProfile.updateMany,
      );
      const mockCreate = vi.mocked(
        (db as unknown as { scoringProfile: { create: ReturnType<typeof vi.fn> } })
          .scoringProfile.create,
      );

      mockUpdateMany.mockImplementation(async () => {
        callOrder.push("updateMany");
        return { count: 1 };
      });
      mockCreate.mockImplementation(async () => {
        callOrder.push("create");
        return { id: "profile-1", name: "Test Co" };
      });

      await tools.setup_company_profile.execute!(sampleInput, executeOpts);

      expect(callOrder).toEqual(["updateMany", "create"]);
    });

    it("should create profile with all fields", async () => {
      const mockCreate = vi.mocked(
        (db as unknown as { scoringProfile: { create: ReturnType<typeof vi.fn> } })
          .scoringProfile.create,
      );

      await tools.setup_company_profile.execute!(sampleInput, executeOpts);

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          name: "Acme Defense",
          userId: "user-xyz-789",
          isActive: true,
          targetNaics: ["541512", "541519"],
          targetDepartments: ["Department of Defense"],
          preferredSetAsides: ["SBA"],
          keywords: ["cybersecurity", "cloud", "FedRAMP"],
          minContractValue: 100000,
        },
      });
    });

    it("should set minContractValue to null when not provided", async () => {
      const mockCreate = vi.mocked(
        (db as unknown as { scoringProfile: { create: ReturnType<typeof vi.fn> } })
          .scoringProfile.create,
      );

      const { minContractValue: _, ...inputWithoutMin } = sampleInput;
      await tools.setup_company_profile.execute!(inputWithoutMin, executeOpts);

      const callArgs = mockCreate.mock.calls[0]![0] as {
        data: { minContractValue: number | null };
      };
      expect(callArgs.data.minContractValue).toBeNull();
    });

    it("should return unscored count and hint when opportunities exist", async () => {
      const mockCount = vi.mocked(
        (db as unknown as { opportunity: { count: ReturnType<typeof vi.fn> } })
          .opportunity.count,
      );
      mockCount.mockResolvedValue(42);

      const result = await tools.setup_company_profile.execute!(
        sampleInput,
        executeOpts,
      );

      const data = result as { unscoredOpportunities: number; hint: string };
      expect(data.unscoredOpportunities).toBe(42);
      expect(data.hint).toContain("42 unscored");
      expect(data.hint).toContain("scoring pipeline");
    });

    it("should return 'already scored' hint when no unscored opportunities", async () => {
      const result = await tools.setup_company_profile.execute!(
        sampleInput,
        executeOpts,
      );

      const data = result as { unscoredOpportunities: number; hint: string };
      expect(data.unscoredOpportunities).toBe(0);
      expect(data.hint).toBe("All opportunities have already been scored.");
    });

    it("should return profileId and companyName from created profile", async () => {
      const result = await tools.setup_company_profile.execute!(
        sampleInput,
        executeOpts,
      );

      const data = result as { profileId: string; companyName: string; message: string };
      expect(data.profileId).toBe("profile-1");
      expect(data.companyName).toBe("Test Co");
      expect(data.message).toContain("Acme Defense");
    });

    it("should default targetDepartments and preferredSetAsides to empty arrays", () => {
      const parsed = zodSchema(tools.setup_company_profile).parse({
        companyName: "Test",
        targetNaics: ["541512"],
        keywords: ["cloud"],
      });
      const data = parsed as { targetDepartments: string[]; preferredSetAsides: string[] };
      expect(data.targetDepartments).toEqual([]);
      expect(data.preferredSetAsides).toEqual([]);
    });

    it("should require companyName, targetNaics, and keywords", () => {
      const missingName = zodSchema(tools.setup_company_profile).safeParse({
        targetNaics: ["541512"],
        keywords: ["cloud"],
      });
      expect(missingName.success).toBe(false);

      const missingNaics = zodSchema(tools.setup_company_profile).safeParse({
        companyName: "Test",
        keywords: ["cloud"],
      });
      expect(missingNaics.success).toBe(false);

      const missingKeywords = zodSchema(tools.setup_company_profile).safeParse({
        companyName: "Test",
        targetNaics: ["541512"],
      });
      expect(missingKeywords.success).toBe(false);

      const valid = zodSchema(tools.setup_company_profile).safeParse({
        companyName: "Test",
        targetNaics: ["541512"],
        keywords: ["cloud"],
      });
      expect(valid.success).toBe(true);
    });

    it("should allow optional minContractValue", () => {
      const without = zodSchema(tools.setup_company_profile).safeParse({
        companyName: "Test",
        targetNaics: ["541512"],
        keywords: ["cloud"],
      });
      expect(without.success).toBe(true);

      const withValue = zodSchema(tools.setup_company_profile).safeParse({
        companyName: "Test",
        targetNaics: ["541512"],
        keywords: ["cloud"],
        minContractValue: 50000,
      });
      expect(withValue.success).toBe(true);
    });
  });
});
