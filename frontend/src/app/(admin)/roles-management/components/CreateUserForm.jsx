"use client"

import React, { useState } from "react"
import { toast } from "react-hot-toast"
import { Eye, EyeOff, User, Mail, Phone, MapPin, Shield, Lock, Upload, X } from "lucide-react"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Label } from "../../../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select"
import { Switch } from "../../../../components/ui/switch"
import { Textarea } from "../../../../components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "../../../../components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card"

/**
 * CreateUserForm Component
 * Secure form for admin-only user creation with validation
 * 
 * Props:
 * - onSuccess: Function called after successful user creation
 * - onCancel: Function called when form is cancelled
 */
export default function CreateUserForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    phone: "",
    address: "",
    profileImage: "",
    twoFactorEnabled: false,
    isBlocked: false
  })

  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailChecking, setEmailChecking] = useState(false)
  const [profileImageFile, setProfileImageFile] = useState(null)

  // Form validation
  const validateForm = async () => {
    const newErrors = {}

    // Required fields
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    if (!formData.password) newErrors.password = "Password is required"
    if (!formData.role) newErrors.role = "Role is required"

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Password validation
    if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters long"
      } else {
        const hasNumber = /\d/.test(formData.password)
        const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
        
        if (!hasNumber) {
          newErrors.password = "Password must contain at least one number"
        } else if (!hasSymbol) {
          newErrors.password = "Password must contain at least one symbol"
        }
      }
    }

    // Confirm password validation
    if (formData.password && formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    // Email uniqueness check
    if (formData.email && !newErrors.email) {
      try {
        setEmailChecking(true)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/check-email/${encodeURIComponent(formData.email)}`, {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          if (!data.available) {
            newErrors.email = "This email is already in use"
          }
        }
      } catch (error) {
        console.error('Error checking email uniqueness:', error)
        // Don't block form submission on API error
      } finally {
        setEmailChecking(false)
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  // Handle profile image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size must be less than 5MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImageFile(file)
        setFormData(prev => ({
          ...prev,
          profileImage: e.target.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove profile image
  const removeImage = () => {
    setProfileImageFile(null)
    setFormData(prev => ({
      ...prev,
      profileImage: ""
    }))
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const isValid = await validateForm()
    if (!isValid) {
      toast.error('Please fix the errors in the form')
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare form data for submission
      const submitData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        role: formData.role,
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        profileImage: formData.profileImage,
        twoFactorEnabled: formData.twoFactorEnabled,
        isBlocked: formData.isBlocked
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(submitData)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('User created successfully!')
        onSuccess && onSuccess(data.user)
      } else {
        toast.error(data.message || 'Failed to create user')
      }

    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Create New User
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Image Upload */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={formData.profileImage} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex gap-2">
              <Label htmlFor="profile-upload" className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" className="flex items-center gap-2" asChild>
                  <span>
                    <Upload className="h-4 w-4" />
                    Upload Image
                  </span>
                </Button>
              </Label>
              <Input
                id="profile-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {formData.profileImage && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeImage}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={errors.firstName ? 'border-red-500' : ''}
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={errors.lastName ? 'border-red-500' : ''}
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Email and Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="Enter email address"
                />
                {emailChecking && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="inventoryManager">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Inventory Manager
                    </div>
                  </SelectItem>
                  <SelectItem value="deliveryStaff">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Delivery Staff
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-red-500 text-sm mt-1">{errors.role}</p>
              )}
            </div>
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="Enter password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Must be 8+ characters with number and symbol
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="Confirm password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="pl-10"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="pl-10 min-h-[40px] max-h-[80px]"
                  placeholder="Enter address"
                />
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium">Account Settings</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-xs text-gray-500">Enable 2FA for enhanced security</p>
              </div>
              <Switch
                checked={formData.twoFactorEnabled}
                onCheckedChange={(checked) => handleInputChange('twoFactorEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Block User</Label>
                <p className="text-xs text-gray-500">Prevent user from logging in</p>
              </div>
              <Switch
                checked={formData.isBlocked}
                onCheckedChange={(checked) => handleInputChange('isBlocked', checked)}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || emailChecking}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Creating User...
                </div>
              ) : (
                'Create User'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}