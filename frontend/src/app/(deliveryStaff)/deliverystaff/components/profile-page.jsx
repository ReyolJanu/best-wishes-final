"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Save, X, Upload, User, Mail, Phone, MapPin } from "lucide-react"
import Image from "next/image"

export default function ProfilePage({ onClose, userProfile }) {
  const [localProfile, setLocalProfile] = useState({
    firstName: userProfile?.firstName || "John",
    lastName: userProfile?.lastName || "Doe",
    name: userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : "John Doe",
    email: userProfile?.email || "john.doe@delivery.com",
    id: userProfile?._id || "12345",
    phone: userProfile?.phone || "+44 7123 456789",
    address: userProfile?.address || "123 Main Street, London, UK",
    profileImage: userProfile?.profileImage || "/images/profile-avatar.png",
  })

  const [isEditing, setIsEditing] = useState(false)
  const [tempProfile, setTempProfile] = useState(localProfile)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)

  // Update local profile when userProfile prop changes
  useEffect(() => {
    if (userProfile) {
      const updatedProfile = {
        firstName: userProfile.firstName || "John",
        lastName: userProfile.lastName || "Doe",
        name: `${userProfile.firstName || "John"} ${userProfile.lastName || "Doe"}`,
        email: userProfile.email || "john.doe@delivery.com",
        id: userProfile._id || "12345",
        phone: userProfile.phone || "+44 7123 456789",
        address: userProfile.address || "123 Main Street, London, UK",
        profileImage: userProfile.profileImage || "/images/profile-avatar.png",
      }
      setLocalProfile(updatedProfile)
      setTempProfile(updatedProfile)
    }
  }, [userProfile])

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        setImagePreview(result)
        setTempProfile((prev) => ({ ...prev, profileImage: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    setLocalProfile(tempProfile)
    setIsEditing(false)
    setImagePreview(null)
    alert("Profile updated successfully!")
  }

  const handleCancel = () => {
    setTempProfile(localProfile)
    setIsEditing(false)
    setImagePreview(null)
  }

  const handleInputChange = (field, value) => {
    setTempProfile((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Profile Content */}
        <div className="p-6 space-y-6">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-200">
                <Image
                  src={imagePreview || tempProfile.profileImage}
                  alt="Profile"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
              {isEditing && (
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full bg-white border-2 border-purple-200"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              )}
            </div>

            {isEditing && (
              <div className="flex flex-col items-center space-y-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Change Profile Picture</span>
                </Button>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Personal Information
                {!isEditing && (
                  <Button variant="default" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1">
                    <User className="w-4 h-4" />
                    <span>Full Name</span>
                  </label>
                  {isEditing ? (
                    <Input
                      value={tempProfile.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="w-full border focus-visible:ring-0 focus-visible:border-[#822BE2] focus:outline-none"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 p-2 rounded">{userProfile.name}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1">
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={tempProfile.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="w-full border focus-visible:ring-0 focus-visible:border-[#822BE2] focus:outline-none"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 p-2 rounded">{userProfile.email}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1">
                    <Phone className="w-4 h-4" />
                    <span>Phone</span>
                  </label>
                  {isEditing ? (
                    <Input
                      value={tempProfile.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="w-full border focus-visible:ring-0 focus-visible:border-[#822BE2] focus:outline-none"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 p-2 rounded">{userProfile.phone}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span>Address</span>
                  </label>
                  {isEditing ? (
                    <Input
                      value={tempProfile.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      className="w-full border focus-visible:ring-0 focus-visible:border-[#822BE2] focus:outline-none"
                    />
                  ) : (
                    <p className="text-gray-900 bg-gray-50 p-2 rounded">{userProfile.address}</p>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={handleSave}
                    variant="default"
                    className="flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
