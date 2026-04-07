<script setup>
import FilterDate from '@/components/common/filters/FilterDate.vue';
import FilterDoctorBtn from '@/components/common/Mobile/filters/FilterDoctorBtn.vue';
import ReserveInfo from '@/components/common/modal-content/mobile/ReserveInfo.vue';

import { DayPilot, DayPilotMonth } from "@daypilot/daypilot-lite-vue";
import { startOfMonth, endOfMonth, format, lastDayOfMonth } from "date-fns";

import { onMounted, ref, computed, watch, onUnmounted } from 'vue';

// 스토어
import { useReservationStore } from '@/stores/reservationStore';
import { useHospitalStore } from '@/stores/hospitalStore';
import { useModalStore } from '@/stores/modalStore';
import { formatDate } from '@/utils/dateFormatter';
import TableLayout from '@/components/common/TableLayout.vue';

import icCheckW from '@/assets/icons/mobile/ic_check_w.svg'
import icCheckB from '@/assets/icons/mobile/ic_check_b.svg'
import icEmpty from '@/assets/icons/ic_empty.svg'
import icClose from '@/assets/icons/mobile/ic_close_b.svg'
import icArrowLeft from '@/assets/icons/ic_arrow_left.svg'

// 예약 상태 아이콘
import icConfirm from '@/assets/icons/ic_res_confirm.svg'
import icPersonal from '@/assets/icons/ic_res_personal.svg'
import icCancel from '@/assets/icons/ic_res_canceled.svg'
import icHold from '@/assets/icons/ic_res_hold.svg'
// 예약 경로 
import icNaver from '@/assets/icons/ic_res_naver.svg'
import icIntoPet from '@/assets/icons/ic_res_intoPet.svg'
import icIntoLink from '@/assets/icons/ic_res_intolink.svg'
// 상태 아이콘 매핑
const statusIcons = {
    0: icHold, // 대기
    1: icConfirm, //확정
    2: icCancel, // 취소
    3: icCancel, // 거절
    4: icPersonal, //개인일정
};
// 예약 경로 아이콘 매핑
const pathIcons = {
    1: icIntoLink,
    2: icIntoPet,
    4: icNaver,
};

const reservationStore = useReservationStore()
const hospitalStore = useHospitalStore();
const modalStore = useModalStore();

const currentDate = ref(new Date());// 선택 날짜 값 (초기값: 오늘 날짜)
const selectedDate = ref(formatDate(new Date())) // 캘랜더에서 선택한 날짜 (초기값: 오늘날짜)
const doctorList = ref(['all']); // 조회 필터에서 선택한 의사 리스트
const activeDoctorId = ref(null); // 현재 달력에서 상세히 보고있는 의사id
const isFolded = ref(false); // 리스트가 올라왔는지 여부
const calendarRef = ref(null);
const dynamicTitle = ref('고객 예약 정보'); // 고객예약정보 모달 타이틀

const dateRange = computed({
    get: (oldValue) => {
        return {
            month: currentDate.value.getMonth(),
            year: currentDate.value.getFullYear()
        };
    },
    set: (newValue) => {
        const month = newValue.month;
        const year = newValue.year;
        const date = new Date(year, month, 1);

        currentDate.value = date;
        selectedDate.value = formatDate(date)
    }
});

// 담당의
const doctorOptions = computed(() => {
    const options = [{ label: '전체', value: 'all' }];
    if (hospitalStore.doctorList?.length > 0) {
        const doctors = hospitalStore.doctorList.map(doc => ({
            label: doc.userName || doc.name || '',
            value: doc.id
        }));
        options.push(...doctors);
    }
    return options;
});

// 선택된 ID들을 바탕으로 { label, value } 객체 리스트를 만듭니다.
const selectedDoctors = computed(() => {
    // 1. '전체'가 선택된 경우 (보통 'all' 하나만 있거나 'all'이 포함됨)
    if (doctorList.value.includes('all')) {
        return doctorOptions.value.filter(opt => opt.value !== 'all');
    }

    // 2. 개별 의사들이 선택된 경우: doctorOptions에서 해당 id를 찾아 이름(label)을 가져옴
    return doctorList.value
        .map(id => doctorOptions.value.find(opt => opt.value === id))
        .filter(opt => opt);
});

// 담당의 데이터 (해당 컬럼 id 와 스케쥴 데이터의 resource가 같아야함)
const staffResources = computed(() => {
    if (!hospitalStore.doctorList) return [];
    
    // 선택된 값이 없거나 '전체('')'가 포함되어 있으면 전체 표시
    if (doctorList.value.includes('all') || doctorList.value.length === 0) {
        return hospitalStore.doctorList.map(doc => ({ id: doc.id, name: doc.userName }));
    }
    
    // 필터링된 담당의만 표시
    return hospitalStore.doctorList
        .filter(doc => doctorList.value.includes(doc.id))
        .map(doc => ({ id: doc.id, name: doc.userName }));
});

// 캘랜더에 표시될 데이터
const summaryEvents = computed(() => {
    const dayStatus = {};
    if (!activeDoctorId.value) return [];

    reservationStore.reserveScheduleList.forEach(ev => {
        // 필터링: 오직 'activeDoctorId'와 일치하는 데이터만!
        if (ev.resource != activeDoctorId.value) return;

        const date = ev.start.split('T')[0];
        if (!dayStatus[date]) {
            dayStatus[date] = { 
                hasPending: false, 
                hasConfirmed: false, 
                hasReject: false, 
                hasCanceled: false,
                hasPersonal: false,
                originList: []
            };
        }

        // 상태값 체크 (RESERVE_STATUS_MAP: 0 대기, 1 확정)
        if (ev.inState === 0) dayStatus[date].hasPending = true;
        if (ev.inState === 1) dayStatus[date].hasConfirmed = true;
        if (ev.inState === 2) dayStatus[date].hasReject = true;
        if (ev.inState === 3) dayStatus[date].hasCanceled = true;
        if (ev.clinicType == '개인일정') dayStatus[date].hasPersonal = true;

        dayStatus[date].originList.push({ ...ev });
    });

    return Object.entries(dayStatus).map(([date, status]) => ({
        id: `status-${date}-${activeDoctorId.value}`,
        start: `${date}T00:00:00`,
        end: `${date}T23:59:59`,
        text: "", 
        tags: { 
            isStatusDot: true, 
            hasPending: status.hasPending, 
            hasConfirmed: status.hasConfirmed, 
            hasReject: status.hasReject, 
            hasCanceled: status.hasCanceled, 
            hasPersonal: status.hasPersonal, 
            originData: status.originList,
        },
    }));
});

// 선택한 날짜에 대한 데이터
const selectedDateEvents = computed(() => {
    const event = summaryEvents.value.find(row => 
        row.start.split('T')[0] === selectedDate.value
    );
    const data = event?.tags?.originData || [];

    return data.slice().sort((a, b) => {
        return a.startDate.localeCompare(b.startDate);
    });
})

const totalCount = computed(() => selectedDateEvents.value?.length ?? 0);
const reserveSummary = computed(() => {
    const counts = { confirmed: 0, pending: 0, canceled: 0, personal: 0 };
    
    selectedDateEvents.value?.forEach(row => {
        if (row.clinicType === '개인일정') {
            counts.personal++;
        } else {
            // 2. '개인일정'이 아닌 경우(else)에만 예약 상태를 카운팅합니다.
            if (row.inState === 1) counts.confirmed++;
            else if (row.inState === 0) counts.pending++;
            else if (row.inState === 2 || row.inState === 3) counts.canceled++;
        }
    });

    return [
        { label: '확정', value: counts.confirmed.toString().padStart(2, '0') },
        { label: '대기', value: counts.pending.toString().padStart(2, '0') },
        { label: '취소 · 거절', value: counts.canceled.toString().padStart(2, '0'), warning: true },
        { label: '개인일정', value: counts.personal.toString().padStart(2, '0')},
    ];
});

// 현재 선택된 날짜가 오늘인지 확인하는 computed
const isTodayActive = computed(() => {
    const todayStr = formatDate(new Date());
    const startStr = formatDate(selectedDate.value);

    return startStr === todayStr;
})

const fetchParams = computed(() => {
    const doctorIds = selectedDoctors.value.map(doc => doc.value);

    return {
        status: null,
        doctorId: doctorIds,
        startDate: format(startOfMonth(currentDate.value), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(currentDate.value), 'yyyy-MM-dd'),
        reRoute: null,
   };
});

// 간단한 터치 감지 로직
let touchStartY = 0;
let isTrackable = false; // 터치 추적 시작(Flag)
// 터치 이벤트
const handleTouchStart = (e) => {
    touchStartY = e.touches[0].clientY;
};
// 터치 이벤트
const handleTouchMove = (e) => {
    const touchMoveY = e.touches[0].clientY;
    const diff = touchStartY - touchMoveY; // 양수: 위로 올림(접기), 음수: 아래로 당김(펴기)
    
    // 현재 브라우저의 스크롤 위치
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;

    // 1. 달력이 펼쳐져 있을 때 (접기 제스처 감지)
    if (!isFolded.value) {
        if (e.cancelable) e.preventDefault(); // 펼쳐진 상태에선 새로고침/스크롤 완전 차단
        
        if (diff > 30) { 
            isFolded.value = true;
        }
        return;
    }

    // 2. 달력이 접혀 있을 때 (isFolded === true)
    if (isFolded.value) {
        // 사용자가 리스트를 끝까지 올려서 scrollTop이 0이 되었을 때 그 상태에서 아래로 더 당기는(diff < 0)' 감지
        if (scrollTop <= 0 && diff < 0) {
            // '당겨서 새로고침'을 막고 달력 펴기
            if (e.cancelable) e.preventDefault();

            // -50만큼 충분히 당겼을 때 달력 펼침
            if (diff < -50) {
                isFolded.value = false;
            }
        }
        
        // scrollTop > 0 이거나 위로 밀고 있다면(diff > 0) 
        // preventDefault를 하지 않으므로 리스트 스크롤
    }
};
// 위로 밀어낼 거리 계산
const translateY = computed(() => {
    if (!isFolded.value) return '0px';
    const weekHeight = 45;
    return `-${getWeekIndex() * weekHeight}px`;
});

// 현재 날짜가 이번 달의 몇 번째 주인지 계산
const getWeekIndex = () => {
    // 1. 기준이 되는 날짜 (현재 선택된 날짜)
    const now = new DayPilot.Date(selectedDate.value);
    
    // 2. 이번 달의 1일 구하기
    const startOfMonth = now.firstDayOfMonth();
    
    // 3. 이번 달 1일이 속한 주의 '일요일' 구하기 (달력의 진짜 시작점)
    // dayOfWeek()가 일:0, 월:1... 토:6 이므로, 1일에서 그 요일만큼 빼면 일요일입니다.
    const firstSunday = startOfMonth.addDays(-startOfMonth.dayOfWeek());
    
    // 4. 달력 시작일(firstSunday)부터 오늘(now)까지 총 며칠 차이 나는지 계산
    const diffInDays = Math.floor(new DayPilot.Duration(firstSunday, now).totalDays());
    
    // 5. 7로 나누고 내림하면 0부터 시작하는 주차(행 번호)가 나옵니다.
    const weekIndex = Math.floor(diffInDays / 7);
    
    return weekIndex;
};

// 캘랜더 라이브러리 config 객체
const config = ref({
    locale: "ko-kr",
    startDate: new DayPilot.Date(format(currentDate.value, 'yyyy-MM-dd')),//new DayPilot.Date(currentDate.value),
    events: summaryEvents.value, // 가공된 요약 데이터 전달
    eventHeight: 10,
    heightSpec: "Fixed",
    eventMoveHandling: "Disabled",
    eventResizeHandling: "Disabled",
    cellHeight: 45,

    // config 내부 수정
    onBeforeEventRender: (args) => {
        if (args.data.tags?.isStatusDot) {
            const { hasPending, hasConfirmed, hasReject, hasCanceled, hasPersonal } = args.data.tags;
            let html = '<div class="custom-events-div">';
            if (hasConfirmed) html += '<span class="dot confirmed"></span>';
            if (hasPending) html += '<span class="dot pending"></span>';
            if (hasReject || hasCanceled) html += '<span class="dot canceled"></span>';
            if (hasPersonal) html += '<span class="dot personal"></span>';
            html += '</div>';
            
            args.data.html = html;
        }
        // console.log(args)
    },

    onBeforeCellRender: (args) => {
       // 기준이 되는 달 
        const currentMonth = new DayPilot.Date(formatDate(currentDate.value)).getMonth();
        const cellMonth = args.cell.start.getMonth();
        const cellDate = args.cell.start.toString("yyyy-MM-dd");
        const today = DayPilot.Date.today().toString("yyyy-MM-dd");

        // 셀 헤더 표시 수정 (1일의 'n월 1일'에서 월 제거)
        let header = args.cell.properties.headerHtml || "";

        if (header.includes("월")) {
            const parts = header.split("월");
            args.cell.properties.headerHtml = "<span class='day-number-wrapper'>" + parts[1].trim() + "</span>";
        } else {
            const parts = args.cell.properties.headerHtml;
            args.cell.properties.headerHtml = "<span class='day-number-wrapper'>" + parts + "</span>";
        }
        
        if(cellDate === today) { // 오늘 날짜 처리
            if (header.includes("월")) {
                const parts = header.split("월");
                args.cell.properties.headerHtml = "<span class='day-number-wrapper today'>" + parts[1].trim() + "</span>";
            } else {
                args.cell.properties.headerHtml = "<span class='day-number-wrapper today'>" + header + "</span>";
            }
        } 

        if(currentMonth !== cellMonth) { // 다른 달 날짜 처리
            if (header.includes("월")) {
                const parts = header.split("월");
                args.cell.properties.headerHtml = "<span class='day-number-wrapper disable'>" + parts[1].trim() + "</span>";
            } else {
                args.cell.properties.headerHtml = "<span class='day-number-wrapper disable'>" + header + "</span>";
            }
        }
        
        if(cellDate === selectedDate.value) { // 사용자가 선택한 날짜 (기본값:오늘)
            if (header.includes("월")) {
                const parts = header.split("월");
                args.cell.properties.headerHtml = "<span class='day-number-wrapper selected'>" + parts[1].trim() + "</span>";
            } else {
                args.cell.properties.headerHtml = "<span class='day-number-wrapper selected'>" + header + "</span>";
            }
        } 
    },

    onEventClick: (args) => {
        //  클릭한 날짜 문자열 추출 
        const clickedDateStr = args.e.start().toString("yyyy-MM-dd");
        
        handleDateSelection(clickedDateStr);
    },

    onTimeRangeSelected: (args) => {
        //  클릭한 날짜 문자열 추출 
        const clickedDateStr = args.start.toString("yyyy-MM-dd");
        
        handleDateSelection(clickedDateStr);
    },
})

// 캘렌더 > 셀 클릭 이벤트
const handleDateSelection = (clickedDateStr) => {
    selectedDate.value = clickedDateStr;
    currentDate.value = new Date(clickedDateStr);

    if (calendarRef.value) {
        calendarRef.value.control.update();
    }
}

// Today 버튼 클릭
const setToday = () => {
    currentDate.value = new Date();
    selectedDate.value = formatDate(new Date());
    if (calendarRef.value) {
        calendarRef.value.control.update();
    }
}

const listAreaRef = ref(null);
// 접힙 상태 감지
// watch 로직 수정
watch(isFolded, (newVal) => {
    if (newVal) {
        // 달력이 접혔을 때: 리스트가 길어지므로 스크롤을 허용해야 함
        document.body.style.overflow = 'auto';
        document.body.style.touchAction = 'auto'; 
        // iOS 등에서 터치 액션이 씹히는 경우 'pan-y'로 설정
        document.documentElement.style.overflow = 'auto';
    } else {
        // 달력이 펼쳐졌을 때: 캘린더 안에서의 터치 제스처를 위해 스크롤 방지
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
        document.documentElement.style.overflow = 'hidden';
        window.scrollTo(0, 0); // 상단으로 고정
    }
}, { immediate: true });

const closeReserveInfoModal = () => {
    modalStore.reserveInfoModal.closeModal()
    document.body.style.overflow = '';
}

const handelReserveDetail = (row) => {
    reservationStore.getReserveInfo(row.reserveIdx);
};

const refreshSchedule = () => {
    reservationStore.getReserveSchedule(fetchParams.value);
};

const handleTitleUpdate = (newTitle) => {
    dynamicTitle.value = newTitle;
};


// 1. 조회 조건이 바뀔 때만 API 호출
watch([dateRange, selectedDoctors], () => {
    reservationStore.getReserveSchedule(fetchParams.value);
}, { deep: true });

// 2. "데이터"나 "선택된 의사"가 바뀔 때 달력 UI만 갱신
watch([() => reservationStore.reserveScheduleList, activeDoctorId, dateRange], () => {
    if (calendarRef.value && calendarRef.value.control) {
        // control.update() 대신 직접 events를 밀어넣고 갱신하는 것이 더 확실합니다.
        const calendar = calendarRef.value.control;
        calendar.events.list = summaryEvents.value;
        calendar.startDate = new DayPilot.Date(format(currentDate.value, 'yyyy-MM-dd'));//new DayPilot.Date(currentDate.value)
        calendar.update();
    }
}, { deep: true });

// 2. 필터(doctorList)가 바뀔 때마다 activeDoctorId를 동기화
watch(selectedDoctors, (newDocs) => {
    // 만약 현재 선택된 의사가 필터 리스트에 없거나, 처음 로드될 때
    if (newDocs.length > 0) {
        const currentActiveExists = newDocs.some(d => d.value === activeDoctorId.value);
        if (!currentActiveExists) {
            activeDoctorId.value = newDocs[0].value; // 필터 중 첫 번째 의사를 기본 선택
        }
    } else {
        activeDoctorId.value = null;
    }
}, { immediate: true });

onMounted(async() => {
    document.body.style.overflow = 'hidden';

    selectedDate.value = formatDate(new Date());
    
    window.scrollTo({ top: 0, behavior: 'auto' })
    
    // 담당의 리스트 불러오기
    if(hospitalStore.doctorList.length == 0) {
        await hospitalStore.getDoctorList();
    }

    // 2. 의사 리스트가 오면 selectedDoctors computed가 작동함
    // 3. activeDoctorId 초기화 (필터 중 첫 번째 의사)
    if (selectedDoctors.value.length > 0 && !activeDoctorId.value) {
        activeDoctorId.value = selectedDoctors.value[0].value;
    }
})

onUnmounted(() => {
    document.documentElement.style.overscrollBehaviorY = 'auto';
    document.body.style.overflow = 'auto';
    document.body.style.touchAction = 'auto';
})
</script>

<template>
    <TableLayout :is-mobile="true">
        <template #filter>
            <div class="d-flex align-center gap-8 w-100">
                <FilterDoctorBtn
                    v-model="doctorList" 
                    :options="doctorOptions"
                />
                
                <div class="bar"></div>

                <div class="selected-doctor-list">
                    <!-- 선택된 담당의 리스트 버튼 -->
                    <button 
                        v-for="doc in selectedDoctors"
                        :key="doc.value"
                        class="doctor-btn"
                        :class="activeDoctorId === doc.value ? 'selected' : ''"
                        @click="activeDoctorId = doc.value"
                    >
                        <span class="doc-name">{{ doc.label }}</span>
                    </button>
                </div>
            </div>
        </template>
        
        <template #table>
            <div class="filter-icon-wrapper">
                <div>
                    <FilterDate  
                        button-type="arrow" 
                        v-model="dateRange" 
                        :default-select="'30'"
                        :is-mobile="true"
                        :use-month-picker="true"
                        :is-range="false"
                    />
                </div>
    
                <div 
                    class="btn btn--mobile-option"
                    :class="{ 'selected': isTodayActive }"
                    @click="setToday"
                >
                    <img :src="isTodayActive ? icCheckW : icCheckB" alt="체크아이콘">
                    <span>Today</span>
                </div>
            </div>


            <div
                @touchstart="handleTouchStart"
                @touchmove.no-passive="handleTouchMove"
            >
                <div class="custom-calendar-section">
                    <div class="custom-calendar-header">
                        <div class="header-cell sun">일</div>
                        <div class="header-cell">월</div>
                        <div class="header-cell">화</div>
                        <div class="header-cell">수</div>
                        <div class="header-cell">목</div>
                        <div class="header-cell">금</div>
                        <div class="header-cell">토</div>
                    </div>
        
                    <div :class="['calendar-wrapper', { 'folded': isFolded }]">
                        <div class="calendar-content">
                            <DayPilotMonth :config="config" ref="calendarRef" />
                        </div>
                    </div>
                </div>
            
                <!-- 리스트 영역 -->
                <div 
                    class="list-area"
                    :class="{ 'expanded': isFolded }"
                    ref="listAreaRef"
                >
                    <div class="handle"></div>
    
                    <div class="mobile-total-count">
                        <div class="total">
                            Total 
                            <span class="cnt">{{ totalCount }}</span>
                        </div>
    
                        <div class="detail-count">
                            <div v-for="reserve in reserveSummary" class="detail">
                                <span class="label">{{ reserve.label }}</span>
                                <span class="cnt" :class="reserve.warning ? 'warning' : ''">{{ reserve.value }}</span>
                            </div>
                        </div>
                    </div>
    
                    <div v-if="selectedDateEvents.length > 0" class="reservation-list">
                        <div 
                            v-for="event in selectedDateEvents" 
                            class="res-item"
                            :class="event.clinicType === '개인일정' ? 'is-personal' : `status-${event.inState}`"
                            @click="handelReserveDetail(event)"
                        >
                            <!-- 좌측: 시간 및 상태 아이콘 -->
                            <div class="res-time-box">
                                <img :src="statusIcons[event.clinicType === '개인일정' ? 4 : event.inState]" 
                                    alt="" class="status-icon">
                                <span class="time-text">{{ event.startDate?.split('T')[1]?.slice(0, 5) }}</span>
                            </div>
    
                            <!-- 중앙: 정보 (예약자/반려동물/경로) -->
                            <div class="res-info-box">
                                <div v-if="event.clinicType !== '개인일정' && event.clinicType !== '일반예약'" class="user-pet-info">
                                    <img v-if="pathIcons[event.reRoute]" :src="pathIcons[event.reRoute]" alt="" class="path-icon">
                                    <span class="name">{{ event.userName }}({{ event.petName }})</span>
                                </div>
                            </div>
    
                            <!-- 우측: 진료실 -->
                            <div class="res-location-box">
                                <span class="room-badge">{{ event.clinicType === '개인일정' || event.clinicType == '일반예약' ? event.clinicType : event.roomName }}</span>
                            </div>
                        </div>
    
                    </div>
    
                    <div v-else class="empty-box">
                        <img :src="icEmpty" alt="비어있음 아이콘">
                        <span class="empty-span">일정이 없습니다.</span>
                    </div>
                </div>
            </div>
        </template>
    </TableLayout>

    <!-- 예약 정보 안내 모달 (모바일 )-->
    <div 
        v-if="modalStore.reserveInfoModal.isVisible"
        class="mobile-full-page"
    >
        <header class="mobile-full-page-header">
            <button @click="closeReserveInfoModal"><img :src="icArrowLeft" alt="닫기" width="20"></button>
            <div class="header-title">
                <h2>{{ dynamicTitle }}</h2>
            </div>
        </header>

        <div class="mobile-full-page-body">
            <ReserveInfo @refresh-list="refreshSchedule" @update-title="handleTitleUpdate" :is-mobile="true" />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.bar {
    width:1px;
    height:12px;
    background-color: $gray-300;
}
.empty-box {
    height: 150px;
    .empty-span {color: $gray-400;}
}
.selected-doctor-list {
    display: flex;
    gap:8px;
    flex: 1;
    min-width:0;
    overflow-x: auto;

    /* 1. 크롬, 사파리, 엣지 (WebKit 기반) */
    &::-webkit-scrollbar {display: none;}
    /* 2. 파이어폭스 */
    scrollbar-width: none;
    /* 3. 인터넷 익스플로러, 구형 엣지 */
    -ms-overflow-style: none;
}
.doctor-btn {
    @include flex-center;
    min-width: 0;
    flex-shrink: 0;
    max-width: 100px;
    height: 32px;
    padding: 0 16px;
    border-radius: 100px;
    background-color: $gray-50;

    .doc-name {
        display: block;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: center;
    }

    &.selected {
        background-color: $gray-800;
        color: $gray-00;
    }
}
.filter-icon-wrapper {
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
}
.custom-calendar-section {
    padding: 0 20px;
    padding-bottom: 5px;
    .custom-calendar-header {
        width:100;
        display: flex;
        
        .header-cell {
            @include flex-center;
            flex: 1 0 0;
            padding: 10px;

            color: $gray-700;
            @include typo($title-m-mobile-size, $title-m-mobile-weight, $title-m-mobile-spacing, $title-m-mobile-line);

            &.sun {color: $warning-200;}
        }
    }
}

:deep(.month_default_main) {
    margin-top: -30px;
    border: none;
    font-family: $font-family-base;
    // overflow-y: auto;

    & > div {
        transition: all 0.3s ease;
        will-change: transform;
        transform: translateY(v-bind(translateY));
    }
}

:deep(.month_default_header) {
    display: none;
}

:deep(.month_default_cell) {
    @include flex-center;
    // height: 40px !important;
}

:deep(.month_default_cell_inner) {
        position: relative;
        background-color: $gray-00;
        border: none;
        z-index: -1;
    }

:deep(.month_default_cell_header) {
    padding: 10px;
    height: 100% !important;
    @include flex-center;
    @include typo($body-m-mobile-size, $body-m-mobile-weight, $body-m-mobile-spacing, $body-m-mobile-line);
    color: $gray-700;
    pointer-events: none;
}

:deep(.day-number-wrapper) {
    border-radius: 100px;
    width: 24px;
    height: 24px;
    pointer-events: auto;
    // padding-right: 1px;

    @include flex-center;
    line-height: 1;

    &.today {
        background-color: $primary-50;
        color: $primary-700;
    }

    &.selected {
        background-color: $primary-700;
        color: $gray-00;
    }

    &.disable {color: $gray-200;}
}

:deep(.month_default_event) {
    // height: 10px !important;
    margin-top: 15px;
}

:deep(.month_default_event_inner) {
    height: fit-content;
    border: none;
    background: transparent !important;
    padding: 0;

    .custom-events-div {
        width:100%; 
        // height:100%;
        display:flex; 
        gap:3px; 
        justify-content:center; 
        align-items: flex-end;
    }

    .dot {
        width: 5px;
        height: 5px;
        background-color: $gray-500;
        border-radius: 100px;

        &.pending {background-color: $status-onHold_text;}
        &.confirmed {background-color: $status-confirmed_text;}
        &.canceled {background-color: $status-canceled_text;}
        &.personal {background-color: $status-personal_text;}
    }
}

:deep(.month_default_event_bar) {display: none;}
:deep(.month_default_shadow) {display: none;}

.calendar-wrapper {
    width: 100%;
    transition: all 0.3s ease; // 부드러운 전환
    max-height: 500px; // 기본 한달 높이 (적절히 조절)
    overflow: hidden;
    position: relative;

    &.folded {
        max-height: 45px; // 한 줄(주간)만 보일 정도의 높이로 강제 축소
    }
}

.list-area {
    position: relative;
    width: 100%;
    // height: 150px;
    min-height: 150px;
    border-top: 1px solid $gray-200;
    background-color: #fff;
    transition: all 0.3s ease;

    touch-action: pan-y; // 세로 스크롤은 허용하되 브라우저 제스처는 제한

    &.expanded {
        min-height: 150px;
        transform: translateY(-0px); // 캘린더가 가려진 만큼 위로 이동
        // height: calc(100vh - 150px); // 화면 전체를 차지하도록 확장
    }
    
    .handle {
        width: 40px;
        height: 4px;
        background: #ccc;
        margin: 10px auto;
        border-radius: 2px;
        /* 핸들 자체는 순수하게 드래그 용도이므로 브라우저 간섭을 완전히 차단 */
        touch-action: none;
    }

    .count-div {
        padding: 20px;
    }
}

.mobile-total-count {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;

    .total {
        @include typo($title-l-mobile-size, $title-l-mobile-weight, $title-l-mobile-spacing, $title-l-mobile-line);
        color: $gray-700;

        .cnt {
            color: $primary-700;
        }
    }

    .detail-count {
        display: flex;
        gap:6px;
        flex-wrap: wrap;

        .detail {
            display: flex;
            align-items: center;
            gap: 4px;

            &::after {
                content: '';
                width: 1px;
                height: 12px;
                background-color: $gray-300;
                margin-left: 4px;
            }

            &:last-child::after {content:none;}

            .label {
                color: $gray-700;
                @include typo($body-s-mobile-size, $body-s-mobile-weight, $body-s-mobile-spacing, $body-s-mobile-line);
                line-height: 1;
            }

            .cnt {
                color: $gray-900;
                @include typo($title-s-mobile-size, $title-s-mobile-weight, $title-s-mobile-spacing, $title-s-mobile-line);
                line-height: 1;
                
                &.warning {color: $warning-500;}
            }
        }
    }
}

.reservation-list {
    display: flex;
    flex-direction: column;
    padding: 0 20px;
    gap: 8px;

    .res-item {
        position: relative;
        padding: 8px 16px;
        display: flex;
        gap:16px;
        align-items: center;
        background: $gray-00;
        border-radius: 4px;
        border: 1px solid $gray-200;

        &.is-personal { border-color: $status-personal_bg; }
        &.status-0 {border-color: $status-onHold_bg;}
        &.status-1 {border-color: $status-confirmed_bg;}
        &.status-2 {border-color: $status-canceled_bg;}
        &.status-3 {border-color: $status-canceled_bg;}
        &:active { background-color: #f5f5f5; } // 터치 피드백

        &::before {
            content: '';
            width: 8px;
            height:35px;
            display: block;
            position: absolute;
            left: 0;
            border-radius: 4px 0 0 4px;
        }

        &.is-personal::before {background-color: $status-personal_bg;}
        &.status-0::before {background-color: $status-onHold_bg;}
        &.status-1::before {background-color: $status-confirmed_bg;}
        &.status-2::before {background-color: $status-canceled_bg;}
        &.status-3::before {background-color: $status-canceled_bg;}
    }

  // 1. 시간 박스
    .res-time-box {
        display: flex;
        align-items: center;
        gap: 4px;
        
        .status-icon { width: 17px; height: 17px; }
        .time-text {
            width: 36px;
            @include typo($title-s-mobile-size, $title-s-mobile-weight, $title-s-mobile-spacing, $title-s-mobile-line);
            color: $gray-700;
            line-height: 1;
        }
    }

  // 2. 정보 박스
    .res-info-box {
        flex: 1;
        min-width: 0;
        
        .user-pet-info {
            display: flex;
            align-items: center;
            gap: 4px;
            width: 100%;

            @include typo($body-m-mobile-size, $body-m-mobile-weight, $body-m-mobile-spacing, $body-m-mobile-line);
            line-height: 1;
            color: $gray-700;

            .name {
                display: inline-block;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }
    }

  // 3. 상품명
    .res-location-box {

        .room-badge {
            text-align: right;
            display: block;
            max-width: 70px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            color: $gray-500;
            @include typo($body-s-mobile-size, $body-s-mobile-weight, $body-s-mobile-spacing, $body-s-mobile-line);
            line-height: 1;
        }
    }
}
</style>