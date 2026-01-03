
'use client';

import { useState, useEffect } from 'react';

interface ReservationCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  selectedFacility: string;
  onReservationAdd: (reservation: any) => void;
}

export default function ReservationCalendar({ selectedDate, onDateSelect, selectedFacility, onReservationAdd }: ReservationCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isClient, setIsClient] = useState(false);
  const [facilities, setFacilities] = useState([
    { 
      id: 'room1', 
      name: '동아리방 A',
      timeSlots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']
    },
    { 
      id: 'room2', 
      name: '동아리방 B',
      timeSlots: ['10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
    },
    { 
      id: 'room3', 
      name: '동아리방 C',
      timeSlots: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00']
    },
    { 
      id: 'auditorium', 
      name: '소공연장',
      timeSlots: ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00']
    },
    { 
      id: 'practice', 
      name: '연습실',
      timeSlots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
    }
  ]);

  // 클라이언트 렌더링 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 관리자로부터 실시간으로 시설 정보 업데이트 받기
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const interval = setInterval(() => {
      const facilitiesFromAdmin = localStorage.getItem('adminFacilities');
      if (facilitiesFromAdmin) {
        try {
          const updatedFacilities = JSON.parse(facilitiesFromAdmin);
          setFacilities(updatedFacilities);
        } catch (error) {
          console.error('시설 정보 업데이트 오류:', error);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 승인된 예약들 (관리자가 승인한 예약들을 실시간으로 가져오기)
  const [approvedReservations, setApprovedReservations] = useState<any[]>([]);

  // 승인 대기 중인 예약들
  const [pendingReservations, setPendingReservations] = useState<any[]>([]);

  // 실시간으로 관리자의 승인된 예약을 반영
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const interval = setInterval(() => {
      const adminReservations: any[] = JSON.parse(localStorage.getItem('adminReservations') || '[]');
      
      // 승인된 예약들 업데이트
      const approved = adminReservations
        .filter((r: any) => r.status === 'approved')
        .map((r: any) => ({
          facility: getFacilityId(r.facility),
          date: r.date,
          time: r.time.split('-')[0],
          club: r.club,
          status: 'approved'
        }));
      
      // 승인 대기 중인 예약들 업데이트
      const pending = adminReservations
        .filter((r: any) => r.status === 'pending')
        .map((r: any) => ({
          facility: getFacilityId(r.facility),
          date: r.date,
          time: r.time.split('-')[0],
          club: r.club,
          status: 'pending'
        }));
      
      setApprovedReservations(approved);
      setPendingReservations(pending);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // 시설명을 ID로 변환하는 헬퍼 함수
  const getFacilityId = (facilityName: string) => {
    const facilityMap: { [key: string]: string } = {
      '동아리방 A': 'room1',
      '동아리방 B': 'room2', 
      '동아리방 C': 'room3',
      '소공연장': 'auditorium',
      '연습실': 'practice'
    };
    return facilityMap[facilityName] || facilityName;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isTimeSlotReserved = (facility: string, time: string) => {
    const dateStr = formatDate(selectedDate);
    return approvedReservations.some(r => 
      r.facility === facility && r.date === dateStr && r.time === time && r.status === 'approved'
    );
  };

  const isTimeSlotPending = (facility: string, time: string) => {
    const dateStr = formatDate(selectedDate);
    return pendingReservations.some(r => 
      r.facility === facility && r.date === dateStr && r.time === time && r.status === 'pending'
    );
  };

  const getReservationInfo = (facility: string, time: string) => {
    const dateStr = formatDate(selectedDate);
    return [...approvedReservations, ...pendingReservations].find(r => 
      r.facility === facility && r.date === dateStr && r.time === time
    );
  };

  // 선택된 날짜에 대한 예약 현황을 계산
  const getDateReservationCount = (date: Date) => {
    const dateStr = formatDate(date);
    const totalReservations = [...approvedReservations, ...pendingReservations].filter(r => r.date === dateStr);
    return {
      approved: totalReservations.filter(r => r.status === 'approved').length,
      pending: totalReservations.filter(r => r.status === 'pending').length,
      total: totalReservations.length
    };
  };

  // 클라이언트 렌더링이 완료되지 않으면 로딩 표시
  if (!isClient) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // 오늘 날짜를 안전하게 가져오기
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">예약 달력</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <i className="ri-arrow-left-s-line text-lg"></i>
            </button>
            <span className="text-lg font-medium px-4">
              {currentMonth.getFullYear()}년 {monthNames[currentMonth.getMonth()]}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <i className="ri-arrow-right-s-line text-lg"></i>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (!day) {
              return <div key={index} className="invisible"></div>;
            }

            const dayTime = new Date(day);
            dayTime.setHours(0, 0, 0, 0);
            
            const isToday = dayTime.getTime() === selectedDate.getTime();
            const isPast = dayTime < today;
            const reservationCount = getDateReservationCount(day);

            return (
              <button
                key={index}
                onClick={() => onDateSelect(day)}
                className={`p-2 text-sm rounded-md transition-colors relative ${
                  isToday
                    ? 'bg-blue-600 text-white'
                    : isPast
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'hover:bg-blue-50 text-gray-900'
                }`}
                disabled={isPast}
              >
                <div className="font-medium">{day.getDate()}</div>
                {reservationCount.total > 0 && !isPast && (
                  <div className="flex justify-center space-x-1 mt-1">
                    {reservationCount.approved > 0 && (
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full" title={`승인됨: ${reservationCount.approved}건`}></div>
                    )}
                    {reservationCount.pending > 0 && (
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" title={`승인 대기: ${reservationCount.pending}건`}></div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900" suppressHydrationWarning={true}>
            {selectedDate.toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })} 시간표
          </h3>
          <div className="text-sm text-gray-500">
            실시간 예약 현황
          </div>
        </div>

        <div className="space-y-4">
          {facilities.map(facility => (
            <div key={facility.id} className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{facility.name}</h4>
                  <div className="text-xs text-gray-500">
                    운영시간: {facility.timeSlots.length}개 타임슬롯
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {facility.timeSlots.map(time => {
                    const isReserved = isTimeSlotReserved(facility.id, time);
                    const isPending = isTimeSlotPending(facility.id, time);
                    const reservationInfo = getReservationInfo(facility.id, time);
                    
                    let buttonClass = '';
                    let title = '';
                    let icon = '';
                    
                    if (isReserved) {
                      buttonClass = 'bg-red-100 text-red-700 border border-red-200';
                      title = `승인됨: ${reservationInfo?.club}`;
                      icon = 'ri-check-line';
                    } else if (isPending) {
                      buttonClass = 'bg-yellow-100 text-yellow-700 border border-yellow-200';
                      title = `승인 대기: ${reservationInfo?.club}`;
                      icon = 'ri-time-line';
                    } else {
                      buttonClass = 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200';
                      title = '예약 가능';
                      icon = 'ri-add-line';
                    }
                    
                    return (
                      <div
                        key={time}
                        className={`p-2 text-xs rounded-md text-center transition-colors cursor-default ${buttonClass}`}
                        title={title}
                      >
                        <div className="flex items-center justify-center mb-1">
                          <i className={`${icon} text-sm`}></i>
                        </div>
                        <div className="font-medium mb-1">{time}</div>
                        {(isReserved || isPending) && (
                          <div className="text-xs truncate leading-tight">
                            {reservationInfo?.club}
                          </div>
                        )}
                        {isPending && (
                          <div className="text-xs font-medium mt-1 px-1 py-0.5 bg-yellow-200 rounded">
                            대기중
                          </div>
                        )}
                        {isReserved && (
                          <div className="text-xs font-medium mt-1 px-1 py-0.5 bg-red-200 rounded">
                            예약됨
                          </div>
                        )}
                        {!isReserved && !isPending && (
                          <div className="text-xs font-medium mt-1 px-1 py-0.5 bg-green-200 rounded">
                            가능
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">예약 현황 범례</h4>
            <div className="text-xs text-gray-500" suppressHydrationWarning={true}>
              마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded flex items-center justify-center">
                <i className="ri-add-line text-green-700 text-xs"></i>
              </div>
              <span className="text-gray-600">예약 가능</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded flex items-center justify-center">
                <i className="ri-time-line text-yellow-700 text-xs"></i>
              </div>
              <span className="text-gray-600">승인 대기</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded flex items-center justify-center">
                <i className="ri-check-line text-red-700 text-xs"></i>
              </div>
              <span className="text-gray-600">승인됨</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
