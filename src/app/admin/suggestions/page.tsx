
'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '../AdminHeader';

interface Suggestion {
  id: number;
  title: string;
  content: string;
  category: string;
  author: string;
  date: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  views: number;
  response?: string;
  responseDate?: string;
}

export default function AdminSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedStatus, setSelectedStatus] = useState('전체');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [newStatus, setNewStatus] = useState<'pending' | 'processing' | 'completed' | 'rejected'>('processing');

  const categories = ['전체', '시설', '시스템', '서비스', '행사', '기타'];
  const statuses = ['전체', 'pending', 'processing', 'completed', 'rejected'];
  const statusLabels = {
    pending: '검토중',
    processing: '처리중',
    completed: '완료',
    rejected: '반려'
  };

  useEffect(() => {
    loadSuggestions();
    const interval = setInterval(loadSuggestions, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadSuggestions = () => {
    const savedSuggestions = localStorage.getItem('suggestions');
    if (savedSuggestions) {
      setSuggestions(JSON.parse(savedSuggestions));
    } else {
      const defaultSuggestions: Suggestion[] = [
        {
          id: 1,
          title: '동아리방 에어컨 교체 요청',
          content: '3층 음악동아리방 에어컨이 작동하지 않습니다. 여름이 다가오는데 교체가 필요합니다.',
          category: '시설',
          author: '김동아리',
          date: '2024-01-15',
          status: 'completed',
          views: 45,
          response: '시설점검을 통해 에어컨 교체 작업을 완료했습니다. 이용에 불편을 드려 죄송했습니다.',
          responseDate: '2024-01-18'
        },
        {
          id: 2,
          title: '예약 시스템 개선 제안',
          content: '현재 예약 시스템에서 취소 기능이 불편합니다. 예약 후 24시간 내 자유 취소가 가능하도록 개선해주세요.',
          category: '시스템',
          author: '이학생',
          date: '2024-01-12',
          status: 'processing',
          views: 32,
          response: '시스템 개선 작업을 진행 중입니다. 다음 업데이트에 반영될 예정입니다.',
          responseDate: '2024-01-14'
        },
        {
          id: 3,
          title: '동아리 홍보 공간 마련 요청',
          content: '1층 로비에 동아리 홍보 게시판을 설치해주세요. 현재 홍보할 공간이 부족합니다.',
          category: '시설',
          author: '박동아리',
          date: '2024-01-10',
          status: 'pending',
          views: 28
        }
      ];
      localStorage.setItem('suggestions', JSON.stringify(defaultSuggestions));
      setSuggestions(defaultSuggestions);
    }
  };

  const saveSuggestions = (updatedSuggestions: Suggestion[]) => {
    localStorage.setItem('suggestions', JSON.stringify(updatedSuggestions));
    setSuggestions(updatedSuggestions);
  };

  const handleStatusChange = (id: number, status: 'pending' | 'processing' | 'completed' | 'rejected') => {
    const updatedSuggestions = suggestions.map(suggestion =>
      suggestion.id === id
        ? { ...suggestion, status }
        : suggestion
    );
    saveSuggestions(updatedSuggestions);
  };

  const handleResponse = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setResponseText(suggestion.response || '');
    setNewStatus(suggestion.status);
    setIsResponseModalOpen(true);
  };

  const submitResponse = () => {
    if (!selectedSuggestion) return;

    const updatedSuggestions = suggestions.map(suggestion =>
      suggestion.id === selectedSuggestion.id
        ? {
            ...suggestion,
            status: newStatus,
            response: responseText,
            responseDate: new Date().toISOString().split('T')[0]
          }
        : suggestion
    );

    saveSuggestions(updatedSuggestions);
    setIsResponseModalOpen(false);
    setSelectedSuggestion(null);
    setResponseText('');
  };

  const handleDelete = (id: number) => {
    if (confirm('정말로 이 건의사항을 삭제하시겠습니까?')) {
      const updatedSuggestions = suggestions.filter(suggestion => suggestion.id !== id);
      saveSuggestions(updatedSuggestions);
    }
  };

  const filteredSuggestions = suggestions
    .filter(suggestion => selectedCategory === '전체' || suggestion.category === selectedCategory)
    .filter(suggestion => selectedStatus === '전체' || suggestion.status === selectedStatus)
    .filter(suggestion => 
      suggestion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      suggestion.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      suggestion.author.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingCount = suggestions.filter(s => s.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <main className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">건의사항 관리</h1>
                <p className="text-gray-600 mt-1">
                  사용자 건의사항을 관리하고 응답할 수 있습니다.
                  {pendingCount > 0 && (
                    <span className="ml-2 bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded-full">
                      신규 {pendingCount}건
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                      selectedStatus === status
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status === '전체' ? status : statusLabels[status as keyof typeof statusLabels]}
                  </button>
                ))}
              </div>
              
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="건의사항 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      제목
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      카테고리
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작성자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작성일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSuggestions.map((suggestion) => (
                    <tr key={suggestion.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {suggestion.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {suggestion.content}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                          {suggestion.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {suggestion.author}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={suggestion.status}
                          onChange={(e) => handleStatusChange(suggestion.id, e.target.value as any)}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 pr-8 ${getStatusColor(suggestion.status)}`}
                        >
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {suggestion.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleResponse(suggestion)}
                            className="text-blue-600 hover:text-blue-900"
                            title="답변하기"
                          >
                            <i className="ri-reply-line"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(suggestion.id)}
                            className="text-red-600 hover:text-red-900"
                            title="삭제"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredSuggestions.length === 0 && (
              <div className="text-center py-12">
                <i className="ri-lightbulb-line text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">건의사항이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {isResponseModalOpen && selectedSuggestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">건의사항 답변</h2>
                <button
                  onClick={() => setIsResponseModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">{selectedSuggestion.title}</h3>
                <p className="text-gray-700 text-sm mb-2">{selectedSuggestion.content}</p>
                <div className="text-xs text-gray-500">
                  작성자: {selectedSuggestion.author} | 작성일: {selectedSuggestion.date}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    처리 상태
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    답변 내용
                  </label>
                  <textarea
                    rows={6}
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="건의사항에 대한 답변을 작성해주세요..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsResponseModalOpen(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 whitespace-nowrap"
                  >
                    취소
                  </button>
                  <button
                    onClick={submitResponse}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
