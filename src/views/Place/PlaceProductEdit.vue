<!-- 상품관리 > 상품 수정 -->
<script setup>
// 컴포넌트
import PageTitle from '@/components/common/PageTitle.vue';
import ProductTabBasic from './PlaceProductDetailBasic.vue';
import ProductTabBookingCalendar from './PlaceProductDetailBookingCalendar.vue';
import ProductTabOption from './PlaceProductDetailOption.vue';
import PlaceProductDetailBookingSide from './PlaceProductDetailBookingSide.vue';
import PlaceProductPreview from './PlaceProductPreview.vue';
import OptionPreview from '@/components/common/OptionPreview.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import ModalSimple from '@/components/common/ModalSimple.vue';
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
import TimeSelect from '@/components/common/TimeSelect.vue';
// 아이콘
import icClear from '@/assets/icons/ic_clear.svg'
// 
import { ref, reactive, computed } from 'vue';
import { useRoute } from 'vue-router';
import { DayPilot } from '@daypilot/daypilot-lite-vue';
// 스토어
import { useModalStore } from '@/stores/modalStore';
import { useProductStore } from '@/stores/productStore';
// utils
import { DAYS_OPTIONS } from '@/utils/schedule';
import { showAlert } from '@/utils/ui';

const modalStore = useModalStore();
const productStore = useProductStore();
const route = useRoute();

/**
 * 상태관리
 */
const currentTab = ref('basic'); // 상단 탭메뉴 상태 저장
const itemId = ref(route.params.id); // 상품아이디

// 예약 가능 동물 수 옵션 (임시 1~10)
const animalCountOptions = Array.from({ length: 10 }, (_, i) => ({ label: String(i + 1), value: i + 1 }));

// 상품 미리보기 데이터 통합 관리
const previewData = reactive({
    mainImage: '', // 대표이미지
    name: '',
    desc: '',
    details: [],
    notice: ''
});

/**
 * 진료가능 예약수, 운영시간 설정 모달 관련
 */
// 모달 타이틀 선택한 날짜 보여줌
const dynamicModalTitle = computed(() => {
    const data = modalStore.setOperationRuleModal.data;

    // 데이터가 없거나 날짜가 없으면 기본 타이틀 반환
    if (!data || !data.date) return "운영 일정 설정";
    
    // DayPilot 또는 dayjs 등을 사용하여 "26.01.22 (목)" 형식으로 변환
    try {
        return new DayPilot.Date(data.date).toString("yy.MM.dd (ddd)", "ko-kr");
    } catch (e) {
        return data.date; // 에러 시 생 날짜 표시
    }
});

// 현재 선택된 날짜의 요일을 반환하는 Computed
const selectedDay = computed(() => {
    const data = modalStore.setOperationRuleModal.data;
    if (!data || !data.date) return "";

    const dayIndex = new DayPilot.Date(data.date).getDayOfWeek();

    const mapping = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return mapping[dayIndex];
});

// 운영 시간 추가 로직
const addTimeSetting = () => {
    // data.times 배열에 새 객체 추가
    modalStore.setOperationRuleModal.data.times.push({ startTime: "", endTime: "" });
};

// 운영 시간 삭제 로직
const removeTimeSetting = (index) => {
    modalStore.setOperationRuleModal.data.times.splice(index, 1);
};

// 저장 로직
const handleModalSave = async () => {
    const data = modalStore.setOperationRuleModal.data;

    // 유효성 검사
    if (!data.stock || data.stock <= 0) return showAlert("진료 가능 동물 수를 선택해주세요.");
    if (data.times.some(t => !t.startTime || !t.endTime)) return showAlert("운영시간을 모두 입력해주세요.");

    const params = {
        day: data.date,
        stock: data.stock,
        times: data.times.map(t => ({
            startTime: t.startTime,
            endTime: t.endTime
        }))
    };

    const response = await productStore.setScheduleModalSave(itemId.value, params);

    if (response && response.status_code <= 300) {
        showAlert("저장되었습니다.");
        
        await productStore.getItemReservationInfo(itemId.value); // 오른쪽 목록 갱신
        
        // 캘린더 갱신 (일단 오늘 기준 주차로 호출)
        const start = DayPilot.Date.today().firstDayOfWeek(1);
        await productStore.getProductSchedule(itemId.value, {
            startDate: start.toString("yyyy-MM-dd"),
            endDate: start.addDays(6).toString("yyyy-MM-dd"),
        });

        modalStore.setOperationRuleModal.closeModal();
    }
};
</script>

<template>
    <PageTitle title="상품 수정" />

    <!-- 콘텐츠 영역 -->
    <div class="contents-flex-row-layout" :class="{ 'is-booking-mode': currentTab === 'booking' }">
        <!-- left -->
        <div class="left">
            <!-- 상단 탭메뉴 -->
            <div class="top-bar">
                <div class="button-group">
                    <button 
                        class="tab-btn btn--size-32"
                        :class="{ active: currentTab === 'basic' }" 
                        @click="currentTab = 'basic'"
                    >
                        기본 정보
                    </button>
                    <button 
                        class="tab-btn btn--size-32"
                        :class="{ active: currentTab === 'booking' }" 
                        @click="currentTab = 'booking'"
                    >
                        일정 설정
                    </button>
                    <button 
                        class="tab-btn btn--size-32"
                        :class="{ active: currentTab === 'option' }" 
                        @click="currentTab = 'option'"
                    >
                        옵션 연결
                    </button>
                </div>
            </div>

            <!-- 콘텐츠 -->
            <div class="contents-wrapper">
                <keep-alive>
                    <component 
                        :is="currentTab === 'basic' ? ProductTabBasic : currentTab === 'booking' ? ProductTabBookingCalendar : ProductTabOption"
                        v-model:preview-name="previewData.name"
                        v-model:preview-desc="previewData.desc"
                        v-model:preview-details="previewData.details"
                        v-model:preview-notice="previewData.notice"
                        :saved-item-id="itemId"
                        :view-type="'update'"
                        @update:preview-main-image="previewData.mainImage = $event"
                    />
                </keep-alive>
            </div>
        </div>

        <!-- right -->
        <div class="right">
            <PlaceProductDetailBookingSide v-if="currentTab === 'booking'" :saved-item-id="itemId"/>
            <OptionPreview v-else-if="currentTab === 'option'" v-model:selected-product="itemId" :no-show-select-box="true" />
            <PlaceProductPreview v-else :preview-data="previewData" />
        </div>
    </div>

    <ModalSimple
        v-if="modalStore.setOperationRuleModal.isVisible"
        :modal-state="modalStore.setOperationRuleModal"
        :title="dynamicModalTitle"
    >
        <div class="modal-contents-inner">
            <div class="d-flex flex-col gap-16 align-center">
                <!-- 요일 버튼 -->
                <div class="day-button-group d-flex gap-4">
                    <button 
                        v-for="day in DAYS_OPTIONS" 
                        :key="day.value" 
                        type="button" 
                        class="btn-day" 
                        :class="{ 'active': selectedDay === day.value }"
                    >
                        {{ day.label }}
                    </button>
                </div>

                <!-- 예약 가능 설정 -->
                <div class="d-flex align-center gap-4 body-s">
                    매 30분 마다
                    <CustomSingleSelect 
                        v-model="modalStore.setOperationRuleModal.data.stock" 
                        :options="animalCountOptions" 
                        select-width="63px" 
                    />
                    마리 진료 가능
                </div>
            </div>

            <div style="min-height: 220px;margin-top: 32px;">
                <!-- 시간 설정 -->
                <div class="d-flex flex-col gap-16">
                    <div v-for="(time, index) in modalStore.setOperationRuleModal.data.times" :key="index" class="set-time-item">
                        <span class="title-s">시작</span>
                        <TimeSelect v-model="time.startTime" />
                        -
                        <span class="title-s">마지막</span>
                        <TimeSelect v-model="time.endTime" />

                        <!-- 삭제버튼 -->
                        <button 
                            v-if="index > 0" 
                            class="btn-clear" 
                            @click="removeTimeSetting(index)">
                            <img :src="icClear" alt="삭제" />
                        </button>
                    </div>
                </div>
            </div>

            <div style="margin-top: 16px; border-top: 1px solid #ddd; padding-top: 16px;">
                <button class="text-button text-button--blue" style="width: 100%;" @click="addTimeSetting">시간 추가</button>
            </div>
        </div>

        <div class="modal-button-wrapper">
            <button class="btn btn--size-32 btn--black" @click="modalStore.setOperationRuleModal.closeModal()">취소</button>
            <button class="btn btn--size-32 btn--blue" @click="handleModalSave">저장</button>
        </div>
    </ModalSimple>
</template>

<style lang="scss" scoped>
    .contents-flex-row-layout {
        width: 100%;
        height: 100%;
        min-height: 0;
        display: flex;
        gap:16px;

        &.is-booking-mode {
            .left { flex: 1; }
            .right { width: 650px; }
        }
    }

    .left {
        flex: 2;

        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .right {
        // flex: 1;
        width: 400px;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    // 진료가능 동물 수, 운영설정 모달 스타일
    .set-time-item {
        display:flex;
        align-items:center;
        gap:8px;
        position: relative;

        .btn-clear {
            position:absolute;
            right:-7px;
            top: -7px;
        }
    }
</style>