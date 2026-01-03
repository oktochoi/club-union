'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from './AdminHeader';
import AdminDashboard from './AdminDashboard';
import Loading from '@/components/ui/Loading';
import { getCurrentUser } from '@/lib/supabase/user';
import type { User } from '@/types/user';

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        
        if (!currentUser) {
          router.push('/login');
          return;
        }

        if (currentUser.role !== 'admin') {
          router.push('/');
          return;
        }

        setUser(currentUser);
      } catch (error) {
        console.error('사용자 로드 오류:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [router]);

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={user} />
      <main>
        <AdminDashboard />
      </main>
    </div>
  );
}