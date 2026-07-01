import { useState, useEffect, useCallback } from 'react';
import type { Admin } from '../types';

const ADMINS_KEY = 'distributor_app_admins';
const ADMIN_SESSION_KEY = 'distributor_app_admin_session';

export function useAdminAuth() {
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem(ADMIN_SESSION_KEY);
    if (session) {
      try {
        const admin = JSON.parse(session);
        setCurrentAdmin(admin);
      } catch {
        localStorage.removeItem(ADMIN_SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const getAdmins = (): Admin[] => {
    const data = localStorage.getItem(ADMINS_KEY);
    return data ? JSON.parse(data) : [];
  };

  const saveAdmins = (admins: Admin[]) => {
    localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
  };

  const register = useCallback((name: string, email: string, password: string): { success: boolean; message: string } => {
    const admins = getAdmins();
    if (admins.find((a) => a.email === email)) {
      return { success: false, message: 'Este e-mail já está cadastrado como administrador.' };
    }
    const newAdmin: Admin = {
      id: crypto.randomUUID(),
      name,
      email,
      password,
      createdAt: new Date().toISOString(),
    };
    admins.push(newAdmin);
    saveAdmins(admins);
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(newAdmin));
    setCurrentAdmin(newAdmin);
    return { success: true, message: 'Cadastro de administrador realizado!' };
  }, []);

  const login = useCallback((email: string, password: string): { success: boolean; message: string } => {
    const admins = getAdmins();
    const admin = admins.find((a) => a.email === email && a.password === password);
    if (!admin) {
      return { success: false, message: 'E-mail ou senha de administrador incorretos.' };
    }
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(admin));
    setCurrentAdmin(admin);
    return { success: true, message: 'Login de administrador realizado!' };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setCurrentAdmin(null);
  }, []);

  return { currentAdmin, isLoading, register, login, logout };
}
