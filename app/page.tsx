import Link from "next/link";

export default function Home() {
  const quickActions = [
    { path: "/register", title: "회원정보등록", description: "새로운 회원 정보를 등록합니다", icon: "📝", color: "from-red-500 to-red-600" },
    { path: "/measurement", title: "회원점수측정", description: "회원의 체력 점수를 측정합니다", icon: "📊", color: "from-green-500 to-green-600" },
    { path: "/list", title: "회원정보목록", description: "등록된 회원 정보를 조회합니다", icon: "📋", color: "from-purple-500 to-purple-600" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">대시보드</h1>
        <p className="text-gray-600 text-lg">헬스장 회원관리 시스템에 오신 것을 환영합니다</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {quickActions.map((action) => (
          <Link key={action.path} href={action.path} className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 hover:border-red-300">
            <div className={`w-16 h-16 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center mb-4 text-3xl group-hover:scale-110 transition-transform duration-300`}>
              {action.icon}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-red-600 transition-colors">{action.title}</h3>
            <p className="text-gray-600 text-sm">{action.description}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">시작하기</h2>
        <p className="text-gray-600 mb-4">좌측 메뉴에서 원하는 기능을 선택하거나, 위의 빠른 액션 카드를 클릭하여 시작하세요.</p>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>회원정보등록: 새로운 회원의 정보를 등록합니다</li>
          <li>회원점수측정: 회원의 체력 및 신체 측정 점수를 기록합니다</li>
          <li>회원정보목록: 등록된 모든 회원 정보를 조회하고 관리합니다</li>
        </ul>
      </div>
    </div>
  );
}
