'use client';

import { useState, useEffect } from 'react';
import { getFacilities } from '@/lib/supabase/facilities';
import type { Facility as FacilityType } from '@/lib/supabase/facilities';
import { getReservationsByFacilityAndDate } from '@/lib/supabase/reservations';
import { Card } from '@/components/ui';

interface ReservationTimeTableProps {
  selectedFacility: string;
  onFacilitySelect: (facilityId: string) => void;
  onTimeSlotSelect: (facilityId: string, date: string, time: string) => void;
}

export default function ReservationTimeTable({ 
  selectedFacility, 
  onFacilitySelect,
  onTimeSlotSelect 
}: ReservationTimeTableProps) {
  const [facilities, setFacilities] = useState<FacilityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [reservations, setReservations] = useState<any[]>([]);

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

  // 시설 데이터 로드
  useEffect(() => {
    const loadFacilities = async () => {
      try {
        setLoading(true);
        const data = await getFacilities();
        setFacilities(data);
        
        // 첫 번째 시설 선택
        if (data.length > 0 && !selectedFacility) {
          onFacilitySelect(data[0].id);
        }
      } catch (error) {
        console.error('시설 로딩 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFacilities();
    const interval = setInterval(loadFacilities, 10000); // 10초마다 업데이트

    return () => clearInterval(interval);
  }, []);

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // 예약 데이터 로드
  useEffect(() => {
    const loadReservations = async () => {
      if (!selectedFacility) return;
      
      try {
        const allReservations: any[] = [];
        for (const date of days) {
          const dateStr = formatDate(date);
          const dayReservations = await getReservationsByFacilityAndDate(selectedFacility, dateStr);
          allReservations.push(...dayReservations);
        }
        setReservations(allReservations);
      } catch (error) {
        console.error('예약 로딩 오류:', error);
      }
    };

    if (selectedFacility) {
      loadReservations();
      const interval = setInterval(loadReservations, 5000); // 5초마다 업데이트
      return () => clearInterval(interval);
    }
  }, [selectedFacility, days]);

  // 모든 시간대 수집 (모든 시설의 시간대를 합침)
  const getAllTimeSlots = () => {
    const allSlots = new Set<string>();
    facilities.forEach(facility => {
      facility.time_slots.forEach(slot => allSlots.add(slot));
    });
    return Array.from(allSlots).sort();
  };

  const allTimeSlots = getAllTimeSlots();

  // 예약 상태 확인 (Supabase에서)
  const getReservationStatus = (facilityId: string, date: string, time: string) => {
    // 승인된 예약만 확인 (pending은 예약 가능)
    const approvedReservation = reservations.find((r: any) => 
      r.facility_id === facilityId && 
      r.date === date && 
      r.status === 'approved' &&
      (r.start_time === time || (r.start_time <= time && r.end_time > time))
    );

    if (approvedReservation) {
      return 'approved';
    }

    // 대기 중인 예약 확인
    const pendingReservation = reservations.find((r: any) => 
      r.facility_id === facilityId && 
      r.date === date && 
      r.status === 'pending' &&
      (r.start_time === time || (r.start_time <= time && r.end_time > time))
    );

    return pendingReservation ? 'pending' : null;
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

  // 시간대가 해당 시설에서 사용 가능한지 확인
  const isTimeSlotAvailable = (facility: FacilityType, time: string) => {
    return facility.time_slots.includes(time);
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (facilities.length === 0) {
    return (
      <Card>
        <div className="p-6 text-center">
          <i className="ri-building-line text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-600">등록된 시설이 없습니다.</p>
        </div>
      </Card>
    );
  }

  const selectedFacilityData = facilities.find(f => f.id === selectedFacility) || facilities[0];

  return (
    <Card>
      <div className="p-6">
        {/* 시설 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            시설 선택
          </label>
          <div className="flex flex-wrap gap-2">
            {facilities.map(facility => (
              <button
                key={facility.id}
                onClick={() => onFacilitySelect(facility.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFacility === facility.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {facility.name}
              </button>
            ))}
          </div>
        </div>

        {/* 시설 정보 */}
        {selectedFacilityData && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedFacilityData.name}</h3>
                <div className="text-sm text-gray-600 mt-1">
                  <span>수용인원: {selectedFacilityData.capacity}</span>
                  {selectedFacilityData.equipment && (
                    <span className="ml-4">보유시설: {selectedFacilityData.equipment}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7일 타임테이블 */}
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* 헤더: 날짜 */}
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div className="font-semibold text-gray-700 text-sm">시간</div>
              {days.map((date, index) => (
                <div
                  key={index}
                  className={`text-center p-2 rounded-lg text-sm font-medium ${
                    index === selectedDateIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <div>{formatDateDisplay(date)}</div>
                </div>
              ))}
            </div>

            {/* 타임테이블 본문 */}
            <div className="space-y-1">
              {allTimeSlots.map(time => {
                const isAvailable = isTimeSlotAvailable(selectedFacilityData, time);
                
                return (
                  <div key={time} className="grid grid-cols-8 gap-2">
                    {/* 시간 라벨 */}
                    <div className="flex items-center justify-center p-2 text-sm font-medium text-gray-700 bg-gray-50 rounded">
                      {time}
                    </div>
                    
                    {/* 각 날짜별 셀 */}
                    {days.map((date, dateIndex) => {
                      const dateStr = formatDate(date);
                      const status = getReservationStatus(selectedFacilityData.id, dateStr, time);
                      const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                      
                      let cellClass = '';
                      let cellContent = '';
                      let onClickHandler: (() => void) | undefined = undefined;

                      if (isPast) {
                        cellClass = 'bg-gray-100 text-gray-400 cursor-not-allowed';
                        cellContent = '-';
                      } else if (!isAvailable) {
                        cellClass = 'bg-gray-50 text-gray-400 cursor-not-allowed';
                        cellContent = '-';
                      } else if (status === 'approved') {
                        cellClass = 'bg-red-100 text-red-700 border-2 border-red-300 cursor-not-allowed';
                        cellContent = '예약불가';
                      } else if (status === 'pending') {
                        cellClass = 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300 cursor-not-allowed';
                        cellContent = '대기중';
                      } else {
                        cellClass = 'bg-green-100 text-green-700 border-2 border-green-300 hover:bg-green-200 cursor-pointer';
                        cellContent = '예약가능';
                        onClickHandler = () => {
                          setSelectedDateIndex(dateIndex);
                          onTimeSlotSelect(selectedFacilityData.id, dateStr, time);
                        };
                      }

                      return (
                        <div
                          key={dateIndex}
                          onClick={onClickHandler}
                          className={`p-3 text-center text-xs font-medium rounded transition-all ${cellClass}`}
                          title={isPast ? '과거 날짜' : status === 'approved' ? '예약됨' : status === 'pending' ? '승인 대기' : '예약 가능'}
                        >
                          {cellContent}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 범례 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
              <span className="text-gray-700">예약 가능</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
              <span className="text-gray-700">승인 대기</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
              <span className="text-gray-700">예약됨</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-50 border-2 border-gray-200 rounded"></div>
              <span className="text-gray-700">운영 시간 아님</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

