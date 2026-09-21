'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function DashboardRedirect() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!profile) return;
    if (profile.role === 'SELLER') {
      router.push('/dashboard/seller');
    } else {
      router.push('/dashboard/buyer');
    }
  }, [user, profile, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <div className="text-sm text-muted-foreground">Loading dashboard...</div>
      </div>
    </div>
  );
}
