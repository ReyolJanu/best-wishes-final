"use client";
import React, { useEffect, useState } from 'react';
import Navbar from '../../components/navBar/page';
import Footer from '../../components/footer/page';
import { MdHistory } from "react-icons/md";
import Image from 'next/image';
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaRegEye } from "react-icons/fa";
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

function Page() {
    const { user } = useSelector(state => state.userState);
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        const fetchOrders = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/orders/history`, { withCredentials: true });
                setOrders(res.data.orders || []);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch order history');
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [user]);

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
                <Navbar />
                <div className="flex flex-col items-center justify-center flex-1">
                    <MdHistory className="text-5xl text-[#822BE2] mb-4" />
                    <h2 className="text-2xl font-semibold mb-2">Login Required</h2>
                    <p className="mb-4 text-gray-600">You must be logged in to view your order history.</p>
                    <Link href="/login" className="px-6 py-2 bg-[#822BE2] text-white rounded hover:bg-purple-700 transition">Login to Access</Link>
                </div>
                <Footer />
            </div>
        );
    }

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

    return (
        <div>
            <div className='px-4 md:px-20 lg:px-[80px] min-h-screen'>
                <Navbar />
                <div className='flex w-full items-center justify-center p-2 md:p-[5px] text-[#822BE2] font-semibold border border-[#822BE2] rounded mb-5 md:mb-[20px] text-base md:text-lg'><MdHistory className='text-2xl md:text-[30px] pr-2 md:pr-[10px]' /> History</div>
                {loading ? (
                    <div className="flex justify-center items-center min-h-[200px]">
                        <div className="w-8 h-8 border-2 border-gray-300 border-t-[#822BE2] rounded-full animate-spin"></div>
                    </div>
                ) : error ? (
                    <div className="text-center text-red-500 py-8">{error}</div>
                ) : orders.length === 0 ? (
                    <div className="text-center text-gray-500 py-8 flex flex-col items-center gap-4">
                        <span>No order history found.</span>
                        <Link href="/allProducts" className="px-6 py-2 bg-[#822BE2] text-white rounded hover:bg-purple-700 transition">Go Shopping</Link>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order._id} className='flex flex-col w-full items-center justify-center mb-6'>
                            {order.items.map((item, idx) => (
                                <div key={item._id || idx} className='flex flex-col md:flex-row w-full gap-2 md:gap-0'>
                                    <div className='flex items-center w-full md:w-[40%] mb-2 md:mb-0'>
                                        <div className="relative w-[40%] md:w-[25%] min-w-[80px] max-w-[130px]">
                                            <Image
                                                src={getProductImage(item.product)}
                                                alt={item.product?.name || "Product image"}
                                                width={130}
                                                height={120}
                                                className="rounded-lg object-cover w-full h-auto"
                                                onError={(e) => {
                                                  e.target.src = '/placeholder.svg';
                                                }}
                                            />
                                        </div>
                                        <span className='text-base md:text-[18px] font-semibold ml-2'>{item.product?.name || 'Product name'}</span>
                                    </div>
                                    <div className='flex flex-wrap md:flex-nowrap justify-between md:justify-evenly items-center w-full md:w-[60%] gap-2'>
                                        <p className='font-semibold text-sm md:text-[16px]'>US {item.price?.toFixed(2) || '0.00'}$</p>
                                        <p className='text-sm md:text-[16px]'>{new Date(order.orderedAt).toLocaleDateString()}</p>
                                        <p className='text-sm md:text-[16px]'>{order.status}</p>
                                        <button className='text-xl md:text-[23px] p-0 bg-transparent border-none hover:bg-transparent focus:outline-none'><FaRegEye /></button>
                                        <button className='text-xl md:text-[23px] text-red-500 p-0 bg-transparent border-none hover:bg-transparent focus:outline-none'><RiDeleteBin6Line /></button>
                                        <button className='border-2 border-[#822BE2] text-sm md:text-[16px] rounded bg-[#822BE2] hover:bg-purple-200 hover:border-[#822BE2] hover:text-[#822BE2] hover:cursor-pointer text-white py-1 px-4 transition-colors'>Feedback</button>
                                    </div>
                                </div>
                            ))}
                            <hr className='mt-4 w-full md:w-[50%] mx-auto text-[#D9D9D9] pb-5 md:ml-[25%]' />
                        </div>
                    ))
                )}
            </div>
            <Footer />
        </div>
    );
}

export default Page;
