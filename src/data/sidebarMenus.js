export const menus = [
    {
        name: "대시보드",
        icon: "icDashboard",
        path: "/dashboard",
        children: [] // 2뎁스 없음
    },
    {
        name: "예약 현황",
        icon: "icReservation",
        children: [
        { name: "전체 예약 조회", path: "/reservation/list" },
        { name: "대기 예약 관리", path: "/reservation/pending" },
        { name: "예약 일정 확인", path: "/reservation/schedule" },
        { name: "SMS 발송 내역", path: "/reservation/sms-history" },
        ]
    },
    {
        name: "네이버 플레이스 관리",
        icon: "icNaver",
        children: []
    },
    {
        name: "인투펫 관리",
        icon: "icIntoPet",
        children: []
    },
    {
        name: "병원정보 관리",
        icon: "icHospital",
        children: []
    }
]
