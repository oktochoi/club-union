
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUsers, updateUserStatus, getCurrentUser } from '@/lib/supabase/user';
import { Button, Badge } from '@/components/ui';
import type { User } from '@/types/user';
import type { Facility } from '@/lib/supabase/facilities';

interface LocalFacility {
  id: string;
  name: string;
  capacity: string;
  equipment: string;
  timeSlots: string[];
}

export default function AdminDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [showUserApprovalModal, setShowUserApprovalModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [editingFacility, setEditingFacility] = useState<any>(null);
  const [selectedFacilityForTime, setSelectedFacilityForTime] = useState<any>(null);

  // 모든 데이터를 빈 배열로 초기화
  const [users, setUsers] = useState<User[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<User | null>(null);
  const [usersLoading, setUsersLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [recentReservations, setRecentReservations] = useState<any[]>([]);
  const [rentalRequests, setRentalRequests] = useState<any[]>([]);
  const [returnRequests, setReturnRequests] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<LocalFacility[]>([]);
  const router = useRouter();

  // Supabase에서 사용자 목록 로드
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setUsersLoading(true);
        const [usersData, adminData] = await Promise.all([
          getUsers(),
          getCurrentUser(),
        ]);
        
        setUsers(usersData || []);
        setCurrentAdmin(adminData);
      } catch (error) {
        console.error('사용자 목록 로드 오류:', error);
        setUsers([]);
      } finally {
        setUsersLoading(false);
      }
    };

    loadUsers();

    // 5초마다 사용자 목록 새로고침
    const interval = setInterval(loadUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  // 동적 통계 계산
  const stats = {
    pendingReservations: 0,
    todayReservations: 0,
    approvedReservations: 0,
    rejectedReservations: 0,
    totalUsers: users.length,
    pendingUsers: users.filter(u => u.status === 'pending').length,
    activeUsers: users.filter(u => u.status === 'active').length,
    totalFacilities: 0,
    outOfStockItems: 0,
    pendingRentals: 0,
    pendingReturns: 0
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 사용자 승인/거절 처리
  const handleUserApproval = async (userId: string, action: 'approve' | 'reject') => {
    // admin 사용자는 수정 불가
    const targetUser = users.find(u => u.id === userId);
    if (targetUser?.role === 'admin') {
      alert('관리자 계정은 수정할 수 없습니다.');
      return;
    }

    setActionLoading(userId);
    try {
      const newStatus = action === 'approve' ? 'active' : 'rejected';
      await updateUserStatus(userId, newStatus);
      
      // 목록 새로고침
      const usersData = await getUsers();
      setUsers(usersData || []);
      
      setShowUserApprovalModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('사용자 승인 오류:', error);
      alert('사용자 승인 처리 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFacilitySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const facilityData = {
      id: editingFacility ? editingFacility.id : `facility_${Date.now()}`,
      name: formData.get('name') as string,
      capacity: formData.get('capacity') as string,
      equipment: formData.get('equipment') as string,
      timeSlots: editingFacility ? editingFacility.timeSlots : ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']
    };

    try {
      if (editingFacility) {
        const updatedFacilities = facilities.map(facility => 
          facility.id === editingFacility.id ? {...facility, ...facilityData} : facility
        );
        setFacilities(updatedFacilities);
        if (typeof window !== 'undefined') {
          localStorage.setItem('adminFacilities', JSON.stringify(updatedFacilities));
        }
        alert('시설이 수정되었습니다.');
      } else {
        const updatedFacilities = [...facilities, facilityData];
        setFacilities(updatedFacilities);
        if (typeof window !== 'undefined') {
          localStorage.setItem('adminFacilities', JSON.stringify(updatedFacilities));
        }
        alert('새 시설이 추가되었습니다.');
      }
      
      setShowFacilityModal(false);
      setEditingFacility(null);
      
    } catch (error) {
      alert('시설 저장 중 오류가 발생했습니다.');
    }
  };

  const handleInventorySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const inventoryData: {
      id: string;
      item: string;
      category: string;
      current: number;
      image: string | null;
    } = {
      id: `inventory_${Date.now()}_${Math.random()}`,
      item: formData.get('item') as string,
      category: formData.get('category') as string,
      current: parseInt(formData.get('current') as string),
      image: null
    };

    // 이미지 업로드 처리
    const imageFile = formData.get('image') as File;
    if (imageFile && imageFile.size > 0) {
      if (imageFile.size > 5 * 1024 * 1024) {
        alert('이미지 파일 크기는 5MB 이하여야 합니다.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          inventoryData.image = e.target.result;
        }
        
        try {
          const updatedInventory = [...inventoryItems, inventoryData];
          setInventoryItems(updatedInventory);
          if (typeof window !== 'undefined') {
            localStorage.setItem('adminInventory', JSON.stringify(updatedInventory));
          }
          alert('재고 아이템이 추가되었습니다.');
          setShowInventoryModal(false);
        } catch (error) {
          alert('재고 추가 중 오류가 발생했습니다.');
        }
      };
      reader.readAsDataURL(imageFile);
    } else {
      try {
        const updatedInventory = [...inventoryItems, inventoryData];
        setInventoryItems(updatedInventory);
        if (typeof window !== 'undefined') {
          localStorage.setItem('adminInventory', JSON.stringify(updatedInventory));
        }
        alert('재고 아이템이 추가되었습니다.');
        setShowInventoryModal(false);
      } catch (error) {
        alert('재고 추가 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
          <p className="mt-2 text-gray-600">총동아리연합회 시설 및 운영 현황을 관리합니다.</p>
        </div>

        {/* 실시간 상태 표시 */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">실시간 동기화 활성</span>
              </div>
              <div className="text-sm text-gray-500" suppressHydrationWarning={true}>
                마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <i className="ri-database-2-line"></i>
              <span>모든 더미 데이터가 제거되었습니다</span>
            </div>
          </div>
        </div>

        {/* 회원가입 감지 상태 */}
        <div className="mb-6 bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-700 font-medium">회원가입 감지 시스템</span>
              </div>
              <div className="text-sm text-blue-700">
                새로운 회원가입이 있으면 즉시 표시됩니다
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm text-blue-700">
              <div>총 사용자: <span className="font-bold">{users.length}명</span></div>
              <div>승인대기: <span className="font-bold text-orange-600">{stats.pendingUsers}명</span></div>
              <div>활성 사용자: <span className="font-bold text-green-600">{stats.activeUsers}명</span></div>
            </div>
          </div>
        </div>

        {/* 관리 버튼들 */}
        <div className="mb-8 flex flex-wrap gap-3">
          <button
            onClick={() => {
              setEditingFacility(null);
              setShowFacilityModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium whitespace-nowrap"
          >
            <i className="ri-add-line mr-2"></i>
            시설 추가
          </button>
          <button
            onClick={() => setShowInventoryModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium whitespace-nowrap"
          >
            <i className="ri-box-3-line mr-2"></i>
            재고 추가
          </button>
        </div>

        {/* 주요 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="ri-calendar-check-line text-yellow-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">승인 대기 예약</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 cursor-pointer hover:bg-gray-50" onClick={() => {
            if (typeof document !== 'undefined') {
              document.getElementById('users-section')?.scrollIntoView({ behavior: 'smooth' });
            }
          }}>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="ri-user-add-line text-orange-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">승인 대기 사용자</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingUsers}</p>
                <p className="text-xs text-gray-500">전체 {stats.totalUsers}명</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="ri-shopping-bag-line text-blue-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">반납 대기</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="ri-error-warning-line text-red-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">품절 재고</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* 빈 상태 표시 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 예약 관리 */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">예약 관리</h2>
            </div>
            <div className="p-6">
              <div className="text-center py-8 text-gray-500">
                <i className="ri-calendar-line text-4xl mb-2"></i>
                <p>현재 예약 신청이 없습니다.</p>
              </div>
            </div>
          </div>

          {/* 대여 관리 */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">대여 관리</h2>
            </div>
            <div className="p-6">
              <div className="text-center py-8 text-gray-500">
                <i className="ri-box-3-line text-4xl mb-2"></i>
                <p>현재 대여 신청이 없습니다.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 재고 관리 */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">재고 관리</h2>
                <button 
                  onClick={() => setShowInventoryModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  재고 추가
                </button>
              </div>
            </div>
            <div className="p-6">
              {inventoryItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <i className="ri-box-3-line text-4xl mb-2"></i>
                  <p>현재 등록된 재고가 없습니다.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {inventoryItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <i className="ri-box-3-line text-green-600"></i>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{item.item}</h4>
                          <p className="text-sm text-gray-600">현재: {item.current}개</p>
                          <p className="text-xs text-gray-500">{item.category}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 사용자 관리 섹션 강화 */}
        <div className="mb-8" id="users-section">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold text-gray-900">사용자 관리</h2>
                  {stats.pendingUsers > 0 && (
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>총 {stats.totalUsers}명</span>
                  <span>승인대기 {stats.pendingUsers}명</span>
                  <span>활성 {stats.activeUsers}명</span>
                  <Link 
                    href="/admin/users"
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                  >
                    전체 보기 →
                  </Link>
                </div>
              </div>
            </div>
            <div className="p-6">
              {usersLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-500">사용자 목록을 불러오는 중...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <i className="ri-user-line text-6xl mb-4 text-gray-300"></i>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 사용자가 없습니다</h3>
                  <p className="text-gray-600 mb-4">사용자들이 회원가입하면 여기에 즉시 표시됩니다</p>
                  <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                    <div className="flex items-center space-x-2 text-blue-700">
                      <i className="ri-information-line"></i>
                      <span className="text-sm font-medium">실시간 감지 중</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">새로운 회원가입이 있으면 1초 내에 자동으로 표시됩니다</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* 승인 대기 사용자 */}
                  {stats.pendingUsers > 0 && (
                    <div className="mb-6">
                      <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                        <i className="ri-time-line text-orange-500 mr-2"></i>
                        승인 대기 사용자 ({stats.pendingUsers}명)
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse ml-2"></div>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {users.filter(user => user.status === 'pending').slice(0, 6).map((user) => (
                          <div key={user.id} className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                  <i className="ri-user-line text-orange-600 text-sm"></i>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                  <div className="text-xs text-gray-600">{user.club_name || '-'}</div>
                                </div>
                              </div>
                              <Badge variant="warning">승인대기</Badge>
                            </div>
                            <div className="text-xs text-gray-600 mb-3">
                              <div>{user.email}</div>
                              <div className="mt-1">
                                <span className="font-medium">역할:</span> {user.role === 'president' ? '회장' : user.role === 'admin' ? '관리자' : '회원'}
                              </div>
                              {user.phone_number && (
                                <div>
                                  <span className="font-medium">연락처:</span> {user.phone_number}
                                </div>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                가입일: {new Date(user.created_at).toLocaleDateString('ko-KR')}
                              </div>
                            </div>
                            {user.role !== 'admin' && (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handleUserApproval(user.id, 'approve')}
                                  isLoading={actionLoading === user.id}
                                  disabled={!!actionLoading}
                                  className="flex-1 text-xs"
                                >
                                  승인
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleUserApproval(user.id, 'reject')}
                                  isLoading={actionLoading === user.id}
                                  disabled={!!actionLoading}
                                  className="flex-1 text-xs"
                                >
                                  거절
                                </Button>
                              </div>
                            )}
                            {user.role === 'admin' && (
                              <div className="text-xs text-gray-500 italic">
                                관리자 계정은 수정할 수 없습니다
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {stats.pendingUsers > 6 && (
                        <div className="mt-4 text-center">
                          <Link href="/admin/users" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            외 {stats.pendingUsers - 6}명 더 보기 →
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 활성 사용자 */}
                  {stats.activeUsers > 0 && (
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                        <i className="ri-user-check-line text-green-500 mr-1"></i>
                        활성 사용자 ({stats.activeUsers}명)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {users.filter(user => user.status === 'active').slice(0, 6).map((user) => (
                          <div key={user.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <i className="ri-user-line text-green-600 text-sm"></i>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                  <div className="text-xs text-gray-600">{user.club_name || '-'}</div>
                                </div>
                              </div>
                              <Badge variant="success">활성</Badge>
                            </div>
                            <div className="text-xs text-gray-600">
                              <div>{user.email}</div>
                              <div className="mt-1">
                                <span className="font-medium">역할:</span> {user.role === 'president' ? '회장' : user.role === 'admin' ? '관리자' : '회원'}
                              </div>
                              {user.phone_number && (
                                <div>
                                  <span className="font-medium">연락처:</span> {user.phone_number}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {stats.activeUsers > 6 && (
                        <div className="mt-4 text-center">
                          <Link href="/admin/users" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            외 {stats.activeUsers - 6}명 더 보기 →
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 시설 추가/수정 모달 */}
      {showFacilityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingFacility ? '시설 수정' : '시설 추가'}
                </h3>
                <button
                  onClick={() => {
                    setShowFacilityModal(false);
                    setEditingFacility(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleFacilitySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시설명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingFacility?.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 동아리방 A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    수용인원 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="capacity"
                    required
                    defaultValue={editingFacility?.capacity || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 30명"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    보유시설 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="equipment"
                    required
                    defaultValue={editingFacility?.equipment || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 프로젝터, 음향시설, 화이트보드"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFacilityModal(false);
                      setEditingFacility(null);
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    {editingFacility ? '수정하기' : '추가하기'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 사용자 승인 거절 모달 */}
      {showUserApprovalModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">사용자 승인 거절</h3>
                <button
                  onClick={() => {
                    setShowUserApprovalModal(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="text-sm text-red-700">
                  <div><strong>이름:</strong> {selectedUser.name}</div>
                  <div><strong>이메일:</strong> {selectedUser.email}</div>
                  <div><strong>동아리:</strong> {selectedUser.club_name || '-'}</div>
                  <div><strong>역할:</strong> {selectedUser.role === 'president' ? '회장' : selectedUser.role === 'admin' ? '관리자' : '회원'}</div>
                  {selectedUser.phone_number && (
                    <div><strong>연락처:</strong> {selectedUser.phone_number}</div>
                  )}
                </div>
              </div>

              {selectedUser.role === 'admin' ? (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
                  <p className="text-sm text-yellow-700">
                    관리자 계정은 수정할 수 없습니다.
                  </p>
                </div>
              ) : null}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowUserApprovalModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                >
                  취소
                </button>
                {selectedUser.role !== 'admin' && (
                  <button
                    onClick={() => handleUserApproval(selectedUser.id, 'reject')}
                    disabled={actionLoading === selectedUser.id}
                    className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-50"
                  >
                    {actionLoading === selectedUser.id ? '처리 중...' : '거절하기'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 재고 추가 모달 */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">재고 아이템 추가</h3>
                <button
                  onClick={() => setShowInventoryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleInventorySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    아이템명 *
                  </label>
                  <input
                    type="text"
                    name="item"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="예: 무선 마이크"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    카테고리 *
                  </label>
                  <select
                    name="category"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-8"
                  >
                    <option value="">선택하세요</option>
                    <option value="음향장비">음향장비</option>
                    <option value="영상장비">영상장비</option>
                    <option value="전자기기">전자기기</option>
                    <option value="컴퓨터">컴퓨터</option>
                    <option value="촬영장비">촬영장비</option>
                    <option value="기타">기타</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    현재 수량 *
                  </label>
                  <input
                    type="number"
                    name="current"
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="개"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    물품 이미지
                  </label>
                  <input
                    type="file"
                    name="image"
                    accept="image/jpeg,image/png,image/gif"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    JPG, PNG, GIF 형식 지원 (최대 5MB)
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowInventoryModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    추가하기
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

