import { NextResponse } from "next/server";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

// Type for external API movie data (attributeIds comes as array)
interface ExternalMovie {
  id: string;
  name: string;
  length: number;
  posterLink: string;
  videoLink: string | null;
  link: string;
  weight: number;
  releaseYear: string | null;
  releaseDate: string;
  attributeIds: string[];
}

export async function POST(req: Request) {
  const ctx = await createTRPCContext({ headers: req.headers });
  const caller = createCaller(ctx);
  try {
    const movies = (await req.json()) as ExternalMovie[];
    await caller.movie.create(movies);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
