"use client"

import React, { useEffect } from 'react'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

const NotificationModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = "info",
  autoClose = true,
  duration = 5000 
}) => {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isOpen, autoClose, duration, onClose])

  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />
      default:
        return <Info className="w-6 h-6 text-blue-500" />
    }
  }

  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          header: 'bg-green-100'
        }
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          header: 'bg-red-100'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          header: 'bg-yellow-100'
        }
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          header: 'bg-blue-100'
        }
    }
  }

  const colors = getColorClasses()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-xl max-w-md w-full mx-4 border-2 ${colors.border}`}>
        {/* Header */}
        <div className={`p-4 ${colors.header} rounded-t-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getIcon()}
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`p-6 ${colors.bg}`}>
          <p className="text-gray-700 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Footer with auto-close indicator */}
        {autoClose && (
          <div className={`px-6 py-3 ${colors.bg} rounded-b-lg`}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                This message will close automatically
              </p>
              <button
                onClick={onClose}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Close now
              </button>
            </div>
          </div>
        )}

        {/* Manual close footer for non-auto-close */}
        {!autoClose && (
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationModal