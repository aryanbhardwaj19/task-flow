import mongoose, { Schema, Document } from "mongoose";
import { User, Project, Task, ProjectMember } from "../shared/schema";

// User Schema
const userSchema = new Schema<User>({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

// Project Schema
const projectSchema = new Schema<Project>({
    name: { type: String, required: true },
    description: { type: String },
    ownerId: { type: String, required: true },
    status: { type: String, enum: ["active", "archived"], default: "active" },
    createdAt: { type: Date, default: Date.now },
});

// Task Schema
const taskSchema = new Schema<Task>({
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ["todo", "in_progress", "done"], default: "todo" },
    projectId: { type: String, required: true },
    assigneeId: { type: String },
    createdAt: { type: Date, default: Date.now },
});

// Project Member Schema
const projectMemberSchema = new Schema<ProjectMember>({
    projectId: { type: String, required: true },
    userId: { type: String, required: true },
});

// Indexes for performance
projectSchema.index({ ownerId: 1 });
taskSchema.index({ projectId: 1 });
taskSchema.index({ assigneeId: 1 });
projectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });

// Export Models
export const UserModel = mongoose.model<User>("User", userSchema);
export const ProjectModel = mongoose.model<Project>("Project", projectSchema);
export const TaskModel = mongoose.model<Task>("Task", taskSchema);
export const ProjectMemberModel = mongoose.model<ProjectMember>("ProjectMember", projectMemberSchema);
