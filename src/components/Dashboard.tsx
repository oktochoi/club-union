'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');

  const todayReservations = [
    { id: 1, space: '음악연습실 A', time: '14:00-16:00', status: '승인완료', club: '어쿠스틱기타동아리' },
    { id: 2, space: '대공연장', time: '19:00-21:00', status: '대기중', club: '연극동아리' },
    { id: 3, space: '장비보관실', time: '10:00-12:00', status: '승인완료', club: '방송동아리' },
  ];

  const recentNotices = [
    { id: 1, title: '2024년 동아리 지원사업 공모 안내', date: '2024.12.20', important: true },
    { id: 2, title: '겨울방학 시설 이용 안내', date: '2024.12.19', important: false },
    { id: 3, title: '동아리방 열쇠 반납 공지', date: '2024.12.18', important: true },
    { id: 4, title: '신규 장비 도입 안내', date: '2024.12.17', important: false },
  ];

  const inventoryStatus = [
    { name: '릴선 (10m)', available: 5, total: 10, status: 'normal' },
    { name: '멀티탭 (6구)', available: 2, total: 8, status: 'low' },
    { name: '마이크 (무선)', available: 0, total: 6, status: 'empty' },
    { name: '스피커 (이동형)', available: 3, total: 4, status: 'normal' },
    { name: '프로젝터', available: 1, total: 3, status: 'low' },
    { name: '노트북 (대여용)', available: 4, total: 5, status: 'normal' },
  ];

  const mySuggestions = [
    { id: 1, title: '음악실 방음시설 개선 요청', status: '답변완료', date: '2024.12.15' },
    { id: 2, title: '대공연장 조명 보수 필요', status: '검토중', date: '2024.12.18' },
  ];

  const quickStats = [
    { title: '오늘 예약', value: '3건', icon: 'ri-calendar-check-line', color: 'blue' },
    { title: '미확인 알림', value: '5개', icon: 'ri-notification-3-line', color: 'red' },
    { title: '대여 가능 장비', value: '15개', icon: 'ri-tools-line', color: 'green' },
    { title: '미답변 건의', value: '1개', icon: 'ri-question-answer-line', color: 'orange' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">대시보드</h1>
        <p className="text-gray-600">음악동아리 김동아리님, 안녕하세요!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className={`w-12 h-12 flex items-center justify-center rounded-lg bg-${stat.color}-100`}>
                <i className={`${stat.icon} text-xl text-${stat.color}-600`}></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">오늘의 예약 현황</h2>
              <Link href="/reservation" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                전체 보기
              </Link>
            </div>
          </div>
          <div className="p-6">
            {todayReservations.length > 0 ? (
              <div className="space-y-4">
                {todayReservations.map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{reservation.space}</h3>
                      <p className="text-sm text-gray-600">{reservation.club}</p>
                      <p className="text-sm text-gray-500">{reservation.time}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        reservation.status === '승인완료' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {reservation.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                오늘 예약된 시설이 없습니다.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">최근 공지사항</h2>
              <Link href="/notice" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                전체 보기
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {recentNotices.map((notice) => (
                <div key={notice.id} className="cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <div className="flex items-start">
                    {notice.important && (
                      <i className="ri-error-warning-line text-red-500 text-sm mt-1 mr-2"></i>
                    )}
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                        {notice.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">{notice.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">오피스아워 재고 현황</h2>
              <Link href="/office-hour" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                전체 보기
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {inventoryStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                    <div className="flex items-center mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className={`h-2 rounded-full ${
                            item.status === 'empty' ? 'bg-red-500' :
                            item.status === 'low' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(item.available / item.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 whitespace-nowrap">
                        {item.available}/{item.total}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">내 건의사항</h2>
              <Link href="/suggestion" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                전체 보기
              </Link>
            </div>
          </div>
          <div className="p-6">
            {mySuggestions.length > 0 ? (
              <div className="space-y-4">
                {mySuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{suggestion.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{suggestion.date}</p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        suggestion.status === '답변완료' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {suggestion.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                등록된 건의사항이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}