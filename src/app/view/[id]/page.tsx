"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImageIcon, Clock, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ImageData {
  imageUrl: string
  fileName: string
  expiresAt: string
  createdAt: string
  id: string
}

export default function ViewImage() {
  const params = useParams()
  const id = params.id as string
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        // Try server-side storage first
        const apiRes = await fetch(`/api/qr/${id}`, { cache: "no-store" })
        if (apiRes.ok) {
          const json = await apiRes.json()
          if (json?.found && json?.data) {
            if (!cancelled) {
              setImageData(json.data)
              const expiryDate = new Date(json.data.expiresAt)
              setIsExpired(expiryDate <= new Date())
              setLoading(false)
            }
            return
          }
        }
      } catch (e) {
        console.log("[v0] Supabase fetch skipped/fallback:", (e as Error)?.message)
      }

      // Fallback: localStorage
      const savedQRs = typeof window !== "undefined" ? localStorage.getItem("qrList") : null
      if (savedQRs) {
        try {
          const qrList = JSON.parse(savedQRs)
          const found = qrList.find((qr: ImageData) => qr.id === id)
          if (found) {
            if (!cancelled) {
              setImageData(found)
              const expiryDate = new Date(found.expiresAt)
              setIsExpired(expiryDate <= new Date())
            }
          } else {
            if (!cancelled) setError("Image not found or has been deleted")
          }
        } catch (e) {
          console.error("Failed to load image data:", e)
          if (!cancelled) setError("Failed to load image data")
        }
      } else {
        if (!cancelled) setError("No image data found")
      }
      if (!cancelled) setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading image...</p>
        </div>
      </div>
    )
  }

  if (error || !imageData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-6 h-6" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error || "Image not found"}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Clock className="w-6 h-6" />
              QR Code Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                This QR code expired on {new Date(imageData.expiresAt).toLocaleString("id-ID")}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="container mx-auto max-w-4xl py-8">
        <Card className="border-2 border-blue-100">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ImageIcon className="w-6 h-6 text-blue-600" />
              <CardTitle className="text-2xl">Shared Image</CardTitle>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="default" className="bg-green-600">
                Active
              </Badge>
              <span className="text-sm text-gray-600">
                Expires: {new Date(imageData.expiresAt).toLocaleString("id-ID")}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-inner">
              <img
                src={imageData.imageUrl || "/placeholder.svg"}
                alt={imageData.fileName}
                className="w-full h-auto max-h-[600px] object-contain mx-auto rounded-lg"
              />
            </div>
            <div className="text-center text-sm text-gray-600">
              <p className="font-semibold">{imageData.fileName}</p>
              <p>Uploaded: {new Date(imageData.createdAt).toLocaleString("id-ID")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
