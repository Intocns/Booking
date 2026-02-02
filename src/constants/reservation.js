//예약상태 define
export const RESERVE_STATUS_OPTIONS = [
    { label: '전체', value: 'all' },
    { label: '예약대기', value: 0 },
    { label: '예약확정', value: 1 },
    { label: '예약취소', value: 2 },
    { label: '예약거절', value: 3 },
]

export const RESERVE_STATUS_MAP = {
    0: '예약대기',
    1: '예약확정',
    2: '예약취소',
    3: '예약거절'
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
    { label: 'IntoVetGE', value: 1 },
    { label: '인투펫', value: 2 },
    { label: 'fitpet', value: 3 },
    { label: '네이버예약', value: 4 },
]

// ② List / Table 용 (O(1))
export const RESERVE_ROUTE_MAP = {
    1: 'IntoVetGE',
    2: '인투펫',
    3: 'fitpet',
    4: '네이버예약'
}