"use client";
import React from 'react'
import Navbar from '../../components/navBar/page'
import Image from 'next/image';
import { RiDeleteBin6Line } from "react-icons/ri";
import { AiOutlineEdit } from "react-icons/ai";
import { FaCcVisa, FaCcPaypal } from "react-icons/fa";
import { SiMastercard } from "react-icons/si";
import { FiShoppingCart } from "react-icons/fi";
import Footer from '../../components/footer/page'
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { removeFromCart, increaseQuantity, decreaseQuantity } from '../../slices/cartSlice';
import { AiFillStar, AiOutlineStar, AiTwotoneStar } from 'react-icons/ai';
import { toast, Toaster } from 'sonner';

export default function CheckoutPage() {
    const cart = useSelector((state) => state.cartState.items);
    const {user} = useSelector((state) => state.userState);
    const dispatch = useDispatch();
    const router = useRouter();

    const handleRemove = (id) => {
        dispatch(removeFromCart(id));
        toast.success('Removed from cart');
    };

    const handleIncrease = (id) => {
        dispatch(increaseQuantity(id));
    };

    const handleDecrease = (id) => {
        dispatch(decreaseQuantity(id));
    };

    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    // Helper function to get product image
    const getProductImage = (product) => {
      if (product?.images && product.images.length > 0) {
        if (typeof product.images[0] === 'object' && product.images[0].url) {
          return product.images[0].url;
        }
        return product.images[0];
      }
      return '/placeholder.svg';
    };

    const handleCheckout = () => {
        if (!user) {
            toast.error('Please login to continue');
            return;
        }
        router.push('/payment/cart');
    };

    return (
        <>
            <div className='px-4 md:px-8 lg:px-16 xl:px-20 max-w-7xl mx-auto'>
                <Navbar />
                <div className='text-2xl md:text-3xl font-semibold mt-4 mb-6'>Cart ({cart.length})</div>

                <div className='flex flex-col lg:flex-row w-full mt-6 gap-6 min-h-[50vh]'>
                    {cart.length === 0 ? (
                        <div className="flex flex-1 min-h-[60vh] items-center justify-center">
                            <div className="flex flex-col items-center justify-center py-20">
                                <FiShoppingCart className="text-[80px] text-gray-300 mb-4" />
                                <div className="text-2xl font-semibold text-gray-600 mb-2">Your cart is empty!</div>
                                <div className="text-md text-gray-400 mb-6">Looks like you haven't added anything yet.</div>
                                <a href="/allProducts">
                                    <button className="px-6 py-3 rounded-full bg-[#822BE2] text-white font-bold text-lg shadow-md hover:bg-purple-200 hover:text-[#822BE2] hover:border-2 hover:border-[#822BE2] transition-all duration-200">Go to Shopping</button>
                                </a>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className='flex-col w-full lg:w-2/3 items-center space-y-6'>
                                {cart.map((item) => (
                                    <div key={item.productId} className='w-full flex flex-col sm:flex-row justify-center bg-white p-4 rounded-lg shadow-sm border border-gray-100'>
                                        <div className="relative w-full sm:w-32 h-32 mb-4 sm:mb-0 sm:mr-4">
                                            <Image
                                                src={getProductImage(item.product)}
                                                alt={item.product.name}
                                                fill
                                                className="rounded-lg object-cover"
                                                onError={(e) => {
                                                  e.target.src = '/placeholder.svg';
                                                }}
                                            />
                                        </div>
                                        <div className='flex-1 flex flex-col sm:flex-row gap-4'>
                                            <div className='flex-1'>
                                                <p className='text-lg font-medium mb-2'>{item.product.name}</p>
                                                <p className='text-xl font-semibold text-[#822BE2] mb-2'>US ${item.product.price}</p>
                                                <div className="flex text-yellow-400 text-sm">
                                                    {Array.from({ length: 5 }, (_, i) => {
                                                        const fullStars = Math.floor(item.product.rating || 0);
                                                        const hasHalfStar = (item.product.rating || 0) - fullStars >= 0.5;
                                                        if (i < fullStars) {
                                                            return <AiFillStar key={i} />;
                                                        } else if (i === fullStars && hasHalfStar) {
                                                            return <AiTwotoneStar key={i} />;
                                                        } else {
                                                            return <AiOutlineStar key={i} />;
                                                        }
                                                    })}
                                                </div>
                                            </div>
                                            <div className='flex flex-col sm:w-64 space-y-4'>
                                                <div className='flex flex-col sm:flex-row sm:items-center gap-2'>
                                                    <span className='text-sm font-medium'>Quantity:</span>
                                                    <div className='flex items-center space-x-2'>
                                                        <button
                                                            className='w-8 h-8 flex justify-center items-center rounded bg-gray-300 text-gray-700 text-xl font-bold hover:bg-purple-200 hover:text-[#822BE2] hover:border-2 hover:border-[#822BE2] transition-all'
                                                            onClick={() => handleDecrease(item.productId)}
                                                        >
                                                            -
                                                        </button>
                                                        <span className='bg-white border-2 border-gray-200 w-12 h-8 rounded flex justify-center items-center font-medium'>{item.quantity}</span>
                                                        <button
                                                            className='w-8 h-8 flex justify-center items-center rounded bg-gray-300 text-gray-700 text-xl font-bold hover:bg-purple-200 hover:text-[#822BE2] hover:border-2 hover:border-[#822BE2] transition-all'
                                                            onClick={() => handleIncrease(item.productId)}
                                                        >
                                                            +
                                                        </button>
                                                        <button 
                                                            className='border-2 border-red-500 rounded-full p-2 ml-2 hover:bg-red-50 transition-all' 
                                                            onClick={() => handleRemove(item.productId)}
                                                        >
                                                            <RiDeleteBin6Line className='text-red-500 text-lg' />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className='flex justify-between items-center pt-2 border-t border-gray-200'>
                                                    <span className='text-sm font-medium'>Total:</span> 
                                                    <span className='text-lg font-semibold text-[#822BE2]'>US ${(item.product.price * item.quantity).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {cart.length > 0 && (
                                <div className="flex flex-col w-full lg:w-1/3 space-y-6">
                                    <div className='w-full p-4 sm:p-6 border-2 border-gray-200 rounded-lg'>
                                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Check Out</h2>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm sm:text-base text-gray-600">Shipping Fees</p>
                                                <p className="text-sm sm:text-base font-semibold text-gray-800">US $10</p>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm sm:text-base text-gray-600">Subtotal</p>
                                                <p className="text-sm sm:text-base font-semibold text-gray-800">US ${total.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <div className='mt-6'>
                                            <button onClick={handleCheckout} className="h-12 w-full rounded-lg bg-[#822BE2] hover:bg-purple-200 hover:border-2 hover:border-[#822BE2] hover:text-[#822BE2] hover:cursor-pointer text-white font-bold text-lg transition-all duration-200">
                                                Checkout US ${total.toFixed(2)}
                                            </button>
                                        </div>
                                    </div>

                                    <div className='w-full p-4 sm:p-6 border-2 border-gray-200 rounded-lg'>
                                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Payer Information</h2>
                                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6'>
                                            <div>
                                                <p className='text-sm font-medium text-gray-600 mb-1'>First Name</p>
                                                <p className='text-base font-semibold text-[#822BE2]'>{user.firstName}</p>
                                            </div>
                                            <div>
                                                <p className='text-sm font-medium text-gray-600 mb-1'>Last Name</p>
                                                <p className='text-base font-semibold text-[#822BE2]'>{user.lastName}</p>
                                            </div>
                                        </div>
                                        
                                        <div className='mb-6'>
                                            <p className='text-sm font-medium text-gray-600 mb-2'>Shipping Address</p>
                                            <div className='flex items-center border border-gray-300 rounded-lg p-3'>
                                                <input
                                                    type='text'
                                                    placeholder='shipping address'
                                                    defaultValue={user.address}
                                                    className='bg-transparent outline-none flex-1 text-sm'
                                                />
                                                <button className='ml-2'>
                                                    <AiOutlineEdit className='text-xl text-gray-600 hover:text-[#822BE2]' />
                                                </button>
                                            </div>
                                        </div>

                                        <button className='w-full bg-[#822BE2] font-semibold h-12 rounded-lg text-white hover:bg-purple-200 hover:border-2 hover:border-[#822BE2] hover:text-[#822BE2] transition-all duration-200 mb-6'>
                                            Save Changes
                                        </button>
                                        
                                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Information</h2>
                                        <p className='text-sm text-gray-600 mb-6 leading-relaxed'>
                                            Shipping fee will be added based on your buying product and product will be delivered within 7 days. Returnable with <a href='#' className='text-[#822BE2] underline'>Terms & Conditions</a>
                                        </p>
                                        
                                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Options</h2>
                                        <div className='flex gap-3 justify-start'>
                                            <FaCcVisa className='text-4xl sm:text-5xl text-gray-500 hover:text-blue-600 transition-colors' />
                                            <FaCcPaypal className='text-4xl sm:text-5xl text-gray-500 hover:text-blue-800 transition-colors' />
                                            <SiMastercard className='text-4xl sm:text-5xl text-gray-500 hover:text-red-600 transition-colors' />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

            </div>
            <Footer />
            <Toaster position="top-center" richColors closeButton />
        </>
    )
}
