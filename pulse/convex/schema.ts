import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    user: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    text: v.string(),
    chatId: v.optional(v.string()),
    attachments: v.optional(
      v.array(
        v.object({
          name: v.string(),
          type: v.string(),
          url: v.string(),
        })
      )
    ),
    createdAt: v.number(),
  })
    .index("by_user", ["user"])
    .index("by_chat", ["chatId"])
    .index("by_user_and_chat", ["user", "chatId"]),

  appointments: defineTable({
    user: v.string(),
    doctor: v.string(),
    date: v.string(),
    reason: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["user"]),

  reports: defineTable({
    user: v.string(),
    reportText: v.string(),
    summary: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["user"]),
});