'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Home } from 'lucide-react';
import { useSelector } from 'react-redux';


const WarningModal = ({ isOpen, onClose }) => {
  const [countdown, setCountdown] = useState(15);
  const router = useRouter();
  const { user } = useSelector(state => state.userState);
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, router]);

  const handleReturnHome = () => {
    router.push('/');
  };

  if (!isOpen) return null;

  return (
    <>
   
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          {/* Warning Icon */}
          <div className="bg-red-100 rounded-full p-4 mb-4">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
          
          {/* Warning Title */}
           <h2 className="text-2xl font-bold text-gray-900 mb-2">
             {!user ? 'Login Required' : 'Access Denied'}
           </h2>
          
          {/* Warning Message */}
           <p className="text-gray-600 mb-6 leading-relaxed">
             Dear <span className="font-bold text-red-500">{user?.firstName || 'User'}</span>,
             {!user ? 'You need to be logged in to access this page. ' : 'Your access has been denied! Only Admin users can access this page. '}
             You will be automatically redirected to the home page in{' '}
             <span className="font-bold text-red-600">{countdown}</span> seconds.
           </p>
          
          {/* Countdown Circle */}
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-red-200 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-red-600">{countdown}</span>
            </div>
            <div 
              className="absolute inset-0 border-4 border-red-600 rounded-full animate-pulse"
              style={{
                clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((countdown / 5) * 2 * Math.PI - Math.PI / 2)}% ${50 + 50 * Math.sin((countdown / 5) * 2 * Math.PI - Math.PI / 2)}%, 50% 50%)`
              }}
            />
          </div>
          
           {/* Action Buttons */}
           <div className="flex gap-3 w-full">
             <button
               onClick={handleReturnHome}
               className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
             >
               <Home className="h-4 w-4" />
               Return to Home
             </button>
             {/* {!user && (
               <button
                 onClick={() => router.push('/login')}
                 className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
               >
                 Login
               </button>
             )} */}
           </div>
          
          {/* Additional Note */}
          <p className="text-sm text-gray-500 mt-4">
            If you believe this is an error, please contact the administrator.
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default WarningModal;
