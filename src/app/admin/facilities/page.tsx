'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '../AdminHeader';
import { Button, Card, Input } from '@/components/ui';
import { 
  getFacilities, 
  createFacility, 
  updateFacility, 
  deleteFacility,
  type Facility as FacilityType 
} from '@/lib/supabase/facilities';
import { getReservationsByFacilityAndDate, updateReservation } from '@/lib/supabase/reservations';
import { getUsers } from '@/lib/supabase/user';

interface Reservation {
  id: string;
  facility: string;
  club: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'rejected';
  applicant: string;
  purpose: string;
  participants: number;
  contact: string;
}

// DB의 Facility 타입을 UI에서 사용하는 형식으로 변환
interface Facility {
  id: string;
  name: string;
  capacity: string;
  equipment: string;
  timeSlots: string[];
}

export default function AdminFacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [facilityForm, setFacilityForm] = useState({
    name: '',
    capacity: '',
    equipment: '',
    timeSlots: [] as string[]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 시설 데이터 로딩 (Supabase)
  const loadFacilities = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getFacilities(true); // 비활성화된 시설도 포함
      
      // DB 형식을 UI 형식으로 변환
      const convertedFacilities: Facility[] = data.map(f => ({
        id: f.id,
        name: f.name,
        capacity: f.capacity,
        equipment: f.equipment || '',
        timeSlots: f.time_slots
      }));
      
      setFacilities(convertedFacilities);
      
      // 선택된 시설이 없거나 삭제된 경우 첫 번째 시설 선택
      if (!selectedFacility || !convertedFacilities.find(f => f.id === selectedFacility.id)) {
        if (convertedFacilities.length > 0) {
          setSelectedFacility(convertedFacilities[0]);
        } else {
          setSelectedFacility(null);
        }
      }
    } catch (err) {
      console.error('시설 로딩 오류:', err);
      setError(err instanceof Error ? err.message : '시설을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 예약 데이터 로딩 (Supabase)
  const loadReservations = async () => {
    try {
      if (!selectedFacility) return;
      
      // 사용자 정보 가져오기
      const users = await getUsers();
      const userMap = new Map(users.map(u => [u.id, u]));
      
      // 7일간의 예약 데이터 로드
      const allReservations: any[] = [];
      for (const date of days) {
        const dateStr = formatDate(date);
        const dayReservations = await getReservationsByFacilityAndDate(selectedFacility.id, dateStr);
        allReservations.push(...dayReservations.map(r => ({
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
        })));
      }
      
      setReservations(allReservations);
    } catch (error) {
      console.error('예약 데이터 로딩 오류:', error);
    }
  };

  useEffect(() => {
    loadFacilities();
    const interval = setInterval(() => {
      loadFacilities();
    }, 10000); // 10초마다 시설 데이터 동기화

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedFacility) {
      loadReservations();
      const interval = setInterval(() => {
        loadReservations();
      }, 5000); // 5초마다 예약 데이터 동기화

      return () => clearInterval(interval);
    }
  }, [selectedFacility]);

  // 7일간의 날짜 배열 생성 (오늘부터)
  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const days = getNext7Days();

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDateDisplay = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '내일';
    
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.getMonth() + 1}/${date.getDate()}(${weekdays[date.getDay()]})`;
  };

  // 특정 시설, 날짜, 시간대의 예약 현황 확인
  const getReservationStatus = (facilityName: string, date: string, timeSlot: string): {
    status: 'approved' | 'pending' | 'available';
    reservation: Reservation | null;
  } => {
    // 승인된 예약 우선 확인 (예약 불가)
    const approvedReservation = reservations.find(r => 
      r.facility === facilityName && 
      r.date === date && 
      r.status === 'approved' &&
      (r.time === timeSlot || r.time?.includes(timeSlot) || 
       (r.time?.includes('-') && r.time.split('-')[0] === timeSlot))
    );

    if (approvedReservation) {
      return { status: 'approved', reservation: approvedReservation };
    }

    // 대기 중인 예약 확인
    const pendingReservation = reservations.find(r => 
      r.facility === facilityName && 
      r.date === date && 
      r.status === 'pending' &&
      (r.time === timeSlot || r.time?.includes(timeSlot) || 
       (r.time?.includes('-') && r.time.split('-')[0] === timeSlot))
    );

    if (pendingReservation) {
      return { status: 'pending', reservation: pendingReservation };
    }

    return { status: 'available', reservation: null };
  };

  // 전체 통계 계산 (7일간)
  const getOverallStats = () => {
    if (!selectedFacility) return { total: 0, available: 0, pending: 0, approved: 0 };

    let total = 0, available = 0, pending = 0, approved = 0;

    days.forEach(date => {
      const dateStr = formatDate(date);
      selectedFacility.timeSlots.forEach(timeSlot => {
        total++;
        const { status } = getReservationStatus(selectedFacility.name, dateStr, timeSlot);
        if (status === 'available') available++;
        else if (status === 'pending') pending++;
        else if (status === 'approved') approved++;
      });
    });

    return { total, available, pending, approved };
  };

  const stats = getOverallStats();

  // 시설 추가/수정 모달 열기
  const handleOpenFacilityModal = (facility?: Facility) => {
    if (facility) {
      setEditingFacility(facility);
      setFacilityForm({
        name: facility.name,
        capacity: facility.capacity,
        equipment: facility.equipment,
        timeSlots: [...facility.timeSlots]
      });
    } else {
      setEditingFacility(null);
      setFacilityForm({
        name: '',
        capacity: '',
        equipment: '',
        timeSlots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']
      });
    }
    setShowFacilityModal(true);
  };

  // 시설 저장
  const handleSaveFacility = async () => {
    if (!facilityForm.name.trim()) {
      alert('시설명을 입력해주세요.');
      return;
    }
    if (!facilityForm.capacity.trim()) {
      alert('수용인원을 입력해주세요.');
      return;
    }
    if (facilityForm.timeSlots.length === 0) {
      alert('최소 1개 이상의 시간대를 설정해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (editingFacility) {
        // 수정
        await updateFacility(editingFacility.id, {
          name: facilityForm.name,
          capacity: facilityForm.capacity,
          equipment: facilityForm.equipment || undefined,
          time_slots: facilityForm.timeSlots
        });
        alert('시설이 수정되었습니다.');
      } else {
        // 추가
        const newFacility = await createFacility({
          name: facilityForm.name,
          capacity: facilityForm.capacity,
          equipment: facilityForm.equipment || undefined,
          time_slots: facilityForm.timeSlots
        });
        
        // UI 형식으로 변환
        const convertedFacility: Facility = {
          id: newFacility.id,
          name: newFacility.name,
          capacity: newFacility.capacity,
          equipment: newFacility.equipment || '',
          timeSlots: newFacility.time_slots
        };
        
        setSelectedFacility(convertedFacility);
        alert('새 시설이 추가되었습니다.');
      }
      
      // 데이터 다시 로드
      await loadFacilities();
      setShowFacilityModal(false);
      setEditingFacility(null);
    } catch (err) {
      console.error('시설 저장 오류:', err);
      setError(err instanceof Error ? err.message : '시설 저장 중 오류가 발생했습니다.');
      alert(err instanceof Error ? err.message : '시설 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 시설 삭제
  const handleDeleteFacility = async (facilityId: string) => {
    if (!confirm('정말로 이 시설을 삭제하시겠습니까? 관련된 모든 예약 정보도 함께 삭제됩니다.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const facility = facilities.find(f => f.id === facilityId);
      await deleteFacility(facilityId);
      
      // 관련 예약도 삭제 (localStorage)
      if (facility && typeof window !== 'undefined') {
        const updatedReservations = reservations.filter(r => r.facility !== facility.name);
        setReservations(updatedReservations);
        localStorage.setItem('adminReservations', JSON.stringify(updatedReservations));
      }

      // 선택된 시설이 삭제된 경우 첫 번째 시설 선택
      if (selectedFacility?.id === facilityId) {
        const remainingFacilities = facilities.filter(f => f.id !== facilityId);
        setSelectedFacility(remainingFacilities.length > 0 ? remainingFacilities[0] : null);
      }
      
      // 데이터 다시 로드
      await loadFacilities();
      alert('시설이 삭제되었습니다.');
    } catch (err) {
      console.error('시설 삭제 오류:', err);
      setError(err instanceof Error ? err.message : '시설 삭제 중 오류가 발생했습니다.');
      alert(err instanceof Error ? err.message : '시설 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 시간대 추가
  const handleAddTimeSlot = () => {
    const time = prompt('시간을 입력하세요 (예: 09:00)');
    if (time && /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      if (facilityForm.timeSlots.includes(time)) {
        alert('이미 추가된 시간대입니다.');
        return;
      }
      setFacilityForm({
        ...facilityForm,
        timeSlots: [...facilityForm.timeSlots, time].sort()
      });
    } else if (time) {
      alert('올바른 시간 형식을 입력해주세요. (예: 09:00)');
    }
  };

  // 시간대 삭제
  const handleRemoveTimeSlot = (time: string) => {
    setFacilityForm({
      ...facilityForm,
      timeSlots: facilityForm.timeSlots.filter(t => t !== time)
    });
  };

  // 예약 승인 모달 열기
  const handleApproval = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowApprovalModal(true);
  };

  // 예약 거절 모달 열기
  const handleRejection = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowRejectionModal(true);
  };

  // 예약 승인 제출
  const handleApprovalSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedReservation) return;
    
    setIsProcessing(true);
    
    const formData = new FormData(e.currentTarget);
    const adminNotes = formData.get('adminNotes') as string;

    try {
      // DB의 예약 ID를 찾아야 함
      const dbReservations = await getReservationsByFacilityAndDate(
        selectedFacility?.id || '',
        selectedReservation.date
      );
      
      const dbReservation = dbReservations.find(r => 
        r.facility_name === selectedReservation.facility &&
        r.date === selectedReservation.date &&
        (r.start_time === selectedReservation.time || r.start_time?.includes(selectedReservation.time))
      );

      if (!dbReservation) {
        throw new Error('예약을 찾을 수 없습니다.');
      }

      await updateReservation(dbReservation.id, {
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

  // 예약 거절 제출
  const handleRejectionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedReservation) return;
    
    setIsProcessing(true);
    
    const formData = new FormData(e.currentTarget);
    const rejectionReason = formData.get('rejectionReason') as string;

    if (!rejectionReason || !rejectionReason.trim()) {
      alert('거절 사유를 입력해주세요.');
      setIsProcessing(false);
      return;
    }

    try {
      // DB의 예약 ID를 찾아야 함
      const dbReservations = await getReservationsByFacilityAndDate(
        selectedFacility?.id || '',
        selectedReservation.date
      );
      
      const dbReservation = dbReservations.find(r => 
        r.facility_name === selectedReservation.facility &&
        r.date === selectedReservation.date &&
        (r.start_time === selectedReservation.time || r.start_time?.includes(selectedReservation.time))
      );

      if (!dbReservation) {
        throw new Error('예약을 찾을 수 없습니다.');
      }

      await updateReservation(dbReservation.id, {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">시설별 예약 현황</h1>
            <p className="mt-2 text-gray-600">각 시설의 시간대별 예약 현황을 확인하고 관리할 수 있습니다.</p>
          </div>
          <Button onClick={() => handleOpenFacilityModal()} disabled={loading}>
            <i className="ri-add-line mr-2"></i>
            시설 추가
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* 시설 선택 탭 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {facilities.map(facility => (
              <div key={facility.id} className="relative group">
                <button
                  onClick={() => setSelectedFacility(facility)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedFacility?.id === facility.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {facility.name}
                </button>
                <div className="absolute top-0 right-0 -mt-1 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenFacilityModal(facility);
                      }}
                      className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600"
                      title="수정"
                    >
                      <i className="ri-edit-line"></i>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFacility(facility.id);
                      }}
                      className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                      title="삭제"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedFacility && (
          <>
            {/* 시설 정보 */}
            <div className="mb-6 bg-white rounded-lg shadow-sm border p-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{selectedFacility.name}</h2>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><span className="font-medium">수용인원:</span> {selectedFacility.capacity}</div>
                  <div><span className="font-medium">보유시설:</span> {selectedFacility.equipment}</div>
                  <div><span className="font-medium">운영시간:</span> {selectedFacility.timeSlots.length}개 시간대</div>
                </div>
              </div>
            </div>

            {/* 현황 통계 (7일간) */}
            <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="ri-calendar-line text-blue-600"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">전체 (7일)</p>
                    <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="ri-check-circle-line text-green-600"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">예약 가능</p>
                    <p className="text-xl font-bold text-green-600">{stats.available}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <i className="ri-time-line text-yellow-600"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">승인 대기</p>
                    <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <i className="ri-calendar-check-line text-red-600"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">예약됨</p>
                    <p className="text-xl font-bold text-red-600">{stats.approved}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 7일 타임테이블 */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    7일간 시간대별 예약 현황
                  </h3>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded mr-2"></div>
                      <span className="text-gray-600">예약 가능</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded mr-2"></div>
                      <span className="text-gray-600">승인 대기</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded mr-2"></div>
                      <span className="text-gray-600">예약됨</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 overflow-x-auto">
                <div className="min-w-full">
                  {/* 헤더: 날짜 */}
                  <div className="grid grid-cols-8 gap-2 mb-2">
                    <div className="font-semibold text-gray-700 text-sm p-2">시간</div>
                    {days.map((date, index) => (
                      <div
                        key={index}
                        className="text-center p-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700"
                      >
                        <div className="font-semibold">{formatDateDisplay(date)}</div>
                      </div>
                    ))}
                  </div>

                  {/* 타임테이블 본문 */}
                  <div className="space-y-1">
                    {selectedFacility.timeSlots.map(time => (
                      <div key={time} className="grid grid-cols-8 gap-2">
                        {/* 시간 라벨 */}
                        <div className="flex items-center justify-center p-2 text-sm font-medium text-gray-700 bg-gray-50 rounded">
                          {time}
                        </div>
                        
                        {/* 각 날짜별 셀 */}
                        {days.map((date, dateIndex) => {
                          const dateStr = formatDate(date);
                          const { status, reservation } = getReservationStatus(selectedFacility.name, dateStr, time);
                          const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                          
                          let cellClass = '';
                          let cellContent = '';
                          let onClickHandler: (() => void) | undefined = undefined;

                          if (isPast) {
                            cellClass = 'bg-gray-100 text-gray-400 cursor-not-allowed';
                            cellContent = '-';
                          } else if (status === 'approved') {
                            cellClass = 'bg-red-100 text-red-700 border-2 border-red-300 cursor-pointer hover:bg-red-200';
                            cellContent = reservation ? reservation.club : '예약불가';
                            onClickHandler = () => {
                              if (reservation) {
                                setSelectedReservation(reservation);
                                setShowDetailModal(true);
                              }
                            };
                          } else if (status === 'pending') {
                            cellClass = 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300 cursor-pointer hover:bg-yellow-200';
                            cellContent = reservation ? `${reservation.club} (대기중)` : '대기중';
                            onClickHandler = () => {
                              if (reservation) {
                                setSelectedReservation(reservation);
                                setShowDetailModal(true);
                              }
                            };
                          } else {
                            cellClass = 'bg-green-100 text-green-700 border-2 border-green-300 cursor-default';
                            cellContent = '예약가능';
                          }

                          return (
                            <div
                              key={dateIndex}
                              onClick={onClickHandler}
                              className={`p-3 text-center text-xs font-medium rounded transition-all ${cellClass}`}
                              title={isPast ? '과거 날짜' : status === 'approved' ? '예약됨 - 클릭하여 상세보기' : status === 'pending' ? '승인 대기 - 클릭하여 상세보기' : '예약 가능'}
                            >
                              <div className="truncate">{cellContent}</div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {facilities.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border">
            <i className="ri-building-line text-4xl text-gray-400 mb-4"></i>
            <p className="text-gray-600 mb-2">등록된 시설이 없습니다.</p>
            <p className="text-sm text-gray-500">관리자 대시보드에서 시설을 먼저 등록해주세요.</p>
          </div>
        )}
      </main>

      {/* 예약 상세보기 모달 */}
      {showDetailModal && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">예약 상세 정보</h3>
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

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="ri-building-line text-blue-600"></i>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{selectedReservation.facility}</h4>
                    <p className="text-gray-600">{selectedReservation.club}</p>
                    <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                      selectedReservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedReservation.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedReservation.status === 'pending' ? '승인 대기' :
                       selectedReservation.status === 'approved' ? '승인됨' : '거절됨'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">신청자:</span>
                    <div className="text-gray-900">{selectedReservation.applicant}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">연락처:</span>
                    <div className="text-gray-900">{selectedReservation.contact}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">날짜:</span>
                    <div className="text-gray-900">{selectedReservation.date}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">시간:</span>
                    <div className="text-gray-900">{selectedReservation.time}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">인원:</span>
                    <div className="text-gray-900">{selectedReservation.participants}명</div>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-700">사용 목적:</span>
                  <div className="text-gray-900 bg-gray-50 p-3 rounded-md mt-1">
                    {selectedReservation.purpose}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-6 border-t mt-6">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedReservation(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium whitespace-nowrap"
                >
                  닫기
                </button>
                {selectedReservation.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleApproval(selectedReservation);
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md text-sm font-medium whitespace-nowrap"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleRejection(selectedReservation);
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md text-sm font-medium whitespace-nowrap"
                    >
                      거절
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 시설 추가/수정 모달 */}
      {showFacilityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingFacility ? '시설 수정' : '시설 추가'}
                </h3>
                <button
                  onClick={() => {
                    setShowFacilityModal(false);
                    setEditingFacility(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <Input
                  label="시설명 *"
                  value={facilityForm.name}
                  onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })}
                  placeholder="예: 동아리방 A"
                  required
                />

                <Input
                  label="수용인원 *"
                  value={facilityForm.capacity}
                  onChange={(e) => setFacilityForm({ ...facilityForm, capacity: e.target.value })}
                  placeholder="예: 20명"
                  required
                />

                <Input
                  label="보유시설"
                  value={facilityForm.equipment}
                  onChange={(e) => setFacilityForm({ ...facilityForm, equipment: e.target.value })}
                  placeholder="예: 프로젝터, 화이트보드"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    운영 시간대 * (최소 1개 이상)
                  </label>
                  <div className="border border-gray-300 rounded-md p-4 min-h-[200px]">
                    {facilityForm.timeSlots.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">시간대를 추가해주세요.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {facilityForm.timeSlots.map((time, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-md px-3 py-1.5"
                          >
                            <span className="text-sm font-medium text-blue-900">{time}</span>
                            <button
                              onClick={() => handleRemoveTimeSlot(time)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <i className="ri-close-line text-sm"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddTimeSlot}
                      className="mt-4"
                    >
                      <i className="ri-add-line mr-2"></i>
                      시간대 추가
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    예약 가능한 시간대를 설정하세요. (예: 09:00, 14:00)
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowFacilityModal(false);
                    setEditingFacility(null);
                  }}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleSaveFacility}
                  className="flex-1"
                >
                  {editingFacility ? '수정' : '추가'}
                </Button>
              </div>
            </div>
          </Card>
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
  );
}