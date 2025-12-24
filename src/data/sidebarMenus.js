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
        children: [
            { name: "네이버 연동 계정 관리", path: "/place/account" },
            { name: "상품 관리", path: "/place/product" },
            { name: "옵션 관리", path: "/place/option" },
            { name: "간단 예약 관리", path: "/place/simple-reservation" },
            { name: "플레이스 설정", path: "/place/settings" }
        ]
    },
    {
        name: "인투펫 관리",
        icon: "icIntoPet",
        children: [
            { name: "운영 설정", path: "/intoPet/settings"},
            { name: "진료실 관리", path: "/intoPet/clinic"}
        ]
    },
    {
        name: "병원정보 관리",
        icon: "icHospital",
        children: []
    }
]
