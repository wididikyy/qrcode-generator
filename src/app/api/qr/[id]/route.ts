import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ found: false, reason: "Supabase not configured" }, { status: 404 })
    }

    const { data, error } = await supabase
      .from("qr_images")
      .select("id, image_url, file_name, expires_at, created_at")
      .eq("id", params.id)
      .maybeSingle()

    if (error) {
      console.error("[v0] Supabase select error:", error.message)
      return NextResponse.json({ found: false, error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ found: false }, { status: 404 })
    }

    return NextResponse.json({
      found: true,
      data: {
        id: data.id,
        imageUrl: data.image_url,
        fileName: data.file_name,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
      },
    })
  } catch (e) {
    console.error("[v0] /api/qr/[id] GET error:", e)
    return NextResponse.json({ found: false }, { status: 500 })
  }
}
