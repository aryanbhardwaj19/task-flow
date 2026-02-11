import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// JWT Secret - in production this should be an environment variable
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-12345";

// Middleware to verify JWT token
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    (req as any).user = user;
    next();
  });
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === Auth Routes ===
  
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(input.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      const user = await storage.createUser({ ...input, password: hashedPassword });
      
      // Don't return password
      res.status(201).json({ id: user.id, username: user.username });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByUsername(input.username);

      if (!user || !(await bcrypt.compare(input.password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token });
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get(api.auth.me.path, authenticateToken, async (req: any, res) => {
    const user = await storage.getUser(req.user.id);
    if (!user) return res.status(401).json({ message: "User not found" });
    res.json({ id: user.id, username: user.username });
  });

  // === Projects Routes ===

  app.get(api.projects.list.path, authenticateToken, async (req: any, res) => {
    const projects = await storage.getUserProjects(req.user.id);
    res.json(projects);
  });

  app.post(api.projects.create.path, authenticateToken, async (req: any, res) => {
    try {
      const input = api.projects.create.input.parse(req.body);
      const project = await storage.createProject({ ...input, ownerId: req.user.id });
      res.status(201).json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get(api.projects.get.path, authenticateToken, async (req: any, res) => {
    const projectId = Number(req.params.id);
    if (!(await storage.isProjectMember(req.user.id, projectId))) {
      return res.status(403).json({ message: "Access denied" });
    }
    const project = await storage.getProject(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  });

  app.patch(api.projects.update.path, authenticateToken, async (req: any, res) => {
    const projectId = Number(req.params.id);
    if (!(await storage.isProjectOwner(req.user.id, projectId))) {
      return res.status(403).json({ message: "Only owners can update project settings" });
    }
    try {
      const input = api.projects.update.input.parse(req.body);
      const updated = await storage.updateProject(projectId, input);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get(api.projects.members.list.path, authenticateToken, async (req: any, res) => {
    const projectId = Number(req.params.id);
    if (!(await storage.isProjectMember(req.user.id, projectId))) {
      return res.status(403).json({ message: "Access denied" });
    }
    const members = await storage.getProjectMembers(projectId);
    res.json(members.map(m => ({ id: m.id, username: m.username })));
  });

  app.post(api.projects.members.add.path, authenticateToken, async (req: any, res) => {
    const projectId = Number(req.params.id);
    if (!(await storage.isProjectOwner(req.user.id, projectId))) {
      return res.status(403).json({ message: "Only owners can add members" });
    }
    try {
      const { username } = api.projects.members.add.input.parse(req.body);
      const userToAdd = await storage.getUserByUsername(username);
      if (!userToAdd) return res.status(404).json({ message: "User not found" });
      
      const isAlreadyMember = await storage.isProjectMember(userToAdd.id, projectId);
      if (isAlreadyMember) return res.status(400).json({ message: "User is already a member" });

      await storage.addProjectMember({ projectId, userId: userToAdd.id });
      res.status(201).json({ id: userToAdd.id, username: userToAdd.username });
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // === Tasks Routes ===

  app.get(api.tasks.list.path, authenticateToken, async (req: any, res) => {
    const projectId = Number(req.params.projectId);
    if (!(await storage.isProjectMember(req.user.id, projectId))) {
      return res.status(403).json({ message: "Access denied" });
    }
    const tasks = await storage.getProjectTasks(projectId);
    res.json(tasks);
  });

  app.post(api.tasks.create.path, authenticateToken, async (req: any, res) => {
    try {
      const projectId = Number(req.params.projectId);
      if (!(await storage.isProjectMember(req.user.id, projectId))) {
        return res.status(403).json({ message: "Access denied" });
      }

      const input = api.tasks.create.input.parse({ 
        ...req.body, 
        projectId,
        assigneeId: req.body.assigneeId || null 
      });
      const task = await storage.createTask(input);
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch(api.tasks.update.path, authenticateToken, async (req: any, res) => {
    const taskId = Number(req.params.id);
    const task = await storage.getTask(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (!(await storage.isProjectMember(req.user.id, task.projectId))) {
      return res.status(403).json({ message: "Access denied" });
    }

    try {
      const input = api.tasks.update.input.parse(req.body);
      const updatedTask = await storage.updateTask(taskId, input);
      res.json(updatedTask);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.delete(api.tasks.delete.path, authenticateToken, async (req: any, res) => {
    const taskId = Number(req.params.id);
    const task = await storage.getTask(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (!(await storage.isProjectMember(req.user.id, task.projectId))) {
      return res.status(403).json({ message: "Access denied" });
    }

    await storage.deleteTask(taskId);
    res.status(204).send();
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Seed Database
  const existingUser = await storage.getUserByUsername("demo");
  if (!existingUser) {
    console.log("Seeding database...");
    const hashedPassword = await bcrypt.hash("demo123", 10);
    const user = await storage.createUser({ username: "demo", password: hashedPassword });
    
    const project = await storage.createProject({
      name: "Demo Project",
      description: "A sample project to get you started",
      ownerId: user.id,
      status: "active"
    });

    await storage.createTask({
      title: "Welcome to your new task manager",
      description: "This is a sample task. You can drag it to other columns.",
      status: "todo",
      projectId: project.id,
      assigneeId: user.id
    });

    await storage.createTask({
      title: "In Progress Task",
      description: "This task is currently being worked on.",
      status: "in_progress",
      projectId: project.id,
      assigneeId: user.id
    });
    
    await storage.createTask({
      title: "Completed Task",
      description: "This task is done.",
      status: "done",
      projectId: project.id,
      assigneeId: user.id
    });

    console.log("Database seeded!");
  }

  return httpServer;
}
