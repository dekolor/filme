import { NextResponse } from "next/server";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

export async function POST(req: Request) {
  const ctx = await createTRPCContext({ headers: req.headers });
  const caller = createCaller(ctx);
  try {
    const movies = await req.json();
    await caller.movie.create(movies);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
