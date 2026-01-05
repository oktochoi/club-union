
'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '../AdminHeader';

interface Notice {
  id: number;
  title: string;
  content: string;
  category: string;
  author: string;
  date: string;
  isImportant: boolean;
}

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['전체', '일반', '시설', '동아리', '행사', '시스템'];

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '일반',
    isImportant: false
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // 공지사항 데이터 초기화
    localStorage.removeItem('notices');
    localStorage.setItem('notices', JSON.stringify([]));
    setNotices([]);
  }, []);

  const saveNotices = (updatedNotices: Notice[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notices', JSON.stringify(updatedNotices));
    }
    setNotices(updatedNotices);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingNotice) {
      const updatedNotices = notices.map(notice =>
        notice.id === editingNotice.id
          ? {
              ...notice,
              title: formData.title,
              content: formData.content,
              category: formData.category,
              isImportant: formData.isImportant
            }
          : notice
      );
      saveNotices(updatedNotices);
    } else {
      const newNotice: Notice = {
        id: Date.now(),
        title: formData.title,
        content: formData.content,
        category: formData.category,
        author: '관리자',
        date: new Date().toISOString().split('T')[0],
        isImportant: formData.isImportant
      };
      saveNotices([newNotice, ...notices]);
    }

    setFormData({ title: '', content: '', category: '일반', isImportant: false });
    setIsFormOpen(false);
    setEditingNotice(null);
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      category: notice.category,
      isImportant: notice.isImportant
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      const updatedNotices = notices.filter(notice => notice.id !== id);
      saveNotices(updatedNotices);
    }
  };

  const filteredNotices = notices
    .filter(notice => selectedCategory === '전체' || notice.category === selectedCategory)
    .filter(notice => 
      notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <AuthCheck requireAuth={true} requireAdmin={true}>
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
      <main className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">공지사항 관리</h1>
                <p className="text-gray-600 mt-1">공지사항을 작성하고 관리할 수 있습니다.</p>
              </div>
              <button
                onClick={() => {
                  setIsFormOpen(true);
                  setEditingNotice(null);
                  setFormData({ title: '', content: '', category: '일반', isImportant: false });
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
              >
                <i className="ri-add-line"></i>
                공지 작성
              </button>
            </div>

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
                      작성일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNotices.map((notice) => (
                    <tr key={notice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {notice.isImportant && (
                            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                              중요
                            </span>
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {notice.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                          {notice.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {notice.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(notice)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(notice.id)}
                            className="text-red-600 hover:text-red-900"
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

            {filteredNotices.length === 0 && (
              <div className="text-center py-12">
                <i className="ri-file-list-line text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">공지사항이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  {editingNotice ? '공지사항 수정' : '새 공지사항 작성'}
                </h2>
                <button
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingNotice(null);
                  }}
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
                    placeholder="공지사항 제목을 입력하세요"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                      우선순위
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isImportant}
                        onChange={(e) => setFormData({ ...formData, isImportant: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">중요 공지</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    내용
                  </label>
                  <textarea
                    required
                    rows={10}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="공지사항 내용을 입력하세요"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingNotice(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 whitespace-nowrap"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                  >
                    {editingNotice ? '수정' : '등록'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </AuthCheck>
  );
}
