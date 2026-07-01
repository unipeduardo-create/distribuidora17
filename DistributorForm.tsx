import { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';

const USERS_KEY = 'distributor_app_users';
const SESSION_KEY = 'distributor_app_session';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      try {
        const user = JSON.parse(session);
        setCurrentUser(user);
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const getUsers = (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  };

  const saveUsers = (users: User[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  };

  const register = useCallback((name: string, email: string, password: string): { success: boolean; message: string } => {
    const users = getUsers();
    if (users.find((u) => u.email === email)) {
      return { success: false, message: 'Este e-mail já está cadastrado.' };
    }
    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email,
      password,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    saveUsers(users);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    setCurrentUser(newUser);
    return { success: true, message: 'Cadastro realizado com sucesso!' };
  }, []);

  const login = useCallback((email: string, password: string): { success: boolean; message: string } => {
    const users = getUsers();
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) {
      return { success: false, message: 'E-mail ou senha incorretos.' };
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    setCurrentUser(user);
    return { success: true, message: 'Login realizado com sucesso!' };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
  }, []);

  return { currentUser, isLoading, register, login, logout };
}
