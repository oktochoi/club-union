
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthCheck from '@/components/AuthCheck';

interface Notice {
  id: number;
  title: string;
  content: string;
  category: string;
  author: string;
  date: string;
  isImportant: boolean;
}

export default function NoticePage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const categories = ['전체', '일반', '시설', '동아리', '행사', '시스템'];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadNotices = () => {
      const savedNotices = localStorage.getItem('notices');
      if (savedNotices) {
        setNotices(JSON.parse(savedNotices));
      } else {
        // 빈 배열로 초기화
        setNotices([]);
        localStorage.setItem('notices', JSON.stringify([]));
      }
    };

    loadNotices();
    const interval = setInterval(loadNotices, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredNotices = notices
    .filter(notice => selectedCategory === '전체' || notice.category === selectedCategory)
    .filter(notice => 
      notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (a.isImportant && !b.isImportant) return -1;
      if (!a.isImportant && b.isImportant) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const handleNoticeClick = (notice: Notice) => {
    setSelectedNotice(notice);
  };

  if (selectedNotice) {
    return (
      <AuthCheck requireAuth={true}>
        <div className="min-h-screen bg-gray-50">
          <Header />
        <main className="py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <button
                onClick={() => setSelectedNotice(null)}
                className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
              >
                <i className="ri-arrow-left-line mr-2"></i>
                목록으로 돌아가기
              </button>

              <div className="border-b pb-6 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  {selectedNotice.isImportant && (
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                      중요
                    </span>
                  )}
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    {selectedNotice.category}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  {selectedNotice.title}
                </h1>
                <div className="flex items-center text-sm text-gray-500 space-x-4">
                  <span>작성자: {selectedNotice.author}</span>
                  <span>작성일: {selectedNotice.date}</span>
                </div>
              </div>

              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {selectedNotice.content}
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
      </AuthCheck>
    );
  }

  return (
    <AuthCheck requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        <Header />
      <main className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">공지사항</h1>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
              
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="공지사항 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>

            <div className="space-y-3">
              {filteredNotices.map((notice) => (
                <div
                  key={notice.id}
                  onClick={() => handleNoticeClick(notice)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {notice.isImportant && (
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                            중요
                          </span>
                        )}
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                          {notice.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {notice.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span>{notice.author}</span>
                        <span>{notice.date}</span>
                      </div>
                    </div>
                    <i className="ri-arrow-right-s-line text-gray-400 ml-4"></i>
                  </div>
                </div>
              ))}
            </div>

            {filteredNotices.length === 0 && (
              <div className="text-center py-12">
                <i className="ri-file-list-line text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">공지사항이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
    </AuthCheck>
  );
}
