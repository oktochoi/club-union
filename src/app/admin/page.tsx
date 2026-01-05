'use client';

import AdminHeader from './AdminHeader';
import AdminDashboard from './AdminDashboard';
import AuthCheck from '@/components/AuthCheck';

export default function AdminPage() {
  return (
    <AuthCheck requireAuth={true} requireAdmin={true}>
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <main>
          <AdminDashboard />
        </main>
      </div>
    </AuthCheck>
  );
}