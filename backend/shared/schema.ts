import { z } from "zod";

// Zod Schemas matching MongoDB documents

export const insertUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  ownerId: z.string(), // ObjectId string
  status: z.enum(["active", "archived"]).default("active"),
});

export const insertTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  projectId: z.string(), // ObjectId string
  assigneeId: z.string().optional().nullable(), // ObjectId string
});

export const insertProjectMemberSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
});

// Types inferred from Zod schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertProjectMember = z.infer<typeof insertProjectMemberSchema>;

export type User = InsertUser & { id: string };
export type Project = InsertProject & { id: string; createdAt: Date };
export type Task = InsertTask & { id: string; createdAt: Date };
export type ProjectMember = InsertProjectMember & { id: string };
