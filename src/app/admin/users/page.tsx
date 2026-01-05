'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '../AdminHeader';
import AuthCheck from '@/components/AuthCheck';
import Loading from '@/components/ui/Loading';
import { Button, Card, Badge, Input, ErrorMessage } from '@/components/ui';
import { getCurrentUser, getUsers, updateUserStatus } from '@/lib/supabase/user';
import type { User, UserStatus } from '@/types/user';

export default function AdminUsersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
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
        await loadUsers();
      } catch (error) {
        console.error('데이터 로드 오류:', error);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const loadUsers = async () => {
    try {
      const filters: { status?: UserStatus } = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      
      const usersData = await getUsers(filters);
      
      // 검색 필터 적용
      let filteredUsers = usersData || [];
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredUsers = filteredUsers.filter(
          (u) =>
            u.name.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term) ||
            (u.club_name && u.club_name.toLowerCase().includes(term))
        );
      }
      
      setUsers(filteredUsers);
    } catch (error) {
      console.error('사용자 목록 로드 오류:', error);
      setError('사용자 목록을 불러오는 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    if (!loading) {
      loadUsers();
    }
  }, [statusFilter, searchTerm, loading]);

  const handleStatusUpdate = async (userId: string, newStatus: UserStatus) => {
    if (!confirm(`사용자 상태를 "${newStatus === 'active' ? '승인' : newStatus === 'rejected' ? '거절' : '비활성화'}"으로 변경하시겠습니까?`)) {
      return;
    }

    setActionLoading(userId);
    setError('');

    try {
      await updateUserStatus(userId, newStatus);
      await loadUsers(); // 목록 새로고침
    } catch (error) {
      console.error('상태 업데이트 오류:', error);
      setError('상태 업데이트 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    const variants: Record<UserStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }> = {
      pending: { label: '승인 대기', variant: 'warning' },
      active: { label: '활성', variant: 'success' },
      rejected: { label: '거절됨', variant: 'danger' },
      inactive: { label: '비활성', variant: 'info' },
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { label: string; variant: 'success' | 'warning' | 'info' }> = {
      admin: { label: '관리자', variant: 'success' },
      president: { label: '회장', variant: 'warning' },
      member: { label: '회원', variant: 'info' },
    };

    const config = variants[role] || { label: role, variant: 'info' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!user) {
    return null;
  }

  const pendingUsers = users.filter((u) => u.status === 'pending');
  const activeUsers = users.filter((u) => u.status === 'active');

  return (
    <AuthCheck requireAuth={true} requireAdmin={true}>
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">사용자 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            회원가입한 사용자를 승인하고 관리할 수 있습니다.
          </p>
        </div>

        {error && <ErrorMessage message={error} className="mb-4" />}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="p-4">
              <div className="text-sm text-gray-600">총 사용자</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{users.length}</div>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="text-sm text-gray-600">승인 대기</div>
              <div className="text-2xl font-bold text-orange-600 mt-1">{pendingUsers.length}</div>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="text-sm text-gray-600">활성 사용자</div>
              <div className="text-2xl font-bold text-green-600 mt-1">{activeUsers.length}</div>
            </div>
          </Card>
        </div>

        {/* 필터 및 검색 */}
        <Card className="mb-6">
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="이름, 이메일, 동아리명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                >
                  전체
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('pending')}
                >
                  승인 대기
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('active')}
                >
                  활성
                </Button>
                <Button
                  variant={statusFilter === 'rejected' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('rejected')}
                >
                  거절됨
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* 사용자 목록 */}
        <Card>
          <div className="p-6">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">사용자가 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        역할
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        동아리
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        가입일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{u.name}</div>
                            <div className="text-sm text-gray-500">{u.email}</div>
                            {u.phone_number && (
                              <div className="text-xs text-gray-400">{u.phone_number}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(u.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(u.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{u.club_name || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(u.created_at).toLocaleDateString('ko-KR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            {u.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handleStatusUpdate(u.id, 'active')}
                                  isLoading={actionLoading === u.id}
                                  disabled={!!actionLoading}
                                >
                                  승인
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleStatusUpdate(u.id, 'rejected')}
                                  isLoading={actionLoading === u.id}
                                  disabled={!!actionLoading}
                                >
                                  거절
                                </Button>
                              </>
                            )}
                            {u.status === 'active' && u.role !== 'admin' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    // 수정 모달 열기 (추후 구현)
                                    alert('사용자 수정 기능은 준비 중입니다.');
                                  }}
                                  disabled={!!actionLoading}
                                >
                                  수정
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={async () => {
                                    if (confirm(`정말로 ${u.name} 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
                                      setActionLoading(u.id);
                                      try {
                                        const { deleteUser } = await import('@/lib/supabase/user');
                                        await deleteUser(u.id);
                                        await loadUsers();
                                      } catch (error) {
                                        console.error('사용자 삭제 오류:', error);
                                        setError('사용자 삭제 중 오류가 발생했습니다.');
                                      } finally {
                                        setActionLoading(null);
                                      }
                                    }
                                  }}
                                  isLoading={actionLoading === u.id}
                                  disabled={!!actionLoading}
                                >
                                  삭제
                                </Button>
                              </>
                            )}
                            {u.status === 'inactive' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handleStatusUpdate(u.id, 'active')}
                                  isLoading={actionLoading === u.id}
                                  disabled={!!actionLoading}
                                >
                                  활성화
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={async () => {
                                    if (confirm(`정말로 ${u.name} 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
                                      setActionLoading(u.id);
                                      try {
                                        const { deleteUser } = await import('@/lib/supabase/user');
                                        await deleteUser(u.id);
                                        await loadUsers();
                                      } catch (error) {
                                        console.error('사용자 삭제 오류:', error);
                                        setError('사용자 삭제 중 오류가 발생했습니다.');
                                      } finally {
                                        setActionLoading(null);
                                      }
                                    }
                                  }}
                                  isLoading={actionLoading === u.id}
                                  disabled={!!actionLoading}
                                >
                                  삭제
                                </Button>
                              </>
                            )}
                            {u.status === 'rejected' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handleStatusUpdate(u.id, 'active')}
                                  isLoading={actionLoading === u.id}
                                  disabled={!!actionLoading}
                                >
                                  승인
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={async () => {
                                    if (confirm(`정말로 ${u.name} 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
                                      setActionLoading(u.id);
                                      try {
                                        const { deleteUser } = await import('@/lib/supabase/user');
                                        await deleteUser(u.id);
                                        await loadUsers();
                                      } catch (error) {
                                        console.error('사용자 삭제 오류:', error);
                                        setError('사용자 삭제 중 오류가 발생했습니다.');
                                      } finally {
                                        setActionLoading(null);
                                      }
                                    }
                                  }}
                                  isLoading={actionLoading === u.id}
                                  disabled={!!actionLoading}
                                >
                                  삭제
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </main>
      </div>
    </AuthCheck>
  );
}

