
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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

export default function SuggestionPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedStatus, setSelectedStatus] = useState('전체');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const categories = ['전체', '시설', '시스템', '서비스', '행사', '기타'];
  const statuses = ['전체', 'pending', 'processing', 'completed', 'rejected'];
  const statusLabels = {
    pending: '검토중',
    processing: '처리중',
    completed: '완료',
    rejected: '반려'
  };

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '시설'
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
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
        if (typeof window !== 'undefined') {
          localStorage.setItem('suggestions', JSON.stringify(defaultSuggestions));
        }
        setSuggestions(defaultSuggestions);
      }
    };

    loadSuggestions();
    const interval = setInterval(loadSuggestions, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newSuggestion: Suggestion = {
      id: Date.now(),
      title: formData.title,
      content: formData.content,
      category: formData.category,
      author: '김동아리',
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      views: 0
    };

    const updatedSuggestions = [newSuggestion, ...suggestions];
    setSuggestions(updatedSuggestions);
    if (typeof window !== 'undefined') {
      localStorage.setItem('suggestions', JSON.stringify(updatedSuggestions));
    }

    setFormData({ title: '', content: '', category: '시설' });
    setIsFormOpen(false);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    const updatedSuggestions = suggestions.map(s => 
      s.id === suggestion.id ? { ...s, views: s.views + 1 } : s
    );
    setSuggestions(updatedSuggestions);
    if (typeof window !== 'undefined') {
      localStorage.setItem('suggestions', JSON.stringify(updatedSuggestions));
    }
    setSelectedSuggestion(suggestion);
  };

  const filteredSuggestions = suggestions
    .filter(suggestion => selectedCategory === '전체' || suggestion.category === selectedCategory)
    .filter(suggestion => selectedStatus === '전체' || suggestion.status === selectedStatus)
    .filter(suggestion => 
      suggestion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      suggestion.content.toLowerCase().includes(searchTerm.toLowerCase())
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

  if (selectedSuggestion) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <button
                onClick={() => setSelectedSuggestion(null)}
                className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
              >
                <i className="ri-arrow-left-line mr-2"></i>
                목록으로 돌아가기
              </button>

              <div className="border-b pb-6 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(selectedSuggestion.status)}`}>
                    {statusLabels[selectedSuggestion.status]}
                  </span>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    {selectedSuggestion.category}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  {selectedSuggestion.title}
                </h1>
                <div className="flex items-center text-sm text-gray-500 space-x-4">
                  <span>작성자: {selectedSuggestion.author}</span>
                  <span>작성일: {selectedSuggestion.date}</span>
                  <span>조회수: {selectedSuggestion.views}</span>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-3">건의 내용</h3>
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed bg-gray-50 p-4 rounded-lg">
                  {selectedSuggestion.content}
                </div>
              </div>

              {selectedSuggestion.response && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <i className="ri-reply-line text-blue-600 mr-2"></i>
                    <h3 className="text-lg font-medium text-blue-900">관리자 답변</h3>
                    <span className="text-sm text-blue-600 ml-auto">
                      {selectedSuggestion.responseDate}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap text-blue-800 leading-relaxed">
                    {selectedSuggestion.response}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">건의사항</h1>
                <p className="text-gray-600 mt-1">여러분의 소중한 의견을 들려주세요</p>
              </div>
              <button
                onClick={() => setIsFormOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
              >
                <i className="ri-add-line"></i>
                건의하기
              </button>
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

            <div className="space-y-3">
              {filteredSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(suggestion.status)}`}>
                          {statusLabels[suggestion.status]}
                        </span>
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                          {suggestion.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {suggestion.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span>{suggestion.author}</span>
                        <span>{suggestion.date}</span>
                        <span>조회 {suggestion.views}</span>
                      </div>
                    </div>
                    <i className="ri-arrow-right-s-line text-gray-400 ml-4"></i>
                  </div>
                </div>
              ))}
            </div>

            {filteredSuggestions.length === 0 && (
              <div className="text-center py-12">
                <i className="ri-lightbulb-line text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">검색 결과가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">새 건의사항 작성</h2>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    제목
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="건의사항 제목을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                  >
                    {categories.slice(1).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    내용
                  </label>
                  <textarea
                    required
                    rows={8}
                    maxLength={500}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="건의사항을 자세히 설명해주세요 (최대 500자)"
                  />
                  <div className="text-right text-sm text-gray-500 mt-1">
                    {formData.content.length}/500
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 whitespace-nowrap"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                  >
                    제출
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
