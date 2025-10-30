// convex/messages.ts - REPLACE
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth.config";

export const send = mutation({
  args: {
    role: v.union(v.literal("user"), v.literal("assistant")),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const messageId = await ctx.db.insert("messages", {
      userId,
      role: args.role,
      text: args.text,
      createdAt: Date.now(),
    });
    return messageId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    
    return messages.sort((a, b) => a.createdAt - b.createdAt);
  },
});