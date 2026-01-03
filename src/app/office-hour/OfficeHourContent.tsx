
'use client';

import { useState, useEffect } from 'react';
import RentalForm from './RentalForm';

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
  status: 'pending' | 'approved' | 'rejected';
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

  const [rentalItems, setRentalItems] = useState<RentalItem[]>([
    {
      id: '1',
      name: '무선 마이크',
      category: '음향장비',
      price: 5000,
      available: 8,
      total: 10,
      description: '고품질 무선 마이크로 공연 및 발표에 최적화되어 있습니다.',
      image: 'https://readdy.ai/api/search-image?query=professional%20wireless%20microphone%20on%20white%20background%2C%20clean%20product%20photography%2C%20modern%20design%2C%20high%20quality%20audio%20equipment&width=300&height=200&seq=mic1&orientation=landscape',
      deposit: 20000
    },
    {
      id: '2',
      name: '포터블 스피커',
      category: '음향장비',
      price: 8000,
      available: 5,
      total: 8,
      description: '대용량 배터리와 강력한 출력을 자랑하는 포터블 스피커입니다.',
      image: 'https://readdy.ai/api/search-image?query=portable%20bluetooth%20speaker%20black%20color%20on%20white%20background%2C%20professional%20product%20photography%2C%20modern%20wireless%20speaker%20design&width=300&height=200&seq=speaker1&orientation=landscape',
      deposit: 50000
    },
    {
      id: '3',
      name: '프로젝터',
      category: '영상장비',
      price: 15000,
      available: 3,
      total: 5,
      description: 'Full HD 해상도를 지원하는 고성능 프로젝터입니다.',
      image: 'https://readdy.ai/api/search-image?query=modern%20projector%20white%20background%2C%20professional%20presentation%20equipment%2C%20clean%20product%20photography%2C%20business%20projector%20design&width=300&height=200&seq=projector1&orientation=landscape',
      deposit: 100000
    },
    {
      id: '4',
      name: '노트북 (대여용)',
      category: '컴퓨터',
      price: 10000,
      available: 7,
      total: 10,
      description: '업무 및 발표용으로 최적화된 대여용 노트북입니다.',
      image: 'https://readdy.ai/api/search-image?query=modern%20laptop%20computer%20open%20on%20white%20background%2C%20clean%20product%20photography%2C%20silver%20laptop%20design%2C%20professional%20business%20laptop&width=300&height=200&seq=laptop1&orientation=landscape',
      deposit: 200000
    },
    {
      id: '5',
      name: '카메라 (DSLR)',
      category: '카메라',
      price: 20000,
      available: 2,
      total: 4,
      description: '전문적인 사진 촬영을 위한 DSLR 카메라입니다.',
      image: 'https://readdy.ai/api/search-image?query=professional%20DSLR%20camera%20black%20color%20on%20white%20background%2C%20clean%20product%20photography%2C%20digital%20camera%20with%20lens%2C%20photography%20equipment&width=300&height=200&seq=camera1&orientation=landscape',
      deposit: 300000
    },
    {
      id: '6',
      name: '삼각대',
      category: '카메라',
      price: 3000,
      available: 6,
      total: 8,
      description: '카메라 및 캠코더용 안정적인 삼각대입니다.',
      image: 'https://readdy.ai/api/search-image?query=professional%20camera%20tripod%20black%20color%20on%20white%20background%2C%20clean%20product%20photography%2C%20adjustable%20tripod%20legs%2C%20photography%20equipment&width=300&height=200&seq=tripod1&orientation=landscape',
      deposit: 15000
    },
    {
      id: '7',
      name: '조명 세트',
      category: '영상장비',
      price: 12000,
      available: 3,
      total: 5,
      description: '영상 촬영 및 사진 촬영용 LED 조명 세트입니다.',
      image: 'https://readdy.ai/api/search-image?query=professional%20LED%20lighting%20kit%20on%20white%20background%2C%20clean%20product%20photography%2C%20video%20lighting%20equipment%2C%20adjustable%20studio%20lights&width=300&height=200&seq=light1&orientation=landscape',
      deposit: 80000
    },
    {
      id: '8',
      name: '연장선 (10m)',
      category: '기타',
      price: 1000,
      available: 12,
      total: 15,
      description: '10미터 길이의 안전한 연장선입니다.',
      image: 'https://readdy.ai/api/search-image?query=10%20meter%20extension%20cord%20white%20background%2C%20clean%20product%20photography%2C%20electrical%20cable%20with%20multiple%20outlets%2C%20safety%20power%20strip&width=300&height=200&seq=cord1&orientation=landscape',
      deposit: 5000
    }
  ]);

  // 관리자가 수정한 물품 정보를 실시간으로 반영
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const interval = setInterval(() => {
      // 관리자 재고 정보 동기화
      const adminRentalItems = localStorage.getItem('adminRentalItems');
      const adminInventory = localStorage.getItem('adminInventory');
      
      if (adminRentalItems) {
        try {
          const updatedItems = JSON.parse(adminRentalItems);
          
          // 관리자 재고 관리와 동기화
          if (adminInventory) {
            const inventoryItems = JSON.parse(adminInventory);
            const syncedItems = updatedItems.map((item: any) => {
              const inventoryItem = inventoryItems.find((inv: any) => inv.item === item.name);
              if (inventoryItem) {
                return {
                  ...item,
                  available: inventoryItem.current,
                  total: inventoryItem.current + 5, // 기본 총량 설정
                  image: item.image || `https://readdy.ai/api/search-image?query=modern%20$%7Bitem.name%7D%20product%20on%20white%20background%2C%20clean%20product%20photography%2C%20professional%20equipment&width=300&height=200&seq=${item.id}&orientation=landscape`
                };
              }
              return {
                ...item,
                image: item.image || `https://readdy.ai/api/search-image?query=modern%20$%7Bitem.name%7D%20product%20on%20white%20background%2C%20clean%20product%20photography%2C%20professional%20equipment&width=300&height=200&seq=${item.id}&orientation=landscape`
              };
            });
            setRentalItems(syncedItems);
          } else {
            // 이미지가 base64인 경우 그대로 사용, 아닌 경우 기본 이미지 유지
            const itemsWithImages = updatedItems.map((item: any) => ({
              ...item,
              image: item.image || `https://readdy.ai/api/search-image?query=modern%20$%7Bitem.name%7D%20product%20on%20white%20background%2C%20clean%20product%20photography%2C%20professional%20equipment&width=300&height=200&seq=${item.id}&orientation=landscape`
            }));
            setRentalItems(itemsWithImages);
          }
        } catch (error) {
          console.error('물품 정보 업데이트 오류:', error);
        }
      }

      // 관리자의 계좌 정보 업데이트
      const adminAccountInfo = typeof window !== 'undefined' ? localStorage.getItem('adminAccountInfo') : null;
      if (adminAccountInfo) {
        try {
          const updatedAccount = JSON.parse(adminAccountInfo);
          setAccountInfo(updatedAccount);
        } catch (error) {
          console.error('계좌 정보 업데이트 오류:', error);
        }
      }
    }, 2000); // 2초마다 확인

    return () => clearInterval(interval);
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

  const handleRentalSubmit = (rentalData: any) => {
    const newRental: RentalRequest = {
      id: Date.now().toString(),
      itemId: selectedItem!.id,
      itemName: selectedItem!.name,
      quantity: rentalData.quantity,
      rentalDate: rentalData.rentalDate,
      returnDate: rentalData.returnDate,
      totalPrice: selectedItem!.price * rentalData.quantity * rentalData.days,
      deposit: selectedItem!.deposit * rentalData.quantity,
      status: 'pending',
      applicant: rentalData.applicant,
      club: rentalData.club,
      contact: rentalData.contact,
      purpose: rentalData.purpose,
      createdAt: new Date().toISOString()
    };

    setMyRentals(prev => [newRental, ...prev]);
    
    // 관리자에게 실시간으로 전송
    if (typeof window !== 'undefined') {
      const existingRequests = JSON.parse(localStorage.getItem('userRentalRequests') || '[]');
      existingRequests.push(newRental);
      localStorage.setItem('userRentalRequests', JSON.stringify(existingRequests));
    }
    
    alert('대여 신청이 완료되었습니다. 관리자 승인 후 안내드리겠습니다.');
    
    setShowRentalForm(false);
    setSelectedItem(null);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '승인 대기';
      case 'approved':
        return '승인 완료';
      case 'rejected':
        return '거절됨';
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
              총 {filteredItems.length}개 물품
            </div>
          </div>

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

          {filteredItems.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border">
              <i className="ri-search-line text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-600">검색 조건에 맞는 물품이 없습니다.</p>
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
