// convex/messages.ts - REPLACE ENTIRE FILE
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth.config";

export const send = mutation({
  args: {
    userId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      userId: args.userId,
      role: args.role,
      text: args.text,
      createdAt: Date.now(),
    });
    return messageId;
  },
});

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    
    return messages.sort((a, b) => a.createdAt - b.createdAt);
  },
});