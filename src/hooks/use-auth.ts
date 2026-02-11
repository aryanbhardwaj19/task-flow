import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type InsertUser } from "@shared/routes";
import { z } from "zod";
import { useLocation } from "wouter";

// Helper to manage token
const TOKEN_KEY = "auth_token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

// Auth headers helper
export const getAuthHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { "Authorization": `Bearer ${token}` } : {};
};

export function useAuth() {
  const queryClient = useQueryClient();
  const [_, setLocation] = useLocation();

  // Load current user
  const { data: user, isLoading, error } = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const token = getToken();
      if (!token) return null;

      const res = await fetch(api.auth.me.path, {
        headers: { ...getAuthHeaders() }
      });

      if (res.status === 401) {
        removeToken();
        return null;
      }
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.auth.me.responses[200].parse(await res.json());
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: z.infer<typeof api.auth.login.input>) => {
      const res = await fetch(api.auth.login.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid username or password");
        throw new Error("Login failed");
      }

      const data = api.auth.login.responses[200].parse(await res.json());
      setToken(data.token);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await fetch(api.auth.register.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 400) throw new Error("Username already taken");
        throw new Error("Registration failed");
      }

      return api.auth.register.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      // Auto login after register would be nice, but let's just redirect to login for now
      setLocation("/auth");
    },
  });

  const logout = () => {
    removeToken();
    queryClient.setQueryData([api.auth.me.path], null);
    setLocation("/auth");
  };

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout,
  };
}
