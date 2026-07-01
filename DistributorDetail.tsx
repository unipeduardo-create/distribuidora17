import { useState, useEffect, useCallback } from 'react';
import type { Distributor, User } from '../types';

const DISTRIBUTORS_KEY = 'distributor_app_distributors';
const USERS_KEY = 'distributor_app_users';

export function useAdminData() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const reload = useCallback(() => {
    const distData = localStorage.getItem(DISTRIBUTORS_KEY);
    setDistributors(distData ? JSON.parse(distData) : []);

    const usersData = localStorage.getItem(USERS_KEY);
    setUsers(usersData ? JSON.parse(usersData) : []);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggleStatus = useCallback((id: string) => {
    const all = JSON.parse(localStorage.getItem(DISTRIBUTORS_KEY) || '[]') as Distributor[];
    const updated = all.map((d) =>
      d.id === id ? { ...d, isOpen: !d.isOpen, updatedAt: new Date().toISOString() } : d
    );
    localStorage.setItem(DISTRIBUTORS_KEY, JSON.stringify(updated));
    setDistributors(updated);
  }, []);

  const importMany = useCallback((items: Array<Omit<Distributor, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const all = JSON.parse(localStorage.getItem(DISTRIBUTORS_KEY) || '[]') as Distributor[];
    const now = new Date().toISOString();
    const newItems: Distributor[] = items.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }));
    const updated = [...all, ...newItems];
    localStorage.setItem(DISTRIBUTORS_KEY, JSON.stringify(updated));
    setDistributors(updated);
    return newItems.length;
  }, []);

  const remove = useCallback((id: string) => {
    const all = JSON.parse(localStorage.getItem(DISTRIBUTORS_KEY) || '[]') as Distributor[];
    const updated = all.filter((d) => d.id !== id);
    localStorage.setItem(DISTRIBUTORS_KEY, JSON.stringify(updated));
    setDistributors(updated);
  }, []);

  const removeUser = useCallback((userId: string) => {
    // Remove o usuário
    const allUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]') as User[];
    const updatedUsers = allUsers.filter((u) => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    setUsers(updatedUsers);

    // Remove distribuidoras do usuário
    const allDists = JSON.parse(localStorage.getItem(DISTRIBUTORS_KEY) || '[]') as Distributor[];
    const updatedDists = allDists.filter((d) => d.userId !== userId);
    localStorage.setItem(DISTRIBUTORS_KEY, JSON.stringify(updatedDists));
    setDistributors(updatedDists);
  }, []);

  return { distributors, users, toggleStatus, remove, removeUser, importMany, reload };
}
