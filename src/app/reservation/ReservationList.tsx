
'use client';

import { useState, useEffect } from 'react';
import { getMyReservations, deleteReservation } from '@/lib/supabase/reservations';
import { Button } from '@/components/ui';

interface Reservation {
  id: string;
  facility: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected';
  purpose: string;
  participants: number;
  contact: string;
  notes?: string;
  createdAt: string;
  adminNotes?: string;
  rejectionReason?: string;
}

export default function ReservationList() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 예약 데이터 로드 (Supabase)
  const loadReservations = async () => {
    try {
      setLoading(true);
      const data = await getMyReservations();
      
      // UI 형식으로 변환
      const convertedReservations: Reservation[] = data.map(r => ({
        id: r.id,
        facility: r.facility_name,
        date: r.date,
        time: `${r.start_time}-${r.end_time}`,
        status: r.status,
        purpose: r.purpose,
        participants: r.participants,
        contact: r.contact,
        notes: r.notes || undefined,
        createdAt: r.created_at,
        adminNotes: r.admin_notes || undefined,
        rejectionReason: r.rejection_reason || undefined,
      }));
      
      setReservations(convertedReservations);
    } catch (error) {
      console.error('예약 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
    const interval = setInterval(loadReservations, 5000); // 5초마다 업데이트

    return () => clearInterval(interval);
  }, []);

  // 예약 삭제
  const handleDelete = async (reservationId: string) => {
    if (!confirm('정말로 이 예약을 취소하시겠습니까?')) {
      return;
    }

    try {
      setDeletingId(reservationId);
      await deleteReservation(reservationId);
      alert('예약이 취소되었습니다.');
      await loadReservations();
    } catch (error) {
      console.error('예약 삭제 오류:', error);
      alert(error instanceof Error ? error.message : '예약 취소 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

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

  const stats = {
    total: reservations.length,
    pending: reservations.filter(r => r.status === 'pending').length,
    approved: reservations.filter(r => r.status === 'approved').length,
    rejected: reservations.filter(r => r.status === 'rejected').length
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">내 예약 현황</h2>
          <div className="text-sm text-gray-600">
            총 {stats.total}건의 예약
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="p-6 border-b">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">전체</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">승인 대기</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-600">승인됨</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600">거절됨</div>
          </div>
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="p-6 border-b">
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
      <div className="divide-y">
        {filteredReservations.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <i className="ri-calendar-check-line text-4xl mb-4"></i>
            <p className="text-lg font-medium mb-2">예약이 없습니다</p>
            <p className="text-sm">새로운 예약을 신청해보세요.</p>
          </div>
        ) : (
          filteredReservations
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((reservation) => (
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
                          {reservation.purpose}
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
                        <span className="font-medium text-gray-700">인원:</span>
                        <div>{reservation.participants}명</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">신청일:</span>
                        <div>{new Date(reservation.createdAt).toLocaleDateString('ko-KR')}</div>
                      </div>
                    </div>
                    
                    {reservation.adminNotes && (
                      <div className="mt-2 p-3 bg-green-50 rounded-md border border-green-200">
                        <div className="text-sm text-green-700">
                          <span className="font-medium">관리자 메모:</span> {reservation.adminNotes}
                        </div>
                      </div>
                    )}
                    
                    {reservation.rejectionReason && (
                      <div className="mt-2 p-3 bg-red-50 rounded-md border border-red-200">
                        <div className="text-sm text-red-700">
                          <span className="font-medium">거절 사유:</span> {reservation.rejectionReason}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-6 flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setSelectedReservation(reservation);
                        setShowDetailModal(true);
                      }}
                      className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200 whitespace-nowrap"
                    >
                      상세보기
                    </button>
                    {reservation.status === 'pending' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(reservation.id)}
                        isLoading={deletingId === reservation.id}
                        disabled={!!deletingId}
                      >
                        <i className="ri-delete-bin-line mr-2"></i>
                        취소
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>

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
                    <p className="text-gray-600">{selectedReservation.purpose}</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedReservation.status)}`}>
                      {getStatusText(selectedReservation.status)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">참가 인원</label>
                      <p className="text-gray-900">{selectedReservation.participants}명</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                      <p className="text-gray-900">{selectedReservation.contact}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">신청일</label>
                      <p className="text-gray-900">{new Date(selectedReservation.createdAt).toLocaleDateString('ko-KR')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedReservation.status)}`}>
                        {getStatusText(selectedReservation.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">사용 목적</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{selectedReservation.purpose}</p>
                </div>

                {selectedReservation.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">특이사항</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{selectedReservation.notes}</p>
                  </div>
                )}

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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
