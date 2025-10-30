// convex/schema.ts - REPLACE ENTIRE FILE
import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  // Auth tables (auto-managed by Convex Auth)
  ...authTables,

  // Messages
  messages: defineTable({
    userId: v.id("users"), // Changed from string to user ID
    role: v.union(v.literal("user"), v.literal("assistant")),
    text: v.string(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  // User Usage Limits
  userUsage: defineTable({
    userId: v.id("users"), // Changed to user ID
    
    // Reports
    reportsUploaded: v.number(),
    reportsLimit: v.number(),
    totalStorageMB: v.number(),
    storageLimit: v.number(),
    
    // Chat
    chatMessagesThisMonth: v.number(),
    chatMessageLimit: v.number(),
    
    // Tier
    tier: v.union(
      v.literal("free"),
      v.literal("premium"),
      v.literal("trial")
    ),
    
    // Metadata
    lastResetDate: v.string(),
    accountCreatedAt: v.number(),
    trialEndsAt: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

  // Reports
  reports: defineTable({
    userId: v.id("users"), // Changed to user ID
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
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  // Appointments
  appointments: defineTable({
    userId: v.id("users"), // Changed to user ID
    doctor: v.string(),
    date: v.string(),
    time: v.string(),
    reason: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled")
    ),
    googleEventId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_date", ["userId", "date"]),

  // Google Calendar Tokens
  userTokens: defineTable({
    userId: v.id("users"), // Changed to user ID
    accessToken: v.string(),
    refreshToken: v.string(),
    expiryDate: v.number(),
  }).index("by_userId", ["userId"]),
});