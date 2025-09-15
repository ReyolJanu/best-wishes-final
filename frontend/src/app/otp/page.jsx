"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Clock, RefreshCw } from 'lucide-react'
import logo from '../../assets/logo.png'
import axios from 'axios'
import AuthNavbar from '../components/authNavbar/page'

export default function OTPPage() {
  const router = useRouter()
  const [otp, setOtp] = useState(['', '', '', ''])
  const [timer, setTimer] = useState(60)
  const [isTimerRunning, setIsTimerRunning] = useState(true)
  const [isResendDisabled, setIsResendDisabled] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const inputRefs = useRef([])

  useEffect(() => {
    // Try to get email from localStorage (set during signup)
    const storedEmail = localStorage.getItem('signupEmail')
    if (storedEmail) setEmail(storedEmail)
  }, [])

  // Timer effect
  useEffect(() => {
    let interval = null
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            setIsTimerRunning(false)
            setIsResendDisabled(false)
            return 0
          }
          return prevTimer - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, timer])

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return // Prevent multiple characters
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError('')

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').slice(0, 4)
    if (/^\d{4}$/.test(pastedData)) {
      const newOtp = pastedData.split('')
      setOtp([...newOtp, ...Array(4 - newOtp.length).fill('')])
      setError('')
    }
  }

  // Format timer display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Handle resend OTP
  const handleResend = async () => {
    try {
      setIsResendDisabled(true)
      setTimer(60)
      setIsTimerRunning(true)
      setError('')
      
      // Here you would typically call your API to resend OTP
      // await axios.post('/api/resend-otp', { email: userEmail })
      
    } catch (error) {
      setError('Failed to resend OTP. Please try again.')
    }
  }

  // Handle OTP submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    const otpString = otp.join('')
    if (otpString.length !== 4) {
      setError('Please enter the complete 4-digit OTP')
      return
    }
    if (!/^[0-9]{4}$/.test(otpString)) {
      setError('Please enter a valid 4-digit OTP')
      return
    }
    if (!email) {
      setError('Email not found. Please sign up again.')
      return
    }
    try {
      setIsSubmitting(true)
      setError('')
      // Call backend to verify OTP
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/verify-otp`, {
        email,
        otp: otpString
      }, { withCredentials: true })
      if (response.data.success) {
        // Enable twoFactor for the user
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/twoFactor`, {
          email,
          twoFactorEnabled: true
        }, { withCredentials: true })
        // Redirect to login
        router.push('/login')
      } else {
        setError('Invalid OTP. Please try again.')
        // Disable twoFactor for the user
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/twoFactor`, {
          email,
          twoFactorEnabled: false
        }, { withCredentials: true })
      }
    } catch (error) {
      setError('Invalid OTP. Please try again.')
      // Disable twoFactor for the user
      try {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/twoFactor`, {
          email,
          twoFactorEnabled: false
        }, { withCredentials: true })
      } catch {}
    } finally {
      setIsSubmitting(false)
    }
  }

  const isSubmitDisabled = otp.join('').length !== 4 || isSubmitting || timer === 0

  return (
    <>
      <AuthNavbar />
    <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md bg-[#ffffff] rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-[200px] relative">
              <Image 
                src={logo} 
                alt="Best Wishes Logo" 
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-[#000000] mb-2">
            Verify Your Account
          </h2>
          <p className="text-sm text-[#5c5c5c]">
            We've sent a 4-digit verification code to your email
          </p>
        </div>

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#822be2] hover:text-[#822be2]/80 transition-colors mb-6"
          aria-label="Go back to previous page"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back to Signup</span>
        </button>

        {/* OTP Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP Input Fields */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-[#000000]">
              Enter Verification Code
            </label>
            <div className="flex gap-3 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={`
                    w-14 h-14 text-center text-lg font-semibold rounded-lg border-2 
                    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#822be2] focus:border-transparent
                    ${digit 
                      ? 'border-[#822be2] bg-[#822be2]/5 text-[#822be2]' 
                      : 'border-[#818181] bg-[#ffffff] text-[#5c5c5c] hover:border-[#822be2]/50'
                    }
                    ${error ? 'border-red-500 focus:ring-red-500' : ''}
                  `}
                  placeholder=""
                />
              ))}
            </div>
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
          </div>

          {/* Timer */}
          <div className="text-center">
            {isTimerRunning ? (
              <div className="flex items-center justify-center gap-2 text-[#5c5c5c]">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  Resend code in <span className="font-semibold text-[#822be2]">{formatTime(timer)}</span>
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-[#5c5c5c]">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Code expired</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`
              w-full bg-[#822be2] text-white rounded-lg py-3 font-medium transition-all 
              focus:outline-none focus:ring-2 focus:ring-[#822be2] focus:ring-offset-2
              ${isSubmitDisabled 
                ? 'opacity-50 cursor-not-allowed bg-gray-400' 
                : 'hover:bg-[#822be2]/90 active:bg-[#822be2]/80'
              }
            `}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : (
              'Verify Code'
            )}
          </button>

          {/* Resend Button */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={isResendDisabled}
              aria-label="Resend verification code"
              className={`
                flex items-center justify-center gap-2 mx-auto text-sm font-medium transition-colors
                ${isResendDisabled 
                  ? 'text-[#818181] cursor-not-allowed' 
                  : 'text-[#822be2] hover:text-[#822be2]/80 hover:underline'
                }
              `}
            >
              <RefreshCw className={`h-4 w-4 ${isResendDisabled ? '' : 'animate-spin'}`} />
              Resend Code
            </button>
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-[#5c5c5c]">
            Didn't receive the code? Check your spam folder or{' '}
            <button
              type="button"
              onClick={() => router.push('/contact')}
              className="text-[#822be2] hover:underline font-medium"
              aria-label="Contact support for help"
            >
              contact support
            </button>
          </p>
        </div>
      </div>
    </div>
    </>
  )
}