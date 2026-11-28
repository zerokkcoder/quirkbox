import { NextRequest, NextResponse } from "next/server";
import { generateNameSuggestion } from "@/features/random-name/lib/generator";

export async function GET(request: NextRequest) {
  const result = await generateNameSuggestion({
    culture: request.nextUrl.searchParams.get("culture") ?? undefined,
    gender: request.nextUrl.searchParams.get("gender") ?? undefined,
    seed: request.nextUrl.searchParams.get("seed") ?? undefined,
  });

  return NextResponse.json({ result });
}
