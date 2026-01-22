import { formatDate } from '@/utils/dateFormatter';

export const IS_IMP_TYPE = [
    { label: '미노출', value: false },
    { label: '노출중', value: true }
]

//운영일정, 운영시간 계산 작업
export const setOperatingObject = (event, object, scheduleMode) => {
    //평일/주말 구분 리스트
    const weekdaysList = {
        'sat' : ['sat'],
        'sun' : ['sun'],
        'weekend' : ['sat', 'sun'],
        'weekday' : ['mon','tue','wed','thu','fri'],
        'all' : ['mon','tue','wed','thu','fri','sat','sun']
    }

    //공통 return 데이터
    const baseSchedule = {
        startDate: event?.[0] ? formatDate(event?.[0]) : null,
        endDate: event?.[1] ? formatDate(event?.[1]) : null,
        isBusinessDay: true,
        isBasicSchedule: null, //scheduleMode !== 'event', //해당 키값은 임시운영에 대한 키값이므로 주석처리함
    };

    //운영 시간 라디오 버튼 선택에 따른 분기처리
    switch(object.operatingMode){
        case 'all' : //모든 영업일 동일
            return {
                ...baseSchedule,
                weekdays : weekdaysList['all'],
                time : object.allDaysTime
            };
        case 'split' : //평일/주말 운영 시간 구분
            return Object.entries(object.splitTime)
            .filter(([key]) => 
                (object.splitMode === 'weekend_all' && ['weekday','weekend'].includes(key)) ||
                (object.splitMode === 'weekend_split' && ['weekday','sat','sun'].includes(key))
            ).map(([key,data]) => ({
                ...baseSchedule,
                weekdays: weekdaysList[key],
                time: data,
            }));
        case 'daily' : //요일별 설정
            return Object.values(object.dailyGroups).map(data => ({
                ...baseSchedule,
                weekdays : data.selectedDays,
                time : data.times
            }));
        default : 
            return false;
    }
}