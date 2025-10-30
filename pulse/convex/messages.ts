import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const send = mutation({
  args: {
    user: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    text: v.string(),
    chatId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      user: args.user,
      role: args.role,
      text: args.text,
      chatId: args.chatId,
      createdAt: Date.now(),
    });
    return messageId;
  },
});

export const list = query({
  args: { 
    user: v.string(),
    chatId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let messages;
    
    if (args.chatId) {
      // Get messages for specific chat
      messages = await ctx.db
        .query("messages")
        .withIndex("by_user_and_chat", (q) => 
          q.eq("user", args.user).eq("chatId", args.chatId)
        )
        .collect();
    } else {
      // Get all messages for user (fallback for legacy chats)
      messages = await ctx.db
        .query("messages")
        .withIndex("by_user", (q) => q.eq("user", args.user))
        .collect();
    }
    
    return messages.sort((a, b) => a.createdAt - b.createdAt);
  },
});