// convex/userUsage.ts - REPLACE ENTIRE FILE
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth.config";

export const initializeUser = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userUsage")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!existing) {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      
      await ctx.db.insert("userUsage", {
        userId: args.userId,
        reportsUploaded: 0,
        reportsLimit: 10,
        totalStorageMB: 0,
        storageLimit: 50,
        chatMessagesThisMonth: 0,
        chatMessageLimit: 100,
        tier: "free",
        lastResetDate: currentMonth,
        accountCreatedAt: Date.now(),
      });
    }
  },
});

export const getUsage = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const usage = await ctx.db
      .query("userUsage")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!usage) return null;

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    if (usage.lastResetDate !== currentMonth) {
      await ctx.db.patch(usage._id, {
        reportsUploaded: 0,
        chatMessagesThisMonth: 0,
        lastResetDate: currentMonth,
      });
      return { 
        ...usage, 
        reportsUploaded: 0,
        chatMessagesThisMonth: 0,
      };
    }

    return usage;
  },
});

export const canUploadReport = query({
  args: { 
    userId: v.string(),
    fileSizeMB: v.number(),
  },
  handler: async (ctx, args) => {
    const usage = await ctx.db
      .query("userUsage")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!usage) return { allowed: false, reason: "User not found" };
    
    if (usage.tier === "premium" || usage.tier === "trial") {
      return { allowed: true, reason: null };
    }

    if (usage.reportsUploaded >= usage.reportsLimit) {
      return { 
        allowed: false, 
        reason: `Monthly limit reached (${usage.reportsLimit} reports/month)` 
      };
    }

    if (usage.totalStorageMB + args.fileSizeMB > usage.storageLimit) {
      return { 
        allowed: false, 
        reason: `Storage full (${usage.storageLimit}MB limit)` 
      };
    }

    return { allowed: true, reason: null };
  },
});

export const incrementReportCount = mutation({
  args: { 
    userId: v.string(),
    fileSizeMB: v.number(),
  },
  handler: async (ctx, args) => {
    const usage = await ctx.db
      .query("userUsage")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (usage) {
      await ctx.db.patch(usage._id, {
        reportsUploaded: usage.reportsUploaded + 1,
        totalStorageMB: usage.totalStorageMB + args.fileSizeMB,
      });
    }
  },
});

export const canSendMessage = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const usage = await ctx.db
      .query("userUsage")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!usage) return { allowed: false, reason: "User not found" };
    
    if (usage.tier === "premium" || usage.tier === "trial") {
      return { allowed: true, reason: null };
    }

    if (usage.chatMessagesThisMonth >= usage.chatMessageLimit) {
      return { 
        allowed: false, 
        reason: `Monthly chat limit reached (${usage.chatMessageLimit} messages/month)` 
      };
    }

    return { allowed: true, reason: null };
  },
});

export const incrementMessageCount = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const usage = await ctx.db
      .query("userUsage")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (usage) {
      await ctx.db.patch(usage._id, {
        chatMessagesThisMonth: usage.chatMessagesThisMonth + 1,
      });
    }
  },
});

export const deleteReport = mutation({
  args: { 
    userId: v.string(),
    reportId: v.id("reports"),
    fileSizeMB: v.number(),
  },
  handler: async (ctx, args) => {
    const usage = await ctx.db
      .query("userUsage")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (usage) {
      await ctx.db.patch(usage._id, {
        totalStorageMB: Math.max(0, usage.totalStorageMB - args.fileSizeMB),
      });
    }

    await ctx.db.delete(args.reportId);
  },
});