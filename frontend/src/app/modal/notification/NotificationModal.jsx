"use client";
import React, { useEffect } from 'react';
import { IoIosCloseCircleOutline } from "react-icons/io";
import { FiCheck, FiX, FiAlertTriangle, FiInfo } from "react-icons/fi";

const NotificationModal = ({ 
  isOpen, 
  onClose, 
  title = "Notification",
  message = "",
  type = "info", // success, error, warning, info
  autoClose = true,
  duration = 3000
}) => {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, duration, onClose]);

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

  const getBackgroundColor = () => {
    switch(type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-black"
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
          
          <div className={`p-4 rounded-lg border ${getBackgroundColor()} mb-4`}>
            <p className="text-gray-700 text-sm">
              {message}
            </p>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;