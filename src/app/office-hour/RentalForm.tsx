'use client';

import { useState } from 'react';

interface RentalItem {
  id: string;
  name: string;
  price: number;
  available: number;
  deposit: number;
}

interface RentalFormProps {
  item: RentalItem;
  onSubmit: (data: any) => void;
  onClose: () => void;
}

export default function RentalForm({ item, onSubmit, onClose }: RentalFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [rentalDate, setRentalDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [applicant, setApplicant] = useState('김동아리');
  const [club, setClub] = useState('음악동아리');
  const [contact, setContact] = useState('');
  const [purpose, setPurpose] = useState('');

  // 날짜 차이 계산
  const calculateDays = () => {
    if (!rentalDate || !returnDate) return 0;
    const rental = new Date(rentalDate);
    const returnD = new Date(returnDate);
    const diffTime = returnD.getTime() - rental.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const days = calculateDays();
  const totalPrice = item.price * quantity * days;
  const totalDeposit = item.deposit * quantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rentalDate || !returnDate || !contact || !purpose) {
      alert('모든 항목을 입력해주세요.');
      return;
    }

    if (new Date(rentalDate) >= new Date(returnDate)) {
      alert('반납일은 대여일보다 이후여야 합니다.');
      return;
    }

    if (quantity > item.available) {
      alert('재고보다 많은 수량을 신청할 수 없습니다.');
      return;
    }

    onSubmit({
      quantity,
      rentalDate,
      returnDate,
      applicant,
      club,
      contact,
      purpose,
      days,
      totalPrice,
      totalDeposit
    });
  };

  // 오늘 날짜를 최소값으로 설정
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">대여 신청</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          {/* 물품 정보 */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-lg font-medium text-blue-900 mb-2">{item.name}</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div><span className="font-medium">일일 대여료:</span> {item.price.toLocaleString()}원</div>
              <div><span className="font-medium">보증금:</span> {item.deposit.toLocaleString()}원 (개당)</div>
              <div><span className="font-medium">재고:</span> {item.available}개 사용 가능</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 신청자 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  신청자 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={applicant}
                  onChange={(e) => setApplicant(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  소속 동아리 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                연락처 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="010-1234-5678"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* 대여 정보 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                수량 <span className="text-red-500">*</span>
              </label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                required
              >
                {Array.from({ length: Math.min(item.available, 10) }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>{num}개</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  대여일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={rentalDate}
                  onChange={(e) => setRentalDate(e.target.value)}
                  min={today}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  반납일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={rentalDate || today}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사용 목적 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="물품을 사용할 목적을 간단히 설명해주세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
              <div className="text-xs text-gray-500 mt-1">최대 200자</div>
            </div>

            {/* 요금 계산 */}
            {days > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h5 className="text-sm font-medium text-gray-900 mb-2">요금 계산</h5>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>대여 기간:</span>
                    <span>{days}일</span>
                  </div>
                  <div className="flex justify-between">
                    <span>수량:</span>
                    <span>{quantity}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span>대여료:</span>
                    <span>{item.price.toLocaleString()}원 × {quantity}개 × {days}일</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="font-medium">총 대여료:</span>
                    <span className="font-medium text-blue-600">{totalPrice.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">보증금:</span>
                    <span className="font-medium text-orange-600">{totalDeposit.toLocaleString()}원</span>
                  </div>
                </div>
              </div>
            )}

            {/* 안내사항 */}
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-xs text-yellow-800">
                <div className="font-medium mb-1">대여 안내사항:</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>보증금은 물품 반납 후 전액 환불됩니다.</li>
                  <li>손상 시 수리비가 보증금에서 차감될 수 있습니다.</li>
                  <li>기한 내 반납하지 않을 시 추가 요금이 발생합니다.</li>
                  <li>관리자 승인 후 대여가 확정됩니다.</li>
                </ul>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
              >
                신청하기
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}