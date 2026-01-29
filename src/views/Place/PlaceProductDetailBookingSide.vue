<!-- 상품관리 > 상품 수정 > 예약 정보 tab > 예약정보, 예약오픈/미노출 설정 -->
<script setup>
// 컴포넌트
import ModalDatePicker from '@/components/common/ModalDatePicker.vue';
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
import CustomDatePicker from '@/components/common/CustomDatePicker.vue';
import OperatingTimeForm from './OperatingTimeForm.vue';
import Modal from '@/components/common/Modal.vue';
import HolidayForm from './HolidayForm.vue';
import ModalSimple from '@/components/common/ModalSimple.vue';
import TimeSelect from '@/components/common/TimeSelect.vue';
// 아이콘
import icSetting from '@/assets/icons/ic_setting.svg'
import icEdit from '@/assets/icons/ic_edit.svg'
import icPlus from '@/assets/icons/ic_plus_black.svg';
import icDel from '@/assets/icons/ic_del.svg';
import icReset from '@/assets/icons/ic_reset.svg'

import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { format } from "date-fns";
// 스토어
import { useModalStore } from '@/stores/modalStore';
import { useProductStore } from '@/stores/productStore';
//util
import { formatDateToDay } from '@/utils/dateFormatter';
import { setOperatingObject } from '@/utils/product';
import { DAYS_OPTIONS, PUBLIC_HOLIDAYS_OPTIONS } from '@/constants';
import { validateTimeRanges } from '@/utils/common';
import { DayPilot } from '@daypilot/daypilot-lite-vue';
import { showAlert } from '@/utils/ui';

// props
const props = defineProps({
    savedItemId: {type: String},
    viewType: {type: String, default:null},
    previewName: { type: String },
    previewDesc: { type: String },
    previewDetails: { type: Array },
    previewNotice: { type: String }
})

const router = useRouter();
// 스토어
const modalStore = useModalStore();
const productStore = useProductStore();

// 설정 데이터 생성 함수
const createDefaultConfig = () => ({
    operatingMode: 'all',
    allDaysTime: [{ startTime: '', endTime: '' }],
    splitMode: 'weekend_all',
    splitTime: {
        weekday: [{ startTime: '', endTime: '' }], weekend: [{ startTime: '', endTime: '' }],
        sat: [{ startTime: '', endTime: '' }], sun: [{ startTime: '', endTime: '' }]
    },
    dailyGroups: [{ selectedDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], times: [{ startTime: '', endTime: '' }] }]
});

// 상태관리
const selectedAnimalCount = ref(null); // 예약 가능 동물 수 선택
const isHolidayEnabled = ref(false); // 휴무일 설정 여부 (Toggle)
const scheduleMode = ref('regular'); // 운영 일정 : 'regular', 'event'
const applyMode = ref('all'); // 적용 기간 : 'all', 'period'
const eventDates = ref([[]]); // 이벤트 기간/설정용

const configs = ref([createDefaultConfig()]); // 운영 설정 데이터 (하나로 관리)
const temporarySchedules = computed(() => productStore.temporarySchedules); //임시운영 데이터 스토어 직접참조
const holidayTexts = ref({
    regular: '',
    public: '',
    custom: ''
});
const holidayFormRef = ref(null) //저장 시 api에 맞춰 request형식으로 format하는 함수를 호출

const isDatePickerModalOpen = ref(false); //
const isTimeModalOpen = ref(false); // 시간 모달(ModalSimple) 상태
const settingType = ref(''); // 현재 어떤 설정을 하고 있는지 저장

// 기간 추가 
const addEventPeriod = () => {
    eventDates.value.push([]);
    configs.value.push(createDefaultConfig());
};
// 기간 삭제
const removeEventPeriod = (idx) => {
    eventDates.value.splice(idx, 1);
    configs.value.splice(idx, 1);
};

// 예약 가능 동물 수 옵션 (임시 1~10)
const animalCountOptions = Array.from({ length: 10 }, (_, i) => ({ label: String(i + 1), value: i + 1 }));

/**
 * 예약 오픈, 노출, 미노출 일 설정 관련
 */

// 모달에서 선택된 날짜들을 보관 (초기화 방지용)
const selectionData = reactive({
    OPEN_DATE: { date: null, time: '' },
    EXPOSURE_START: { date: null, time: '' },
    EXPOSURE_END: { date: null, time: '' }
});

//  모달 타이틀 동적 계산
const datePickerModalTitle = computed(() => {
    switch (settingType.value) {
        case 'OPEN_DATE': return '예약 오픈일시를 선택해 주세요';
        case 'EXPOSURE_START': return '노출 시작일시를 선택해 주세요';
        case 'EXPOSURE_END': return '미노출 시작일시를 선택해 주세요';
        default: return '날짜를 선택해 주세요';
    }
});

// 공통 모달 열기 함수
const openModal = (type) => {
    settingType.value = type;
    isDatePickerModalOpen.value = true;
};

// 날짜 모달에서 '적용' 클릭 시 -> 시간 모달로 전환
const onAddHoliday = (selectedData) => {
    if (settingType.value) {
        // 날짜 보관
        selectionData[settingType.value].date = selectedData.date;
    }
    isDatePickerModalOpen.value = false;
    isTimeModalOpen.value = true;
};

// 시간 모달 내부에서 날짜 박스 클릭 시 -> 다시 날짜 모달로
const goToDatePicker = () => {
    isTimeModalOpen.value = false;       // 시간 잠시 닫고
    isDatePickerModalOpen.value = true;  // 날짜 다시 열기 (기존 settingType 유지됨)
};

// 모달데이터 초기화 
const resetSelection = (type) => {
    if (!type) return;
    selectionData[type].date = null;
    selectionData[type].time = ''; // 또는 기본값 '09:00'
};

const onOpenDateSetting = () => openModal('OPEN_DATE'); // 예약 오픈일 설정하기
const onExposureStartSetting = () => openModal('EXPOSURE_START'); // 노출 시작일 설정하기
const onExposureEndSetting = () => openModal('EXPOSURE_END'); // 미노출 시작일 설정하기

// 예약오픈, 노출, 미노출일 취소 버튼 클릭 시
const closeTimeModal = () => {
    resetSelection(settingType.value); 
    isTimeModalOpen.value = false;
};

// selectionData에 값이 있으면(사용자가 수정했으면) 그 값을 쓰고, 없으면 기존 store 값 사용
const getFormattedDateTime = (type) => {
    const data = selectionData[type];
    if (data && data.date && data.time) {
        const datePart = format(data.date, 'yyyy-MM-dd');
        return `${datePart}T${data.time}:00+09:00`;
    }
    return null;
};

// 예약오픈, 노출, 미노출일 저장 버튼 클릭 시 
const saveTimeSetting = () => {
    const type = settingType.value; // 현재 설정 중인 타입 (OPEN_DATE 등)
    const currentData = selectionData[type];
    
    if (!currentData.date || !currentData.time) {
        showAlert('날짜와 시간을 모두 설정해 주세요.');
        return;
    }

    updateItemSchedule('operating');
};

/**
 * 저장 로직
 */
// 상품 수정 >> 일정 설정 >> 예약 정보 저장(예약일정)
const updateItemSchedule = (async(type) => {
    // --- 시간 유효성 검사 추가 ---
    for (const config of configs.value) {
        let allRanges = [];

        if (config.operatingMode === 'all') {
            allRanges = config.allDaysTime;
        } else if (config.operatingMode === 'split') {
            allRanges = [
                ...config.splitTime.weekday,
                ...config.splitTime.weekend,
                ...config.splitTime.sat,
                ...config.splitTime.sun
            ];
        } else if (config.operatingMode === 'daily') {
            allRanges = config.dailyGroups.flatMap(g => g.times);
        }

        if (!validateTimeRanges(allRanges)) {
            showAlert('마감 시간은 시작 시간보다 이후여야 합니다.');
            return; // 저장 중단
        }
    }
    // --------------------------

    const reserveCnt = selectedAnimalCount.value; // 진료가능 동물 수

    // 1. 현재 화면의 정기/이벤트 일정
    const currentPos = setScheduleForSave();
    // 2. 스토어에 보관 중인 임시 운영 일정 
    const tempPos = (productStore.temporarySchedules || []).map(temp => {
        return {
            ...temp,
            time: bitToTimeRanges(temp.hourBit),
            weekdays: [format(new Date(temp.startDate), 'eee').toLowerCase()],
        };
    });
    // 두 배열을 하나로 합침
    const pos = [...currentPos, ...tempPos];

    const proSchInfo = productStore.productScheduleInfo || {};

    // 휴무일 데이터 
    let impos = null;
    if(type == 'operating'){ // 수정화면 저장
        //수정화면 오픈 시 조회햇던 holiday 그대로 가져올 것
        impos = proSchInfo.impos;
    }else{ // holiday
        impos = isHolidayEnabled.value ? holidayFormRef.value.setSaveFormat() : null;
    }

    // 예약 오픈일, 노출시작일, 미노출 시작일 데이터
    // const newOpenDate = getFormattedDateTime('OPEN_DATE'); // 예약 오픈일 설정 미사용
    const newExpStart = getFormattedDateTime('EXPOSURE_START');
    const newExpEnd = getFormattedDateTime('EXPOSURE_END');

    const params = {
        reserveCnt: reserveCnt,
        pos: pos,
        impos: impos,
        impStartDateTime: proSchInfo.impStartDateTime || null,
        impEndDateTime: proSchInfo.impEndDateTime || null,
        bookableSettingJson: proSchInfo.bookableSettingJson ? { ...proSchInfo.bookableSettingJson } : null,
    };

    // 사용자가 모달을 통해 새로 설정한 값이 있다면 덮어쓰기
    if (newExpStart) params.impStartDateTime = newExpStart;
    if (newExpEnd) params.impEndDateTime = newExpEnd;
     // 예약 오픈일 설정 미사용
    // if (newOpenDate) {
    //     params.bookableSettingJson = {
    //         ...productStore.productScheduleInfo.bookableSettingJson,
    //         isUseOpen: true,
    //         openDateTime: newOpenDate,
    //     };
    // }

    // console.log(params);
    // return false;

    try {
        const response = await productStore.updateItemReservationInfo(props.savedItemId, params);

        showAlert('저장이 완료되었습니다');

        await initDataMapping(); 

        // 캘랜더 데이터 업데이트
        const currentStart = DayPilot.Date.today().firstDayOfWeek(1); 
        await productStore.getProductSchedule(props.savedItemId, {
            startDate: currentStart.toString("yyyy-MM-dd"),
            endDate: currentStart.addDays(6).toString("yyyy-MM-dd"),
        });

        isTimeModalOpen.value = false;
        modalStore.holidaySettingModal.closeModal();
    } catch(e) {
        console.error(e)
    }
})

//저장 전 일정 계산
const setScheduleForSave = () => {
    const isRegular = (scheduleMode.value === 'regular');
    const isAllMode = (scheduleMode.value === 'regular' || applyMode.value === 'all');

    return eventDates.value.flatMap((event, idx) => {
        const eventObject = !isRegular ? event : null;
        // 전체 설정 모드면 무조건 0번(첫 번째) 설정을 사용
        const targetConfig = isAllMode ? configs.value[0] : configs.value[idx];
        
        return setOperatingObject(eventObject, targetConfig, scheduleMode.value);
    });
}

// hourBit를 변환
const bitToTimeRanges = (bitString) => {
    // 비트가 없거나 전부 0인 경우
    if (!bitString || !bitString.includes('1')) {
        return [{ startTime: '', endTime: '' }];
    }

    const ranges = [];
    let start = null;

    // 48비트 순회 (0~47)
    for (let i = 0; i < bitString.length; i++) {
        const bit = bitString[i];
        
        // 1을 만났는데 아직 시작점이 없다면 (새로운 구간 시작)
        if (bit === '1' && start === null) {
            start = i;
        } 
        
        // 현재가 1인데 다음이 0이거나, 문자열의 끝인 경우 (구간 종료)
        if (start !== null && (bitString[i + 1] === '0' || i === bitString.length - 1)) {
            const end = i + 1; // 종료 지점은 인덱스 + 1 (길이 개념)
            
            const formatTime = (totalHalfHours) => {
                const hours = Math.floor(totalHalfHours / 2);
                const minutes = (totalHalfHours % 2) * 30;
                return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            };

            ranges.push({
                startTime: formatTime(start),
                endTime: formatTime(end)
            });
            
            start = null; // 초기화
        }
    }

    // console.log(bitString, ranges);
    return ranges.length > 0 ? ranges : [{ startTime: '', endTime: '' }];
};

// 운영일정,운영시간 데이터를 ui용 객체(config)로 변환
const mapPosToConfig = (posArray) => {
    const config = createDefaultConfig();
    if (!posArray || posArray.length === 0) return config;

    // 데이터가 1개이면서 7일 전체이거나, 혹은 여러 개라도 첫 번째 객체가 7일 전체인 경우
    const allDayItem = posArray.find(p => p.weekdays.length === 7);

    if (allDayItem) {
        config.operatingMode = 'all';
        config.allDaysTime = bitToTimeRanges(allDayItem.hourBit);
        return config; // 
    }

    // 평일 그룹 (월~금만 포함)
    const weekdayItem = posArray.find(p => 
        p.weekdays.every(day => ['mon', 'tue', 'wed', 'thu', 'fri'].includes(day)) && 
        p.weekdays.length >= 1
    );
    
    // 주말 그룹 (토, 일만 포함)
    const weekendItem = posArray.find(p => 
        p.weekdays.every(day => ['sat', 'sun'].includes(day)) &&
        p.weekdays.includes('sat') && p.weekdays.includes('sun')
    );

    // 개별 토/일
    const satItem = posArray.find(p => p.weekdays.length === 1 && p.weekdays[0] === 'sat');
    const sunItem = posArray.find(p => p.weekdays.length === 1 && p.weekdays[0] === 'sun');

    // 판별 및 매핑
    if (posArray.length === 2 && weekdayItem && weekendItem) {
        config.operatingMode = 'split';
        config.splitMode = 'weekend_all';
        config.splitTime.weekday = bitToTimeRanges(weekdayItem.hourBit);
        config.splitTime.weekend = bitToTimeRanges(weekendItem.hourBit);
    } 
    else if (posArray.length === 3 && weekdayItem && satItem && sunItem) {
        config.operatingMode = 'split';
        config.splitMode = 'sat_sun_individually';
        config.splitTime.weekday = bitToTimeRanges(weekdayItem.hourBit);
        config.splitTime.sat = bitToTimeRanges(satItem.hourBit);
        config.splitTime.sun = bitToTimeRanges(sunItem.hourBit);
    } 
    else {
        config.operatingMode = 'daily';
        config.dailyGroups = posArray.map(p => ({
            selectedDays: p.weekdays,
            times: bitToTimeRanges(p.hourBit)
        }));
    }
    return config;
};

// 임시운영 데이터를 ui용 객체로 변환
// 시작일과 종료일을 비교하여 포맷팅하는 헬퍼 함수
const formatTempDate = (start, end) => {
    const s = formatDateToDay(start); // 이미 만드신 util 사용
    const e = formatDateToDay(end);
    return s === e ? s : `${s} ~ ${e}`;
};

// UI에 표시할 임시 운영 리스트 가공
const formattedTempSchedules = computed(() => {
    return temporarySchedules.value.map(temp => {
        const timeRanges = bitToTimeRanges(temp.hourBit);
        
        const timeText = timeRanges
            .map(range => (range.startTime && range.endTime) 
                ? `${range.startTime} - ${range.endTime}` 
                : '시간 미설정')
            .join(', ');

        return {
            id: temp.id, // 수정 시 참조할 ID
            text: `${formatTempDate(temp.startDate, temp.endDate)} ${timeText} / 30분당 ${productStore.productScheduleInfo.reserveCnt}마리`,
            raw: temp // 수정 시 활용할 원본 데이터
        };
    });
});

// 임시운영 데이터 수정 로직
const onEditTemporary = (raw) => {
    // 캘린더에서 클릭했을 때와 동일한 데이터 규격으로 payload를 구성하여 전달
    modalStore.setOperationRuleModal.openModal({
        date: raw.startDate,
        stock: raw.stock,
        // bit를 [{startTime, endTime}] 배열로 변환해서 전달
        times: bitToTimeRanges(raw.hourBit),
        isUpdate: true, // 수정 모드임을 알림 (선택사항)
        originData: raw  // 원본 데이터가 필요할 경우를 대비
    });
};

// 임시운영 삭제 확인 모달 
const openDeleteTemporaryModal = (raw, targetIdx) => {
    modalStore.confirmModal.openModal({
        title: '예약 시간대 삭제',
        text: '삭제 시 일별로 변경한 설정을 포함하여 해당 시간대의\n모든 일정이 삭제됩니다.',
        confirmBtnText: '삭제',
        onConfirm: () => onDeleteTemporary(raw, targetIdx)
    })

}
// 임시운영 데이터 삭제 로직 (삭제하려는임시운영의 데이터만 제외하고 저장함)
const onDeleteTemporary = async (raw, targetIdx) => {
    modalStore.confirmModal.closeModal();

    // 현재 스토어의 임시 운영 배열 복사 및 해당 인덱스 삭제
    // 원본 스토어 데이터를 직접 수정하지 않기 위해 filter의 index 활용
    const updatedTempSchedules = (productStore.temporarySchedules || []).filter((_, idx) => idx !== targetIdx);

    // 가공 로직 (기존 updateItemSchedule 내부 로직 재활용)
    const reserveCnt = selectedAnimalCount.value;
    const currentPos = setScheduleForSave(); // 정기/이벤트 일정

    // 삭제하고 남은 임시 일정들 가공
    const tempPos = updatedTempSchedules.map(temp => {
        // startDate를 기반으로 요일 계산
        const dayAbbr = new DayPilot.Date(temp.startDate).toString("ddd", "en-us").toUpperCase();
        const shortToLong = {
            'MO': 'MON', 'TU': 'TUE', 'WE': 'WED', 'TH': 'THU', 
            'FR': 'FRI', 'SA': 'SAT', 'SU': 'SUN'
        };
        const finalDay = shortToLong[dayAbbr] || dayAbbr;
        return {
            ...temp,
            time: bitToTimeRanges(temp.hourBit),
            weekdays: [finalDay]
        }
    });

    const pos = [...currentPos, ...tempPos];
    const proSchInfo = productStore.productScheduleInfo || {};

    const params = {
        reserveCnt: reserveCnt,
        pos: pos,
        impos: proSchInfo.impos,
        impStartDateTime: proSchInfo.impStartDateTime,
        impEndDateTime: proSchInfo.impEndDateTime,
        bookableSettingJson: proSchInfo.bookableSettingJson
    };

    // console.log(params)
    // return false;

    // 전체 데이터 전송
    const response = await productStore.updateItemReservationInfo(props.savedItemId, params);

    showAlert('삭제되었습니다.');

    await initDataMapping(); // 예약 정보 재조회

    // 캘린더 새로고침
    const start = DayPilot.Date.today().firstDayOfWeek(1);
    await productStore.getProductSchedule(props.savedItemId, {
        startDate: start.toString("yyyy-MM-dd"),
        endDate: start.addDays(6).toString("yyyy-MM-dd"),
    });
};

// 휴무일 데이터를 ui용 객체(config)로 변환
const mapImposConfig = (impos) => {
    if (!impos) return;

    // 1. 정기 휴무일 처리
    const regularData = (impos.week && impos.week.length > 0) ? impos.week[0] : null;
    let regText = '';
    
    if (regularData?.weekdays && regularData.weekdays.length > 0) {
        // daysOptions에서 라벨 매핑 (daysOptions는 상단에 정의되어 있어야 함)
        const dayLabels = regularData.weekdays
            .map(d => DAYS_OPTIONS.find(opt => opt.value === d)?.label)
            .filter(l => l)
            .join(', ');

        const typeMap = {
            'WEEKLY': '매주',
            'BI_WEEKLY': '격주',
            'MONTHLY': '매달'
        };
        regText = `${typeMap[regularData.repetitionType] || ''} ${dayLabels}`;
    }

    // 2. 법정 공휴일 처리
    const hoDay = impos.hoDay || [];
    let pubText = '';

    if (hoDay.length > 0) {
        PUBLIC_HOLIDAYS_OPTIONS.forEach(opt => {
            if (hoDay.includes(opt.apiValue || opt.label)) {
                pubText += (pubText ? ', ' : '') + opt.label;
            }
        });
        pubText = hoDay.join(', ');
    }

    // 3. 그외 휴무일(spDay) 처리
    const spDay = impos.spDay || [];
    let cusText = '';
    if (spDay.length > 0) {
        cusText = spDay
        .filter(d => d.holidayType === "CUSTOM")
        .map(d => {
            if (d.repetitionType === 'DAILY') return d.startDate;
            if (d.repetitionType === 'MONTHLY') return `매달 ${d.repetitionDay}일`;
            if (d.repetitionType === 'YEARLY') return `매년 ${d.repetitionMonth}월 ${d.repetitionDay}일`;
            return '';
        }).join(', ');
    }

    // 최종 객체 업데이트
    holidayTexts.value = {
        regular: regText,
        public: pubText,
        custom: cusText
    };
};

// 휴무일 수정 모달 오픈
const openHolidayModal = async () => {
    modalStore.holidaySettingModal.openModal();
    
    setTimeout(() => {
        if (holidayFormRef.value) {
            holidayFormRef.value.initFormData(productStore.productScheduleInfo.impos);
        }
    }, 100);
};

// 데이터 매핑 함수
const initDataMapping = async () => {
    // API 호출 
    await Promise.all([
        productStore.getItemReservationInfo(props.savedItemId),
        productStore.getItemDetailInfo(props.savedItemId)
    ]);

    const data = productStore.productScheduleInfo;
    if (!data || !data.pos) return;

    // 실제 화면 설정(정기/이벤트)에 사용할 데이터만 필터링 (isBasicSchedule:true)
    const basicPos = data.pos.filter(item => item.isBasicSchedule !== false);

    // 기본 운영 데이터를 시작일 기준 정렬
    const sortedPos = [...basicPos].sort((a, b) => {
        return new Date(a.startDate) - new Date(b.startDate);
    });

    // 휴무일 데이터
    const impos = data.impos || {};

    // 이벤트 일정 존재 여부 확인 (endDate값 유무)
    const hasEventDate = sortedPos.some(item => item.endDate);

    // 데이터 매핑
    // 예약 가능 동물 수 매핑
    selectedAnimalCount.value = data.reserveCnt;
    // 휴무일 설정 여부 매핑
    isHolidayEnabled.value = !!(impos && (impos.week || impos.spDay || impos.hoDay));

    if (hasEventDate) {
        // 이벤트 운영 모드
        scheduleMode.value = 'event';

        const periods = [...new Set(sortedPos.map(p => `${p.startDate}~${p.endDate}`))];

        // 적용방식 > 기간이 2개 이상이면  'period'(기간별 설정), 1개면 'all'(전체 설정)
        applyMode.value = periods.length > 1 ? 'period' : 'all';
        // UI용 날짜 배열 생성
        eventDates.value = periods.map(p => p.split('~'));
        
        // 각 기간에 해당하는 설정값을 configs 배열에 매핑
        configs.value = periods.map(period => {
            const periodPos = sortedPos.filter(p => `${p.startDate}~${p.endDate}` === period);
            return mapPosToConfig(periodPos);
        });
    } else {
        // 정기 운영 모드
        scheduleMode.value = 'regular';
        configs.value = [mapPosToConfig(sortedPos)];
    }

    mapImposConfig(impos); // 휴무일 텍스트 갱신
    
    // 저장이 완료되었으므로 임시 선택 데이터는 비워줌
    resetSelection('OPEN_DATE');
    resetSelection('EXPOSURE_START');
    resetSelection('EXPOSURE_END');
};

// 운영시간 초기화 버튼
const onClearConfig = () => {
    configs.value = [createDefaultConfig()];
}

onMounted(async() => {
    initDataMapping();
})
</script>

<template>
    <div class="booking-right-layout">
        <section class="setting-box top">
            <p class="heading-s">예약 정보</p>
            <ul class="form-container">
                <li class="form-item">
                    <div class="form-label">예약 가능 동물 수</div>
                    <div class="form-content">
                        <div>
                            <div class="d-flex align-center gap-4 body-s">
                                매 30분 마다 최대
                                <CustomSingleSelect 
                                    v-model="selectedAnimalCount" 
                                    :options="animalCountOptions" 
                                    select-width="63px" 
                                    placeholder="0" 
                                />
                                마리까지 예약 가능
                            </div>
                            <span class="caption">
                                ※ 예약 가능한 동물 수는 IntoVet GE, 인투펫 예약 데이터와 연동되어 제공되는 기능입니다.
                            </span>
                        </div>
                    </div>
                </li>
                <li class="form-item">
                    <div class="form-label">운영 일정</div>
                    <div class="form-content">
                        <div class="d-flex gap-16">
                            <label class="radio">
                                <input type="radio" v-model="scheduleMode" value="regular" />
                                <span class="circle"></span>
                                <span class="label">정기 운영</span>
                            </label>

                            <label class="radio">
                                <input type="radio" v-model="scheduleMode" value="event" />
                                <span class="circle"></span>
                                <span class="label">이벤트 운영</span>
                            </label>
                        </div>

                        <!-- 이벤트 운영의 경우 기간 추가 영역 생성 -->
                        <div v-if="scheduleMode === 'event'" class="d-flex flex-col gap-8">
                            <div v-for="(date, idx) in eventDates" :key="idx" class="d-flex align-center gap-8">
                                <div class="d-flex align-center gap-8">
                                    <span class="title-s">기간</span>
                                    <CustomDatePicker  v-model="eventDates[idx]" />
                                </div>

                                <button 
                                    v-if="idx === 0" @click="addEventPeriod" 
                                    class="btn btn--size-24 btn--black-outline"
                                >
                                    <img :src="icPlus" alt="아이콘">기간 추가
                                </button>

                                <button 
                                    v-else 
                                    @click="removeEventPeriod(idx)" 
                                    class="btn btn--size-24 btn--black-outline"
                                >
                                    <img :src="icDel">삭제
                                </button>
                            </div>
                        </div>
                    </div>
                </li>

                <!-- 이벤트 운영일 경우, 적용 방식 설정  -->
                <li v-if="scheduleMode === 'event'" class="form-item">
                    <div class="form-label">적용 방식</div>
                    <div class="form-content">
                        <div class="d-flex gap-16">
                            <label class="radio">
                                <input type="radio" v-model="applyMode" value="all" />
                                <span class="circle"></span>
                                <span class="label">전체 설정</span>
                            </label>
                            <label class="radio">
                                <input type="radio" v-model="applyMode" value="period" />
                                <span class="circle"></span>
                                <span class="label">기간별 설정</span>
                            </label>
                        </div>
                    </div>
                </li>

                <!-- 운영 시간 -->
                <li class="form-item">
                    <div class="form-label">운영 시간</div>
                    <div class="form-content" style="padding: 8px 10px;">
                        <!-- 정기운영 || 이벤트 운영 && 전체 설정의 경우 -->
                        <div v-if="scheduleMode === 'regular' || applyMode === 'all'">
                            <OperatingTimeForm v-model="configs[0]" />
                        </div>

                        <!-- 이벤트 운영 && 기간별 설정의 경우 -->
                        <div v-else-if="scheduleMode === 'event' && applyMode === 'period'" class="d-flex flex-col gap-16">
                            <!-- 기간별로 운영시간 설정 영역 보여줌 -->
                            <div 
                                v-for="(pConfig, idx) in configs" 
                                :key="idx"
                                class="d-flex flex-col gap-8 period-item"
                            >
                                <div class="title-s">
                                    {{ eventDates[idx][0] ? formatDateToDay(eventDates[idx][0]) : '시작일 미정' }} ~ 
                                    {{ eventDates[idx][1] ? formatDateToDay(eventDates[idx][1]) : '종료일 미정' }}
                                </div>
                                <OperatingTimeForm v-model="configs[idx]" :idx="idx" />
                            </div>
                        </div>

                        <div class="d-flex justify-end">
                            <button 
                                @click="onClearConfig"
                                class="btn btn--size-24 btn--black-outline"
                            >
                                <img :src="icReset" alt="아이콘">
                                운영시간 초기화
                            </button>
                        </div>
                    </div>
                </li>

                <!-- 임시운영 정보 표시 -->
                <li v-if="formattedTempSchedules.length > 0" class="form-item">
                    <div class="form-label">임시 운영</div>
                    <div class="form-content">
                        <div class="d-flex flex-col gap-8">
                            <div 
                                v-for="(temp, idx) in formattedTempSchedules" 
                                :key="idx" 
                                class="d-flex align-center justify-between gap-8 body-s"
                            >
                                <span class="temp-schedule-text">{{ temp.text }}</span>
                                <!-- 수정/삭제 버튼 -->
                                <div class="d-flex align-center gap-4">
                                    <button 
                                        type="button" 
                                        class="btn btn--size-24 btn--black-outline" 
                                        @click="onEditTemporary(temp.raw)"
                                    >
                                        <img :src="icEdit" alt="수정" style="width:14px;">수정
                                    </button>
                                    <button
                                        class="btn btn--size-24 btn--black-outline"
                                        @click="openDeleteTemporaryModal(temp.raw, idx)"
                                    >
                                        <img :src="icDel" alt="아이콘"/>삭제
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </li>

                <li class="form-item">
                    <div class="form-label">휴무일 설정</div>
                    <div class="form-content">
                        <div class="d-flex align-center justify-between">
                            <label class="toggle">
                                <input type="checkbox" v-model="isHolidayEnabled" />
                                <span class="toggle-img"></span>
                            </label>
                            <button 
                                v-if="isHolidayEnabled" 
                                class="btn btn--size-24 btn--black-outline"
                                @click="openHolidayModal"
                            >
                                <img :src="icEdit" alt="아이콘">휴무일 수정
                            </button>
                        </div>
                    </div>
                </li>

                <!-- 휴무일 설정 on -->
                <template v-if="isHolidayEnabled">
                    <li class="form-item">
                        <div class="form-label">정기 휴무일</div>
                        <div class="form-content">
                            <p class="body-s">{{ holidayTexts.regular }}</p>
                        </div>
                    </li>
                    <li class="form-item">
                        <div class="form-label">법정 공휴일</div>
                        <div class="form-content">
                            <p class="body-s">{{ holidayTexts.public }}</p>
                        </div>
                    </li>
                    <li class="form-item">
                        <div class="form-label">그외 휴무일</div>
                        <div class="form-content">
                            <p class="body-s">{{ holidayTexts.custom }}</p>
                        </div>
                    </li>
                </template>

            </ul>
        </section>

        <section class="setting-box bottom">
            <p class="heading-s">노출/미노출 시작일 설정</p>
            
            <ul class="form-container">
                <!-- 예약오픈일 (추후 기능필요시 주석해제) -->
                <!-- <li class="form-item">
                    <div class="form-label">예약 오픈일</div>
                    <div class="form-content">
                        <div class="d-flex align-center justify-between">
                            <span class="body-s">
                                {{ productStore.productScheduleInfo.bookableSettingJson?.isUseOpen ? 
                                    formatDateToDay(new Date(productStore.productScheduleInfo.bookableSettingJson.openDateTime)) + '부터 예약 시작'
                                    : '오픈일 설정시, 오픈일 이전까지 예약 상품은 사전공개됩니다.' 
                                }}
                            </span>
                            <button class="btn btn--size-24 btn--black-outline" @click="onOpenDateSetting">
                                <img :src="icSetting" alt="아이콘">설정하기
                            </button>
                        </div>
                    </div>
                </li> -->
                <li class="form-item">
                    <div class="form-label">노출 시작일</div>
                    <div class="form-content">
                        <div class="d-flex align-center justify-between">
                            <span class="body-s">
                                {{ productStore.productScheduleInfo.impStartDateTime ? 
                                    formatDateToDay(new Date(productStore.productScheduleInfo.impStartDateTime)) + '부터 노출'
                                    : '노출되는 날짜, 시간을 미리 예약 설정할 수 있습니다.' }}
                            </span>
                            <button class="btn btn--size-24 btn--black-outline" @click="onExposureStartSetting">
                                <img :src="icSetting" alt="아이콘">설정하기
                            </button>
                        </div>
                    </div>
                </li>
                <li class="form-item">
                    <div class="form-label">미노출 시작일</div>
                    <div class="form-content">
                        <div class="d-flex align-center justify-between">
                            <span class="body-s">
                                {{ productStore.productScheduleInfo.impEndDateTime ? 
                                    formatDateToDay(new Date(productStore.productScheduleInfo.impEndDateTime)) + '부터 미노출'
                                    : '미노출되는 날짜, 시간을 미리 예약 설정할 수 있습니다.' }}
                            </span>
                            <button class="btn btn--size-24 btn--black-outline" @click="onExposureEndSetting">
                                <img :src="icSetting" alt="아이콘">설정하기
                            </button>
                        </div>
                    </div>
                </li>
            </ul>
        </section>

        <div class="button-wrapper">
            <button class="btn btn--size-40 btn--black" @click="router.push({ name: 'placeProduct'})">목록으로</button>
            <button class="btn btn--size-40 btn--blue" @click="updateItemSchedule('operating')">저장</button>
        </div>
    </div>

    <!-- 예약 오픈, 노출/미노출 설정 모달 -->
    <ModalDatePicker
        :is-modal-open="isDatePickerModalOpen" 
        :title="datePickerModalTitle"
        :show-repeat-options="false"
        :initial-date="selectionData[settingType]?.date"
        @close="isDatePickerModalOpen = false"
        @add="onAddHoliday"
    />
    
    <!-- 예약 오픈, 노출/미노출 설정 후 시간 설정 모달 -->
    <ModalSimple 
        v-if="isTimeModalOpen" 
        modal-width="240px"
        modal-height="400px"
        :modal-state="modalStore.setTimeSettingModal"
        :small-title="datePickerModalTitle"
    >
        <div class="modal-contents-inner">
            <div class="d-flex flex-col gap-16">
                <div class="d-flex flex-col gap-6">
                    <p class="title-s">시작일 설정</p>
                    <!--  -->
                    <div class="fake-date-picker" @click.stop="goToDatePicker">
                        <CustomDatePicker 
                            v-model="selectionData[settingType].date"
                            readonly 
                            :range="false"
                            style="pointer-events: none;"
                        />
                    </div>
                </div>
    
                <div class="d-flex flex-col gap-6">
                    <p class="title-s">시작 시각 설정</p>
                    <TimeSelect v-model="selectionData[settingType].time" />
                </div>
            </div>
        </div>

        <div class="modal-button-wrapper small">
            <div class="buttons">
                <button class="btn btn--size-24 btn--black-outline" @click="closeTimeModal">취소</button>
                <button class="btn btn--size-24 btn--black" @click="saveTimeSetting">저장</button>
            </div>
        </div>
    </ModalSimple>

    <!-- 휴무일 설정 모달 -->
    <Modal
        v-if="modalStore.holidaySettingModal.isVisible"
        size="m"
        title="휴무일 수정"
        :modal-state="modalStore.holidaySettingModal"
    >
        <div class="modal-contents-inner">
            <HolidayForm ref="holidayFormRef" />
        </div>

        <div class="modal-button-wrapper">
            <div class="buttons">
                <button class="btn btn--size-32 btn--blue" @click="updateItemSchedule('holiday')">저장</button>
            </div>
        </div>
    </Modal>
</template>

<style lang="scss" scoped>
    :deep(.caption) { color: $gray-500; }
    .booking-right-layout {
        display: flex;
        flex-direction: column;
        gap: 16px;
        height: 100%;

        .setting-box {
            display: flex;
            flex-direction: column;
            gap: 16px;
            
            background: #fff;
            border: 1px solid $gray-200;
            border-radius: 8px;
            padding: 24px;
            
            &.top {flex: 4; min-height:0;}
            &.bottom {flex: 1;}
        }
    }

    .button-wrapper {
        display: flex;
        gap: 8px;
        // padding-top: 16px;

        button {flex:1;}
    }

    .temp-schedule-text {
        flex: 2;
    }
</style>