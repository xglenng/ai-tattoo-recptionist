import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { message } = await req.json();
  const text = String(message ?? "").toLowerCase();

  let reply =
    "Thanks! Tell me the placement, approximate size, color vs. black and gray, and send any reference images. I’ll use that to determine the next booking step.";

  if (text.includes("price") || text.includes("cost")) {
    reply =
      "Vals's current rate is $200/hour with a $200 deposit. I can give a more specific estimate once I know the placement, size, style, and reference.";
  } else if (text.includes("book") || text.includes("appointment")) {
    reply =
      "Absolutely. Once I have the tattoo details, I can check available appointment times and reserve a slot.";
  }

  return NextResponse.json({ reply });
}
