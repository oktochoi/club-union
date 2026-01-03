
'use client';

export default function Footer() {
  return (
    <footer className="bg-white border-t mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="font-['Pacifico'] text-2xl text-blue-600 mb-4">총동연</div>
            <p className="text-gray-600 text-sm leading-relaxed">
              총동아리연합회는 모든 동아리의 원활한 활동을 지원하고<br />
              소통과 협력의 플랫폼을 제공합니다.
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600">
                <i className="ri-facebook-fill"></i>
              </a>
              <a href="#" className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600">
                <i className="ri-instagram-line"></i>
              </a>
              <a href="#" className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600">
                <i className="ri-kakao-talk-fill"></i>
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">주요 메뉴</h3>
            <ul className="space-y-2">
              <li><a href="/reservation" className="text-gray-600 hover:text-blue-600 text-sm">시설 예약</a></li>
              <li><a href="/office-hour" className="text-gray-600 hover:text-blue-600 text-sm">오피스아워</a></li>
              <li><a href="/notice" className="text-gray-600 hover:text-blue-600 text-sm">공지사항</a></li>
              <li><a href="/suggestion" className="text-gray-600 hover:text-blue-600 text-sm">건의사항</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">고객지원</h3>
            <ul className="space-y-2">
              <li className="text-gray-600 text-sm">
                <i className="ri-phone-line mr-2"></i>
                02-1234-5678
              </li>
              <li className="text-gray-600 text-sm">
                <i className="ri-mail-line mr-2"></i>
                okto@handong.ac.kr
              </li>
              <li className="text-gray-600 text-sm">
                <i className="ri-time-line mr-2"></i>
                평일 09:00 - 18:00
              </li>
              <li className="text-gray-600 text-sm">
                <i className="ri-map-pin-line mr-2"></i>
                학생회관 2층 총동연 사무실
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-6 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              © 2025 총동아리연합회. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-500 hover:text-blue-600 text-sm">이용약관</a>
              <a href="#" className="text-gray-500 hover:text-blue-600 text-sm">개인정보처리방침</a>
              <a href="#" className="text-gray-500 hover:text-blue-600 text-sm">문의하기</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}