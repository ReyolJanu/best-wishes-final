"use client"

import { useState, useEffect } from "react"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { X, AlertTriangle, CheckCircle, Info, Trash2, Edit, Save } from "lucide-react"

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = "info", // "info", "success", "warning", "error", "confirm", "delete", "edit"
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  showCancel = true,
  children,
  iconColor   // <-- NEW PROP
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isVisible) return null

  const getIcon = () => {
    const colorClass = iconColor || {   // fallback to default if not provided
      success: "text-green-600",
      warning: "text-yellow-600",
      error: "text-red-600",
      delete: "text-red-600",
      edit: "text-blue-600",
      confirm: "text-blue-600",
      info: "text-purple-600",
    }[type]
  
    switch (type) {
      case "success":
        return <CheckCircle className={`w-8 h-8 ${colorClass}`} />
      case "warning":
        return <AlertTriangle className={`w-8 h-8 ${colorClass}`} />
      case "error":
        return <AlertTriangle className={`w-8 h-8 ${colorClass}`} />
      case "delete":
        return <Trash2 className={`w-8 h-8 ${colorClass}`} />
      case "edit":
        return <Edit className={`w-8 h-8 ${colorClass}`} />
      case "confirm":
        return <Info className={`w-8 h-8 ${colorClass}`} />
      default:
        return <Info className={`w-8 h-8 ${colorClass}`} />
    }
  }
  

  const getButtonVariant = () => {
    switch (type) {
      case "success":
        return "default"
      case "warning":
        return "secondary"
      case "error":
      case "delete":
        return "destructive"
      case "edit":
        return "default"
      case "confirm":
        return "default"
      default:
        return "default"
    }
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    onClose()
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${
      isOpen ? "opacity-100" : "opacity-0"
    }`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-md mx-4 transform transition-all duration-200 scale-100">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getIcon()}
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {message && (
            <p className="text-gray-600 leading-relaxed">{message}</p>
          )}
          
          {children}
          
          <div className="flex gap-3 pt-4">
            {showCancel && (
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
              >
                {cancelText}
              </Button>
            )}
            <Button
              variant={getButtonVariant()}
              onClick={handleConfirm}
              className="flex-1"
            >
              {confirmText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Convenience hooks for common modal types
export function useConfirmModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState({})

  const showConfirm = (title, message, onConfirm, options = {}) => {
    setConfig({
      title,
      message,
      onConfirm,
      type: "confirm",
      ...options
    })
    setIsOpen(true)
  }

  const showDelete = (title, message, onConfirm, options = {}) => {
    setConfig({
      title,
      message,
      onConfirm,
      type: "delete",
      confirmText: "Delete",
      ...options
    })
    setIsOpen(true)
  }

  const showEdit = (title, message, onConfirm, options = {}) => {
    setConfig({
      title,
      message,
      onConfirm,
      type: "edit",
      confirmText: "Save",
      ...options
    })
    setIsOpen(true)
  }

  const showSuccess = (title, message, onConfirm, options = {}) => {
    setConfig({
      title,
      message,
      onConfirm,
      type: "success",
      confirmText: "OK",
      showCancel: false,
      ...options
    })
    setIsOpen(true)
  }

  const showError = (title, message, onConfirm, options = {}) => {
    setConfig({
      title,
      message,
      onConfirm,
      type: "error",
      confirmText: "OK",
      showCancel: false,
      ...options
    })
    setIsOpen(true)
  }

  const closeModal = () => setIsOpen(false)

  return {
    isOpen,
    config,
    showConfirm,
    showDelete,
    showEdit,
    showSuccess,
    showError,
    closeModal
  }
} 