import mongoose from "mongoose";
import {
  type User, type InsertUser,
  type Project, type InsertProject,
  type Task, type InsertTask,
  type ProjectMember, type InsertProjectMember
} from "@shared/schema";
import { UserModel, ProjectModel, TaskModel, ProjectMemberModel } from "./models";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getUserProjects(userId: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;

  // Project Members
  addProjectMember(member: InsertProjectMember): Promise<ProjectMember>;
  getProjectMembers(projectId: string): Promise<User[]>;
  isProjectMember(userId: string, projectId: string): Promise<boolean>;
  isProjectOwner(userId: string, projectId: string): Promise<boolean>;

  // Tasks
  getTask(id: string): Promise<Task | undefined>;
  getProjectTasks(projectId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  // Project Settings
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const user = await UserModel.findById(id);
    return user ? this.mapDoc(user) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ username });
    return user ? this.mapDoc(user) : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser = await UserModel.create(user);
    return this.mapDoc(newUser);
  }

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    const project = await ProjectModel.findById(id);
    return project ? this.mapDoc(project) : undefined;
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    const ownedProjects = await ProjectModel.find({ ownerId: userId });
    const memberships = await ProjectMemberModel.find({ userId });
    const memberProjectIds = memberships.map(m => m.projectId);
    const memberProjects = await ProjectModel.find({ _id: { $in: memberProjectIds } });

    const allProjects = [...ownedProjects, ...memberProjects];

    // Deduplicate by ID string
    const uniqueProjects = Array.from(new Map(allProjects.map(p => [(p as any)._id.toString(), p])).values());
    return uniqueProjects.map(p => this.mapDoc(p));
  }

  async createProject(project: InsertProject): Promise<Project> {
    const newProject = await ProjectModel.create(project);
    return this.mapDoc(newProject);
  }

  // Project Members
  async addProjectMember(member: InsertProjectMember): Promise<ProjectMember> {
    const newMember = await ProjectMemberModel.create(member);
    return this.mapDoc(newMember);
  }

  async getProjectMembers(projectId: string): Promise<User[]> {
    const memberships = await ProjectMemberModel.find({ projectId });
    const userIds = memberships.map(m => m.userId);
    const users = await UserModel.find({ _id: { $in: userIds } });
    return users.map(u => this.mapDoc(u));
  }

  async isProjectMember(userId: string, projectId: string): Promise<boolean> {
    const project = await ProjectModel.findById(projectId);
    if (project && project.ownerId === userId) return true;

    const member = await ProjectMemberModel.findOne({ projectId, userId });
    return !!member;
  }

  async isProjectOwner(userId: string, projectId: string): Promise<boolean> {
    const project = await ProjectModel.findById(projectId);
    return project?.ownerId === userId;
  }

  // Tasks
  async getTask(id: string): Promise<Task | undefined> {
    const task = await TaskModel.findById(id);
    return task ? this.mapDoc(task) : undefined;
  }

  async getProjectTasks(projectId: string): Promise<Task[]> {
    const tasks = await TaskModel.find({ projectId });
    return tasks.map(t => this.mapDoc(t));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const newTask = await TaskModel.create(task);
    return this.mapDoc(newTask);
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task> {
    const updated = await TaskModel.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) throw new Error("Task not found");
    return this.mapDoc(updated);
  }

  async deleteTask(id: string): Promise<void> {
    await TaskModel.findByIdAndDelete(id);
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project> {
    const updated = await ProjectModel.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) throw new Error("Project not found");
    return this.mapDoc(updated);
  }

  // Helper to map Mongoose document to plain object with id as string
  private mapDoc<T extends { _id: unknown }>(doc: T): any {
    const obj = (doc as any).toObject ? (doc as any).toObject() : doc;
    // @ts-ignore
    const { _id, ...rest } = obj;
    return { id: _id.toString(), ...rest };
  }
}

export const storage = new DatabaseStorage();
