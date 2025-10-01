import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const { id, imageUrl, fileName, expiresAt, createdAt } = payload || {}

    if (!id || !imageUrl || !fileName || !expiresAt || !createdAt) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const supabase = await createClient()
    if (!supabase) {
      // Graceful no-op if Supabase not configured
      return NextResponse.json({
        saved: false,
        reason: "Supabase not configured",
      })
    }

    const { error } = await supabase.from("qr_images").upsert(
      [
        {
          id,
          image_url: imageUrl,
          file_name: fileName,
          expires_at: expiresAt,
          created_at: createdAt,
        },
      ],
      { onConflict: "id" },
    )

    if (error) {
      console.error("[v0] Supabase upsert error:", error.message)
      return NextResponse.json({ saved: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ saved: true })
  } catch (e) {
    console.error("[v0] /api/qr POST error:", e)
    return NextResponse.json({ error: "Failed to upsert" }, { status: 500 })
  }
}
