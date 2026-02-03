// 요일 
export const DAYS_OPTIONS = [
    { label: '월', value: 'MON' },
    { label: '화', value: 'TUE' }, 
    { label: '수', value: 'WED' },
    { label: '목', value: 'THU' }, 
    { label: '금', value: 'FRI' }, 
    { label: '토', value: 'SAT' }, 
    { label: '일', value: 'SUN' }
]

// 공휴일 데이터
export const PUBLIC_HOLIDAYS_OPTIONS = [
    { label: '신정', value: 0 },
    { label: '설날 전날', value: 1, apiValue: '설 연휴1' },
    { label: '설날 당일', value: 2 },
    { label: '설날 다음날', value: 3, apiValue: '설 연휴2' },
    { label: '삼일절', value: 4 },
    { label: '석가탄신일', value: 5 },
    { label: '어린이날', value: 6 },
    { label: '현충일', value: 7 },
    { label: '광복절', value: 8 },
    { label: '개천절', value: 9 },
    { label: '한글날', value: 10 },
    { label: '추석 전날', value: 11, apiValue: '추석 연휴1' },
    { label: '추석 당일', value: 12 },
    { label: '추석 다음날', value: 13, apiValue: '추석 연휴2' },
    { label: '크리스마스', value: 14 },
]