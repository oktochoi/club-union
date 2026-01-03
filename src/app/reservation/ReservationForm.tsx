
'use client';

import { useState, useEffect } from 'react';
import { getFacilities } from '@/lib/supabase/facilities';
import type { Facility } from '@/lib/supabase/facilities';
import { createReservation } from '@/lib/supabase/reservations';
import { getCurrentUser } from '@/lib/supabase/user';

interface ReservationFormProps {
  selectedDate: Date;
  selectedFacility: string;
  selectedTimeSlot?: { facilityId: string; date: string; time: string } | null;
  onFacilitySelect: (facility: string) => void;
  onReservationAdd: (reservation: any) => void;
}

export default function ReservationForm({ selectedDate, selectedFacility, selectedTimeSlot, onFacilitySelect, onReservationAdd }: ReservationFormProps) {
  const [formData, setFormData] = useState({
    facility: selectedFacility,
    startTime: '',
    endTime: '',
    purpose: '',
    participants: '',
    contact: '',
    notes: ''
  });

  // 선택된 시간대가 변경되면 폼 업데이트
  useEffect(() => {
    if (selectedTimeSlot) {
      setFormData(prev => ({
        ...prev,
        facility: selectedTimeSlot.facilityId,
        startTime: selectedTimeSlot.time,
        endTime: selectedTimeSlot.time
      }));
    }
  }, [selectedTimeSlot]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  // Supabase에서 시설 데이터 로드
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
        console.error('시설 정보 로딩 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFacilities();
    const interval = setInterval(loadFacilities, 10000); // 10초마다 업데이트

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setShowError(false);

    try {
      const facility = facilities.find(f => f.id === formData.facility);
      if (!facility) {
        setErrorMessage('시설을 선택해주세요.');
        setShowError(true);
        return;
      }

      const user = await getCurrentUser();
      if (!user) {
        setErrorMessage('로그인이 필요합니다.');
        setShowError(true);
        return;
      }

      // Supabase에 예약 저장
      const newReservation = await createReservation({
        facility_id: facility.id,
        facility_name: facility.name,
        date: selectedDate.toISOString().split('T')[0],
        start_time: formData.startTime,
        end_time: formData.endTime,
        purpose: formData.purpose,
        participants: parseInt(formData.participants) || 1,
        contact: formData.contact,
        notes: formData.notes || undefined,
      });

      onReservationAdd(newReservation);
      
      setShowSuccess(true);
      setFormData({
        facility: '',
        startTime: '',
        endTime: '',
        purpose: '',
        participants: '',
        contact: '',
        notes: ''
      });
      
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);

    } catch (error) {
      console.error('예약 신청 오류:', error);
      setErrorMessage(error instanceof Error ? error.message : '예약 신청 중 오류가 발생했습니다. 다시 시도해주세요.');
      setShowError(true);
      
      setTimeout(() => {
        setShowError(false);
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'facility') {
      onFacilitySelect(value);
      // 시설 변경 시 시작/종료 시간 초기화
      setFormData(prev => ({
        ...prev,
        facility: value,
        startTime: '',
        endTime: ''
      }));
    }
  };

  const selectedFacilityInfo = facilities.find(f => f.id === formData.facility);
  const availableTimeSlots = selectedFacilityInfo?.time_slots || [];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">예약 신청</h3>
      
      {showSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-check-line text-green-600"></i>
            </div>
            <p className="ml-2 text-sm text-green-700">
              예약 신청이 완료되었습니다. 관리자 승인을 기다려주세요.
            </p>
          </div>
        </div>
      )}

      {showError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-error-warning-line text-red-600"></i>
            </div>
            <p className="ml-2 text-sm text-red-700">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} id="reservation-form" className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            예약 날짜
          </label>
          <div className="p-3 bg-gray-50 rounded-md text-gray-900">
            {selectedDate.toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </div>
        </div>

        <div>
          <label htmlFor="facility" className="block text-sm font-medium text-gray-700 mb-1">
            시설 선택 *
          </label>
          <select
            id="facility"
            name="facility"
            value={formData.facility}
            onChange={handleInputChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 pr-8"
          >
            <option value="">시설을 선택하세요</option>
            {facilities.map(facility => (
              <option key={facility.id} value={facility.id}>
                {facility.name}
              </option>
            ))}
          </select>
          
          {selectedFacilityInfo && (
            <div className="mt-2 p-3 bg-blue-50 rounded-md">
              <div className="text-sm text-blue-800 space-y-1">
                <div><strong>수용인원:</strong> {selectedFacilityInfo.capacity}</div>
                <div><strong>보유시설:</strong> {selectedFacilityInfo.equipment}</div>
                <div><strong>운영시간:</strong> {selectedFacilityInfo.time_slots.length}개 타임슬롯 운영</div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
              시작 시간 *
            </label>
            <select
              id="startTime"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 pr-8"
            >
              <option value="">선택</option>
              {availableTimeSlots.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
              종료 시간 *
            </label>
            <select
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 pr-8"
            >
              <option value="">선택</option>
              {availableTimeSlots.filter(time => formData.startTime < time).map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
            사용 목적 *
          </label>
          <input
            type="text"
            id="purpose"
            name="purpose"
            value={formData.purpose}
            onChange={handleInputChange}
            required
            placeholder="예: 정기 연습, 공연 준비, 회의 등"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="participants" className="block text-sm font-medium text-gray-700 mb-1">
            참가 인원 *
          </label>
          <input
            type="number"
            id="participants"
            name="participants"
            value={formData.participants}
            onChange={handleInputChange}
            required
            min="1"
            placeholder="예상 참가 인원 수"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
            연락처 *
          </label>
          <input
            type="tel"
            id="contact"
            name="contact"
            value={formData.contact}
            onChange={handleInputChange}
            required
            placeholder="010-0000-0000"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            특이사항
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            maxLength={500}
            placeholder="추가 요청사항이나 특이사항을 적어주세요 (500자 이내)"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {formData.notes.length}/500
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              신청 중...
            </div>
          ) : (
            '예약 신청하기'
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-yellow-50 rounded-md">
        <div className="flex items-start">
          <div className="w-5 h-5 flex items-center justify-center mt-0.5">
            <i className="ri-information-line text-yellow-600"></i>
          </div>
          <div className="ml-2 text-sm text-yellow-800">
            <p><strong>예약 안내</strong></p>
            <ul className="mt-1 space-y-1">
              <li>• 예약 신청 후 관리자 승인이 필요합니다</li>
              <li>• 승인/거절 시 실시간 알림을 보내드립니다</li>
              <li>• 시설별로 운영시간이 다를 수 있습니다</li>
              <li>• 취소는 이용 1일 전까지 가능합니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
