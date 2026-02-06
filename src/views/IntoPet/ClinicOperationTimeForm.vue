<!-- 인투펫 관리 > 진료실 관리 > 모바일 예약 운영 시간 설정 -->
<script setup>
import { ref, computed, watch } from 'vue';
import TimeSelect from '@/components/common/TimeSelect.vue';
// 아이콘
import icPlus from '@/assets/icons/ic_plus_black.svg';
import icDel from '@/assets/icons/ic_del.svg';
import icInfo from '@/assets/icons/ic_infomation_b.svg'

const props = defineProps({
  // 부모에서 v-model="operationConfig"로 전달
    modelValue: {
        type: Object,
    }
});

const emit = defineEmits(['update:modelValue']);

const config = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

// 요일 옵션
const allDays = [
    { label: '월', key: 'monday' },
    { label: '화', key: 'tue' },
    { label: '수', key: 'wed' },
    { label: '목', key: 'thu' },
    { label: '금', key: 'fri' },
    { label: '토', key: 'sat' },
    { label: '일', key: 'sun' },
    // { label: '공휴일', key: 'holiday' },
];

// 옵션 데이터
const modeOptions = [
    { label: '모든 영업일 동일', value: 1 },
    { label: '평일/주말 운영 시간 구분', value: 2 },
    { label: '요일별 설정', value: 3 }
];
const dayToNumMap = { monday: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7, holiday: 8 };
const dayKeys = ['tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'holiday'];
const weekdays = ['tue', 'wed', 'thu', 'fri']; // 월요일 제외
const weekends = ['sun']; // 토요일 제외

// '모든 영업일 동일'의 경우 > '월요일'데이터를 대표로 ui에 그려줌
// > 월요일 데이터가 변할 때 다른 요일로 전부 복사 ('모든 영업일 동일' 일때만)
watch(() => config.value.pos?.monday, (newVal, oldVal) => {
    if (config.value.set_reserve !== 1 || !newVal || !oldVal) return;

    // is_disabled를 제외한 나머지 시간 데이터만 추출해서 비교
    const stripDisabled = (arr) => arr.map(({ is_disabled, ...rest }) => rest);

    const newTimeOnly = JSON.stringify(stripDisabled(newVal));
    const oldTimeOnly = JSON.stringify(stripDisabled(oldVal));
    // '휴무 상태(is_disabled)'만 바뀐 거라면 복사 중단
    if (newTimeOnly === oldTimeOnly) return;

    // 시간이 실제로 바뀌었을 때만 복사 실행
    const copy = JSON.parse(JSON.stringify(newVal));
    dayKeys.forEach(day => {
        // 이때 주의! 다른 요일의 기존 '휴무 상태'는 보존하면서 시간만 덮어씌워야 함
        config.value.pos[day] = config.value.pos[day].map((slot, idx) => ({
            ...copy[idx],
            is_disabled: slot.is_disabled // 기존 요일의 휴무 상태 유지
        }));
    });
}, { deep: true });


// 운영 모드 변경 감시
watch(() => config.value.set_reserve, (newMode, oldMode) => {
    if (oldMode === undefined) return;
    if (!config.value.pos?.monday) return;
    
    // 월요일/토요일 데이터 복사본 생성
    const monCopy = JSON.parse(JSON.stringify(config.value.pos.monday));
    const satCopy = JSON.parse(JSON.stringify(config.value.pos.sat));

    if (newMode === 1) { // 전체 동일
        dayKeys.forEach(day => {
            config.value.pos[day] = monCopy.map((slot, idx) => ({
                ...slot,
                is_disabled: config.value.pos[day][idx]?.is_disabled //기존 휴무 상태 유지!
            }));
        });
    } else if (newMode === 2) { // 평일/주말 구분
        // 평일 복사
        weekdays.forEach(day => {
            config.value.pos[day] = monCopy.map((slot, idx) => ({
                ...slot,
                is_disabled: config.value.pos[day][idx]?.is_disabled //기존 휴무 상태 유지
            }));
        });
        // 주말 복사
        weekends.forEach(day => {
            config.value.pos[day] = satCopy.map((slot, idx) => ({
                ...slot,
                is_disabled: config.value.pos[day][idx]?.is_disabled //기존 휴무 상태 유지
            }));
        });
    }
}, { immediate: false });

// '평일/주말 운영 시간 구분' 일 경우 > '평일'은 '월요일'데이터를 대표로 ui에 그려줌
// 해당 데이터(월요일) 이 변할 때 > 화~금에 복사
watch(() => config.value.pos?.monday, (newVal, oldVal) => {
    if (config.value.set_reserve !== 2 || !newVal || !oldVal) return;

    const stripDisabled = (arr) => arr.map(({ is_disabled, ...rest }) => rest);
    if (JSON.stringify(stripDisabled(newVal)) === JSON.stringify(stripDisabled(oldVal))) return;

    const copy = JSON.parse(JSON.stringify(newVal));
    weekdays.forEach(day => {
        config.value.pos[day] = config.value.pos[day].map((slot, idx) => ({
            ...copy[idx],
            is_disabled: slot.is_disabled
        }));
    });
}, { deep: true });

// '평일/주말 운영 시간 구분' 일 경우 > '주말'은 '토요일'데이터를 대표로 ui에 그려줌
// 해당 데이터(토요일) 이 변할 때 > 일/공휴일에 복사 
watch(() => config.value.pos?.sat, (newVal, oldVal) => {
    if (config.value.set_reserve !== 2 || !newVal || !oldVal) return;

    const stripDisabled = (arr) => arr.map(({ is_disabled, ...rest }) => rest);
    if (JSON.stringify(stripDisabled(newVal)) === JSON.stringify(stripDisabled(oldVal))) return;

    const copy = JSON.parse(JSON.stringify(newVal));
    weekends.forEach(day => {
        config.value.pos[day] = config.value.pos[day].map((slot, idx) => ({
            ...copy[idx],
            is_disabled: slot.is_disabled
        }));
    });
}, { deep: true });


// 시간/분 필드를 HH:mm 형식으로 연결해주는 어댑터 함수
const createTimeAdapter = (timeObj, type = 'start') => {
  const hKey = type === 'start' ? 'st_hour' : 'end_hour';
  const mKey = type === 'start' ? 'st_min' : 'end_min';

  return computed({
    get: () => {
      // "09시", "30분" -> "09:30"으로 변환
      const h = timeObj[hKey]?.replace('시', '') || '00';
      const m = timeObj[mKey]?.replace('분', '') || '00';
      return `${h}:${m}`;
    },
    set: (val) => {
      if (!val) return;
      // "09:30" -> "09시", "30분"으로 쪼개서 원본 데이터 수정
      const [h, m] = val.split(':');
      timeObj[hKey] = `${h}시`;
      timeObj[mKey] = `${m}분`;
    }
  });
};

// 로직 함수들
// 시간대 추가 (모드 고려)
const addTimeRange = (targetDayKey) => {
    const mode = config.value.set_reserve;
    const firstItem = config.value.pos[targetDayKey][0];

    // 1. 추가할 기본 객체 생성
    const newSlot = {
        st_hour: '10시',
        st_min: '00분',
        end_hour: '20시',
        end_min: '00분',
        is_disabled: 0, // 기본값은 0 (운영)
        deadline_hour: firstItem?.deadline_hour || '19시',
        deadline_min: firstItem?.deadline_min || '00분'
    };

    // 2. 모드에 따라 적용 대상 요일 결정
    let targetDays = [];
    if (mode === 1) { // 모든 영업일 동일
        targetDays = ['monday', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'holiday'];
    } else if (mode === 2) { // 평일/주말 구분
        const weekdays = ['monday', 'tue', 'wed', 'thu', 'fri'];
        const weekends = ['sat', 'sun'];
        if (weekdays.includes(targetDayKey)) {
            targetDays = weekdays;
        } else if (weekends.includes(targetDayKey)) {
            targetDays = weekends;
        } else {
            targetDays = ['holiday'];
        }
    } else { // 요일별 설정 (mode === 3)
        targetDays = [targetDayKey];
    }

    // 3. 대상 요일들에 시간대 추가
    targetDays.forEach(day => {
        const daySlots = config.value.pos[day];
        if (daySlots) {
            // [핵심] 해당 요일의 첫 번째 슬롯이 휴무(1)라면, 추가되는 슬롯도 휴무(1)를 따라가게 할지 결정
            // 보통 운영 시간 추가는 '영업 시간'을 늘리는 행위이므로 0으로 넣되, 
            // 만약 요일 전체가 잠겨있는 상태를 유지해야 한다면 아래처럼 처리합니다.
            const isDayOff = daySlots[0]?.is_disabled === 1;
            
            daySlots.push({ 
                ...newSlot,
                is_disabled: isDayOff ? 1 : 0 // 요일 자체가 휴무면 추가된 칸도 휴무 상태 유지
            });
        }
    });
};

// 시간대 삭제
const removeTimeRange = (targetDayKey, index) => {
    const mode = config.value.set_reserve;
    let targetDays = [];

    if (mode === 1) {
        targetDays = ['monday', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'holiday'];
    } else if (mode === 2) {
        const weekdays = ['monday', 'tue', 'wed', 'thu', 'fri'];
        const weekends = ['sat', 'sun'];
        if (weekdays.includes(targetDayKey)) {
            targetDays = weekdays;
        } else if (weekends.includes(targetDayKey)) {
            targetDays = weekends;
        } else {
            targetDays = ['holiday'];
        }
    } else {
        targetDays = [targetDayKey];
    }

    targetDays.forEach(day => {
        config.value.pos[day].splice(index, 1);
    });
};

// --- 비활성화 상태 판별 로직 ---
// 특정 요일 그룹(days)의 모든 데이터가 is_disabled === 1 인지 확인
const isGroupDisabled = (days) => {
    // 1. 우선 impos.week(휴무일 설정) 데이터를 안전하게 가져옴
    const rawWeek = config.value.impos?.week;
    const weekArray = Array.isArray(rawWeek) 
        ? rawWeek.map(Number) 
        : (typeof rawWeek === 'string' ? rawWeek.split(',').map(Number) : []);

    // 2. 인자로 받은 days(예: ['monday', 'tue'...])의 '모든' 요일이 비활성인지 검사
    return days.every(day => {
        // 해당 요일이 휴무일 배열에 포함되어 있는가?
        const isImpos = weekArray.includes(dayToNumMap[day]);
        
        // 해당 요일의 운영시간 데이터가 모두 비활성(1)인가?
        const dayData = config.value.pos?.[day] || [];
        const isDataDisabled = dayData.length > 0 && dayData.every(t => t.is_disabled === 1);
        
        // 둘 중 하나라도 해당되면 그 요일은 '비활성' 상태임
        return isImpos || isDataDisabled;
    });
};
// 평일 그룹 비활성화 여부 (월~금)
const isWeekdayDisabled = computed(() => isGroupDisabled(['monday', 'tue', 'wed', 'thu', 'fri']));
// 주말 그룹 비활성화 여부 (토~일)
const isWeekendDisabled = computed(() => isGroupDisabled(['sat', 'sun']));
// 공휴일은 단독 체크
const isHolidaySectionDisabled = computed(() => {
    // 1. '요일별 시간으로 설정하기' 체크박스가 체크되어 있거나 (1)
    // 2. 서버에서 넘어온 데이터 자체가 비활성(is_disabled === 1)인 경우
    return config.value.use_weekday_time === 1 || isGroupDisabled(['holiday']);
});

const updateTime = (dayKey, idx, type, val) => {
    const [h, m] = val.split(':');
    const hourStr = h + '시';
    const minStr = m + '분';
    const mode = config.value.set_reserve;

    let targetDays = [];

    // 1. 모든 영업일 동일: 평일 + 주말 + 공휴일 몽땅 다!
    if (mode === 1) {
        targetDays = ['monday', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'holiday'];
    } 
    // 2. 평일/주말 구분: 평일끼리, 주말끼리, 공휴일은 혼자
    else if (mode === 2) {
        if (dayKey === 'holiday') {
            targetDays = ['holiday'];
        } else {
            const weekdays = ['monday', 'tue', 'wed', 'thu', 'fri'];
            const weekends = ['sat', 'sun'];
            targetDays = weekdays.includes(dayKey) ? weekdays : weekends;
        }
    } 
    // 3. 요일별: 딱 선택한 그 요일만
    else {
        targetDays = [dayKey];
    }

    // 대상 요일들 데이터 일괄 동기화
    targetDays.forEach(day => {
        const slots = config.value.pos[day];
        if (!slots) return;

        if (type === 'deadline') {
            // [추가] 마감 시간은 해당 요일의 "모든" 슬롯에 똑같이 적용
            slots.forEach(slot => {
                slot.deadline_hour = hourStr;
                slot.deadline_min = minStr;
            });
        } else {
            // [기존] 시작(st)/종료(end) 시간은 해당 인덱스(idx)만 적용
            const slot = slots[idx];
            if (slot) {
                slot[`${type}_hour`] = hourStr;
                slot[`${type}_min`] = minStr;
            }
        }
    });
};

// 공휴일 체크박스 핸들러 (선택 사항: 체크 시 공휴일 시간 데이터를 초기화하거나 특정 로직이 필요할 경우)
const onHolidayCheckChange = (e) => {
    config.value.use_weekday_time = e.target.checked ? 1 : 0;
};
</script>

<template>
    <div class="operating-time-container">
        <div class="radio-group">
            <label class="radio" v-for="opt in modeOptions" :key="opt.value">
                <input type="radio" v-model="config.set_reserve" :value="opt.value" />
                <span class="circle"></span>
                <span class="label">{{ opt.label }}</span>
            </label>
        </div>

        <div class="schedule-table-wrapper">

            <div class="schedule-grid">
                <!-- 운영시간 -->
                <div class="column column--left">
                    <div class="form-label required column-header">운영시간</div>
                    
                    <!-- 모든 영업일 동일 -->
                    <template v-if="config.set_reserve === 1">
                        <div class="schedule-row">
                            <div class="days-box"><span class="flag flag--black">공통</span></div>

                            <div class="times-rows">
                                <!-- 모든 요일 (시간이 모두 같게 됨으로 대표로 월요일 값을 봄) -->
                                <div v-for="(time, idx) in config.pos.monday" :key="'all'+idx" class="time-row">
                                    <div class="time-box">
                                        <TimeSelect 
                                            :model-value="`${time.st_hour.replace('시','')}:${time.st_min.replace('분','')}`"
                                            @update:model-value="(val) => updateTime('monday', idx, 'st', val)""
                                        />
                                        <span>-</span>
                                        <TimeSelect 
                                            :model-value="`${time.end_hour.replace('시','')}:${time.end_min.replace('분','')}`"
                                            @update:model-value="(val) => updateTime('monday', idx, 'end', val)"
                                        />
                                    </div>
                                    <div class="btn-box">
                                        <button 
                                            v-if="idx === 0" 
                                            @click="addTimeRange('monday')"
                                            class="btn btn--size-24 btn--black-outline"
                                        >
                                            <img :src="icPlus">시간 추가
                                        </button>
                                        <button 
                                            v-else 
                                            @click="removeTimeRange('monday', idx)"
                                            class="btn btn--size-24 btn--black-outline"
                                        >
                                            <img :src="icDel" width="14" >삭제
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>

                    <!-- 평일/주말 운영시간 구분 -->
                    <template  v-if="config.set_reserve === 2">
                        <!-- 평일 (평일 시간이 모두 같게 됨으로 대표로 월요일 값을 봄)-->
                        <div class="schedule-row">
                            <div class="days-box"><span class="flag flag--black">평일</span></div>

                            <div class="times-rows">
                                <div 
                                    v-for="(time, idx) in config.pos.monday" 
                                    :key="'wd'+idx" 
                                    class="time-row"
                                    :class="{ '--disabled': isWeekdayDisabled }"
                                >
                                    <div class="time-box">
                                        <TimeSelect
                                            :model-value="`${(time.st_hour||'00시').replace('시','')}:${(time.st_min||'00분').replace('분','')}`"
                                            @update:model-value="(val) => updateTime('monday', idx, 'st', val)"
                                            :disabled="time.is_disabled === 1"
                                        />
                                        <span>-</span>
                                        <TimeSelect
                                            :model-value="`${(time.end_hour||'00시').replace('시','')}:${(time.end_min||'00분').replace('분','')}`"
                                            @update:model-value="(val) => updateTime('monday', idx, 'end', val)"
                                            :disabled="time.is_disabled === 1"
                                        />
                                    </div>
                                    <div class="btn-box">
                                        <button 
                                            v-if="idx === 0" 
                                            @click="addTimeRange('monday')"
                                            class="btn btn--size-24 btn--black-outline"
                                            :class="{ 'is-disabled': time.is_disabled === 1 }"
                                        >
                                            <img :src="icPlus">시간 추가
                                        </button>
                                        <button 
                                            v-else 
                                            @click="removeTimeRange('monday', idx)"
                                            class="btn btn--size-24 btn--black-outline"
                                        >
                                            <img :src="icDel" width="14">삭제
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- 주말 (주말 시간이 모두 같게 됨으로 토요일 값을 봄) -->
                        <div class="schedule-row">
                            <div class="days-box"><span class="flag flag--black">주말</span></div>

                            <div class="times-rows">
                                <div 
                                    v-for="(time, idx) in config.pos.sat" 
                                    :key="'we'+idx" 
                                    class="time-row"
                                    :class="{ '--disabled': isWeekendDisabled }"
                                >
                                    <div class="time-box">
                                        <TimeSelect
                                            :model-value="`${(time.st_hour||'00시').replace('시','')}:${(time.st_min||'00분').replace('분','')}`"
                                            @update:model-value="(val) => updateTime('sat', idx, 'st', val)"
                                            :disabled="isWeekendDisabled"
                                        />
                                        <span>-</span>
                                        <TimeSelect
                                            :model-value="`${(time.end_hour||'00시').replace('시','')}:${(time.end_min||'00분').replace('분','')}`"
                                            @update:model-value="(val) => updateTime('sat', idx, 'end', val)"
                                            :disabled="isWeekendDisabled"
                                        />
                                    </div>
                                    <div class="btn-box">
                                        <button 
                                            v-if="idx === 0" 
                                            @click="addTimeRange('sat')"
                                            class="btn btn--size-24 btn--black-outline"
                                            :class="{ 'is-disabled': time.is_disabled === 1 }"
                                        >
                                            <img :src="icPlus">시간 추가
                                        </button>
                                        <button
                                            v-else 
                                            @click="removeTimeRange('sat', idx)"
                                            class="btn btn--size-24 btn--black-outline"
                                        >
                                            <img :src="icDel" width="14">삭제
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- 공휴일 -->
                        <div class="schedule-row">
                            <div class="days-box">공휴일</div>

                            <div class="times-rows">
                                <!-- <div>
                                    <label class="checkbox">
                                        <input type="checkbox" :true-value="1" :false-value="0" v-model="config.use_weekday_time" />
                                        <span class="box"></span>
                                        <span class="label">공휴일 운영시간 요일별 시간으로 설정하기</span>
                                    </label>
                                </div> -->

                                <div 
                                    v-for="(time, idx) in config.pos.holiday" 
                                    :key="'hol'+idx"
                                    :class="{ '--disabled': isHolidaySectionDisabled }"
                                    class="time-row"
                                >
                                    <div class="time-box">
                                        <TimeSelect
                                            :model-value="`${(time.st_hour||'00시').replace('시','')}:${(time.st_min||'00분').replace('분','')}`"
                                            @update:model-value="(val) => updateTime('holiday', idx, 'st', val)"
                                            :disabled="isHolidaySectionDisabled"
                                        />
                                        <span>-</span>
                                        <TimeSelect
                                            :model-value="`${(time.end_hour||'00시').replace('시','')}:${(time.end_min||'00분').replace('분','')}`"
                                            @update:model-value="(val) => updateTime('holiday', idx, 'end', val)"
                                            :disabled="isHolidaySectionDisabled"
                                        />
                                    </div>
                                    <div class="btn-box">
                                        <button v-if="idx === 0" @click="addTimeRange('holiday')" 
                                                class="btn btn--size-24 btn--black-outline" :class="{ 'is-disabled': isHolidaySectionDisabled }">
                                            <img :src="icPlus">시간 추가
                                        </button>
                                        <button v-else @click="removeTimeRange('holiday', idx)" 
                                                class="btn btn--size-24 btn--black-outline" :disabled="isHolidaySectionDisabled">
                                            <img :src="icDel" width="14">삭제
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>

                    <!-- 요일별 설정 -->
                    <template v-if="config.set_reserve === 3">
                        <div v-for="day in allDays" :key="day.key" class="schedule-row">
                            <div class="days-box">
                                <span>{{ day.label }}</span>
                            </div>
                            
                            <div class="times-rows">
                                <div 
                                    v-for="(time, idx) in config.pos[day.key]" 
                                    :key="day.key + idx" 
                                    :class="{ '--disabled': time.is_disabled === 1 }"
                                    class="time-row"
                                >
                                    <div class="time-box">
                                        <TimeSelect 
                                            :model-value="`${(time.st_hour||'00시').replace('시','')}:${(time.st_min||'00분').replace('분','')}`"
                                            @update:model-value="(val) => updateTime(day.key, idx, 'st', val)"
                                            :disabled="time.is_disabled === 1"
                                        />
                                        <span>-</span>
                                        <TimeSelect 
                                            :model-value="`${(time.end_hour||'00시').replace('시','')}:${(time.end_min||'00분').replace('분','')}`"
                                            @update:model-value="(val) => updateTime(day.key, idx, 'end', val)"
                                            :disabled="time.is_disabled === 1"
                                        />
                                    </div>
                                    <div class="btn-box">
                                        <button 
                                            v-if="idx === 0"
                                            @click="addTimeRange(day.key)" 
                                            class="btn btn--size-24 btn--black-outline"
                                            :class="{ 'is-disabled': time.is_disabled === 1 }"
                                        >
                                            <img :src="icPlus"> 시간추가
                                        </button>
                                        <button v-else @click="removeTimeRange(day.key, idx)" class="btn btn--size-24 btn--black-outline">
                                            <img :src="icDel" width="14"> 삭제
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 공휴일 -->
                        <div class="schedule-row">
                            <div class="days-box">공휴일</div>

                            <div class="times-rows">
                                <!-- <div>
                                    <label class="checkbox">
                                        <input type="checkbox" :true-value="1" :false-value="0" v-model="config.use_weekday_time" />
                                        <span class="box"></span>
                                        <span class="label">공휴일 운영시간 요일별 시간으로 설정하기</span>
                                    </label>
                                </div> -->

                                <div 
                                    v-for="(time, idx) in config.pos.holiday" 
                                    :key="'hol'+idx"
                                    :class="{ '--disabled': isHolidaySectionDisabled }"
                                    class="time-row"
                                >
                                    <div class="time-box">
                                        <TimeSelect
                                            :model-value="`${(time.st_hour||'00시').replace('시','')}:${(time.st_min||'00분').replace('분','')}`"
                                            @update:model-value="(val) => updateTime('holiday', idx, 'st', val)"
                                            :disabled="isHolidaySectionDisabled"
                                        />
                                        <span>-</span>
                                        <TimeSelect
                                            :model-value="`${(time.end_hour||'00시').replace('시','')}:${(time.end_min||'00분').replace('분','')}`"
                                            @update:model-value="(val) => updateTime('holiday', idx, 'end', val)"
                                            :disabled="isHolidaySectionDisabled"
                                        />
                                    </div>
                                    <div class="btn-box">
                                        <button v-if="idx === 0" @click="addTimeRange('holiday')" 
                                                class="btn btn--size-24 btn--black-outline" :class="{ 'is-disabled': isHolidaySectionDisabled }" :disabled="isHolidaySectionDisabled">
                                            <img :src="icPlus">시간 추가
                                        </button>
                                        <button v-else @click="removeTimeRange('holiday', idx)" 
                                                class="btn btn--size-24 btn--black-outline" :disabled="isHolidaySectionDisabled">
                                            <img :src="icDel" width="14">삭제
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </template>
                </div>

                <!-- 예약 마감 시간 -->
                <div class="column column--right">
                    <div class="form-label required column-header">
                        예약 마감 시간
                        <div class="helper">
                            <img :src="icInfo" alt="안내아이콘" class="helper__icon">
                            <div class="tooltip-content">
                                예약 마감 시간 이후에는 오늘 날짜 기준 이틀 뒤 예약부터 받을 수 있습니다.<br/>
                                <br/>
                                [예시] 오늘 날짜 : 3월 7일 | 예약 마감시간 : 17시
                                <ul>
                                    <li>17시 이전 예약 고객 : 3월 8일 예약 가능.</li>
                                    <li>17시 이후 예약 고객 : 3월 8일 예약 불가능. 3월 9일 날짜 부터 예약가능.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 모든 영업일 동일 -->
                    <div v-if="config.set_reserve === 1" class="schedule-row">
                        <div class="days-box"><span class="flag flag--black">마감</span></div>
                        
                        <div class="times-rows">
                            <div class="time-row">
                                <div class="time-box">
                                    <TimeSelect 
                                        :model-value="`${config.pos.monday[0].deadline_hour.replace('시','')}:${config.pos.monday[0].deadline_min.replace('분','')}`"
                                        @update:model-value="(val) => updateTime('monday', 0, 'deadline', val)"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 평일/주말 운영 시간 구분 -->
                    <template v-if="config.set_reserve === 2">
                        <!-- 평일 -->
                        <div class="schedule-row" :class="{ '--disabled': isWeekdayDisabled }">
                            <div class="days-box"><span class="flag flag--black">평일</span></div>

                            <div class="times-rows">
                                <div 
                                    v-for="(time, idx) in config.pos.monday" 
                                        :key="'wd'+idx" 
                                        class="time-row"
                                        :class="{ '--disabled': isWeekdayDisabled }"
                                >
                                    <div class="time-box">
                                        <TimeSelect 
                                            v-if="idx == 0"
                                            :model-value="`${(config.pos.monday[0].deadline_hour||'00시').replace('시','')}:${(config.pos.monday[0].deadline_min||'00분').replace('분','')}`"
                                            @update:model-value="(val) => updateTime('monday', 0, 'deadline', val)"
                                            :disabled="isWeekdayDisabled"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- 주말 -->
                        <div class="schedule-row" :class="{ '--disabled': isWeekendDisabled }">
                            <div class="days-box"><span class="flag flag--black">주말</span></div>

                            <div class="times-rows">
                                <div
                                    v-for="(time, idx) in config.pos.sat" 
                                    :key="'we'+idx" 
                                    class="time-row"
                                    :class="{ '--disabled': isWeekendDisabled }"
                                >
                                    <div class="time-box">
                                        <TimeSelect 
                                            v-if="idx == 0"
                                            :model-value="`${(config.pos.sat[0].deadline_hour||'00시').replace('시','')}:${(config.pos.sat[0].deadline_min||'00분').replace('분','')}`"
                                            @update:model-value="(val) => updateTime('sat', 0, 'deadline', val)"
                                            :disabled="isWeekendDisabled"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!--  공휴일 -->
                        <div class="schedule-row" :class="{ '--disabled': isHolidaySectionDisabled }">
                            <div class="days-box"><span>공휴일</span></div>
                            <div class="times-rows">
                                <div
                                    v-for="(time, idx) in config.pos.holiday" 
                                    :key="'hol'+idx"
                                    :class="{ '--disabled': isHolidaySectionDisabled }"
                                    class="time-row"
                                >
                                    <TimeSelect 
                                        v-if="idx == 0"
                                        :model-value="`${(config.pos.holiday[0].deadline_hour||'00시').replace('시','')}:${(config.pos.holiday[0].deadline_min||'00분').replace('분','')}`"
                                        @update:model-value="(val) => updateTime('holiday', 0, 'deadline', val)"
                                        :disabled="isHolidaySectionDisabled"
                                    />
                                </div>
                            </div>
                        </div>
                    </template>

                    <!-- 요일별 설정 -->
                    <template v-if="config.set_reserve === 3">
                        <div v-for="day in allDays" :key="'deadline-' + day.key" class="schedule-row">
                            <div class="times-rows">
                                <div 
                                    v-for="(time, idx) in config.pos[day.key]" 
                                    :key="'d-row' + idx" 
                                    class="time-row" 
                                >
                                    <div class="time-box">
                                        <TimeSelect 
                                            v-if="idx === 0"
                                            :model-value="`${(config.pos[day.key][0].deadline_hour||'00시').replace('시','')}:${(config.pos[day.key][0].deadline_min||'00분').replace('분','')}`"
                                            @update:model-value="(val) => updateTime(day.key, 0, 'deadline', val)"
                                            :disabled="time.is_disabled === 1"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- 공휴일 -->
                        <div class="schedule-row">
                            <div class="times-rows">
                                <div 
                                    v-for="(time, idx) in config.pos.holiday" 
                                    :key="'d-row-hol' + idx" 
                                    class="time-row"
                                    :class="{ '--disabled': isHolidaySectionDisabled }"
                                >
                                    <div class="time-box">
                                        <TimeSelect 
                                            v-if="idx === 0"
                                            :model-value="`${(config.pos.holiday[0].deadline_hour||'00시').replace('시','')}:${(config.pos.holiday[0].deadline_min||'00분').replace('분','')}`"
                                            @update:model-value="(val) => updateTime('holiday', 0, 'deadline', val)"
                                            :disabled="isHolidaySectionDisabled"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>

            </div>

        </div>
    </div>
</template>

<style lang="scss" scoped>
    .radio-group {
        display: flex;
        gap: 8px;
        margin: 8px 0 15px;
    }
    .operating-time-container {
        padding-top: 4px;

        .schedule-table-wrapper {
            margin: 0 -10px -4px;
        }

        .group-add-banner {
            padding: 0 10px 8px;
        }

        .schedule-grid {
            display: flex;
            background: $gray-00;

            .column {
                display: flex;
                flex-direction: column;

                &--left { flex: 2; border-right: 1px solid $gray-200; }
                &--right { flex: 1; }

                .column-header {
                    height: 36px;
                    background: $gray-100;
                    @include flex-center;
                }
            }
        }

        .schedule-row {
            display: flex;
            align-items: center;
            gap: 8px;
            min-height: 46px;
            padding: 0 8px;

            border-bottom: 1px solid $gray-200;
            &:last-child { border-bottom: none; }

            .flag-wrapper {
                width: 48px;
            }

            .days-box {
                margin-left: -8px;
                width: 55px;
                min-height: 45px;
                height:100%;
                @include flex-center;
                @include typo($title-s-size, $title-s-weight, $title-s-spacing, $title-s-line);

                border-right: 1px solid $gray-200;
                color: $gray-700;
            }

            .times-rows {
                flex:1;
                display: flex;
                flex-direction: column;
                gap: 8px;
                padding: 6px 0;
                
                .time-row {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    height: 32px;
                }
            }

            .time-box {
                display: flex;
                align-items: center;
                gap: 4px;
                flex: 1;
            }

            .btn-box {
                width: 70px;
                display: flex;
                gap: 4px;
            }

            // &.--disabled {
            //     // pointer-events: none;
            // }
        }
    }

    .tooltip-content {
        top: 20px;
        left:auto;
        right: 0;
    }
</style>