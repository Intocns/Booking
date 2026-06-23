//예약상태 define
export const RESERVE_STATUS_OPTIONS = [
    { label: '전체', value: 'all' },
    { label: '대기', value: 0 },
    { label: '확정', value: 1 },
    { label: '취소', value: 2 },
    { label: '거절', value: 3 },
]

export const RESERVE_STATUS_MAP = {
    0: '대기',
    1: '확정',
    2: '취소',
    3: '거절'
}

export const RESERVE_STATUS_SHORT_MAP = {
    0: '대기',
    1: '확정',
    2: '취소',
    3: '거절'
}

export const RESERVE_STATUS_CLASS_MAP = {
    0: 'flag--yellow',
    1: 'flag--basic',
    2: 'flag--warning',
    3: 'flag--warning'
}

//예약경로 define
export const RESERVE_ROUTE_OPTIONS = [
    { label: '전체', value: 'all' },
    { label: '네이버 예약', value: 4 },
    { label: 'IntoVET', value: 1 },
    { label: '인투펫', value: 2 },
    // { label: 'fitpet', value: 3 },
]

// ② List / Table 용 (O(1))
export const RESERVE_ROUTE_MAP = {
    1: 'IntoVET',
    2: '인투펫',
    // 3: 'fitpet',
    4: '네이버예약'
}