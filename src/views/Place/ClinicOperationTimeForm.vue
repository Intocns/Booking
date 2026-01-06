<!-- 인투펫 관리 > 진료실 관리 > 모바일 예약 운영 시간 설정 -->
<script setup>
import { ref } from 'vue';
import TimeSelect from '@/components/common/TimeSelect.vue';
// 아이콘
import icPlus from '@/assets/icons/ic_plus_black.svg';
import icDel from '@/assets/icons/ic_del.svg';
import icInfo from '@/assets/icons/ic_infomation_b.svg'

const props = defineProps({
  // 부모에서 v-model="operationConfig"로 전달
    modelValue: {
    type: Object,
    default: () => ({
        operatingMode: 'all',
        // [모든 영업일 동일] 데이터
        allDaysTime: [{ start: '', end: '' }],
        allDeadline: '',
        // [평일/주말 구분] 데이터
        splitTime: {
            weekday: [{ start: '', end: '' }],
            weekend: [{ start: '', end: '' }]
        },
        splitDeadline: { weekday: '', weekend: '' },
        // [요일별 설정] 데이터
        dailyGroups: [
            { selectedDays: [], times: [{ start: '', end: '' }], deadline: '' }
        ]
    })
    }
});

const emit = defineEmits(['update:modelValue']);
const config = props.modelValue;

// 옵션 데이터
const modeOptions = [
    { label: '모든 영업일 동일', value: 'all' },
    { label: '평일/주말 운영 시간 구분', value: 'split' },
    { label: '요일별 설정', value: 'daily' }
];

const daysOptions = [
    { label: '월', value: 'mon' }, { label: '화', value: 'tue' }, 
    { label: '수', value: 'wed' }, { label: '목', value: 'thu' }, 
    { label: '금', value: 'fri' }, { label: '토', value: 'sat' }, 
    { label: '일', value: 'sun' }
];

// 로직 함수들
const addTimeRange = (arr) => {
    if (arr.length < 5) arr.push({ start: '', end: '' });
};

const removeTimeRange = (arr, i) => {
    arr.splice(i, 1);
};

const addDailyGroup = () => {
    config.dailyGroups.push({
        selectedDays: [],
        times: [{ start: '', end: '' }],
        deadline: ''
    });
};

const removeDailyGroup = (i) => {
    config.dailyGroups.splice(i, 1);
};

const toggleDayInGroup = (group, dayValue) => {
    const index = group.selectedDays.indexOf(dayValue);
    if (index > -1) {
        group.selectedDays.splice(index, 1);
    } else {
        group.selectedDays.push(dayValue);
    }
};
</script>

<template>
    <div class="operating-time-container">
        <div class="radio-group">
            <label class="radio" v-for="opt in modeOptions" :key="opt.value">
            <input type="radio" v-model="config.operatingMode" :value="opt.value" />
            <span class="circle"></span>
            <span class="label">{{ opt.label }}</span>
            </label>
        </div>

        <div class="schedule-table-wrapper">
            <div v-if="config.operatingMode === 'daily'" class="group-add-banner">
                <button @click="addDailyGroup" class="btn btn--size-24 btn--black-outline">
                    <img :src="icPlus"> 요일 그룹 추가
                </button>
            </div>
        
            <div class="schedule-grid">
                <!-- 운영시간 -->
                <div class="column column--left">
                    <div class="form-label required column-header">운영시간</div>
                    
                    <!-- 모든 영업일 동일 -->
                    <template v-if="config.operatingMode === 'all'">
                        <div class="row-wrapper">
                            <div v-for="(time, idx) in config.allDaysTime" :key="'all'+idx" class="schedule-row">
                                <div class="flag-wrapper"><span v-if="idx == 0" class="flag flag--black">공통</span></div>
                                <div class="time-box">
                                    <TimeSelect v-model="time.start" /> <span>-</span> <TimeSelect v-model="time.end" />
                                </div>
                                <div class="btn-box">
                                    <button 
                                        v-if="idx === 0" 
                                        @click="addTimeRange(config.allDaysTime)" 
                                        class="btn btn--size-24 btn--black-outline"
                                    >
                                        <img :src="icPlus">시간 추가
                                    </button>
                                    <button 
                                        v-else 
                                        @click="removeTimeRange(config.allDaysTime, idx)" 
                                        class="btn btn--size-24 btn--black-outline"
                                    >
                                        <img :src="icDel" width="14" >삭제
                                    </button>
                                </div>
                            </div>
                        </div>
                    </template>

                    <!-- 평일/주말 운영시간 구분 -->
                    <template  v-if="config.operatingMode === 'split'">
                        <div class="row-wrapper">
                            <div v-for="(time, idx) in config.splitTime.weekday" :key="'wd'+idx" class="schedule-row">
                                <div class="flag-wrapper"><span v-if="idx == 0" class="flag flag--black">평일</span></div>
                                <div class="time-box">
                                    <TimeSelect v-model="time.start" /> <span>-</span> <TimeSelect v-model="time.end" />
                                </div>
                                <div class="btn-box">
                                    <button 
                                        v-if="idx === 0" 
                                        @click="addTimeRange(config.splitTime.weekday)" 
                                        class="btn btn--size-24 btn--black-outline"
                                    >
                                        <img :src="icPlus">시간 추가
                                    </button>
                                    <button 
                                        v-else 
                                        @click="removeTimeRange(config.splitTime.weekday, idx)" 
                                        class="btn btn--size-24 btn--black-outline"
                                    >
                                        <img :src="icDel" width="14">삭제
                                    </button>
                                </div>
                            </div>
    
                            <div v-for="(time, idx) in config.splitTime.weekend" :key="'we'+idx" class="schedule-row">
                                <div class="flag-wrapper"><span v-if="idx == 0" class="flag flag--black">주말</span></div>
                                <div class="time-box">
                                    <TimeSelect v-model="time.start" /> <span>-</span> <TimeSelect v-model="time.end" />
                                </div>
                                <div class="btn-box">
                                    <button 
                                        v-if="idx === 0" 
                                        @click="addTimeRange(config.splitTime.weekend)" 
                                        class="btn btn--size-24 btn--black-outline"
                                    >
                                        <img :src="icPlus">시간 추가
                                    </button>
                                    <button
                                        v-else 
                                        @click="removeTimeRange(config.splitTime.weekend, idx)" 
                                        class="btn btn--size-24 btn--black-outline"
                                    >
                                        <img :src="icDel" width="14">삭제
                                    </button>
                                </div>
                            </div>
                        </div>
                    </template>

                    <!-- 요일별 설정 -->
                    <template v-if="config.operatingMode === 'daily'">
                        <div v-for="(group, gIdx) in config.dailyGroups" :key="'group'+gIdx" class="daily-group-card">
                            <div v-for="(time, tIdx) in group.times" :key="'gt'+tIdx" class="schedule-row">
                                <div class="day-buttons d-flex gap-4">
                                    <button 
                                        v-show="tIdx == 0"
                                        v-for="day in daysOptions" 
                                        :key="day.value" 
                                        class="btn-day" 
                                        :class="{ active: group.selectedDays.includes(day.value) }"
                                        @click="toggleDayInGroup(group, day.value)">
                                        {{ day.label }}
                                    </button>
                                </div>
                                <div class="time-box">
                                    <TimeSelect v-model="time.start" /> <span>-</span> <TimeSelect v-model="time.end" />
                                </div>
                                <div class="btn-box">
                                    <button v-if="tIdx === 0" @click="addTimeRange(group.times)" class="btn btn--size-24 btn--black-outline">
                                        <img :src="icPlus">시간 추가
                                    </button>
                                    <button v-else @click="removeTimeRange(group.times, tIdx)" class="btn btn--size-24 btn--black-outline">
                                        <img :src="icDel">삭제
                                    </button>
                                    <button v-if="tIdx == 0 && gIdx > 0" @click="removeDailyGroup(gIdx)" class="btn btn--size-24 btn--black-outline">
                                        <img :src="icDel">요일 삭제
                                    </button>
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
                    
                    <div class="row-wrapper">
                        <!-- 모든 영업일 동일 -->
                        <div v-if="config.operatingMode === 'all'" class="schedule-row">
                            <div class="flag-wrapper"><span class="flag flag--black">마감</span></div>
                            <div class="time-box"><TimeSelect v-model="config.allDeadline" /></div>
                        </div>
    
                        <!-- 평일/주말 운영 시간 구분 -->
                        <template v-if="config.operatingMode === 'split'">
                            <div class="schedule-row">
                                <div class="flag-wrapper"><span class="flag flag--black">평일</span></div>
                                <div class="time-box"><TimeSelect v-model="config.splitDeadline.weekday" /></div>
                            </div>
                            <div class="schedule-row">
                                <div class="flag-wrapper"><span class="flag flag--black">주말</span></div>
                                <div class="time-box"><TimeSelect v-model="config.splitDeadline.weekend" /></div>
                            </div>
                        </template>
    
                        <!-- 요일별 설정 -->
                        <template v-if="config.operatingMode === 'daily'">
                            <div v-for="(group, gIdx) in config.dailyGroups" :key="'deadline'+gIdx">
                                <div class="schedule-row">
                                    <div class="flag-wrapper"><span class="flag flag--black">마감</span></div>
                                    <div class="time-box"><TimeSelect v-model="group.deadline" /></div>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<style lang="scss" scoped>
    .radio-group {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
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

            .row-wrapper {
                display: flex;
                flex-direction: column;
                gap: 8px;
                padding: 8px 10px;
            }

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

            .flag-wrapper {
                width: 38px;
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
        }

        /* 요일별 설정 스타일 */
        .daily-group-card {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 8px 10px;

            .schedule-row {
                .day-buttons {width: 256px;}
                .btn-box {width: 150px;}
            }
        }
    }

    .tooltip-content {
        top: 20px;
        left:auto;
        right: 0;
    }
</style>