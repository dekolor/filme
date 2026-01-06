import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import type { Cinema } from "@prisma/client";
import { env } from "~/env";

export async function POST(req: Request) {
  // Verify authentication
  const authHeader = req.headers.get("authorization");
  const expectedAuth = `Bearer ${env.CRON_SECRET}`;

  const isValid =
    authHeader &&
    authHeader.length === expectedAuth.length &&
    timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedAuth));

  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ctx = await createTRPCContext({ headers: req.headers });
  const caller = createCaller(ctx);
  try {
    const cinemas = (await req.json()) as Cinema[];
    await caller.cinema.create(cinemas);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error creating cinemas:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create cinemas" },
      { status: 500 },
    );
  }
}
