"use client"

import React from 'react'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = "info", 
  onConfirm, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  isLoading = false 
}) => {
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
          button: 'bg-green-600 hover:bg-green-700'
        }
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          button: 'bg-red-600 hover:bg-red-700'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          button: 'bg-yellow-600 hover:bg-yellow-700'
        }
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          button: 'bg-blue-600 hover:bg-blue-700'
        }
    }
  }

  const colors = getColorClasses()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className={`p-4 border-b ${colors.border} ${colors.bg} rounded-t-lg`}>
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
        <div className="p-6">
          <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {cancelText}
            </button>
            {onConfirm && (
              <button
                onClick={() => {
                  onConfirm()
                  onClose()
                }}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium text-white ${colors.button} rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2`}
              >
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>{confirmText}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationModal