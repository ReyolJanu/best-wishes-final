"use client";
import React, { useRef, useState, useEffect } from 'react';
import { IoIosCloseCircleOutline } from "react-icons/io";
import { useSelector } from 'react-redux';
import Loader from '../../components/loader/page';
import { toast, Toaster } from 'sonner';
import axios from 'axios';
import { getOccasionTypes } from '../../services/occasionService';

const ReminderGift = ({ onClose, children }) => {
  const modalRef = useRef(null);
  const [remindermsg, setRemindermsg] = useState("");
  const [date, setDate] = useState("");
  const [event, setEvent] = useState("");
  const [occasion, setOccasion] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [occasionTypes, setOccasionTypes] = useState([]);

  const { user } = useSelector((state) => state.userState);

  // Fetch occasion types on component mount
  useEffect(() => {
    const fetchOccasionTypes = async () => {
      try {
        const types = await getOccasionTypes();
        setOccasionTypes(types);
      } catch (error) {
        console.error('Error fetching occasion types:', error);
      }
    };
    fetchOccasionTypes();
  }, []);

  // Helper to get today's date in yyyy-mm-dd format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const HandleReminder = async () => {
    setErrorMsg("");
    if (!remindermsg || !date || !event || event === "" || !time || !occasion) {
      toast.error("Please enter all details including occasion to continue!");
      return;
    }
    // Prevent setting reminders for past dates only (allow today)
    const selectedDate = new Date(date);
    const now = new Date();
    now.setHours(0,0,0,0); // Set to start of today
    if (selectedDate < now) {
      toast.error("Please select today's date or a future date for the reminder!");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/reminder`,
        { remindermsg, date, event, time, occasion },
        { withCredentials: true }
      );
      toast.success("Reminder set successfully with product recommendations!");
      setRemindermsg("");
      setDate("");
      setEvent("");
      setTime("");
      setOccasion("");
      onClose && onClose();
    } catch (error) {
      console.error('Reminder error:', error);
      setErrorMsg(error.response?.data?.message || 'Failed to set reminder. Please try again.');
      toast.error(error.response?.data?.message || 'Failed to set reminder. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal} ref={modalRef}>
        {children}
        <div className="flex-col rounded-[10px]">
          <div className="w-full flex justify-between pb-[20px]">
            <p className="text-[18px] font-semibold">Reminder Gift Notifier</p>
            <IoIosCloseCircleOutline
              onClick={onClose}
              className="text-[30px] hover:cursor-pointer hover:text-red-500"
            />
          </div>
          {!user && (
            <p className="mb-[20px] text-orange-500">
              Please login to access this feature!
            </p>
          )}
          {errorMsg && <p className="text-red-500 mt-2">{errorMsg}</p>}
          <div className="flex-col">
            <p className="text-[#5C5C5C] font-semibold">Reminder Message</p>
            <textarea
              value={remindermsg}
              onChange={(e) => setRemindermsg(e.target.value)}
              placeholder="Enter your reminder message here..."
              className="border-2 border-[#D9D9D9] rounded-[5px] w-full mt-[10px] h-[120px] p-[15px] resize-none"
            />
          </div>
          
          {/* Occasion Selection */}
          <div className="flex-col pt-[15px]">
            <p className="text-[#5C5C5C] font-semibold">Choose Occasion</p>
            <div className="border-2 border-[#D9D9D9] w-full flex justify-center items-center pl-[10px] pr-[10px] mt-[10px] h-[50px] rounded-[5px]">
              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full bg-transparent outline-none placeholder:text-gray-600"
              >
                <option value="">Select Occasion Type</option>
                {occasionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">This helps us recommend the perfect gifts for your occasion</p>
          </div>
          <div className="flex w-full pt-[15px]">
            <div className="flex-col w-[50%] justify-between items-center ">
              <p className="text-[#5C5C5C] font-semibold">Choose Date</p>
              <div className="flex space-x-[10px] justify-center items-center mt-[10px]">
                <div className="border-2 border-[#D9D9D9] w-full flex justify-center items-center pl-2 pr-2 h-[50px] rounded-[5px]">
                  <input
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    type="date"
                    min={getTodayDate()}
                    className="w-full h-full outline-none text-gray-700"
                  />
                </div>
                <div className="border-2 border-[#D9D9D9] w-full flex justify-center items-center pl-2 pr-2 h-[50px] rounded-[5px] ml-2">
                  <input
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    type="time"
                    className="w-full h-full outline-none text-gray-700"
                  />
                </div>
              </div>
            </div>
            <div className="flex-col w-[50%] items-center pl-[20px]">
              <div className="flex-col w-full">
                <p className="text-[#5C5C5C] font-semibold">Choose Event</p>
                <div className="border-2 border-[#D9D9D9] w-full flex justify-center items-center pl-[10px] pr-[10px] mt-[10px] h-[50px] rounded-[5px]">
                  <select
                    value={event}
                    onChange={(e) => setEvent(e.target.value)}
                    name="event"
                    className="w-full bg-transparent outline-none placeholder:text-gray-600"
                  >
                    <option value="">Select Event</option>
                    <option value="Birthday Party">Birthday Party</option>
                    <option value="Anniversary Celebration">Anniversary Celebration</option>
                    <option value="Wedding Ceremony">Wedding Ceremony</option>
                    <option value="Graduation Party">Graduation Party</option>
                    <option value="Baby Shower">Baby Shower</option>
                    <option value="Housewarming Party">Housewarming Party</option>
                    <option value="Holiday Celebration">Holiday Celebration</option>
                    <option value="Farewell Party">Farewell Party</option>
                    <option value="Promotion Celebration">Promotion Celebration</option>
                    <option value="Family Gathering">Family Gathering</option>
                    <option value="Other Event">Other Event</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex w-full gap-[10px] pt-[20px]">
          <button
            onClick={onClose}
            className="h-[50px] w-[30%] text-[18px] border-2 border-[#822BE2] text-[#822BE2] font-semibold rounded-[8px] hover:cursor-pointer bg-white hover:bg-purple-200 mt-[20px]"
          >
            Cancel
          </button>
          {loading ? (<Loader />):
          <button
            onClick={HandleReminder}
            disabled={!user}
            className={`h-[50px] w-[70%] text-[18px] text-white font-semibold rounded-[8px] mt-[20px] ${
              user
                ? "bg-[#822BE2] hover:bg-purple-600 hover:cursor-pointer"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Set Reminder
          </button>}
        </div>
      </div>
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
};

export default ReminderGift;

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#fff",
    padding: "30px",
    borderRadius: "10px",
    width: "40%",
    position: "relative",
  },
};
