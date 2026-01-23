<!-- 상품"수정" > 예약 정보 -->
<script setup>
import { DayPilot, DayPilotCalendar } from "@daypilot/daypilot-lite-vue";
import { ref, reactive, onMounted, computed, watch, onActivated } from 'vue';
import { storeToRefs } from "pinia";
// 아이콘
import icArrowRight from '@/assets/icons/ic_arrow_right_blue.svg'
import icClear from '@/assets/icons/ic_clear.svg'
// 컴포넌트
import ModalSimple from "@/components/common/ModalSimple.vue";
import CustomSingleSelect from "@/components/common/CustomSingleSelect.vue";
import TimeSelect from "@/components/common/TimeSelect.vue";
// 스토어
import { useModalStore } from "@/stores/modalStore";
import { useProductStore } from "@/stores/productStore";
// 
import { bitToTimeRanges } from "@/utils/schedule";
import { DAYS_OPTIONS } from "@/utils/schedule";


const productStore = useProductStore();
const modalStore = useModalStore();
const { productWeekScheduleDataList } = storeToRefs(productStore);

// props
const props = defineProps({
    savedItemId: {type: [ String, Number ]},
    viewType: {type: String, default:null},
    previewName: { type: String },
    previewDesc: { type: String },
    previewDetails: { type: Array },
    previewNotice: { type: String }
})

/**
 * 상태 관리
 */
const calendarRef = ref(null);
const selectedEvent = ref(null);
const tempBitArray = ref([]); // 모달 내에서 임시로 수정될 상태 변수
const targetDate = ref("");
const selectedDay = ref(null); // 요일 선택 상태
const selectedAnimalCount = ref(null); // 진료 가능 동물 수 선택 상태
const times = ref([
    { startTime: "", endTime: "" }
]); // 진료가능 동물 수, 운영시간 설정 모달창 > 운영시간 설정 times

// 예약 가능 동물 수 (임시 1~10)
const animalCountOptions = Array.from({ length: 10 }, (_, i) => ({ label: String(i + 1), value: i + 1 }));

// productWeekScheduleDataList 데이터를 이벤트 형식으로 파싱
const events = computed(() => {
    const allEvents = [];

    if(!productWeekScheduleDataList.value) return [];

    productWeekScheduleDataList.value.forEach(daySchedule => {
        allEvents.push(...parseHourBitToEvents(daySchedule));
    });

    return allEvents;
})

const getTotalMinutes = (timeStr) => { // 운영 시간 범위(startTime ~ endTime)를 인덱스로 변환
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

const parseHourBitToEvents = (daySchedule) => {
    if(!daySchedule || !daySchedule.hourBit) return [];
    if(daySchedule.isBusinessDay === false) return []; // 비운영일 경우 빈 배열 반환

    const bitString = daySchedule.hourBit;
    const newEvents = []; // 가공해서 담아줄 데이터
    const dateStr = daySchedule.date;

    // 운영 시간 범위 계산
    const startLimitMin = getTotalMinutes(daySchedule.startTime || "00:00");
    const endLimitMin = getTotalMinutes(daySchedule.endTime || "24:00");

    const startIdxLimit = Math.max(0, Math.floor(startLimitMin / 30));
    const endIdxLimit = Math.min(bitString.length, Math.ceil(endLimitMin / 30));

    let i = startIdxLimit;

    while (i < endIdxLimit) {
        const currentBit = bitString[i];
        let j = i;

        // 같은 비트가 연속되는 구간 찾기 (단, endIdxLimit을 넘지 않아야 함)
        while (j < endIdxLimit && bitString[j] === currentBit) {
            j++;
        }

        // 시간 계산 (startIdx부터 endIdx까지 하나의 블록)
        const blockStartTotalMin = i * 30;
        const blockEndTotalMin = j * 30;

        const format = (totalMin) => {
            const h = Math.floor(totalMin / 60).toString().padStart(2, '0');
            const m = (totalMin % 60).toString().padStart(2, '0');
            return `${h}:${m}:00`;
        };

        newEvents.push({
            id: `${dateStr}-${i}`,
            start: `${dateStr}T${format(blockStartTotalMin)}`,
            end: `${dateStr}T${format(blockEndTotalMin)}`,
            backColor: currentBit === '1' ? '#E3F2FD' : '#F5F5FA', // 운영/마감에 따른 배경색 설정
            cssClass: currentBit === '1' ? 'event-open' : 'event-closed', // 운영/마감에 따른 클래스 설정

            tags: {
                bitValue: currentBit,
                startIdx: i,
                endIdx: j,
                date: dateStr
            }
        });

        // 다음 블록 시작점으로 이동
        i = j;
    }
    return newEvents;
}

// 이전 주로 이동
const prevWeek = () => {
    // 현재 시작일 - 7
    const currentStart = new DayPilot.Date(calendarConfig.startDate);
    calendarConfig.startDate = currentStart.addDays(-7);
};

// 다음 주로 이동
const nextWeek = () => {
    // 현재 시작일 + 7
    const currentStart = new DayPilot.Date(calendarConfig.startDate);
    calendarConfig.startDate = currentStart.addDays(7);
};

// 현재 표시되는 날짜 범위 텍스트
const dateRangeText = computed(() => {
    if (!calendarConfig.startDate) return "";
    
    const start = new DayPilot.Date(calendarConfig.startDate);
    // 주간 뷰(7일)이므로 시작일 + 6일이 종료일
    const end = start.addDays(6);
    
    // 형식: 2026.01.05 - 01.11
    return `${start.toString("yyyy.MM.dd")} - ${end.toString("MM.dd")}`;
});

// 이벤트 클릭 시 데이터를 복사해서 임시 변수에 담음
const handleEventClick = (args) => {
    // console.log("이벤트 클릭:", args.e.data);
    const eventData = args.e.data;
    const date = eventData.tags.date; // parseHourBitToEvents에서 넣은 날짜
    targetDate.value = date;

    const daySchedule = productWeekScheduleDataList.value.find(day => day.date === date);
    
    if (daySchedule) {
        // console.log("선택된 날짜 스케줄:", daySchedule);
        // 원본 배열로 복사
        tempBitArray.value = daySchedule.hourBit.split('');

        let dayOfWeekIndex = new DayPilot.Date(date).getDayOfWeek(); // 1:월 ~ 7:일
        if (dayOfWeekIndex === 0) {
            dayOfWeekIndex = 6;
        } else {
            dayOfWeekIndex = dayOfWeekIndex - 1;
        }
        const currentDayValue = DAYS_OPTIONS[dayOfWeekIndex].value;
        selectedDay.value = currentDayValue; // 요일 선택 상태 설정

        // 동물 수 연결
        selectedAnimalCount.value = daySchedule.stock || '';
        
        selectedEvent.value = JSON.parse(JSON.stringify(eventData)); 
        modalStore.setDateSettingModal.openModal(selectedEvent.value);
    }
};

// 2단계: "진료 가능 동물 수, 운영시간 변경하기" 버튼 클릭 시
const handelSetOperationModalOpen = () => {
    // 1. 현재 열려있는 캘린더 전용 모달 닫기
    modalStore.setDateSettingModal.closeModal();

    // 2. 부모가 관리하는 '공통 설정 모달'에 데이터 채워주며 열기
    const daySchedule = productStore.productWeekScheduleDataList.find(day => day.date === targetDate.value);
    
    if (daySchedule) {
        modalStore.setOperationRuleModal.openModal({
            date: targetDate.value,
            stock: daySchedule.stock,
            // 비트를 [{startTime, endTime}] 배열로 변환
            times: bitToTimeRanges(daySchedule.hourBit) 
        });
    }
};

// 캘린더 설정
const calendarConfig = reactive({
    viewType: "Week",                // 주간 뷰 설정
    locale: "ko-kr",                 // 한국어 설정
    weekStarts: 1,                   // 0: 일요일, 1: 월요일 (시작일 설정)
    headerDateFormat: "MM.dd (ddd)", // 헤더 날짜 형식
    timeFormat: "Clock24Hours",      // 타임 포맷 24시 형식
    cellHeight: 32,                  // 셀 높이
    businessBeginsHour: 9,           // 시작 시간
    businessEndsHour: 20,            // 종료 시간
    dayBeginsHour: 0,                // 하루 시작 (0시)
    dayEndsHour: 24,                 // 하루 끝 (24시)
    events: events.value,
    eventMoveHandling: "Disabled",
    eventResizeHandling: "Disabled",
    
    onEventClick: handleEventClick,
});

// 모달 내에서 편집할 해당 날짜의 전체 시간 리스트
const dayEvents = computed(() => {
    if (!selectedEvent.value || tempBitArray.value.length === 0) return [];
    
    const daySchedule = productWeekScheduleDataList.value.find(day => day.date === targetDate.value);
    if (!daySchedule) return [];

    const startTime = daySchedule.startTime || "00:00";
    const endTime = daySchedule.endTime || "24:00";

    const getTotalMinutes = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    };

    const startLimit = getTotalMinutes(startTime);
    const endLimit = getTotalMinutes(endTime);
    const list = [];

    // 임시 배열(tempBitArray)을 기준으로 30분 단위 리스트 생성
    for (let i = 0; i < tempBitArray.value.length; i++) {
        const totalMinutes = i * 30;
        if (totalMinutes >= startLimit && totalMinutes < endLimit) {
            const hour = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
            const min = (totalMinutes % 60).toString().padStart(2, '0');
            
            list.push({
                id: i,
                timeText: `${hour}:${min}`,
                bitValue: tempBitArray.value[i] // 임시 상태값
            });
        }
    }
    return list;
});

// 모달 헤더에 표시할 날짜 형식
const modalTitle = computed(() => {
    if (!selectedEvent.value) return ""
    
    // ddd는 요일을 한 글자(월, 화, 수...)로 표시
    return new DayPilot.Date(selectedEvent.value.start).toString("yy.MM.dd (ddd)","ko-kr");
});

// 상품시간별 운영/미운영 개별 토글 버튼 이벤트
const handleToggle = (index, isChecked) => {
    tempBitArray.value[index] = isChecked ? '1' : '0';
};

// 상품시간별 운영/마감 API 호출 및 상태 업데이트
const updateScheduleBit = async (bizItemId, day, newBitArray, startTime, endTime, scheduleId = 0) => {
    const times = newBitArray.map((bit, i) => ({
        time: formatTime(i),
        useFlag: parseInt(bit)
    }));

    const params = {
        day: day,
        startTime: startTime,
        endTime: endTime,
        times: times
    };

    const response = await productStore.setScheduleTime(bizItemId, params, scheduleId);

    if (response && response.status_code <= 300) {
        // 현재 캘린더의 시작일 기준
        const start = new DayPilot.Date(calendarConfig.startDate);
        const end = start.addDays(6);

        const fetchParams = {
            startDate: start.toString("yyyy-MM-dd"),
            endDate: end.toString("yyyy-MM-dd"),
        };
        
        await productStore.getProductSchedule(bizItemId, fetchParams);
    }
};

// 시간 포맷팅 함수 (인덱스 -> "HH:mm")
const formatTime = (index) => {
    const totalMin = index * 30;
    const h = Math.floor(totalMin / 60).toString().padStart(2, '0');
    const m = (totalMin % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
};

// 전체 가능 / 전체 마감 기능
const setAllStatus = (statusBit) => {
    const daySchedule = productWeekScheduleDataList.value.find(day => day.date === targetDate.value);
    const startIdx = Math.floor(getTotalMinutes(daySchedule.startTime) / 30);
    const endIdx = Math.ceil(getTotalMinutes(daySchedule.endTime) / 30);

    for (let i = startIdx; i < endIdx; i++) {
        tempBitArray.value[i] = statusBit;
    }
};

// 시간별 운영 / 마감 모달창 저장 버튼
const handleSaveSchedule = async () => {
    const daySchedule = productWeekScheduleDataList.value.find(day => day.date === targetDate.value);
    if (!daySchedule) return;

    await updateScheduleBit(
        props.savedItemId, 
        targetDate.value, 
        tempBitArray.value, 
        daySchedule.startTime, 
        daySchedule.endTime
    );

    modalStore.setDateSettingModal.closeModal();
};

// 날짜 변경되면 api호출 - 주간 스케줄 데이터 가져오기
watch( () => calendarConfig.startDate, async (newStartDate) => {
    if (!newStartDate) return;

    const start = new DayPilot.Date(newStartDate);
    const end = start.addDays(6);

    const params = {
        startDate: start.toString("yyyy-MM-dd"),
        endDate: end.toString("yyyy-MM-dd"),
    };

    await productStore.getProductSchedule(props.savedItemId, params);

}, { immediate: true });

// 캘린더 스크롤을 운영시작 위치로 이동
const scrollToWorkTime = () => {
    const calendarEl = document.querySelector('.calendar_default_main > div:nth-child(2)');

    if (calendarEl) {
        calendarEl.scrollTop = 576; // 9시 위치로 스크롤 // TODO: 동적계산 필요
    }
};

onMounted(() => {
    // 초기 로드 시 오늘 날짜로 업데이트
    const start = DayPilot.Date.today().firstDayOfWeek(1);
    calendarConfig.startDate = start;

    scrollToWorkTime();
})

onActivated(() => {
    scrollToWorkTime();
});
</script>

<template>
    <!-- 날짜 선택 영역 -->
    <div class="calendar-nav-bar">
        <button class="nav-btn" @click="prevWeek">
            <img src="@/assets/icons/ic_arrow_left.svg" alt="이전">
        </button>

        <div class="current-range">
            <span class="heading-s">{{ dateRangeText }}</span>
        </div>
        
        <button class="nav-btn" @click="nextWeek">
            <img src="@/assets/icons/ic_arrow_right.svg" alt="다음">
        </button>
    </div>

    <!-- 캘랜더 -->
    <div class="calendar-wrapper">
        <DayPilotCalendar 
            :config="calendarConfig" 
            :events="events" 
            ref="calendarRef" 
        />
    </div>

    <!-- 날짜 선택 시, 운영 설정 모달 -->
    <ModalSimple
        v-if="modalStore.setDateSettingModal.isVisible"
        :title="modalTitle"
        :modal-state="modalStore.setDateSettingModal"
        modal-width="320px"
    >
        <div class="modal-contents-inner">
            <div class="d-flex flex-col gap-16 align-center">
                <button class="btn-link" @click="handelSetOperationModalOpen">진료 가능 동물 수, 운영시간 변경하기<img :src="icArrowRight" alt="아이콘"></button>
                <div class="d-flex gap-8">
                    <button class="btn btn--size-24 btn--black-outline" @click="setAllStatus('1')">전체 가능</button>
                    <button class="btn btn--size-24 btn--black-outline" @click="setAllStatus('0')">전체 마감</button>
                </div>
            </div>

            <div class="time-list-container">
                <div v-for="item in dayEvents" :key="item.id" class="time-item d-flex align-center justify-between">
                    <span class="body-m">{{ item.timeText }}</span>
                    <label class="toggle">
                        <input 
                            type="checkbox" 
                            :checked="item.bitValue == '1'"
                            @change="(e) => handleToggle(item.id, e.target.checked)"
                            @click.stop 
                        />
                        <img class="toggle-img" />
                    </label>
                </div>
            </div>
        </div>
        <div class="modal-button-wrapper">
            <button class="btn btn--size-32 btn--black" @click="modalStore.setDateSettingModal.closeModal()">취소</button>
            <button class="btn btn--size-32 btn--blue" @click="handleSaveSchedule">저장</button>
        </div>
    </ModalSimple>
</template>

<style lang="scss" scoped>
    .calendar-nav-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 50px;
        padding: 8px 24px;
        margin-bottom: 16px;

        border-radius: 4px;
        border: 1px solid $gray-200;

        .current-range {
            min-width: 200px;
            text-align: center;
            .heading-s {
                color: $gray-900;
            }
        }

        .nav-btn {
            @include flex-center;
            width: 24px;
            height: 24px;

            border-radius: 100px;
            border: 1px solid $gray-200;
            background: #fff;
            cursor: pointer;

            &:hover {
                background-color: $gray-50;
            }
        }
    }
    .calendar-wrapper {
        height: calc(100% - 66px);
    }

    // 캘렌더 커스텀 스타일
    :deep(.calendar_default_main) {
        width: 100%;
        height: 100%;
        overflow-x: auto;
        // overflow-y: hidden;

        border-color: $gray-200;
        font-family: $font-family-base;

        // /* 헤더 영역 */
        & > div:first-child {
            width: auto !important;
            overflow: visible !important;
            position: sticky;
            top: 0;
            z-index: 2;
            
        }

        & > div:nth-child(2) {
            height: calc(100% - 30px) !important;
        }
    }

    :deep(.calendar_default_corner_inner) {
        background: $gray-100;
        border-color: $gray-200;
    }

    :deep(.calendar_default_cornerright_inner), 
    :deep(.calendar_default_colheader_inner), 
    :deep(.calendar_default_alldayheader_inner) {
        height: 100%;
        background: $gray-100;
        border-color: $gray-200;
        // border-right: 0;
        color: $gray-700;
        @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line);
    }

    :deep(.calendar_default_rowheader_inner) {
        @include flex-center;

        background: $gray-00;
        border-color: $gray-200;
        color: $gray-700;
        @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line);
    }

    :deep(.calendar_default_rowheader_minutes) {
        font-size: inherit;
        vertical-align:baseline;
        padding: 0;
    }
    :deep(.calendar_default_rowheader_minutes::before) {
        content: ':';
        display: inline-block;
        transform: translateY(-1px);
    }
    :deep(.calendar_default_event) {width: calc(100% + 4px) !important;}
    :deep(.calendar_default_event_inner) {
        border: none;

        &:hover {background-color: $primary-100 !important;}
    }
    :deep(.calendar_default_cell_inner) {
        background-color: $gray-00;
    }
    // 운영 스타일
    :deep(.calendar_default_event.event-open) {
        opacity: 0.9;
        background-color: $primary-50;
    }
    // 마감 스타일
    :deep(.calendar_default_event.event-closed) {
        background-color: $gray-50;
        opacity: 0.83;
        .calendar_default_event_inner {
            background: url('@/assets/images/Pattern.png') repeat !important;

            &:hover {
                background-color: $gray-200 !important;
            }
        }
    }
    :deep(.calendar_default_event_bar) {display: none;} // 왼쪽 색상바 안보이도록
    :deep(.calendar_default_shadow) {display: none;}

    // 운영 설정 모달 스타일
    .time-list-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        width: 50%;
        margin: 32px auto 0;
    }
    .btn-link {
        display: flex;
        gap: 4px;
        color: $primary-700;
        @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line); 
    }
</style>