import { embedMany } from "ai";
import { db } from "~/server/db";
import { embeddingModel } from "~/server/bedrock";
import { type SamOpportunity } from "~/server/sam";

/**
 * Build the text we embed for each opportunity.
 * description is a URL in SAM.gov, so we use structured fields instead.
 */
function buildChunkText(opp: SamOpportunity): string {
  const parts = [
    opp.title,
    opp.department,
    opp.subTier,
    opp.type,
    opp.baseType,
    opp.naicsCode && `NAICS: ${opp.naicsCode}`,
    opp.solicitationNumber && `Solicitation: ${opp.solicitationNumber}`,
    opp.state && `State: ${opp.state}`,
    opp.responseDeadLine && `Deadline: ${opp.responseDeadLine}`,
  ].filter(Boolean);

  return parts.join(" | ");
}

export interface IngestResult {
  upserted: number;
  embedded: number;
  skipped: number;
}

export async function ingestOpportunities(
  opportunities: SamOpportunity[],
): Promise<IngestResult> {
  let upserted = 0;
  let embedded = 0;
  let skipped = 0;

  for (const opp of opportunities) {
    // Derive department — SAM.gov sometimes omits it, falling back to fullParentPathName
    const department =
      opp.department ??
      opp.fullParentPathName?.split(".")[0] ??
      "Unknown";

    // Upsert opportunity record
    const record = await db.opportunity.upsert({
      where: { noticeId: opp.noticeId },
      create: {
        noticeId: opp.noticeId,
        title: opp.title,
        solicitationNumber: opp.solicitationNumber,
        department,
        subTier: opp.subTier,
        office: opp.office,
        type: opp.type,
        baseType: opp.baseType,
        postedDate: new Date(opp.postedDate),
        responseDeadline: opp.responseDeadLine
          ? new Date(opp.responseDeadLine)
          : null,
        naicsCode: opp.naicsCode,
        classificationCode: opp.classificationCode,
        active: opp.active === "Yes",
        state: opp.state,
        contactName: opp.pointOfContact?.[0]?.fullName,
        contactEmail: opp.pointOfContact?.[0]?.email,
        awardAmount: opp.award?.amount
          ? parseFloat(opp.award.amount)
          : null,
        awardeeName: opp.award?.awardee?.name,
        rawJson: opp as object,
      },
      update: {
        title: opp.title,
        active: opp.active === "Yes",
        responseDeadline: opp.responseDeadLine
          ? new Date(opp.responseDeadLine)
          : null,
        rawJson: opp as object,
      },
    });
    upserted++;

    // Skip embedding if chunks already exist
    const existingChunks = await db.opportunityChunk.count({
      where: { opportunityId: record.id },
    });
    if (existingChunks > 0) {
      skipped++;
      continue;
    }

    // Build chunk text and embed
    const chunkText = buildChunkText(opp);
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: [chunkText],
      providerOptions: {
        bedrock: { dimensions: 1024, normalize: true },
      },
    });

    // Create chunk record
    const chunk = await db.opportunityChunk.create({
      data: {
        opportunityId: record.id,
        content: chunkText,
        metadata: {
          noticeId: opp.noticeId,
          department: opp.department,
          type: opp.type,
          naicsCode: opp.naicsCode,
        },
      },
    });

    // Store embedding via raw SQL (column not in Prisma schema)
    const vector = `[${embeddings[0]!.join(",")}]`;
    await db.$executeRaw`
      UPDATE "OpportunityChunk"
      SET embedding = ${vector}::vector
      WHERE id = ${chunk.id}
    `;

    embedded++;
  }

  return { upserted, embedded, skipped };
}
