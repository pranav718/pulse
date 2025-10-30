import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    user: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    text: v.string(),
    createdAt: v.number(),
  }).index("by_creation_time", ["createdAt"]),

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