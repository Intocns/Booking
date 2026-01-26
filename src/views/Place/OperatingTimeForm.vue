<!-- 상품 등록 > 예약 정보 > 운영시간 -->
<script setup>
import TimeSelect from '@/components/common/TimeSelect.vue';
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
import icPlus from '@/assets/icons/ic_plus_black.svg';
import icPlusBlue from '@/assets/icons/ic_plus_blue.svg';
import icDel from '@/assets/icons/ic_del.svg';
import { watch, computed } from 'vue';
const props = defineProps({
    modelValue: Object,
    idx: { type: Number, default: 0 }
});
const emit = defineEmits(['update:modelValue']);

// 부모로부터 받은 객체 참조
// const config = props.modelValue;

const config = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

// 운영 시간 옵션
const modeOptions = [ 
    { label: '모든 영업일 동일', value: 'all' },
    { label: '평일/주말 운영 시간 구분', value: 'split' },
    { label: '요일별 설정', value: 'daily' }
];

// 요일옵션 데이터 (임시)
const daysOptions = [
    { label: '월', value: 'mon' },
    { label: '화', value: 'tue' }, 
    { label: '수', value: 'wed' },
    { label: '목', value: 'thu' }, 
    { label: '금', value: 'fri' }, 
    { label: '토', value: 'sat' }, 
    { label: '일', value: 'sun' }
];

// 평일/주말 운영 시간 구분 > 옵션
const weekendOptions = [
    { label: '주말', value: 'weekend_all' }, 
    { label: '토,일 구분', value: 'weekend_split' }
];
const satOptions = [{ label: '토요일', value: 'sat' }, { label: '토,일 합침', value: 'merge' }];
const sunOptions = [{ label: '일요일', value: 'sun' }, { label: '토,일 합침', value: 'merge' }];

const addTimeRange = (arr) => arr.push({ startTime: '', endTime: '' });
const removeTimeRange = (arr, i) => arr.splice(i, 1);

const handleWeekendMerge = (val) => { if (val === 'merge') config.splitMode = 'weekend_all'; };

const addDailyGroup = () => config.value.dailyGroups.push({ selectedDays: [], times: [{ startTime: '', endTime: '' }] });
const removeDailyGroup = (i) => config.value.dailyGroups.splice(i, 1);
const toggleDayInGroup = (gIdx, dayValue) => {
    const disabledDays = getDisabledDays(gIdx);
    if (disabledDays.includes(dayValue)) return;

    const days = config.value.dailyGroups[gIdx].selectedDays;
    const index = days.indexOf(dayValue);
    index > -1 ? days.splice(index, 1) : days.push(dayValue);

    emit('update:modelValue', { ...config.value });
};

// 이미 선택된 요일 값 (선택하지 못하도록)
const getDisabledDays = (currentGIdx) => {
    const disabledDays = [];
    config.value.dailyGroups.forEach((group, index) => {
        if (index !== currentGIdx) {
            disabledDays.push(...group.selectedDays);
        }
    });
    return disabledDays;
};

// watch(() => props.modelValue.operatingMode, (newVal) => {
//     // 사용자가 모드를 바꿀 때마다 해당 객체의 시간값 초기화
//     const target = props.modelValue;
//     target.allDaysTime = [{ startTime: '', endTime: '' }];
//     target.splitTime = {
//         weekday: [{ startTime: '', endTime: '' }],
//         weekend: [{ startTime: '', endTime: '' }],
//         sat: [{ startTime: '', endTime: '' }],
//         sun: [{ startTime: '', endTime: '' }]
//     };
//     target.dailyGroups = [{ selectedDays: [], times: [{ startTime: '', endTime: '' }] }];
// });
</script>

<template>
    <div class="operating-time-form d-flex flex-col gap-16">
        <!-- 운영 시간 옵션 -->
        <div>
            <div class="d-flex gap-16">
                <label class="radio" v-for="opt in modeOptions" :key="idx + opt.value">
                    <input type="radio" v-model="modelValue.operatingMode" :value="opt.value" />
                    <span class="circle"></span>
                    <span class="label">{{ opt.label }}</span>
                </label>
            </div>
            <span class="caption">※ 휴게 시간은 제외하고 등록해주세요.</span>
        </div>

        <!-- 운영 시간 > 모든 영업일 동일 -->
        <div v-if="modelValue.operatingMode === 'all'" class="d-flex flex-col gap-8">
            <div v-for="(time, tIdx) in modelValue.allDaysTime" :key="tIdx" class="d-flex align-center gap-8">
                <!-- 시간 설정 영역 -->
                <div class="d-flex align-center gap-8">
                    <span class="title-s">시작</span>
                    <TimeSelect v-model="time.startTime" select-width="94px" />
                    -
                    <span class="title-s">마지막</span>
                    <TimeSelect v-model="time.endTime" select-width="94px" />
                </div>

                <!-- 버튼 영역 -->
                <div class="d-flex align-center gap-8">
                    <!-- 시간 추가 버튼 -->
                    <button 
                        v-if="tIdx === 0" 
                        @click="addTimeRange(modelValue.allDaysTime)" 
                        class="btn btn--size-24 btn--black-outline"
                    >
                        <img :src="icPlus" alt="아이콘">시간 추가
                    </button>
                    <!-- 삭제 버튼 -->
                    <button 
                        v-else 
                        @click="removeTimeRange(modelValue.allDaysTime, tIdx)" 
                        class="btn btn--size-24 btn--black-outline"
                    >
                        <img :src="icDel" width="14">삭제
                    </button>
                </div>

            </div>
        </div>

        <!-- 운영 시간 > 평일/주말 운영 시간 구분 -->
        <div v-else-if="modelValue.operatingMode === 'split'" class="d-flex flex-col gap-8">
            <div v-for="(time, tIdx) in modelValue.splitTime.weekday" :key="'wd'+tIdx" class="d-flex align-center gap-8">
                <!-- 시간 설정 영역 -->
                <div class="d-flex align-center gap-8">
                    <span class="title-s" style="width:90px;">
                        <template v-if="tIdx === 0">평일(월~금)</template>
                    </span>
                    <span class="title-s">시작</span>
                    <TimeSelect v-model="time.startTime" select-width="94px" />
                    -
                    <span class="title-s">마지막</span>
                    <TimeSelect v-model="time.endTime" select-width="94px" />
                </div>

                <!-- 버튼 영역 -->
                <div class="d-flex gap-8">
                    <!-- 시간 추가 버튼 -->
                    <button 
                        v-if="tIdx === 0" 
                        @click="addTimeRange(modelValue.splitTime.weekday)" 
                        class="btn btn--size-24 btn--black-outline"
                    >
                        <img :src="icPlus" alt="아이콘">시간 추가
                    </button>
                    <!-- 삭제 버튼 -->
                    <button 
                        v-else 
                        @click="removeTimeRange(modelValue.splitTime.weekday, tIdx)" 
                        class="btn btn--size-24 btn--black-outline"
                    >
                        <img :src="icDel" width="14">삭제
                    </button>
                </div>
            </div>
            
            <!-- 주말, 토/일 구분 영역 -->
            <!-- 주말 -->
            <template v-if="modelValue.splitMode === 'weekend_all'">
                <div v-for="(time, tIdx) in modelValue.splitTime.weekend" :key="'we'+tIdx" class="d-flex align-center gap-8">
                    <!-- 시간 설정 영역 -->
                    <div class="d-flex align-center gap-8">
                        
                        <div style="width:90px;">
                            <CustomSingleSelect v-if="tIdx === 0" v-model="modelValue.splitMode" :options="weekendOptions" select-width="90px" />
                        </div>
                        <span class="title-s">시작</span>
                        <TimeSelect v-model="time.startTime" select-width="94px" />
                        -
                        <span class="title-s">마지막</span>
                        <TimeSelect v-model="time.endTime" select-width="94px" />
                    </div>

                    <!-- 버튼 영역 -->
                    <div class="d-flex align-center gap-8">
                        <!-- 시간 추가 버튼 -->
                        <button 
                            v-if="tIdx === 0" 
                            @click="addTimeRange(modelValue.splitTime.weekend)" 
                            class="btn btn--size-24 btn--black-outline"
                        >
                            <img :src="icPlus" alt="아이콘">시간 추가
                        </button>
                        <!-- 삭제 버튼 -->
                        <button 
                            v-else 
                            @click="removeTimeRange(modelValue.splitTime.weekend, tIdx)" 
                            class="btn btn--size-24 btn--black-outline"
                        >
                            <img :src="icDel" width="14">삭제
                        </button>
                    </div>
                </div>
            </template>
            <!-- 토/일 구분 -->
            <template v-else>
                <!-- 토 -->
                <div v-for="(time, tIdx) in modelValue.splitTime.sat" :key="'sat'+tIdx" class="d-flex align-center gap-8">
                    <!-- 시간 설정 영역 -->
                    <div class="d-flex align-center gap-8">
                        <div style="width:90px;">
                            <CustomSingleSelect 
                                v-if="tIdx === 0" 
                                :model-value="'sat'" 
                                :options="satOptions" 
                                select-width="90px" 
                                @update:modelValue="handleWeekendMerge"
                            />
                        </div>
                        <span class="title-s">시작</span>
                        <TimeSelect v-model="time.startTime" select-width="94px" />
                        - 
                        <span class="title-s">마지막</span>
                        <TimeSelect v-model="time.endTime" select-width="94px" />
                    </div>

                    <!-- 버튼 영역 -->
                    <div class="d-flex align-center gap-8">
                        <!-- 시간 추가 버튼 -->
                        <button 
                            v-if="tIdx === 0" 
                            @click="addTimeRange(modelValue.splitTime.sat)" 
                            class="btn btn--size-24 btn--black-outline"
                        >
                            <img :src="icPlus" alt="아이콘">시간 추가
                        </button>
                        <!-- 삭제 버튼 -->
                        <button 
                            v-else 
                            @click="removeTimeRange(modelValue.splitTime.sat, tIdx)" 
                            class="btn btn--size-24 btn--black-outline"
                        >
                            <img :src="icDel" width="14">삭제
                        </button>
                    </div>
                </div>
                <!-- 일 -->
                <div v-for="(time, tIdx) in modelValue.splitTime.sun" :key="'sun'+tIdx" class="d-flex align-center gap-8">
                    <!-- 시간 설정 영역 -->
                    <div class="d-flex align-center gap-8">
                        <div style="width:90px;">
                            <CustomSingleSelect 
                                v-if="tIdx === 0" 
                                :model-value="'sun'" 
                                :options="sunOptions" 
                                select-width="90px" 
                                @update:modelValue="handleWeekendMerge" 
                            />
                        </div>
                        <span class="title-s">시작</span>
                        <TimeSelect v-model="time.startTime" select-width="94px" />
                        -
                        <span class="title-s">마지막</span>
                        <TimeSelect v-model="time.endTime" select-width="94px" />
                    </div>

                    <!-- 버튼 영역 -->
                    <div class="d-flex align-center gap-8">
                        <button 
                            v-if="tIdx === 0" 
                            @click="addTimeRange(modelValue.splitTime.sun)" 
                            class="btn btn--size-24 btn--black-outline"
                        >
                            <img :src="icPlus" alt="아이콘">시간 추가
                        </button>
                        <button 
                            v-else 
                            @click="removeTimeRange(modelValue.splitTime.sun, tIdx)" 
                            class="btn btn--size-24 btn--black-outline"
                        >
                            <img :src="icDel" width="14">삭제
                        </button>
                    </div>
                </div>
            </template>
        </div>

        <!-- 운영 시간 > 요일별 설정 -->
        <div v-else-if="modelValue.operatingMode === 'daily'" class="d-flex flex-col gap-16">
            <!-- 요일 추가 버튼 -->
            <button 
                type="button" 
                class="text-button text-button--blue add-item-btn" 
                @click="addDailyGroup"
            >
                <img :src="icPlusBlue">요일 추가
            </button>

            <div v-for="(group, gIdx) in modelValue.dailyGroups" :key="gIdx" class="d-flex align-start gap-16 flex-wrap">
                <!-- 요일 버튼 -->
                <div class="day-button-group d-flex gap-4">
                    <button 
                        v-for="day in daysOptions" 
                        :key="day.value" 
                        type="button" 
                        class="btn-day" 
                        :class="{
                            active: group.selectedDays.includes(day.value),
                            disabled: getDisabledDays(gIdx).includes(day.value)
                        }"
                        :disabled="getDisabledDays(gIdx).includes(day.value)"
                        @click="toggleDayInGroup(gIdx, day.value)"
                    >
                        {{ day.label }}
                    </button>
                </div>

                <!-- 시간 설정 영역 -->
                <div class="d-flex flex-col gap-8">
                    <div v-for="(time, tIdx) in group.times" :key="tIdx" class="d-flex align-center gap-8">
                        <!-- 시간 설정 영역 -->
                        <div class="d-flex align-center gap-8">
                            <span class="title-s">시작</span>
                            <TimeSelect v-model="time.startTime" select-width="94px" />
                            -
                            <span class="title-s">마지막</span>
                            <TimeSelect v-model="time.endTime" select-width="94px" />
                        </div>
    
                        <!-- 버튼 영역 -->
                        <div class="d-flex align-center gap-8">
                            <button 
                                v-if="tIdx === 0" 
                                @click="addTimeRange(group.times)" 
                                class="btn btn--size-24 btn--black-outline"
                            >
                                <img :src="icPlus" alt="아이콘">시간 추가
                            </button>
        
                            <button 
                                v-if="tIdx === 0 && gIdx > 0" 
                                @click="removeDailyGroup(gIdx)" 
                                class="btn btn--size-24 btn--black-outline"
                            >
                                <img :src="icDel" width="14">요일 삭제
                            </button>
        
                            <button 
                                v-if="tIdx > 0" 
                                @click="removeTimeRange(group.times, tIdx)" 
                                class="btn btn--size-24 btn--black-outline"
                            >
                                <img :src="icDel" width="14">삭제
                            </button>
                        </div>
    
                    </div>
                </div>

            </div>
            
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .add-item-btn {
        width: 100%;
        height: 32px;
        margin-bottom: 4px;

        border-radius: 5px;
        border: 1px solid $gray-200;
    }
</style>