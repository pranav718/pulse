// convex/reports.ts - REPLACE ENTIRE FILE
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth.config";

export const create = mutation({
  args: {
    userId: v.string(),
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
    return await ctx.db.insert("reports", {
      userId: args.userId,
      reportText: args.reportText,
      summary: args.summary,
      keyFindings: args.keyFindings,
      fileName: args.fileName,
      fileSize: args.fileSize,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    return reports.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getById = query({
  args: { id: v.id("reports") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});