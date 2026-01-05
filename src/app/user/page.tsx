
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthCheck from '@/components/AuthCheck';
import { StatCard, Card, CardContent, EmptyState, Button, Badge } from '@/components/ui';
import { getReservations } from '@/lib/supabase/reservations';
import { getFacilities } from '@/lib/supabase/facilities';
import { getUsers } from '@/lib/supabase/user';
import type { Facility } from '@/lib/supabase/facilities';

interface Notice {
  title: string;
  date: string;
  isImportant: boolean;
  category: string;
}

interface RentalItem {
  name: string;
  category: string;
  price: number;
  available: number;
  total: number;
  image?: string;
}

export default function UserPage() {
  const [stats, setStats] = useState({
    totalReservations: 0,
    pendingReservations: 0,
    approvedReservations: 0,
    totalNotices: 0,
    totalSuggestions: 0,
    totalFacilities: 0,
    activeUsers: 0
  });

  const [recentNotices, setRecentNotices] = useState<Notice[]>([]);
  const [todayReservations, setTodayReservations] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  // Supabase에서 실제 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // 예약 데이터
        const reservations = await getReservations();
        const pendingCount = reservations.filter(r => r.status === 'pending').length;
        const approvedCount = reservations.filter(r => r.status === 'approved').length;
        
        // 오늘 예약
        const today = new Date().toISOString().split('T')[0];
        const todayRes = reservations
          .filter(r => r.date === today && r.status === 'approved')
          .slice(0, 5);
        
        // 사용자 데이터 (동아리명 가져오기)
        const users = await getUsers();
        const userMap = new Map(users.map(u => [u.id, u]));
        const activeUsers = users.filter(u => u.status === 'active').length;
        
        // 오늘 예약에 사용자 정보 추가
        const todayResWithUsers = todayRes.map(r => ({
          ...r,
          club: userMap.get(r.user_id)?.club_name || '',
          time: `${r.start_time}-${r.end_time}`
        }));
        
        // 시설 데이터
        const facilitiesData = await getFacilities();
        
        // 공지사항 (localStorage에서)
        const notices = typeof window !== 'undefined' 
          ? JSON.parse(localStorage.getItem('adminNotices') || '[]')
          : [];
        const recentNoticesData = notices
          .sort((a: Notice, b: Notice) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 3);
        
        // 건의사항 (localStorage에서)
        const suggestions = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('adminSuggestions') || '[]')
          : [];
        
        setStats({
          totalReservations: reservations.length,
          pendingReservations: pendingCount,
          approvedReservations: approvedCount,
          totalNotices: notices.length,
          totalSuggestions: suggestions.length,
          totalFacilities: facilitiesData.length,
          activeUsers: activeUsers
        });
        
        setRecentNotices(recentNoticesData);
        setTodayReservations(todayResWithUsers);
        setFacilities(facilitiesData.slice(0, 4));
      } catch (error) {
        console.error('데이터 로딩 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // 자동 새로고침 제거 (수동 새로고침만 사용)
    // 필요시 사용자가 직접 새로고침 버튼을 클릭하거나 페이지를 새로고침할 수 있습니다
  }, []);

  return (
    <AuthCheck requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main>
          {/* Hero Section */}
          <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white py-24 overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
              </div>
            </div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <div className="inline-block mb-4">
                  <span className="inline-flex items-center bg-white/10 text-white border border-white/30 px-4 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                    <i className="ri-community-line mr-2"></i>
                    총동아리연합회
                  </span>
                </div>
                <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
                  동아리 활동의 모든 것
                </h1>
                <p className="text-xl md:text-2xl mb-10 text-blue-100 max-w-2xl mx-auto">
                  시설 예약부터 장비 대여까지, 동아리 활동에 필요한 모든 서비스를 한 곳에서
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/reservation"
                    className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg whitespace-nowrap inline-flex items-center justify-center"
                  >
                    <i className="ri-calendar-check-line mr-2 text-xl"></i>
                    시설 예약하기
                  </Link>
                  <Link
                    href="/office-hour"
                    className="bg-white/10 backdrop-blur-sm border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105 whitespace-nowrap inline-flex items-center justify-center"
                  >
                    <i className="ri-box-3-line mr-2 text-xl"></i>
                    장비 대여하기
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* 실시간 현황 */}
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">실시간 현황</h2>
                <p className="text-gray-600">동아리연합회의 최신 활동 현황을 확인하세요</p>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-32 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                  <StatCard
                    icon="ri-calendar-check-line"
                    label="승인된 예약"
                    value={stats.approvedReservations}
                    gradient="from-blue-500 to-blue-600"
                  />
                  <StatCard
                    icon="ri-time-line"
                    label="대기 중"
                    value={stats.pendingReservations}
                    gradient="from-yellow-500 to-yellow-600"
                  />
                  <StatCard
                    icon="ri-notification-line"
                    label="공지사항"
                    value={stats.totalNotices}
                    gradient="from-purple-500 to-purple-600"
                  />
                </div>
              )}

              {/* 오늘의 시설 예약 현황 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">오늘의 시설 예약</h3>
                      <Link href="/reservation" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        전체 보기
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {loading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse">
                              <div className="h-16 bg-gray-200 rounded-md"></div>
                            </div>
                          ))}
                        </div>
                      ) : todayReservations.length > 0 ? (
                        todayReservations.map((reservation, index) => (
                          <div key={reservation.id || index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i className="ri-building-line text-blue-600"></i>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{reservation.facility_name}</div>
                                <div className="text-sm text-gray-600">
                                  {reservation.club && <span className="font-medium">{reservation.club}</span>}
                                  {reservation.club && ' · '}
                                  {reservation.time}
                                </div>
                              </div>
                            </div>
                            <Badge variant="success" className="ml-2">
                              <i className="ri-check-line mr-1"></i>
                              승인됨
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <EmptyState
                          icon="ri-calendar-line"
                          title="오늘 예약된 시설이 없습니다"
                          description="새로운 예약을 신청해보세요"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 최신 공지사항 */}
                <Card>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">최신 공지사항</h3>
                      <Link href="/notice" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        전체 보기
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {loading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse">
                              <div className="h-16 bg-gray-200 rounded-md"></div>
                            </div>
                          ))}
                        </div>
                      ) : recentNotices.length > 0 ? (
                        recentNotices.map((notice, index) => (
                          <Link
                            key={index}
                            href="/notice"
                            className="block border-b pb-3 last:border-b-0 hover:bg-gray-50 p-2 rounded-md transition-colors -mx-2"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 mb-1 flex items-center">
                                  {notice.isImportant && (
                                    <i className="ri-error-warning-line text-red-500 mr-2"></i>
                                  )}
                                  {notice.title}
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <span>{notice.date}</span>
                                  {notice.category && (
                                    <>
                                      <span>·</span>
                                      <span className="text-blue-600">{notice.category}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              {notice.isImportant && (
                                <Badge variant="danger" className="ml-2">
                                  중요
                                </Badge>
                              )}
                            </div>
                          </Link>
                        ))
                      ) : (
                        <EmptyState
                          icon="ri-notification-line"
                          title="등록된 공지사항이 없습니다"
                          description="새로운 공지사항이 등록되면 여기에 표시됩니다"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* 등록된 시설 */}
          <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">등록된 시설</h2>
                <p className="text-gray-600">예약 가능한 다양한 시설을 확인하세요</p>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-48 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : facilities.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {facilities.map((facility) => (
                      <Link key={facility.id} href="/reservation">
                        <Card hover className="h-full">
                          <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg flex items-center justify-center">
                            <i className="ri-building-line text-6xl text-blue-400"></i>
                          </div>
                          <CardContent>
                            <h3 className="font-semibold text-gray-900 mb-2 text-lg">{facility.name}</h3>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <i className="ri-group-line mr-2 text-blue-500"></i>
                                수용인원: {facility.capacity}명
                              </div>
                              {facility.equipment && (
                                <div className="flex items-center">
                                  <i className="ri-tools-line mr-2 text-purple-500"></i>
                                  {facility.equipment}
                                </div>
                              )}
                              {facility.time_slots && facility.time_slots.length > 0 && (
                                <div className="flex items-center">
                                  <i className="ri-time-line mr-2 text-green-500"></i>
                                  {facility.time_slots.length}개 시간대 운영
                                </div>
                              )}
                            </div>
                            <div className="mt-4 pt-4 border-t">
                              <span className="text-blue-600 font-medium text-sm">
                                예약하기 →
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                  <div className="text-center mt-8">
                    <Link href="/reservation">
                      <Button>
                        <i className="ri-arrow-right-line mr-2"></i>
                        모든 시설 보기
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <EmptyState
                  icon="ri-building-line"
                  title="등록된 시설이 없습니다"
                  description="관리자가 시설을 등록하면 여기에 표시됩니다"
                  action={
                    <Link href="/reservation">
                      <Button>예약 페이지로 이동</Button>
                    </Link>
                  }
                />
              )}
            </div>
          </section>

          {/* 주요 서비스 */}
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">주요 서비스</h2>
                <p className="text-gray-600">동아리 활동에 필요한 모든 서비스를 제공합니다</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center group">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                    <i className="ri-calendar-check-line text-blue-600 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">시설 예약</h3>
                  <p className="text-gray-600 text-sm">동아리방, 공연장 등 다양한 시설을 온라인으로 예약</p>
                  <Link href="/reservation" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block">
                    예약하기 →
                  </Link>
                </div>

                <div className="text-center group">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                    <i className="ri-box-3-line text-green-600 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">장비 대여</h3>
                  <p className="text-gray-600 text-sm">음향장비, 프로젝터 등 필요한 장비를 합리적인 가격으로 대여</p>
                  <Link href="/office-hour" className="text-green-600 hover:text-green-700 text-sm font-medium mt-2 inline-block">
                    대여하기 →
                  </Link>
                </div>

                <div className="text-center group">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                    <i className="ri-notification-line text-purple-600 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">공지사항</h3>
                  <p className="text-gray-600 text-sm">중요한 공지사항과 행사 정보를 실시간으로 확인</p>
                  <Link href="/notice" className="text-purple-600 hover:text-purple-700 text-sm font-medium mt-2 inline-block">
                    확인하기 →
                  </Link>
                </div>

                <div className="text-center group">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                    <i className="ri-feedback-line text-orange-600 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">건의사항</h3>
                  <p className="text-gray-600 text-sm">동아리 활동 개선을 위한 건의사항을 자유롭게 제출</p>
                  <Link href="/suggestion" className="text-orange-600 hover:text-orange-700 text-sm font-medium mt-2 inline-block">
                    제출하기 →
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* 문의 및 지원 */}
          <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-8 text-white text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  더 많은 도움이 필요하신가요?
                </h2>
                <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                  동아리 활동과 관련된 모든 문의사항에 대해 친절하게 안내해드리겠습니다.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/suggestion"
                    className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors whitespace-nowrap inline-block"
                  >
                    건의사항 제출
                  </Link>
                  <a
                    href="tel:02-0000-0000"
                    className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors whitespace-nowrap"
                  >
                    전화 문의
                  </a>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </AuthCheck>
  );
}

