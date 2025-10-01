import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Upload to Cloudinary
    const cloudinaryFormData = new FormData()
    cloudinaryFormData.append("file", file)
    cloudinaryFormData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "qr_images")

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

    if (!cloudName) {
      return NextResponse.json(
        { error: "Cloudinary not configured. Please add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to environment variables." },
        { status: 500 },
      )
    }

    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: cloudinaryFormData,
    })

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json()
      console.error("Cloudinary upload error:", errorData)
      return NextResponse.json({ error: "Failed to upload image to Cloudinary" }, { status: 500 })
    }

    const data = await uploadResponse.json()

    return NextResponse.json({
      success: true,
      imageUrl: data.secure_url,
      publicId: data.public_id,
      fileName: file.name,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}
