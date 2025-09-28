"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import axios from 'axios';
import logo from '../../assets/logo.png';
import { useRouter } from 'next/navigation';
import Loader from '../components/loader/page';
import Link from 'next/link';
import { toast, Toaster } from 'sonner';
import AuthNavbar from '../components/authNavbar/page';

function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/forgot-password`,
        { email },
        { 
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (res.data.success) {
        setIsEmailSent(true);
        toast.success('Verification code sent! Please check your email.');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error(error.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCodeHandler = async (e) => {
    e.preventDefault();
    
    if (!verificationCode) {
      toast.error('Please enter the verification code');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/verify-reset-code`,
        { email, code: verificationCode },
        { 
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (res.data.success) {
        setIsCodeVerified(true);
        toast.success('Verification code is valid! Now set your new password.');
      }
    } catch (error) {
      console.error('Verify code error:', error);
      toast.error(error.response?.data?.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPasswordHandler = async (e) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast.error('Please fill in both password fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/reset-password`,
        { 
          email, 
          code: verificationCode, 
          password, 
          confirmPassword 
        },
        { 
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (res.data.success) {
        toast.success('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isEmailSent && !isCodeVerified) {
    return (
      <>
        <AuthNavbar />
        <form onSubmit={verifyCodeHandler}>
          <div className='background min-h-screen flex justify-center items-center drop-shadow-lg'>
            <div className='bg-white w-[581px] rounded-[12px] pt-[50px] pb-[50px] flex flex-col items-center space-y-[15px]'>
              <div className='w-[200px] relative'>
                <Image src={logo} alt='Logo' />
              </div>

              <div className='text-center mb-4'>
                <div className='w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center'>
                  <svg className='w-8 h-8 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                </div>
                <h2 className='text-2xl font-semibold mb-2'>Enter Verification Code</h2>
                <p className='text-gray-600 text-sm'>
                  We've sent a 6-digit verification code to <strong>{email}</strong>.
                  Please enter the code below.
                </p>
              </div>

              <div className='w-full flex flex-col gap-4 pl-[45px] pr-[45px]'>
                <div className='flex flex-col'>
                  <label className='font-content mb-1'>Verification Code</label>
                  <input
                    className='pl-[20px] w-full border border-[#818181] focus:outline-none focus:border-[#822BE2] p-2 rounded-[5px] text-center text-2xl tracking-widest'
                    type='text'
                    placeholder='000000'
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    disabled={loading}
                  />
                  <p className='text-xs text-gray-500 mt-1 text-center'>Code expires in 5 minutes</p>
                </div>

                <button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className='w-full h-[50px] rounded-[8px] btn-color text-white font-medium disabled:opacity-50'
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>

                <div className='w-full flex justify-center items-center font-content text-sm'>
                  <span>
                    Didn't receive the code? 
                    <button 
                      type="button"
                      onClick={() => {
                        setIsEmailSent(false);
                        setVerificationCode('');
                      }}
                      className='underline text-blue-500 cursor-pointer ml-1'
                    >
                      Try again
                    </button>
                  </span>
                </div>

                <div className='w-full flex justify-center items-center font-content'>
                  <span>
                    Remember your password? 
                    <Link href='/login' className='underline text-blue-500 cursor-pointer ml-1'>
                      Back to Login
                    </Link>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>
        <Toaster position="top-center" richColors closeButton />
      </>
    );
  }

  if (isCodeVerified) {
    return (
      <>
        <AuthNavbar />
        <form onSubmit={resetPasswordHandler}>
          <div className='background min-h-screen flex justify-center items-center drop-shadow-lg'>
            <div className='bg-white w-[581px] rounded-[12px] pt-[50px] pb-[50px] flex flex-col items-center space-y-[15px]'>
              <div className='w-[200px] relative'>
                <Image src={logo} alt='Logo' />
              </div>

              <div className='text-center mb-4'>
                <h2 className='text-2xl font-semibold mb-2'>Set New Password</h2>
                <p className='text-gray-600 text-sm'>
                  Create a new password for your account.
                </p>
              </div>

              <div className='w-full flex flex-col gap-4 pl-[45px] pr-[45px]'>
                <div className='flex flex-col'>
                  <label className='font-content mb-1'>New Password</label>
                  <div className='relative'>
                    <input
                      className='pl-[20px] pr-[45px] w-full border border-[#818181] focus:outline-none focus:border-[#822BE2] p-2 rounded-[5px]'
                      type={showPassword ? 'text' : 'password'}
                      placeholder='Enter your new password'
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700'
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21' />
                        </svg>
                      ) : (
                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>Password must be at least 6 characters long</p>
                </div>

                <div className='flex flex-col'>
                  <label className='font-content mb-1'>Confirm New Password</label>
                  <div className='relative'>
                    <input
                      className='pl-[20px] pr-[45px] w-full border border-[#818181] focus:outline-none focus:border-[#822BE2] p-2 rounded-[5px]'
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder='Confirm your new password'
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700'
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21' />
                        </svg>
                      ) : (
                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Password match indicator */}
                {confirmPassword && (
                  <div className='text-xs'>
                    {password === confirmPassword ? (
                      <span className='text-green-600 flex items-center'>
                        <svg className='w-4 h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                        </svg>
                        Passwords match
                      </span>
                    ) : (
                      <span className='text-red-600 flex items-center'>
                        <svg className='w-4 h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                        </svg>
                        Passwords do not match
                      </span>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || password !== confirmPassword || password.length < 6}
                  className='w-full h-[50px] rounded-[8px] btn-color text-white font-medium disabled:opacity-50'
                >
                  {loading ? 'Resetting Password...' : 'Reset Password'}
                </button>

                <div className='w-full flex justify-center items-center font-content'>
                  <span>
                    Remember your password? 
                    <Link href='/login' className='underline text-blue-500 cursor-pointer ml-1'>
                      Back to Login
                    </Link>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>
        <Toaster position="top-center" richColors closeButton />
      </>
    );
  }

  return (
    <>
      {loading && <Loader />}
      <AuthNavbar />
      <form onSubmit={submitHandler}>
        <div className='background min-h-screen flex justify-center items-center drop-shadow-lg'>
          <div className='bg-white w-[581px] rounded-[12px] pt-[50px] pb-[50px] flex flex-col items-center space-y-[15px]'>
            <div className='w-[200px] relative'>
              <Image src={logo} alt='Logo' />
            </div>

            <div className='text-center mb-4'>
              <h2 className='text-2xl font-semibold mb-2'>Forgot Password?</h2>
              <p className='text-gray-600 text-sm'>
                Enter your email address and we'll send you a verification code to reset your password.
              </p>
            </div>

            <div className='w-full flex flex-col gap-4 pl-[45px] pr-[45px]'>
              <div className='flex flex-col'>
                <label className='font-content mb-1'>Email Address</label>
                <input
                  className='pl-[20px] w-full border border-[#818181] focus:outline-none focus:border-[#822BE2] p-2 rounded-[5px]'
                  type='email'
                  placeholder='Enter your email address'
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className='w-full h-[50px] rounded-[8px] btn-color text-white font-medium disabled:opacity-50'
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>

              <div className='w-full flex justify-center items-center font-content'>
                <span>
                  Remember your password? 
                  <Link href='/login' className='underline text-blue-500 cursor-pointer ml-1'>
                    Back to Login
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      </form>
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}

export default ForgotPasswordPage;