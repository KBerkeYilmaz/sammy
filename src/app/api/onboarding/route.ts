import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "~/server/better-auth";
import { db } from "~/server/db";

const onboardingSchema = z.object({
  companyName: z.string().min(1),
  targetNaics: z.array(z.string()),
  targetDepartments: z.array(z.string()).default([]),
  preferredSetAsides: z.array(z.string()).default([]),
  keywords: z.array(z.string()),
});

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = onboardingSchema.parse(await req.json());

  // Deactivate existing profiles
  await db.scoringProfile.updateMany({
    where: { userId: session.user.id, isActive: true },
    data: { isActive: false },
  });

  // Create new active profile
  await db.scoringProfile.create({
    data: {
      name: body.companyName,
      userId: session.user.id,
      isActive: true,
      targetNaics: body.targetNaics,
      targetDepartments: body.targetDepartments,
      preferredSetAsides: body.preferredSetAsides,
      keywords: body.keywords,
    },
  });

  // Mark user as onboarded
  await db.user.update({
    where: { id: session.user.id },
    data: { isOnboarded: true },
  });

  return Response.json({ success: true });
}
