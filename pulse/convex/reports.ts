// convex/reports.ts - REPLACE
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth.config";

export const create = mutation({
  args: {
    reportText: v.string(),
    summary: v.string(),
    keyFindings: v.array(
      v.object({
        category: v.string(),
        text: v.string(),
        severity: v.optional(v.string()),
      })
    ),
    fileName: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("reports", {
      userId,
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return reports.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getById = query({
  args: { id: v.id("reports") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const report = await ctx.db.get(args.id);
    
    // Security: only return if user owns the report
    if (report?.userId !== userId) return null;
    
    return report;
  },
});