
'use client';

import { useState, useEffect } from 'react';
import AuthCheck from '@/components/AuthCheck';
import AdminHeader from '../AdminHeader';

interface RentalItem {
  id: string;
  name: string;
  category: string;
  price: number;
  available: number;
  total: number;
  description: string;
  deposit: number;
  image: string;
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

export default function AdminRentalsPage() {
  const [selectedTab, setSelectedTab] = useState('requests');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RentalItem | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RentalRequest | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const [rentalItems, setRentalItems] = useState<RentalItem[]>([
    {
      id: '1',
      name: '무선 마이크',
      category: '음향장비',
      price: 5000,
      available: 8,
      total: 10,
      description: '고품질 무선 마이크로 공연 및 발표에 최적화되어 있습니다.',
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
      deposit: 200000
    }
  ]);

  const [rentalRequests, setRentalRequests] = useState<RentalRequest[]>([
    {
      id: '1',
      itemId: '1',
      itemName: '무선 마이크',
      quantity: 2,
      rentalDate: '2024-01-25',
      returnDate: '2024-01-27',
      totalPrice: 20000,
      deposit: 40000,
      status: 'pending',
      applicant: '김동아리',
      club: '음악동아리',
      contact: '010-1234-5678',
      purpose: '공연 준비',
      createdAt: '2024-01-20T10:30:00Z'
    },
    {
      id: '2',
      itemId: '3',
      itemName: '프로젝터',
      quantity: 1,
      rentalDate: '2024-01-26',
      returnDate: '2024-01-28',
      totalPrice: 45000,
      deposit: 100000,
      status: 'pending',
      applicant: '박발표',
      club: '창업동아리',
      contact: '010-2345-6789',
      purpose: '창업 발표회',
      createdAt: '2024-01-20T14:15:00Z'
    }
  ]);

  const [accountInfo, setAccountInfo] = useState({
    bank: 'KB국민은행',
    accountNumber: '123456-78-901234',
    accountHolder: '총동아리연합회'
  });

  // 로컬 스토리지와 실시간 동기화
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // 관리자가 수정한 물품 정보를 로컬 스토리지에 저장
    localStorage.setItem('adminRentalItems', JSON.stringify(rentalItems));
  }, [rentalItems]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // 사용자의 대여 신청을 실시간으로 확인
    const interval = setInterval(() => {
      const userRentalRequests = localStorage.getItem('userRentalRequests');
      if (userRentalRequests) {
        try {
          const newRequests = JSON.parse(userRentalRequests);
          setRentalRequests(prev => {
            const existingIds = prev.map(r => r.id);
            const filteredNewRequests = newRequests.filter((r: RentalRequest) => !existingIds.includes(r.id));
            if (filteredNewRequests.length > 0) {
              // 새로운 신청이 있을 때 알림
              if (Notification.permission === 'granted') {
                new Notification('새 대여 신청', {
                  body: `${filteredNewRequests[0].club}에서 ${filteredNewRequests[0].itemName} 대여를 신청했습니다.`,
                  icon: '/favicon.ico'
                });
              }
              return [...prev, ...filteredNewRequests];
            }
            return prev;
          });
        } catch (error) {
          console.error('대여 신청 정보 업데이트 오류:', error);
        }
      }
    }, 2000); // 2초마다 확인

    // 알림 권한 요청
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => clearInterval(interval);
  }, []);

  const handleItemSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // 이미지 파일 처리
    const imageFile = formData.get('image') as File;
    let imageUrl = editingItem?.image || '';
    
    if (imageFile && imageFile.size > 0) {
      // 파일을 base64로 변환하여 localStorage에 저장
      const reader = new FileReader();
      reader.onload = function(e) {
        if (!e.target?.result || typeof e.target.result !== 'string') {
          alert('이미지 파일을 읽을 수 없습니다.');
          return;
        }
        
        const base64String = e.target.result;
        
        const itemData: RentalItem = {
          id: editingItem ? editingItem.id : Date.now().toString(),
          name: formData.get('name') as string,
          category: formData.get('category') as string,
          price: parseInt(formData.get('price') as string),
          deposit: parseInt(formData.get('deposit') as string),
          total: parseInt(formData.get('total') as string),
          available: editingItem ? editingItem.available : parseInt(formData.get('total') as string),
          description: formData.get('description') as string,
          image: base64String
        };

        try {
          if (editingItem) {
            setRentalItems(prev => 
              prev.map(item => 
                item.id === editingItem.id 
                  ? { ...itemData, available: Math.min(itemData.total, editingItem.available) }
                  : item
              )
            );
            alert('물품이 수정되었습니다.');
          } else {
            setRentalItems(prev => [...prev, itemData]);
            alert('새 물품이 추가되었습니다.');
          }
          
          setShowItemModal(false);
          setEditingItem(null);
          
        } catch (error) {
          alert('물품 저장 중 오류가 발생했습니다.');
        }
      };
      reader.readAsDataURL(imageFile);
    } else {
      // 이미지가 없는 경우 기존 로직 실행
      const itemData: RentalItem = {
        id: editingItem ? editingItem.id : Date.now().toString(),
        name: formData.get('name') as string,
        category: formData.get('category') as string,
        price: parseInt(formData.get('price') as string),
        deposit: parseInt(formData.get('deposit') as string),
        total: parseInt(formData.get('total') as string),
        available: editingItem ? editingItem.available : parseInt(formData.get('total') as string),
        description: formData.get('description') as string,
        image: imageUrl || `https://readdy.ai/api/search-image?query=modern%20$%7BformData.get%28name%29%7D%20product%20on%20white%20background%2C%20clean%20product%20photography%2C%20professional%20equipment&width=300&height=200&seq=${Date.now()}&orientation=landscape`
      };

      try {
        if (editingItem) {
          setRentalItems(prev => 
            prev.map(item => 
              item.id === editingItem.id 
                ? { ...itemData, available: Math.min(itemData.total, editingItem.available) }
                : item
            )
          );
          alert('물품이 수정되었습니다.');
        } else {
          setRentalItems(prev => [...prev, itemData]);
          alert('새 물품이 추가되었습니다.');
        }
        
        setShowItemModal(false);
        setEditingItem(null);
        
      } catch (error) {
        alert('물품 저장 중 오류가 발생했습니다.');
      }
    }
  };

  const handleItemDelete = (itemId: string) => {
    if (confirm('이 물품을 삭제하시겠습니까?')) {
      setRentalItems(prev => prev.filter(item => item.id !== itemId));
      alert('물품이 삭제되었습니다.');
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject', reason?: string) => {
    // 이미 처리된 요청인지 확인
    const currentRequest = rentalRequests.find(r => r.id === requestId);
    if (!currentRequest || currentRequest.status !== 'pending') {
      alert('이미 처리된 요청입니다.');
      return;
    }

    try {
      const request = rentalRequests.find(r => r.id === requestId);
      if (!request) return;

      if (action === 'approve') {
        // 재고 확인
        const currentItem = rentalItems.find(item => item.id === request.itemId);
        if (!currentItem || currentItem.available < request.quantity) {
          alert('재고가 부족합니다. 현재 재고를 확인해주세요.');
          return;
        }

        // 재고 감소
        setRentalItems(prev => 
          prev.map(item => 
            item.id === request.itemId 
              ? { ...item, available: Math.max(0, item.available - request.quantity) }
              : item
          )
        );
      }

      // 대여 신청 상태 업데이트
      setRentalRequests(prev => 
        prev.map(request => 
          request.id === requestId 
            ? { ...request, status: action === 'approve' ? 'approved' : 'rejected' }
            : request
        )
      );

      // 사용자 대여 요청도 동기화
      if (typeof window !== 'undefined') {
        const userRentalRequests = JSON.parse(localStorage.getItem('userRentalRequests') || '[]');
        const updatedUserRequests = userRentalRequests.map((r: any) => 
          r.id === requestId ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r
        );
        localStorage.setItem('userRentalRequests', JSON.stringify(updatedUserRequests));
      }

      alert(`대여 신청이 ${action === 'approve' ? '승인' : '거절'}되었습니다.`);
      setShowRequestModal(false);
      setSelectedRequest(null);
      
    } catch (error) {
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newAccountInfo = {
      bank: formData.get('bank') as string,
      accountNumber: formData.get('accountNumber') as string,
      accountHolder: formData.get('accountHolder') as string
    };

    setAccountInfo(newAccountInfo);
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminAccountInfo', JSON.stringify(newAccountInfo));
    }
    alert('계좌 정보가 저장되었습니다.');
    setShowAccountModal(false);
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

  return (
    <AuthCheck requireAuth={true} requireAdmin={true}>
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">물품 대여 관리</h1>
            <p className="mt-2 text-gray-600">동아리 물품 대여 신청을 관리하고 물품을 등록합니다.</p>
          </div>

          {/* 탭 네비게이션 */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setSelectedTab('requests')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    selectedTab === 'requests'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <i className="ri-file-list-3-line mr-2"></i>
                  대여 신청 관리
                  {rentalRequests.filter(r => r.status === 'pending').length > 0 && (
                    <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                      {rentalRequests.filter(r => r.status === 'pending').length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setSelectedTab('items')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    selectedTab === 'items'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <i className="ri-box-3-line mr-2"></i>
                  물품 관리
                </button>
                <button
                  onClick={() => setSelectedTab('account')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    selectedTab === 'account'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <i className="ri-bank-card-line mr-2"></i>
                  계좌 관리
                </button>
              </nav>
            </div>
          </div>

          {/* 대여 신청 관리 탭 */}
          {selectedTab === 'requests' && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">대여 신청 현황</h2>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">실시간 연결됨</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {rentalRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{request.itemName}</h4>
                          <p className="text-sm text-gray-600">{request.club} - {request.applicant}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                          {getStatusText(request.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div><span className="font-medium">수량:</span> {request.quantity}개</div>
                        <div><span className="font-medium">대여일:</span> {request.rentalDate}</div>
                        <div><span className="font-medium">반납일:</span> {request.returnDate}</div>
                        <div><span className="font-medium">연락처:</span> {request.contact}</div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        <div><span className="font-medium">목적:</span> {request.purpose}</div>
                        <div className="mt-2">
                          <div className="flex justify-between">
                            <span>대여료: {request.totalPrice.toLocaleString()}원</span>
                            <span>보증금: {request.deposit.toLocaleString()}원</span>
                          </div>
                        </div>
                      </div>
                      
                      {request.status === 'pending' && (
                        <div className="flex space-x-2 pt-3 border-t">
                          <button
                            onClick={() => handleRequestAction(request.id, 'approve')}
                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 whitespace-nowrap"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRequestModal(true);
                            }}
                            className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 whitespace-nowrap"
                          >
                            거절
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {rentalRequests.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <i className="ri-file-list-3-line text-4xl mb-2"></i>
                      <p>대여 신청이 없습니다.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 물품 관리 탭 */}
          {selectedTab === 'items' && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">물품 관리</h2>
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setShowItemModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium whitespace-nowrap"
                  >
                    <i className="ri-add-line mr-2"></i>
                    물품 추가
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rentalItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-medium text-gray-900">{item.name}</h4>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {item.category}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex justify-between">
                          <span>대여료 (1일):</span>
                          <span className="font-medium">{item.price.toLocaleString()}원</span>
                        </div>
                        <div className="flex justify-between">
                          <span>보증금:</span>
                          <span className="font-medium text-orange-600">{item.deposit.toLocaleString()}원</span>
                        </div>
                        <div className="flex justify-between">
                          <span>재고:</span>
                          <span className={`font-medium ${item.available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.available}/{item.total}개
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setShowItemModal(true);
                          }}
                          className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 whitespace-nowrap"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleItemDelete(item.id)}
                          className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 whitespace-nowrap"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 계좌 관리 탭 */}
          {selectedTab === 'account' && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">입금 계좌 관리</h2>
                  <button
                    onClick={() => setShowAccountModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium whitespace-nowrap"
                  >
                    <i className="ri-edit-line mr-2"></i>
                    계좌 수정
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="max-w-md">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">현재 입금 계좌</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600">은행:</span>
                        <div className="text-lg font-medium text-gray-900">{accountInfo.bank}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">계좌번호:</span>
                        <div className="text-lg font-medium text-gray-900">{accountInfo.accountNumber}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">예금주:</span>
                        <div className="text-lg font-medium text-gray-900">{accountInfo.accountHolder}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-start">
                      <div className="w-5 h-5 flex items-center justify-center mt-0.5">
                        <i className="ri-information-line text-yellow-600"></i>
                      </div>
                      <div className="ml-2 text-sm text-yellow-800">
                        <p><strong>안내사항</strong></p>
                        <ul className="mt-1 space-y-1">
                          <li>• 대여료와 보증금은 위 계좌로 입금받습니다</li>
                          <li>• 계좌 정보는 사용자에게 자동으로 제공됩니다</li>
                          <li>• 보증금은 물품 반납 후 환불됩니다</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 물품 추가/수정 모달 */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingItem ? '물품 수정' : '물품 추가'}
                </h3>
                <button
                  onClick={() => {
                    setShowItemModal(false);
                    setEditingItem(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleItemSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    물품명 *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingItem?.name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 무선 마이크"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    카테고리 *
                  </label>
                  <select
                    name="category"
                    required
                    defaultValue={editingItem?.category || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                  >
                    <option value="">선택하세요</option>
                    <option value="음향장비">음향장비</option>
                    <option value="영상장비">영상장비</option>
                    <option value="컴퓨터">컴퓨터</option>
                    <option value="카메라">카메라</option>
                    <option value="기타">기타</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      1일 대여료 *
                    </label>
                    <input
                      type="number"
                      name="price"
                      required
                      min="0"
                      defaultValue={editingItem?.price || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="원"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      보증금 *
                    </label>
                    <input
                      type="number"
                      name="deposit"
                      required
                      min="0"
                      defaultValue={editingItem?.deposit || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="원"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    총 수량 *
                  </label>
                  <input
                    type="number"
                    name="total"
                    required
                    min="1"
                    defaultValue={editingItem?.total || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="개"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명 *
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={3}
                    maxLength={200}
                    defaultValue={editingItem?.description || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="물품에 대한 간단한 설명을 입력하세요"
                  />
                  <div className="text-xs text-gray-500 mt-1">최대 200자</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    물품 사진
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {editingItem?.image && (
                      <div className="mt-2">
                        <img
                          src={editingItem.image}
                          alt="현재 이미지"
                          className="w-20 h-20 object-cover object-top rounded-md border"
                        />
                        <p className="text-xs text-gray-500 mt-1">현재 이미지 (새 이미지를 선택하면 교체됩니다)</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      • 권장 크기: 300x200px
                      • 지원 형식: JPG, PNG, GIF
                      • 최대 파일 크기: 5MB
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowItemModal(false);
                      setEditingItem(null);
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    {editingItem ? '수정하기' : '추가하기'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 거절 사유 모달 */}
      {showRequestModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">대여 신청 거절</h3>
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setSelectedRequest(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="text-sm text-red-700">
                  <div><strong>물품:</strong> {selectedRequest.itemName}</div>
                  <div><strong>신청자:</strong> {selectedRequest.club} - {selectedRequest.applicant}</div>
                  <div><strong>수량:</strong> {selectedRequest.quantity}개</div>
                </div>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const reason = formData.get('reason') as string;
                handleRequestAction(selectedRequest.id, 'reject', reason);
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    거절 사유 *
                  </label>
                  <textarea
                    name="reason"
                    required
                    maxLength={500}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    placeholder="거절 사유를 구체적으로 입력해주세요"
                  />
                  <div className="text-xs text-gray-500 mt-1">최대 500자</div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRequestModal(false);
                      setSelectedRequest(null);
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    거절하기
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 계좌 수정 모달 */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">계좌 정보 수정</h3>
                <button
                  onClick={() => setShowAccountModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleAccountSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    은행명 *
                  </label>
                  <input
                    type="text"
                    name="bank"
                    required
                    defaultValue={accountInfo.bank}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: KB국민은행"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    계좌번호 *
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    required
                    defaultValue={accountInfo.accountNumber}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 123456-78-901234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    예금주 *
                  </label>
                  <input
                    type="text"
                    name="accountHolder"
                    required
                    defaultValue={accountInfo.accountHolder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 총동아리연합회"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAccountModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    저장하기
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AuthCheck>
  );
}
