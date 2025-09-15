"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import axios from "axios"
import { toast, Toaster } from 'sonner';
import Image from "next/image"
import logo from '../../assets/logo.png'
import AuthNavbar from '../components/authNavbar/page'

export default function Component() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    zipCode: "",
    address: "",
    terms: false
  })
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = "Phone number must be exactly 10 digits"
    }
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = "Zip code is required"
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = "Invalid zip code"
    }
    if (!formData.address.trim()) newErrors.address = "Address is required"
    if (!formData.terms) newErrors.terms = "You must accept the terms and conditions"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }))
    }
  }

  function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/register`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address,
        zipCode: formData.zipCode
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        try {
          const otp = generateOTP();
          
          // Store OTP and email in localStorage for OTP verification
          localStorage.setItem('signupEmail', formData.email);
          localStorage.setItem('signupOTP', otp);

          // Send OTP to backend
          await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/otp`, {
            email: formData.email,
            otp: otp
          }, {
            withCredentials: true
          });

          // Send email with OTP
          await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/Email/sendEmail`, {
            to: formData.email,
            subject: "Best Wishes - Email Verification Code",
            html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
        <h2 style="color: #822be2;">Hello ${formData.firstName},</h2>

        <p>Thank you for registering with <strong>Best Wishes</strong>, your trusted E-Commerce platform.</p>

        <p>Your One-Time Password (OTP) for email verification is:</p>

        <div style="font-size: 24px; font-weight: bold; color: #ffffff; background-color: #822be2; padding: 10px 20px; width: fit-content; border-radius: 6px;">
          ${otp}
        </div>

        <p style="margin-top: 20px;">
          Please enter this code within <strong>1 minute</strong> to complete your registration.
        </p>

        <p>If you did not request this code, please ignore this email.</p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />

        <p style="font-size: 14px; color: #777;">
          Best regards,<br/>
          <strong>The Best Wishes Team</strong><br/>
          <a href="https://www.bestwishes.lk" style="color: #822be2; text-decoration: none;">www.bestwishes.lk</a>
        </p>
      </div>
    `
          });

          toast.success(`Hi ${formData.firstName}, OTP sent to your email`);

          setTimeout(() => {
            router.push('/otp');
          }, 2000); // wait 2 seconds before redirecting

        } catch (otpError) {
          console.error('OTP/Email error:', otpError);
          
          // Check if it's an email service error
          if (otpError.response && otpError.response.status === 500) {
            toast.error('Email service is currently unavailable. Please contact support or try again later.');
          } else {
            toast.error('Failed to send OTP. Please try again.');
          }
          // Don't clear the form data, let user retry
        }
      }
    } catch (error) {
      let message = 'Something went wrong';
      if (error.response && error.response.data) {
        message = error.response.data.message || message;
      }

      toast.error(message);

      // Inline error update (optional but nice UX)
      if (message.toLowerCase().includes('email')) {
        setErrors(prev => ({
          ...prev,
          email: message
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthNavbar />
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center p-4 sm:p-6 md:p-8 pt-20">
      <div className="w-full max-w-lg bg-[#ffffff] rounded-2xl p-6 sm:p-8 md:p-10 shadow-sm">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-[250px] relative">
              <Image
                src={logo}
                alt="Best Wishes Logo"
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-[#000000]">Create an account</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* First Name and Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label htmlFor="firstName" className="block text-sm font-medium text-[#000000]">
                First name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.firstName ? 'border-red-500' : 'border-[#818181]'} bg-[#ffffff] text-[#5c5c5c] focus:outline-none focus:ring-2 focus:ring-[#822be2] focus:border-transparent transition-colors`}
                placeholder="Enter your first name"
              />
              {errors.firstName && <p className="text-red-500 text-xs mt-1.5">{errors.firstName}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="lastName" className="block text-sm font-medium text-[#000000]">
                Last name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.lastName ? 'border-red-500' : 'border-[#818181]'} bg-[#ffffff] text-[#5c5c5c] focus:outline-none focus:ring-2 focus:ring-[#822be2] focus:border-transparent transition-colors`}
                placeholder="Enter your last name"
              />
              {errors.lastName && <p className="text-red-500 text-xs mt-1.5">{errors.lastName}</p>}
            </div>
          </div>

          {/* Mobile Number and Zip Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium text-[#000000]">
                Mobile Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.phone ? 'border-red-500' : 'border-[#818181]'} bg-[#ffffff] text-[#5c5c5c] focus:outline-none focus:ring-2 focus:ring-[#822be2] focus:border-transparent transition-colors`}
                placeholder="Enter your mobile number"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1.5">{errors.phone}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="zipCode" className="block text-sm font-medium text-[#000000]">
                Zip code
              </label>
              <input
                id="zipCode"
                name="zipCode"
                type="text"
                value={formData.zipCode}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.zipCode ? 'border-red-500' : 'border-[#818181]'} bg-[#ffffff] text-[#5c5c5c] focus:outline-none focus:ring-2 focus:ring-[#822be2] focus:border-transparent transition-colors`}
                placeholder="Enter your zip code"
              />
              {errors.zipCode && <p className="text-red-500 text-xs mt-1.5">{errors.zipCode}</p>}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label htmlFor="address" className="block text-sm font-medium text-[#000000]">
              Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              value={formData.address}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 rounded-lg border ${errors.address ? 'border-red-500' : 'border-[#818181]'} bg-[#ffffff] text-[#5c5c5c] focus:outline-none focus:ring-2 focus:ring-[#822be2] focus:border-transparent transition-colors`}
              placeholder="Enter your address"
            />
            {errors.address && <p className="text-red-500 text-xs mt-1.5">{errors.address}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-[#000000]">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 rounded-lg border ${errors.email ? 'border-red-500' : 'border-[#818181]'} bg-[#ffffff] text-[#5c5c5c] focus:outline-none focus:ring-2 focus:ring-[#822be2] focus:border-transparent transition-colors`}
              placeholder="Enter your email"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-[#000000]">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 pr-12 rounded-lg border ${errors.password ? 'border-red-500' : 'border-[#818181]'} bg-[#ffffff] text-[#5c5c5c] focus:outline-none focus:ring-2 focus:ring-[#822be2] focus:border-transparent transition-colors`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#818181] hover:text-[#5c5c5c] focus:outline-none transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password}</p>}
          </div>

          {/* Re-enter Password */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#000000]">
              Re-enter Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 pr-12 rounded-lg border ${errors.confirmPassword ? 'border-red-500' : 'border-[#818181]'} bg-[#ffffff] text-[#5c5c5c] focus:outline-none focus:ring-2 focus:ring-[#822be2] focus:border-transparent transition-colors`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#818181] hover:text-[#5c5c5c] focus:outline-none transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword}</p>}
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-3 pt-2">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              checked={formData.terms}
              onChange={handleChange}
              className={`mt-1 h-4 w-4 rounded border-[#818181] text-[#822be2] focus:ring-[#822be2] focus:ring-2 transition-colors ${errors.terms ? 'border-red-500' : ''}`}
            />
            <label htmlFor="terms" className="text-sm text-[#000000] leading-relaxed">
              I agree to our{" "}
              <Link href="#" className="text-[#274690] underline hover:no-underline transition-colors">
                Terms of use
              </Link>{" "}
              and{" "}
              <Link href="#" className="text-[#274690] underline hover:no-underline transition-colors">
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.terms && <p className="text-red-500 text-xs mt-1.5 ml-7">{errors.terms}</p>}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-[#822be2] hover:bg-[#822be2]/90 text-white rounded-lg py-3 mt-6 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#822be2] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#822be2]`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </span>
            ) : (
              'Create an account'
            )}
          </button>

          {/* Sign In Link */}
          <p className="text-center text-sm text-[#5c5c5c] mt-6">
            Already have an Account?{" "}
            <Link href="/login" className="text-[#274690] font-medium underline hover:no-underline transition-colors">
              Sign in
            </Link>
          </p>
        </form>
      </div>
      <Toaster position="top-center" richColors closeButton />
      </div>
    </>
  )
}