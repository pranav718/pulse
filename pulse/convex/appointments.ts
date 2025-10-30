import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    user: v.string(),
    doctor: v.string(),
    date: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const appointmentId = await ctx.db.insert("appointments", {
      user: args.user,
      doctor: args.doctor,
      date: args.date,
      reason: args.reason,
      createdAt: Date.now(),
    });
    return appointmentId;
  },
});

export const listAppointments = query({
  args: { user: v.string() },
  handler: async (ctx, args) => {
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_user", (q) => q.eq("user", args.user))
      .collect();
    
    return appointments.sort((a, b) => b.createdAt - a.createdAt);
  },
});