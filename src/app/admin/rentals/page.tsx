
'use client';

import { useState, useEffect } from 'react';
import AuthCheck from '@/components/AuthCheck';
import AdminHeader from '../AdminHeader';
import {
  getRentalItems,
  createRentalItem,
  updateRentalItem,
  deleteRentalItem,
  getRentalRequests,
  updateRentalRequest,
  type RentalItem as RentalItemType,
  type RentalRequest as RentalRequestType,
} from '@/lib/supabase/rentals';
import { getAccountInfo, updateAccountInfo } from '@/lib/supabase/account';

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
  status: 'pending' | 'approved' | 'rejected' | 'returned';
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
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const [rentalItems, setRentalItems] = useState<RentalItem[]>([]);
  const [rentalRequests, setRentalRequests] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [accountInfo, setAccountInfo] = useState({
    bank: 'KB국민은행',
    accountNumber: '123456-78-901234',
    accountHolder: '총동아리연합회'
  });
  const [loadingAccount, setLoadingAccount] = useState(true);

  // 계좌 정보 로드
  useEffect(() => {
    const loadAccountInfo = async () => {
      try {
        setLoadingAccount(true);
        const data = await getAccountInfo();
        setAccountInfo({
          bank: data.bank,
          accountNumber: data.account_number,
          accountHolder: data.account_holder,
        });
      } catch (error) {
        console.error('계좌 정보 로딩 오류:', error);
      } finally {
        setLoadingAccount(false);
      }
    };

    loadAccountInfo();
    const interval = setInterval(loadAccountInfo, 10000); // 10초마다 업데이트
    return () => clearInterval(interval);
  }, []);

  // 물품 데이터 로드
  useEffect(() => {
    const loadRentalItems = async () => {
      try {
        const data = await getRentalItems(true); // 비활성화된 것도 포함
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
      }
    };

    loadRentalItems();
    const interval = setInterval(loadRentalItems, 10000); // 10초마다 업데이트
    return () => clearInterval(interval);
  }, []);

  // 대여 신청 데이터 로드
  useEffect(() => {
    const loadRentalRequests = async () => {
      try {
        setLoading(true);
        const data = await getRentalRequests();
        setRentalRequests(data.map(req => ({
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

        // 새로운 신청이 있을 때 알림
        if (typeof window !== 'undefined' && Notification.permission === 'granted') {
          const pendingCount = data.filter(r => r.status === 'pending').length;
          if (pendingCount > 0) {
            new Notification('새 대여 신청', {
              body: `승인 대기 중인 대여 신청이 ${pendingCount}건 있습니다.`,
              icon: '/favicon.ico'
            });
          }
        }
      } catch (error) {
        console.error('대여 신청 로딩 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRentalRequests();
    const interval = setInterval(loadRentalRequests, 5000); // 5초마다 업데이트

    // 알림 권한 요청
    if (typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => clearInterval(interval);
  }, []);

  const handleItemSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      // 이미지 파일 처리
      const imageFile = formData.get('image') as File;
      let imageBase64 = editingItem?.image || null;
      
      if (imageFile && imageFile.size > 0) {
        const reader = new FileReader();
        const imagePromise = new Promise<string>((resolve, reject) => {
          reader.onload = (e) => {
            if (!e.target?.result || typeof e.target.result !== 'string') {
              reject(new Error('이미지 파일을 읽을 수 없습니다.'));
              return;
            }
            resolve(e.target.result);
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(imageFile);
        imageBase64 = await imagePromise;
      }

      if (editingItem) {
        // 수정
        await updateRentalItem(editingItem.id, {
          name: formData.get('name') as string,
          category: formData.get('category') as string,
          price: parseInt(formData.get('price') as string),
          deposit: parseInt(formData.get('deposit') as string),
          total: parseInt(formData.get('total') as string),
          description: formData.get('description') as string,
          image: imageBase64 || undefined,
        });
        alert('물품이 수정되었습니다.');
      } else {
        // 추가
        await createRentalItem({
          name: formData.get('name') as string,
          category: formData.get('category') as string,
          price: parseInt(formData.get('price') as string),
          deposit: parseInt(formData.get('deposit') as string),
          total: parseInt(formData.get('total') as string),
          description: formData.get('description') as string,
          image: imageBase64 || undefined,
        });
        alert('새 물품이 추가되었습니다.');
      }
      
      // 데이터 다시 로드
      const data = await getRentalItems(true);
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
      
      setShowItemModal(false);
      setEditingItem(null);
    } catch (error) {
      console.error('물품 저장 오류:', error);
      alert(error instanceof Error ? error.message : '물품 저장 중 오류가 발생했습니다.');
    }
  };

  const handleItemDelete = async (itemId: string) => {
    if (!confirm('이 물품을 삭제하시겠습니까?')) return;
    
    try {
      await deleteRentalItem(itemId);
      alert('물품이 삭제되었습니다.');
      
      // 데이터 다시 로드
      const data = await getRentalItems(true);
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
      console.error('물품 삭제 오류:', error);
      alert(error instanceof Error ? error.message : '물품 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject' | 'return', reason?: string, adminNotes?: string) => {
    const currentRequest = rentalRequests.find(r => r.id === requestId);
    if (!currentRequest) {
      alert('대여 신청을 찾을 수 없습니다.');
      return;
    }

    // 승인/거절은 pending 상태에서만 가능
    if ((action === 'approve' || action === 'reject') && currentRequest.status !== 'pending') {
      alert('이미 처리된 요청입니다.');
      return;
    }

    // 반납 완료는 approved 상태에서만 가능
    if (action === 'return' && currentRequest.status !== 'approved') {
      alert('승인된 대여만 반납 완료 처리할 수 있습니다.');
      return;
    }

    try {
      if (action === 'approve') {
        // 재고 확인
        const currentItem = rentalItems.find(item => item.id === currentRequest.itemId);
        if (!currentItem || currentItem.available < currentRequest.quantity) {
          alert('재고가 부족합니다. 현재 재고를 확인해주세요.');
          return;
        }
      }

      // 대여 신청 상태 업데이트
      let status: 'approved' | 'rejected' | 'returned';
      if (action === 'approve') status = 'approved';
      else if (action === 'reject') status = 'rejected';
      else status = 'returned';

      await updateRentalRequest(requestId, {
        status,
        rejection_reason: action === 'reject' ? reason || null : null,
        admin_notes: adminNotes || null,
      });

      const actionText = action === 'approve' ? '승인' : action === 'reject' ? '거절' : '반납 완료';
      alert(`대여 신청이 ${actionText}되었습니다.`);
      setShowRequestModal(false);
      setShowApprovalModal(false);
      setSelectedRequest(null);
      
      // 데이터 다시 로드
      const [itemsData, requestsData] = await Promise.all([
        getRentalItems(true),
        getRentalRequests(),
      ]);
      
      setRentalItems(itemsData.map(item => ({
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
      
      setRentalRequests(requestsData.map(req => ({
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
      console.error('대여 신청 처리 오류:', error);
      alert(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.');
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const updated = await updateAccountInfo({
        bank: formData.get('bank') as string,
        account_number: formData.get('accountNumber') as string,
        account_holder: formData.get('accountHolder') as string,
      });

      setAccountInfo({
        bank: updated.bank,
        accountNumber: updated.account_number,
        accountHolder: updated.account_holder,
      });

      alert('계좌 정보가 저장되었습니다.');
      setShowAccountModal(false);
    } catch (error) {
      console.error('계좌 정보 저장 오류:', error);
      alert(error instanceof Error ? error.message : '계좌 정보 저장 중 오류가 발생했습니다.');
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
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowApprovalModal(true);
                            }}
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
                      {request.status === 'approved' && (
                        <div className="flex space-x-2 pt-3 border-t">
                          <button
                            onClick={() => {
                              if (confirm('반납 완료 처리하시겠습니까? 반납 후 재고가 복구됩니다.')) {
                                handleRequestAction(request.id, 'return');
                              }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 whitespace-nowrap"
                          >
                            <i className="ri-check-line mr-2"></i>
                            반납 완료
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

      {/* 승인 모달 */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">대여 신청 승인</h3>
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedRequest(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm text-green-700">
                  <div><strong>물품:</strong> {selectedRequest.itemName}</div>
                  <div><strong>신청자:</strong> {selectedRequest.club} - {selectedRequest.applicant}</div>
                  <div><strong>수량:</strong> {selectedRequest.quantity}개</div>
                  <div><strong>대여일:</strong> {selectedRequest.rentalDate}</div>
                  <div><strong>반납일:</strong> {selectedRequest.returnDate}</div>
                </div>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const adminNotes = formData.get('adminNotes') as string;
                handleRequestAction(selectedRequest.id, 'approve', undefined, adminNotes);
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    관리자 메모 (선택)
                  </label>
                  <textarea
                    name="adminNotes"
                    maxLength={500}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="승인과 함께 전달할 메시지나 주의사항을 입력하세요"
                  />
                  <div className="text-xs text-gray-500 mt-1">최대 500자</div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowApprovalModal(false);
                      setSelectedRequest(null);
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    승인하기
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
