"use client";
import React from 'react';
import { IoIosCloseCircleOutline } from "react-icons/io";
import { FiCheck, FiX, FiAlertTriangle, FiInfo } from "react-icons/fi";

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  type = "info", // success, error, warning, info
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false 
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch(type) {
      case 'success':
        return <FiCheck className="w-6 h-6 text-green-600" />;
      case 'error':
        return <FiX className="w-6 h-6 text-red-600" />;
      case 'warning':
        return <FiAlertTriangle className="w-6 h-6 text-orange-600" />;
      default:
        return <FiInfo className="w-6 h-6 text-blue-600" />;
    }
  };

  const getButtonColor = () => {
    switch(type) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'error':
        return 'bg-red-600 hover:bg-red-700';
      case 'warning':
        return 'bg-orange-600 hover:bg-orange-700';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-3 right-3 text-gray-400 hover:text-black disabled:opacity-50"
          aria-label="Close"
        >
          <IoIosCloseCircleOutline size={24} />
        </button>

        <div className="text-center">
          <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
            {getIcon()}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
          
          <p className="text-gray-600 mb-6">
            {message}
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              disabled={isLoading}
              className={`flex-1 px-4 py-2 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${getButtonColor()}`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Loading...
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;