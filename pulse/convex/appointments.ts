// convex/appointments.ts - REPLACE ENTIRE FILE
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth.config";

export const create = mutation({
  args: {
    userId: v.string(),
    doctor: v.string(),
    date: v.string(),
    time: v.string(),
    reason: v.string(),
    googleEventId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("appointments", {
      userId: args.userId,
      doctor: args.doctor,
      date: args.date,
      time: args.time,
      reason: args.reason,
      status: "pending",
      googleEventId: args.googleEventId,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("appointments")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const getUpcoming = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const allAppointments = await ctx.db
      .query("appointments")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    return allAppointments
      .filter((apt) => {
        const aptDate = new Date(apt.date + "T" + apt.time).getTime();
        return aptDate > now && apt.status !== "cancelled";
      })
      .sort((a, b) => {
        const dateA = new Date(a.date + "T" + a.time).getTime();
        const dateB = new Date(b.date + "T" + b.time).getTime();
        return dateA - dateB;
      });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("appointments"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});