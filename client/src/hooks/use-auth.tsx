import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface User {
  id: number;
  email: string;
}

interface AuthError {
  message: string;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: user, isLoading } = useQuery<User, AuthError>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const logout = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      setLocation("/auth");
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logout.mutate,
  };
}
