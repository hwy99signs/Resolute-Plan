import { useState, useEffect } from 'react';
import { ResolveService } from '../services';
import type { Resolve, ResolveInsert, ResolveUpdate } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function useResolves() {
  const { user } = useAuth();
  const [resolves, setResolves] = useState<Resolve[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchResolves = async () => {
    if (!user) {
      setResolves([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await ResolveService.getUserResolves(user.id);
      setResolves(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching resolves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResolves();
  }, [user]);

  const createResolve = async (resolve: ResolveInsert): Promise<Resolve> => {
    const newResolve = await ResolveService.createResolve(resolve);
    setResolves(prev => [newResolve, ...prev]);
    return newResolve;
  };

  const updateResolve = async (resolveId: string, updates: ResolveUpdate): Promise<Resolve> => {
    const updatedResolve = await ResolveService.updateResolve(resolveId, updates);
    setResolves(prev => prev.map(p => p.id === resolveId ? updatedResolve : p));
    return updatedResolve;
  };

  const deleteResolve = async (resolveId: string): Promise<void> => {
    await ResolveService.deleteResolve(resolveId);
    setResolves(prev => prev.filter(p => p.id !== resolveId));
  };

  const completeResolve = async (resolveId: string): Promise<Resolve> => {
    const completedResolve = await ResolveService.completeResolve(resolveId);
    setResolves(prev => prev.map(p => p.id === resolveId ? completedResolve : p));
    return completedResolve;
  };

  const archiveResolve = async (resolveId: string): Promise<Resolve> => {
    const archivedResolve = await ResolveService.archiveResolve(resolveId);
    setResolves(prev => prev.map(p => p.id === resolveId ? archivedResolve : p));
    return archivedResolve;
  };

  return {
    resolves,
    loading,
    error,
    refetch: fetchResolves,
    createResolve,
    updateResolve,
    deleteResolve,
    completeResolve,
    archiveResolve,
  };
}

export function useResolvesByStatus(status: 'active' | 'completed' | 'archived') {
  const { user } = useAuth();
  const [resolves, setResolves] = useState<Resolve[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchResolves = async () => {
      if (!user) {
        setResolves([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await ResolveService.getResolvesByStatus(user.id, status);
        setResolves(data);
      } catch (err) {
        setError(err as Error);
        console.error(`Error fetching ${status} resolves:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchResolves();
  }, [user, status]);

  return { resolves, loading, error };
}

export function useResolveStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    completed: number;
    archived: number;
    averageProgress: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setStats(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await ResolveService.getUserStats(user.id);
        setStats(data);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching resolve stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return { stats, loading, error };
}

// Alias for useResolves that returns Resolves (capitalized) for compatibility
export function usePakts() {
  const { resolves, ...rest } = useResolves();
  return {
    Resolves: resolves,
    ...rest,
  };
}

