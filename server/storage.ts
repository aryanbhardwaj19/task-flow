import { db } from "./db";
import {
  users, projects, tasks, projectMembers,
  type User, type InsertUser,
  type Project, type InsertProject,
  type Task, type InsertTask,
  type ProjectMember, type InsertProjectMember
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Projects
  getProject(id: number): Promise<Project | undefined>;
  getUserProjects(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  
  // Project Members
  addProjectMember(member: InsertProjectMember): Promise<ProjectMember>;
  getProjectMembers(projectId: number): Promise<User[]>;
  isProjectMember(userId: number, projectId: number): Promise<boolean>;
  isProjectOwner(userId: number, projectId: number): Promise<boolean>;

  // Tasks
  getTask(id: number): Promise<Task | undefined>;
  getProjectTasks(projectId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: number): Promise<void>;

  // Project Settings
  updateProject(id: number, updates: Partial<InsertProject>): Promise<Project>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Projects
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getUserProjects(userId: number): Promise<Project[]> {
    // Return projects where user is owner OR member
    // Simplified for now: just fetch all and filter or use join if needed.
    // For this MVP, let's just return owned projects + memberships
    // But efficiently, we can use a join or separate queries.
    // Let's do a raw sql or join if possible, but simplest is separate logic or join.
    
    // Actually, let's just fetch projects where ownerId = userId
    // AND projects where id IN (select projectId from projectMembers where userId = userId)
    
    const owned = await db.select().from(projects).where(eq(projects.ownerId, userId));
    
    const memberProjects = await db.select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      ownerId: projects.ownerId,
      createdAt: projects.createdAt
    })
    .from(projects)
    .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
    .where(eq(projectMembers.userId, userId));

    // Deduping not strictly necessary if logic implies disjoint sets, 
    // but owner should implicitly be a member or handled separately.
    // Let's return unique list.
    const all = [...owned, ...memberProjects];
    const unique = Array.from(new Map(all.map(p => [p.id, p])).values());
    return unique;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  // Project Members
  async addProjectMember(member: InsertProjectMember): Promise<ProjectMember> {
    const [newMember] = await db.insert(projectMembers).values(member).returning();
    return newMember;
  }

  async getProjectMembers(projectId: number): Promise<User[]> {
    const members = await db.select({
      id: users.id,
      username: users.username,
      password: users.password
    })
    .from(users)
    .innerJoin(projectMembers, eq(users.id, projectMembers.userId))
    .where(eq(projectMembers.projectId, projectId));
    return members;
  }

  async isProjectMember(userId: number, projectId: number): Promise<boolean> {
    const project = await this.getProject(projectId);
    if (project && project.ownerId === userId) return true;

    const [member] = await db.select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
    return !!member;
  }

  async isProjectOwner(userId: number, projectId: number): Promise<boolean> {
    const project = await this.getProject(projectId);
    return project?.ownerId === userId;
  }

  // Tasks
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getProjectTasks(projectId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.projectId, projectId));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task> {
    const [updated] = await db.update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    return updated;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project> {
    const [updated] = await db.update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
