"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { Upload, Download, Clock, ImageIcon, QrCode, Calendar, Trash2, Timer } from "lucide-react"
import QRCode from "qrcode"

// Komponen UI dari shadcn/ui
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface QRData {
  imageData: string
  fileName: string
  expiresAt: string
  createdAt: string
  id: string
  qrCode: string
}

type DurationType = "1hour" | "24hours" | "7days" | "custom"

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    expired: boolean
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const expiry = new Date(expiresAt).getTime()
      const difference = expiry - now

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true })
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds, expired: false })
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  if (timeLeft.expired) {
    return (
      <div className="flex items-center justify-center gap-2 text-red-600 font-semibold">
        <Timer className="w-5 h-5" />
        <span>Expired</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <Timer className="w-5 h-5 text-blue-600" />
      <div className="flex gap-2 text-center">
        {timeLeft.days > 0 && (
          <div className="bg-blue-50 px-3 py-2 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{timeLeft.days}</div>
            <div className="text-xs text-gray-600">Days</div>
          </div>
        )}
        <div className="bg-blue-50 px-3 py-2 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{String(timeLeft.hours).padStart(2, "0")}</div>
          <div className="text-xs text-gray-600">Hours</div>
        </div>
        <div className="bg-blue-50 px-3 py-2 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{String(timeLeft.minutes).padStart(2, "0")}</div>
          <div className="text-xs text-gray-600">Minutes</div>
        </div>
        <div className="bg-blue-50 px-3 py-2 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{String(timeLeft.seconds).padStart(2, "0")}</div>
          <div className="text-xs text-gray-600">Seconds</div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("generate")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [durationType, setDurationType] = useState<DurationType>("1hour")
  const [customDate, setCustomDate] = useState("")
  const [customTime, setCustomTime] = useState("")
  const [generatedQR, setGeneratedQR] = useState<QRData | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [qrList, setQrList] = useState<QRData[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Load QR list dari storage saat component mount
  useEffect(() => {
    const savedQRs = localStorage.getItem("qrList")
    if (savedQRs) {
      try {
        setQrList(JSON.parse(savedQRs))
      } catch (e) {
        console.error("Failed to parse saved QR codes:", e)
        localStorage.removeItem("qrList")
      }
    }
  }, [])

  // Save QR list ke storage setiap kali berubah
  useEffect(() => {
    if (qrList.length > 0) {
      localStorage.setItem("qrList", JSON.stringify(qrList))
    }
  }, [qrList])

  const calculateExpirationDate = () => {
    const now = new Date()
    switch (durationType) {
      case "1hour":
        return new Date(now.getTime() + 60 * 60 * 1000)
      case "24hours":
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
      case "7days":
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      case "custom":
        if (customDate && customTime) {
          return new Date(`${customDate}T${customTime}`)
        }
        return null
      default:
        return new Date(now.getTime() + 60 * 60 * 1000)
    }
  }

  const handleImageChange = (file: File | null) => {
    if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
      setError("")
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setError("Please upload a valid JPG or PNG image")
      setSelectedImage(null)
      setImagePreview(null)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleImageChange(file)
  }

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0] || null
    handleImageChange(file)
  }, [])

  const generateQRCode = async () => {
    if (!selectedImage) {
      setError("Please select an image first")
      return
    }

    const expirationDate = calculateExpirationDate()
    if (!expirationDate) {
      setError("Please set a valid expiration date and time")
      return
    }

    if (expirationDate <= new Date()) {
      setError("Expiration date must be in the future")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Simulate encoding image data into QR
      const qrData = {
        imageData: imagePreview!,
        fileName: selectedImage.name,
        expiresAt: expirationDate.toISOString(),
        createdAt: new Date().toISOString(),
        id: Date.now().toString(),
      }

      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(
        JSON.stringify({
          id: qrData.id,
          type: "image",
          expires: qrData.expiresAt,
        }),
        {
          width: 400,
          margin: 2,
          color: {
            dark: "#1e40af",
            light: "#ffffff",
          },
        },
      )

      const newQR: QRData = {
        ...qrData,
        qrCode: qrCodeDataUrl,
      }

      setGeneratedQR(newQR)
      setQrDataUrl(qrCodeDataUrl)
      setQrList((prev) => [newQR, ...prev])

      // Switch to results view
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" })
      }, 100)
    } catch (err) {
      setError("Failed to generate QR code. Please try again.")
      console.error("QR generation error:", err)
    } finally {
      setLoading(false)
    }
  }

  const downloadQR = async (format: "png" | "svg", qrCode?: string) => {
    const dataUrl = qrCode || qrDataUrl

    if (format === "png") {
      const link = document.createElement("a")
      link.download = `qr-code-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } else if (format === "svg") {
      try {
        const svgString = await QRCode.toString(dataUrl, {
          type: "svg",
          width: 400,
          color: {
            dark: "#1e40af",
            light: "#ffffff",
          },
        })
        const blob = new Blob([svgString], { type: "image/svg+xml" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.download = `qr-code-${Date.now()}.svg`
        link.href = url
        link.click()
        URL.revokeObjectURL(url)
      } catch (err) {
        setError("Failed to download SVG")
        console.error("SVG download error:", err)
      }
    }
  }

  const resetForm = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setGeneratedQR(null)
    setQrDataUrl("")
    setError("")
    setDurationType("1hour")
    setCustomDate("")
    setCustomTime("")
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) <= new Date()
  }

  const deleteQR = (id: string) => {
    setQrList((prev) => prev.filter((qr) => qr.id !== id))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <QrCode className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Image to QR Generator</h1>
          </div>
          <p className="text-gray-600">Upload your image and generate a scannable QR code with expiration time</p>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Generate QR
            </TabsTrigger>
            <TabsTrigger value="myqr" className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              My QR Codes ({qrList.length})
            </TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-6">
            {!generatedQR ? (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Upload Section */}
                <Card className="border-2 border-blue-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-blue-600" />
                      Upload Image
                    </CardTitle>
                    <CardDescription>Upload JPG or PNG image</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {imagePreview ? (
                        <div className="space-y-4">
                          <img
                            src={imagePreview || "/placeholder.svg"}
                            alt="Preview"
                            className="max-h-48 mx-auto rounded-lg shadow-md"
                          />
                          <p className="text-sm text-gray-600">{selectedImage?.name}</p>
                          <Button onClick={resetForm} variant="outline" size="sm">
                            Change Image
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                          <p className="text-gray-600 mb-2">Drag & drop your image here</p>
                          <p className="text-sm text-gray-400 mb-4">or</p>
                          <Label htmlFor="file-upload">
                            <Button asChild variant="outline">
                              <span>Browse Files</span>
                            </Button>
                          </Label>
                          <Input
                            id="file-upload"
                            type="file"
                            accept="image/jpeg,image/png"
                            onChange={handleFileInput}
                            className="hidden"
                          />
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Settings Section */}
                <Card className="border-2 border-blue-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      Expiration Settings
                    </CardTitle>
                    <CardDescription>Set how long the QR code will be valid</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration</Label>
                      <Select value={durationType} onValueChange={(value) => setDurationType(value as DurationType)}>
                        <SelectTrigger id="duration">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1hour">1 Hour</SelectItem>
                          <SelectItem value="24hours">24 Hours</SelectItem>
                          <SelectItem value="7days">7 Days</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {durationType === "custom" && (
                      <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                        <div className="space-y-2">
                          <Label htmlFor="custom-date">Date</Label>
                          <Input
                            id="custom-date"
                            type="date"
                            value={customDate}
                            onChange={(e) => setCustomDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="custom-time">Time</Label>
                          <Input
                            id="custom-time"
                            type="time"
                            value={customTime}
                            onChange={(e) => setCustomTime(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={generateQRCode}
                      disabled={!selectedImage || loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg"
                    >
                      {loading ? (
                        "Generating..."
                      ) : (
                        <>
                          <QrCode className="w-5 h-5 mr-2" />
                          Generate QR Code
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* QR Result */
              <Card className="border-2 border-blue-100 max-w-2xl mx-auto">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-blue-600">QR Code Generated Successfully!</CardTitle>
                  <CardDescription>Your QR code is ready to download and use</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-white p-8 rounded-lg shadow-inner flex justify-center">
                    <img src={qrDataUrl || "/placeholder.svg"} alt="Generated QR Code" className="w-80 h-80" />
                  </div>

                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 text-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold">Valid until:</span>
                    </div>
                    <p className="text-xl text-gray-700">{formatDate(generatedQR.expiresAt)}</p>

                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600 mb-3">Time Remaining:</p>
                      <CountdownTimer expiresAt={generatedQR.expiresAt} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button onClick={() => downloadQR("png")} className="bg-blue-600 hover:bg-blue-700 text-white h-12">
                      <Download className="w-4 h-4 mr-2" />
                      Download PNG
                    </Button>
                    <Button
                      onClick={() => downloadQR("svg")}
                      variant="outline"
                      className="border-blue-600 text-blue-600 hover:bg-blue-50 h-12"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download SVG
                    </Button>
                  </div>

                  <Button onClick={resetForm} variant="outline" className="w-full bg-transparent">
                    Generate Another QR Code
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* My QR Codes Tab */}
          <TabsContent value="myqr">
            <Card className="border-2 border-blue-100">
              <CardHeader>
                <CardTitle>My QR Codes</CardTitle>
                <CardDescription>View and manage all your generated QR codes</CardDescription>
              </CardHeader>
              <CardContent>
                {qrList.length === 0 ? (
                  <div className="text-center py-12">
                    <QrCode className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No QR codes generated yet</p>
                    <Button onClick={() => setActiveTab("generate")} variant="link" className="text-blue-600">
                      Generate your first QR code
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {qrList.map((qr) => {
                      const expired = isExpired(qr.expiresAt)
                      return (
                        <Card key={qr.id} className={`${expired ? "opacity-60 border-red-200" : "border-blue-100"}`}>
                          <CardContent className="p-4 space-y-3">
                            <div className="relative">
                              <img
                                src={qr.qrCode || "/placeholder.svg"}
                                alt="QR Code"
                                className="w-full h-48 object-contain bg-white rounded"
                              />
                              {expired && (
                                <div className="absolute inset-0 bg-red-500 bg-opacity-20 rounded flex items-center justify-center">
                                  <Badge variant="destructive" className="text-lg px-4 py-2">
                                    Expired
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge variant={expired ? "destructive" : "default"}>
                                  {expired ? "Expired" : "Active"}
                                </Badge>
                                <Button
                                  onClick={() => deleteQR(qr.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <p className="text-sm text-gray-600">
                                <span className="font-semibold">Created:</span> {formatDate(qr.createdAt)}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-semibold">Expires:</span> {formatDate(qr.expiresAt)}
                              </p>

                              {!expired && (
                                <div className="pt-2 border-t">
                                  <p className="text-xs text-gray-500 mb-2">Time Remaining:</p>
                                  <CountdownTimer expiresAt={qr.expiresAt} />
                                </div>
                              )}

                              <p className="text-sm text-gray-500 truncate">{qr.fileName}</p>
                              {!expired && (
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                  <Button onClick={() => downloadQR("png", qr.qrCode)} size="sm" variant="outline">
                                    <Download className="w-3 h-3 mr-1" />
                                    PNG
                                  </Button>
                                  <Button onClick={() => downloadQR("svg", qr.qrCode)} size="sm" variant="outline">
                                    <Download className="w-3 h-3 mr-1" />
                                    SVG
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
