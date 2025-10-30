"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { motion } from "framer-motion";
import { Calendar, Clock, ChevronRight } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export function UpcomingAppointments() {
  const appointments = useQuery(api.appointments.getUpcoming) || [];

  if (appointments.length === 0) {
    return (
      <div className="p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-blue-100/50">
        <p className="text-sm text-gray-500 font-serif text-center">
          No upcoming appointments
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.slice(0, 3).map((apt, index) => {
        const aptDateTime = new Date(`${apt.date}T${apt.time}`);
        
        return (
          <motion.div
            key={apt._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-blue-100/50 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <h3 className="font-serif font-medium">Dr. {apt.doctor}</h3>
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{format(aptDateTime, "MMM dd, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{format(aptDateTime, "h:mm a")}</span>
                    <span className="text-xs text-blue-600">
                      ({formatDistanceToNow(aptDateTime, { addSuffix: true })})
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mt-2 line-clamp-1">
                  {apt.reason}
                </p>
              </div>
              
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}