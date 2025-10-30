// convex/appointments.ts - REPLACE
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth.config";

export const create = mutation({
  args: {
    doctor: v.string(),
    date: v.string(),
    time: v.string(),
    reason: v.string(),
    googleEventId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("appointments", {
      userId,
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("appointments")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getUpcoming = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const now = Date.now();
    const allAppointments = await ctx.db
      .query("appointments")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
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
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const appointment = await ctx.db.get(args.id);
    if (appointment?.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, { status: args.status });
  },
});