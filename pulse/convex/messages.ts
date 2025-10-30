import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const send = mutation({
  args: {
    user: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      user: args.user,
      role: args.role,
      text: args.text,
      createdAt: Date.now(),
    });
    return messageId;
  },
});

export const list = query({
  args: { user: v.string() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("user", args.user))
      .collect();
    
    return messages.sort((a, b) => a.createdAt - b.createdAt);
  },
});