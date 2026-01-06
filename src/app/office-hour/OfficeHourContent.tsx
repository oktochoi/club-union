
'use client';

import { useState, useEffect } from 'react';
import RentalForm from './RentalForm';
import { getRentalItems, getMyRentalRequests, deleteRentalRequest, createRentalRequest } from '@/lib/supabase/rentals';
import { getCurrentUser } from '@/lib/supabase/user';
import { getAccountInfo } from '@/lib/supabase/account';

interface RentalItem {
  id: string;
  name: string;
  category: string;
  price: number;
  available: number;
  total: number;
  description: string;
  image: string;
  deposit: number;
}

interface RentalRequest {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  rentalDate: string;
  returnDate: string;
  totalPrice: number;
  deposit: number;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  applicant: string;
  club: string;
  contact: string;
  purpose: string;
  createdAt: string;
}

export default function OfficeHourContent() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<RentalItem | null>(null);
  const [showRentalForm, setShowRentalForm] = useState(false);
  const [myRentals, setMyRentals] = useState<RentalRequest[]>([]);
  const [accountInfo, setAccountInfo] = useState({
    bank: 'KB국민은행',
    accountNumber: '123456-78-901234',
    accountHolder: '총동아리연합회'
  });

  const [rentalItems, setRentalItems] = useState<RentalItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 물품 데이터 로드 (Supabase)
  useEffect(() => {
    const loadRentalItems = async () => {
      try {
        setLoading(true);
        const data = await getRentalItems(); // 활성화된 물품만 조회
        setRentalItems(data.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          available: item.available,
          total: item.total,
          description: item.description || '',
          deposit: item.deposit,
          image: item.image || '',
        })));
      } catch (error) {
        console.error('물품 로딩 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRentalItems();
    // 자동 새로고침 제거 (성능 최적화)
  }, []);

  // 내 대여 신청 데이터 로드 (Supabase)
  useEffect(() => {
    const loadMyRentals = async () => {
      try {
        const data = await getMyRentalRequests();
        setMyRentals(data.map(req => ({
          id: req.id,
          itemId: req.item_id,
          itemName: req.item_name || '',
          quantity: req.quantity,
          rentalDate: req.rental_date,
          returnDate: req.return_date,
          totalPrice: req.total_price,
          deposit: req.deposit,
          status: req.status,
          applicant: req.applicant,
          club: req.club || '',
          contact: req.contact,
          purpose: req.purpose || '',
          createdAt: req.created_at,
        })));
      } catch (error) {
        console.error('내 대여 신청 로딩 오류:', error);
      }
    };

    loadMyRentals();
    // 자동 새로고침 제거 (성능 최적화)
  }, []);

  // 계좌 정보 로드 (Supabase)
  useEffect(() => {
    const loadAccountInfo = async () => {
      try {
        const data = await getAccountInfo();
        setAccountInfo({
          bank: data.bank,
          accountNumber: data.account_number,
          accountHolder: data.account_holder,
        });
      } catch (error) {
        console.error('계좌 정보 로딩 오류:', error);
      }
    };

    loadAccountInfo();
    // 자동 새로고침 제거 (성능 최적화)
  }, []);

  const categories = [
    { id: 'all', name: '전체', icon: 'ri-apps-line' },
    { id: '음향장비', name: '음향장비', icon: 'ri-volume-up-line' },
    { id: '영상장비', name: '영상장비', icon: 'ri-movie-line' },
    { id: '컴퓨터', name: '컴퓨터', icon: 'ri-computer-line' },
    { id: '카메라', name: '카메라', icon: 'ri-camera-line' },
    { id: '기타', name: '기타', icon: 'ri-more-line' }
  ];

  const filteredItems = rentalItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleRentalSubmit = async (rentalData: any) => {
    if (!selectedItem) return;

    try {
      const user = await getCurrentUser();
      if (!user) {
        alert('로그인이 필요합니다.');
        return;
      }

      await createRentalRequest({
        item_id: selectedItem.id,
        quantity: rentalData.quantity,
        rental_date: rentalData.rentalDate,
        return_date: rentalData.returnDate,
        total_price: selectedItem.price * rentalData.quantity * rentalData.days,
        deposit: selectedItem.deposit * rentalData.quantity,
        applicant: rentalData.applicant,
        club: rentalData.club,
        contact: rentalData.contact,
        purpose: rentalData.purpose,
      });

      alert('대여 신청이 완료되었습니다. 관리자 승인 후 안내드리겠습니다.');
      
      // 데이터 다시 로드
      const data = await getMyRentalRequests();
      setMyRentals(data.map(req => ({
        id: req.id,
        itemId: req.item_id,
        itemName: req.item_name || '',
        quantity: req.quantity,
        rentalDate: req.rental_date,
        returnDate: req.return_date,
        totalPrice: req.total_price,
        deposit: req.deposit,
        status: req.status,
        applicant: req.applicant,
        club: req.club || '',
        contact: req.contact,
        purpose: req.purpose || '',
        createdAt: req.created_at,
      })));
      
      setShowRentalForm(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('대여 신청 오류:', error);
      alert(error instanceof Error ? error.message : '대여 신청 중 오류가 발생했습니다.');
    }
  };

  const handleCancelRental = async (rentalId: string) => {
    if (!confirm('대여 신청을 취소하시겠습니까?')) return;

    try {
      await deleteRentalRequest(rentalId);
      alert('대여 신청이 취소되었습니다.');
      
      // 데이터 다시 로드
      const data = await getMyRentalRequests();
      setMyRentals(data.map(req => ({
        id: req.id,
        itemId: req.item_id,
        itemName: req.item_name || '',
        quantity: req.quantity,
        rentalDate: req.rental_date,
        returnDate: req.return_date,
        totalPrice: req.total_price,
        deposit: req.deposit,
        status: req.status,
        applicant: req.applicant,
        club: req.club || '',
        contact: req.contact,
        purpose: req.purpose || '',
        createdAt: req.created_at,
      })));
    } catch (error) {
      console.error('대여 취소 오류:', error);
      alert(error instanceof Error ? error.message : '대여 취소 중 오류가 발생했습니다.');
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '승인 대기';
      case 'approved':
        return '승인 완료';
      case 'rejected':
        return '거절됨';
      case 'returned':
        return '반납 완료';
      default:
        return status;
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
      case 'returned':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">오피스아워</h1>
          <p className="text-gray-600">동아리 활동에 필요한 장비와 물품을 대여할 수 있습니다.</p>
        </div>

        {/* 입금 안내 */}
        <div className="mb-8 bg-blue-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-start">
            <div className="w-6 h-6 flex items-center justify-center mt-0.5">
              <i className="ri-bank-card-line text-blue-600 text-lg"></i>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-900 mb-2">입금 안내</h3>
              <div className="text-blue-800 space-y-1">
                <div><strong>은행:</strong> {accountInfo.bank}</div>
                <div><strong>계좌번호:</strong> {accountInfo.accountNumber}</div>
                <div><strong>예금주:</strong> {accountInfo.accountHolder}</div>
              </div>
              <p className="text-sm text-blue-700 mt-2">
                • 대여 승인 후 대여료와 보증금을 위 계좌로 입금해주세요
                <br />
                • 보증금은 물품 반납 후 전액 환불됩니다
              </p>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="물품명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <i className={`${category.icon} mr-2`}></i>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* 대여 가능 물품 목록 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">대여 가능 물품</h2>
            <div className="text-sm text-gray-600">
              {loading ? '로딩 중...' : `총 ${filteredItems.length}개 물품`}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-48 object-cover object-top rounded-t-lg"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {item.category}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">대여료 (1일)</span>
                      <span className="font-medium text-gray-900">{item.price.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">보증금</span>
                      <span className="font-medium text-orange-600">{item.deposit.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">재고</span>
                      <span className={`font-medium ${item.available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.available}/{item.total}개
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setShowRentalForm(true);
                    }}
                    disabled={item.available === 0}
                    className={`w-full py-2 px-4 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                      item.available > 0
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {item.available > 0 ? '대여 신청' : '대여 불가'}
                  </button>
                </div>
              </div>
            ))}
            </div>
          )}

          {!loading && filteredItems.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border">
              <i className="ri-box-3-line text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-600">
                {searchTerm || selectedCategory !== 'all' 
                  ? '검색 조건에 맞는 물품이 없습니다.' 
                  : '등록된 물품이 없습니다. 관리자가 물품을 추가하면 여기에 표시됩니다.'}
              </p>
            </div>
          )}
        </div>

        {/* 내 대여 신청 현황 */}
        {myRentals.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">내 대여 신청 현황</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {myRentals.slice(0, 5).map((rental) => (
                  <div key={rental.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{rental.itemName}</h4>
                        <p className="text-sm text-gray-600">{rental.club}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(rental.status)}`}>
                        {getStatusText(rental.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">수량:</span> {rental.quantity}개
                      </div>
                      <div>
                        <span className="font-medium">대여일:</span> {rental.rentalDate}
                      </div>
                      <div>
                        <span className="font-medium">반납일:</span> {rental.returnDate}
                      </div>
                      <div>
                        <span className="font-medium">총 금액:</span> {rental.totalPrice.toLocaleString()}원
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">목적:</span> {rental.purpose}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">보증금:</span> {rental.deposit.toLocaleString()}원
                      </div>
                      {rental.status === 'pending' && (
                        <div className="mt-3">
                          <button
                            onClick={() => handleCancelRental(rental.id)}
                            className="w-full px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                          >
                            <i className="ri-close-line mr-2"></i>
                            신청 취소
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {myRentals.length > 5 && (
                <div className="mt-4 text-center">
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    전체 내역 보기 ({myRentals.length}건)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 대여 신청 모달 */}
      {showRentalForm && selectedItem && (
        <RentalForm
          item={selectedItem}
          onSubmit={handleRentalSubmit}
          onClose={() => {
            setShowRentalForm(false);
            setSelectedItem(null);
          }}
        />
      )}
    </>
  );
}
