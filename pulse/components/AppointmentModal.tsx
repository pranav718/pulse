"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  MessageSquare, 
  Loader2 
} from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { format } from "date-fns";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppointmentModal({
  isOpen,
  onClose,
}: AppointmentModalProps) {
  const [doctor, setDoctor] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  const createAppointment = useMutation(api.appointments.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor || !date || !time || !reason) return;

    setIsBooking(true);

    try {
      await createAppointment({
        doctor,
        date,
        time,
        reason,
      });

      alert("Appointment booked successfully!");
      onClose();
      resetForm();
    } catch (error) {
      console.error("Booking error:", error);
      alert("Failed to book appointment");
    } finally {
      setIsBooking(false);
    }
  };

  const resetForm = () => {
    setDoctor("");
    setDate("");
    setTime("");
    setReason("");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-serif font-light">Book Appointment</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-serif mb-2 text-gray-700">
                <User className="w-4 h-4 inline mr-2" />
                Doctor Name
              </label>
              <input
                type="text"
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
                placeholder="Dr. Sarah Johnson"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-serif mb-2 text-gray-700">
                  <CalendarIcon className="w-4 h-4 inline mr-2" />
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={format(new Date(), "yyyy-MM-dd")}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-serif mb-2 text-gray-700">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-serif mb-2 text-gray-700">
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Reason for Visit
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe your symptoms or reason for visit..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isBooking}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-serif transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isBooking ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Booking...
                </>
              ) : (
                "Book Appointment"
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}