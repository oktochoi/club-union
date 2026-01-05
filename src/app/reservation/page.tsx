
'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthCheck from '@/components/AuthCheck';
import ReservationTimeTable from './ReservationTimeTable';
import ReservationForm from './ReservationForm';
import ReservationList from './ReservationList';
import { Tabs, Tab } from '@/components/ui';

export default function ReservationPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ facilityId: string; date: string; time: string } | null>(null);
  const [activeTab, setActiveTab] = useState('timetable');
  const [reservations, setReservations] = useState([
    {
      id: 1,
      facility: '동아리방 A',
      date: '2024-01-20',
      startTime: '14:00',
      endTime: '16:00',
      purpose: '정기 연습',
      status: 'approved',
      participants: 15,
      contact: '010-1234-5678',
      createdAt: '2024-01-18',
      notes: '피아노 사용 예정'
    },
    {
      id: 2,
      facility: '소공연장',
      date: '2024-01-25',
      startTime: '19:00',
      endTime: '21:00',
      purpose: '공연 연습',
      status: 'pending',
      participants: 25,
      contact: '010-2345-6789',
      createdAt: '2024-01-19',
      notes: '음향 장비 점검 필요'
    },
    {
      id: 3,
      facility: '연습실',
      date: '2024-01-15',
      startTime: '16:00',
      endTime: '18:00',
      purpose: '밴드 연습',
      status: 'rejected',
      participants: 8,
      contact: '010-3456-7890',
      createdAt: '2024-01-14',
      notes: '드럼 사용',
      rejectionReason: '다른 예약과 중복'
    },
    {
      id: 4,
      facility: '동아리방 B',
      date: '2024-01-30',
      startTime: '10:00',
      endTime: '12:00',
      purpose: '동아리 회의',
      status: 'completed',
      participants: 12,
      contact: '010-4567-8901',
      createdAt: '2024-01-16',
      notes: ''
    }
  ]);

  const addReservation = (newReservation: any) => {
    const reservation = {
      ...newReservation,
      id: reservations.length + 1,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setReservations(prev => [reservation, ...prev]);
  };

  return (
    <AuthCheck requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">시설 예약</h1>
          <p className="mt-2 text-gray-600">동아리방, 공연장, 기자재를 시간별로 예약할 수 있습니다.</p>
        </div>

        <div className="mb-6">
          <Tabs>
            <Tab active={activeTab === 'timetable'} onClick={() => setActiveTab('timetable')}>
              7일 타임테이블
            </Tab>
            <Tab active={activeTab === 'list'} onClick={() => setActiveTab('list')}>
              내 예약 현황
            </Tab>
          </Tabs>
        </div>

        {activeTab === 'timetable' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ReservationTimeTable
                selectedFacility={selectedFacility}
                onFacilitySelect={(facilityId) => {
                  setSelectedFacility(facilityId);
                }}
                onTimeSlotSelect={(facilityId, date, time) => {
                  setSelectedTimeSlot({ facilityId, date, time });
                  // 날짜 문자열을 로컬 타임존으로 파싱 (YYYY-MM-DD 형식)
                  // 시간을 명시적으로 12:00로 설정하여 타임존 문제 방지
                  const [year, month, day] = date.split('-').map(Number);
                  const localDate = new Date(year, month - 1, day, 12, 0, 0);
                  setSelectedDate(localDate);
                  setSelectedFacility(facilityId);
                }}
              />
            </div>
            <div>
              <ReservationForm 
                selectedDate={selectedDate}
                selectedFacility={selectedFacility}
                selectedTimeSlot={selectedTimeSlot}
                onFacilitySelect={setSelectedFacility}
                onReservationAdd={addReservation}
              />
            </div>
          </div>
        )}

        {activeTab === 'list' && (
          <ReservationList />
        )}
        </main>

        <Footer />
      </div>
    </AuthCheck>
  );
}
