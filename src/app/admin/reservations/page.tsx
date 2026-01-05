
'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '../AdminHeader';
import { getReservations, updateReservation } from '@/lib/supabase/reservations';
import { getUsers } from '@/lib/supabase/user';

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 예약 데이터 로딩 (Supabase)
  const loadReservations = async () => {
    try {
      const data = await getReservations();
      
      // UI 형식으로 변환
      const users = await getUsers();
      const userMap = new Map(users.map(u => [u.id, u]));
      
      const convertedReservations = data.map(r => ({
        id: r.id,
        facility: r.facility_name,
        club: userMap.get(r.user_id)?.club_name || '동아리',
        date: r.date,
        time: `${r.start_time}-${r.end_time}`,
        status: r.status,
        applicant: userMap.get(r.user_id)?.name || '신청자',
        purpose: r.purpose,
        participants: r.participants,
        contact: r.contact,
        notes: r.notes,
        adminNotes: r.admin_notes,
        rejectionReason: r.rejection_reason,
        userId: r.user_id,
        createdAt: r.created_at,
        processedAt: r.processed_at,
      }));
      
      setReservations(convertedReservations);
    } catch (error) {
      console.error('예약 로딩 오류:', error);
    }
  };

  useEffect(() => {
    loadReservations();
    const interval = setInterval(loadReservations, 5000); // 5초마다 업데이트

    return () => clearInterval(interval);
  }, []);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '승인 대기';
      case 'approved':
        return '승인됨';
      case 'rejected':
        return '거절됨';
      default:
        return '알 수 없음';
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    if (selectedTab === 'all') return true;
    return reservation.status === selectedTab;
  });

  const handleApproval = async (reservation: any) => {
    setSelectedReservation(reservation);
    setShowApprovalModal(true);
  };

  const handleRejection = async (reservation: any) => {
    setSelectedReservation(reservation);
    setShowRejectionModal(true);
  };

  const handleApprovalSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessing(true);
    
    const formData = new FormData(e.currentTarget);
    const adminNotes = formData.get('adminNotes') as string;

    try {
      await updateReservation(selectedReservation.id, {
        status: 'approved',
        admin_notes: adminNotes || null,
      });
      
      alert('예약이 승인되었습니다.');
      setShowApprovalModal(false);
      setSelectedReservation(null);
      
      // 데이터 다시 로드
      await loadReservations();
      
    } catch (error) {
      console.error('예약 승인 오류:', error);
      alert(error instanceof Error ? error.message : '예약 승인 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessing(true);
    
    const formData = new FormData(e.currentTarget);
    const rejectionReason = formData.get('rejectionReason') as string;

    try {
      await updateReservation(selectedReservation.id, {
        status: 'rejected',
        rejection_reason: rejectionReason || null,
      });
      
      alert('예약이 거절되었습니다.');
      setShowRejectionModal(false);
      setSelectedReservation(null);
      
      // 데이터 다시 로드
      await loadReservations();
      
    } catch (error) {
      console.error('예약 거절 오류:', error);
      alert(error instanceof Error ? error.message : '예약 거절 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 동적 통계 계산
  const stats = {
    total: reservations.length,
    pending: reservations.filter(r => r.status === 'pending').length,
    approved: reservations.filter(r => r.status === 'approved').length,
    rejected: reservations.filter(r => r.status === 'rejected').length
  };

  return (
    <AuthCheck requireAuth={true} requireAdmin={true}>
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">예약 관리</h1>
              <p className="mt-2 text-gray-600">동아리 시설 예약 신청을 관리하고 승인/거절할 수 있습니다.</p>
            </div>
            <div className="text-sm text-gray-500" suppressHydrationWarning={true}>
              실시간 동기화 • {new Date().toLocaleTimeString('ko-KR')}
            </div>
          </div>
        </div>

        {/* 실시간 상태 표시 */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">실시간 동기화</span>
              </div>
              <div className="text-sm text-gray-500" suppressHydrationWarning={true}>
                마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <i className="ri-database-2-line"></i>
              <span>총 {reservations.length}건의 예약 데이터</span>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="ri-calendar-line text-blue-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">전체 예약</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="ri-time-line text-yellow-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">승인 대기</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="ri-check-line text-green-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">승인됨</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="ri-close-line text-red-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">거절됨</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 탭 */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setSelectedTab('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                selectedTab === 'all'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              전체 ({stats.total})
            </button>
            <button
              onClick={() => setSelectedTab('pending')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                selectedTab === 'pending'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              승인 대기 ({stats.pending})
            </button>
            <button
              onClick={() => setSelectedTab('approved')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                selectedTab === 'approved'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              승인됨 ({stats.approved})
            </button>
            <button
              onClick={() => setSelectedTab('rejected')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                selectedTab === 'rejected'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              거절됨 ({stats.rejected})
            </button>
          </div>
        </div>

        {/* 예약 목록 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                예약 목록 ({filteredReservations.length}건)
              </h2>
              {stats.pending > 0 && (
                <div className="flex items-center space-x-2 text-orange-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">{stats.pending}건 승인 대기 중</span>
                </div>
              )}
            </div>
          </div>
          
          {filteredReservations.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <i className="ri-calendar-check-line text-4xl mb-4"></i>
              <p className="text-lg font-medium mb-2">예약이 없습니다</p>
              <p className="text-sm">선택한 상태의 예약이 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredReservations.map((reservation) => (
                <div key={reservation.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <i className="ri-building-line text-blue-600 text-lg"></i>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {reservation.facility}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {reservation.club} - {reservation.applicant}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                          {getStatusText(reservation.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium text-gray-700">날짜:</span>
                          <div>{reservation.date}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">시간:</span>
                          <div>{reservation.time}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">목적:</span>
                          <div>{reservation.purpose}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">인원:</span>
                          <div>{reservation.participants}명</div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-gray-700">연락처:</span> {reservation.contact}
                      </div>
                      
                      {reservation.adminNotes && (
                        <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-700">
                          <span className="font-medium">관리자 메모:</span> {reservation.adminNotes}
                        </div>
                      )}
                      
                      {reservation.rejectionReason && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                          <span className="font-medium">거절 사유:</span> {reservation.rejectionReason}
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-6 flex flex-col space-y-2">
                      <button
                        onClick={() => {
                          setSelectedReservation(reservation);
                          setShowDetailModal(true);
                        }}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200 whitespace-nowrap"
                      >
                        상세보기
                      </button>
                      
                      {reservation.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproval(reservation)}
                            className="px-3 py-1 text-sm bg-green-600 text-white hover:bg-green-700 rounded whitespace-nowrap"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleRejection(reservation)}
                            className="px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 rounded whitespace-nowrap"
                          >
                            거절
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 상세보기 모달 */}
      {showDetailModal && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">예약 상세 정보</h3>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedReservation(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="ri-building-line text-blue-600 text-2xl"></i>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{selectedReservation.facility}</h4>
                    <p className="text-gray-600">{selectedReservation.club}</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedReservation.status)}`}>
                      {getStatusText(selectedReservation.status)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">신청자</label>
                      <p className="text-gray-900">{selectedReservation.applicant}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                      <p className="text-gray-900">{selectedReservation.contact}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">참가 인원</label>
                      <p className="text-gray-900">{selectedReservation.participants}명</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">예약 날짜</label>
                      <p className="text-gray-900">{selectedReservation.date}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">예약 시간</label>
                      <p className="text-gray-900">{selectedReservation.time}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">신청일</label>
                      <p className="text-gray-900">{selectedReservation.createdAt}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">사용 목적</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{selectedReservation.purpose}</p>
                </div>

                {selectedReservation.adminNotes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">관리자 메모</label>
                    <p className="text-gray-900 bg-green-50 p-3 rounded-md border border-green-200">{selectedReservation.adminNotes}</p>
                  </div>
                )}

                {selectedReservation.rejectionReason && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">거절 사유</label>
                    <p className="text-gray-900 bg-red-50 p-3 rounded-md border border-red-200">{selectedReservation.rejectionReason}</p>
                  </div>
                )}

                {selectedReservation.status === 'pending' && (
                  <div className="flex space-x-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleApproval(selectedReservation);
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md font-medium whitespace-nowrap"
                    >
                      승인하기
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleRejection(selectedReservation);
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md font-medium whitespace-nowrap"
                    >
                      거절하기
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 승인 모달 */}
      {showApprovalModal && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">예약 승인</h3>
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedReservation(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm text-green-700">
                  <div><strong>시설:</strong> {selectedReservation.facility}</div>
                  <div><strong>동아리:</strong> {selectedReservation.club}</div>
                  <div><strong>날짜:</strong> {selectedReservation.date}</div>
                  <div><strong>시간:</strong> {selectedReservation.time}</div>
                </div>
              </div>

              <form onSubmit={handleApprovalSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    관리자 메모 (선택)
                  </label>
                  <textarea
                    name="adminNotes"
                    maxLength={500}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="승인과 함께 전달할 메시지나 주의사항을 입력하세요"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowApprovalModal(false);
                      setSelectedReservation(null);
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium whitespace-nowrap"
                    disabled={isProcessing}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md text-sm font-medium whitespace-nowrap disabled:opacity-50"
                    disabled={isProcessing}
                  >
                    {isProcessing ? '처리 중...' : '승인하기'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 거절 모달 */}
      {showRejectionModal && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">예약 거절</h3>
                <button
                  onClick={() => {
                    setShowRejectionModal(false);
                    setSelectedReservation(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="text-sm text-red-700">
                  <div><strong>시설:</strong> {selectedReservation.facility}</div>
                  <div><strong>동아리:</strong> {selectedReservation.club}</div>
                  <div><strong>날짜:</strong> {selectedReservation.date}</div>
                  <div><strong>시간:</strong> {selectedReservation.time}</div>
                </div>
              </div>

              <form onSubmit={handleRejectionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    거절 사유 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="rejectionReason"
                    required
                    maxLength={500}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    placeholder="예약을 거절하는 구체적인 사유를 입력해주세요"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectionModal(false);
                      setSelectedReservation(null);
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium whitespace-nowrap"
                    disabled={isProcessing}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md text-sm font-medium whitespace-nowrap disabled:opacity-50"
                    disabled={isProcessing}
                  >
                    {isProcessing ? '처리 중...' : '거절하기'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </AuthCheck>
  );
}