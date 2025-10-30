import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const save = mutation({
  args: {
    user: v.string(),
    reportText: v.string(),
    summary: v.string(),
  },
  handler: async (ctx, args) => {
    const reportId = await ctx.db.insert("reports", {
      user: args.user,
      reportText: args.reportText,
      summary: args.summary,
      createdAt: Date.now(),
    });
    return reportId;
  },
});

export const listReports = query({
  args: { user: v.string() },
  handler: async (ctx, args) => {
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_user", (q) => q.eq("user", args.user))
      .collect();
    
    return reports.sort((a, b) => b.createdAt - a.createdAt);
  },
});