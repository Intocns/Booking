<script setup>
// 컴포넌트
import PageTitle from '@/components/common/PageTitle.vue';
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
import CommonTable from '@/components/common/CommonTable.vue';
import Modal from '@/components/common/Modal.vue';
import CategorySetting from '@/components/common/modal-content/CategorySetting.vue';
import OptionSetting from '@/components/common/modal-content/OptionSetting.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
// 아이콘 이미지
import icSettingW from '@/assets/icons/ic_setting_w.svg'
import icSetting from '@/assets/icons/ic_setting.svg'
import icArrowLeft from '@/assets/icons/ic_arrow_left.svg'
import icArrowRight from '@/assets/icons/ic_arrow_right.svg'
import icEmpty from '@/assets/icons/ic_empty.svg'
import icArrowRightBlue from '@/assets/icons/ic_arrow_right_blue.svg'
import icEdit from '@/assets/icons/ic_edit.svg'
import icCopy from '@/assets/icons/ic_copy.svg'
import icDel from '@/assets/icons/ic_del.svg'

import { ref, computed, onMounted, onUnmounted } from 'vue';
// 스토어
import { useModalStore } from '@/stores/modalStore';
import { useOptionStore } from '@/stores/optionStore';
import { useProductStore } from '@/stores/productStore';

const modalStore = useModalStore();
const optionStore = useOptionStore();
const productStore = useProductStore();

// 상태 관리
const activeTab = ref('unassigned'); // 현재 선택된 카테고리
const selectedProduct = ref(''); // 미리보기에서 선택된 상품 (단일 선택)

// 상품 리스트를 CustomSelect용 options로 변환
const productOptions = computed(() => {
    return (productStore.productList || []).map(product => ({
        label: product.name || '',
        value: product.id || product.bizItemId || product.idx
    }));
});
// 드롭다운 상태 관리
const activeMenuIndex = ref(null);
const menuPosition = ref({ x: 0, y: 0 });
const scrollViewport = ref(null);

// 카테고리
const currentIndex = computed(() => {
    const index = optionStore.categoryList.findIndex(cat => cat.category_id === activeTab.value);
    return index === -1 ? 0 : index; // 찾지 못할 경우 0번으로 리턴
});

// 카테고리 이전 버튼 핸들러
const prevTab = async () => {
    if (currentIndex.value > 0) {
        const prevCategoryId = optionStore.categoryList[currentIndex.value - 1].category_id;
        await setTab(prevCategoryId);
        // 스크롤 왼쪽으로 이동
        scrollViewport.value?.scrollBy({ left: -100, behavior: 'smooth' });
    }
};

// 카테고리 다음 버튼 핸들러
const nextTab = async () => {
    if (currentIndex.value < optionStore.categoryList.length - 1) {
        const nextCategoryId = optionStore.categoryList[currentIndex.value + 1].category_id;
        await setTab(nextCategoryId);
        // 스크롤 오른쪽으로 이동
        scrollViewport.value?.scrollBy({ left: 100, behavior: 'smooth' });
    }
};

// 테이블 key값 임시..
const optionTableColumns = [ // th에 tooltip이 필요한 경우 여기서 추가
    { key: 'optionName', label: '옵션명' },
    { key: 'price', label: '판매가', tooltip: '해당 옵션의 판매 가격을 의미합니다.' }, // 툴팁 있는 경우
    { key: 'count', label: '재고 수', tooltip: '하루 기준으로 옵션의 예약 가능한 수량을 의미합니다.\n해당 수량만큼 예약이 이루어지면 더이상 해당 옵션의 선택은 불가합니다.' },
    { key: '1', label: '선택가능', tooltip: '고객은 해당 수량 안에서 선택 가능합니다.' },
    { key: '2', label: '운영기간', tooltip: '운영기간이 설정되면 기간 내 날짜를 예약 할 경우에만 해당 옵션 선택이 가능합니다.', width: '18%' },
    { key: 'visibleBtn', label: '노출설정' },
    { key: 'connect', label: '상품연결', width: '8%' },
    { key: 'settingBtn', label: '설정' },
]

// 테이블 데이터 맵 (카테고리별 옵션 리스트 저장) - 반응형으로 생성
const dataMap = ref({
    unassigned: [
        { optionName: '증명서 발급', price: '-', count: '제한 없음', 1: '1개!', 2: '상시운영', 3: '', is_connect: '연결하기' }
    ],
    required: [
        { optionName: '기본 진료비', price: '10,000', count: '999', 1: '필수', 2: '상시운영', 3: '노출', 4: '연결됨' }
    ],
    new: [] // 비어있는 경우
});

// 선택된 카테고리에 따라 rows반환
const currentRows = computed(() => {
    return dataMap.value[activeTab.value] || [];
});

// 탭버튼 변경
const setTab = async (tabId) => {
    activeTab.value = tabId;
    await optionStore.getOptionListByCategoryId(tabId);
    // dataMap에 옵션 리스트 저장 (반응형으로 업데이트)
    dataMap.value[tabId] = optionStore.optionList || [];
};

const tableTitleTooltipText = "상품에 카테고리 미지정 옵션만 연결될 경우 예약 서비스에서 카테고리 표시없이 옵션만 노출됩니다.다른 카테고리의 옵션과 함께 연결될 경우 카테고리 미지정 옵션은 '기타' 카테고리로 표시됩니다."

// 카테고리 관리 클릭 이벤트 핸들러
const categorySettingBtnClick = () => {
    modalStore.categorySettingModal.openModal();
}
// 옵션등록 클릭 이벤트 핸들러
const optionRegisterBtnClick = () => {
    isEdit.value = false; // 등록
    modalStore.optionSettingModal.setTitle('옵션 등록');
    // 현재 선택된 카테고리 ID를 전달
    modalStore.optionSettingModal.openModal({ categoryId: activeTab.value });
}

// 설정 버튼 클릭 핸들러 (좌표 계산 포함)
const toggleSettingMenu = (e, index) => {
    // 이미 열려있는 메뉴를 다시 누르면 닫기
    if (activeMenuIndex.value === index) {
        activeMenuIndex.value = null;
        return;
    }

    menuPosition.value = {
        x: e.clientX - 50,
        y: e.clientY + 8
    };
    
    activeMenuIndex.value = index;
};

// 바깥 클릭 시 닫기 로직
const closeMenu = (e) => {
    // 클릭된 요소가 설정 버튼 컨테이너 내부가 아니면 닫음
    if (!e.target.closest('.row__btn-td')) {
        activeMenuIndex.value = null;
    }
};

onMounted(async () => {
    window.addEventListener('click', closeMenu);

    // 상품 리스트 미리 로딩
    await productStore.getProductList();
    
    await optionStore.getCategoryList(); // 카테고리 리스트 불러옴

    if (optionStore.categoryList.length > 0) {
        const firstCategoryId = optionStore.categoryList[0].category_id;
        await setTab(firstCategoryId);
    }
});

onUnmounted(() => {
    window.removeEventListener('click', closeMenu);
});

const isEdit = ref(false); // 수정 모드 여부 상태 추가

// 메뉴 아이템 클릭 시 처리
const handleMenuAction = async (action, row) => {
    activeMenuIndex.value = null; // 메뉴 닫기
    
    if (action === 'edit') {
        isEdit.value = true; // 수정
        modalStore.optionSettingModal.setTitle('옵션 수정');
        console.log(row.rawData);
        // 이미 가져온 옵션 리스트의 rawData 활용 (별도 API 호출 불필요)
        modalStore.optionSettingModal.openModal({ 
            optionData: row.rawData
        });
    } else if (action === 'copy') {
        isEdit.value = false; // 복사는 등록과 같은 로직
        modalStore.optionSettingModal.setTitle('옵션 복사');
        modalStore.optionSettingModal.openModal();
    } else if (action === 'delete') {
        // 삭제 로직 실행
        modalStore.confirmModal.openModal()
        console.log('삭제 대상:', row);
    }
};
</script>

<template>
    <PageTitle title="옵션 관리" />

    <div class="contents-flex-row-layout">
        <div class="left">
            <!-- 상단 바 -->
            <div class="top-bar">
                <div class="category-scroll-area" ref="scrollViewport">
                    <!-- 카테고리 버튼 -->
                    <button 
                        v-for="cat in optionStore.categoryList" 
                        :key="cat.category_id"
                        class="tab-btn btn--size-32"
                        :class="{ 'active': activeTab === cat.category_id }" 
                        @click="setTab(cat.category_id)"
                    >
                        {{ cat.name }}
                    </button>
                </div>
        
                <div class="button-group">
                    <button 
                        class="btn btn--size-32 btn--black-outline"
                        @click="prevTab"
                        :disabled="currentIndex === 0"
                    >
                        <img :src="icArrowLeft" alt="이전">
                    </button>
                    <button 
                        class="btn btn--size-32 btn--black-outline"
                        @click="nextTab"
                        :disabled="currentIndex === optionStore.categoryList.length - 1"
                    >
                        <img :src="icArrowRight" alt="다음">
                    </button>
                    <button class="btn btn--size-32 btn--blue" @click="categorySettingBtnClick">
                        <img :src="icSettingW" alt="관리아이콘">
                        카테고리 관리
                    </button>
                </div>
            </div>

            <div class="table-wrapper">
                <CommonTable
                    title="등록된 옵션"
                    :columns="optionTableColumns" 
                    :rows="currentRows"
                    :table-title-tooltip="tableTitleTooltipText"
                    table-empty-text="등록된 옵션이 없습니다."
                    table-empty-sub-text="예약 상품에 연결해 함께 예약할 옵션 상품이 있다면 등록해주세요."
                    table-empty-btn-text="옵션 등록"
                    @empty-btn-click="optionRegisterBtnClick"
                >
                    <template #right>
                        <div class="d-flex gap-16 align-center table-title-right">
                            <div class="d-flex gap-8 align-center">
                                <span class="title-m">{{ optionStore.selectionTypeCode === 'CHECK' ? '체크형' : '수량형' }}</span>
                                <div>
                                    <span class="title-m">{{ optionStore.optionList.length }}</span>
                                    <span class="title-m"> 개</span>
                                </div>
                            </div>
                            <div class="line"></div>
                            <button class="btn btn--size-32 btn--black" @click="optionRegisterBtnClick">옵션등록</button>
                        </div>
                    </template>


                    <!-- 노출설정 커스텀 슬롯 td -->
                    <template #visibleBtn="{ row, rowIndex }">
                        <label class="toggle"> 
                            <input type="checkbox" :checked="row.checked" />
                            <span class="toggle-img"></span>
                        </label>
                    </template>

                    <!-- 상품연결 커스텀 슬롯 td -->
                    <template #connect="{ row, rowIndex }">
                        <div class="connect_btn">
                            <span class="title-s">{{ row.is_connect }}</span>
                            <img :src="icArrowRightBlue" alt="">
                        </div>
                    </template>

                    <!-- 설정버튼 커스텀 슬롯 td -->
                    <!-- 설정 -->
                    <template #settingBtn="{ row, rowIndex }">
                        <div class="row__btn-td">
                            <button 
                                class="btn btn--size-24 btn--black-outline"
                                @click.stop="toggleSettingMenu($event, rowIndex)"
                                :class="{ 'active': activeMenuIndex === rowIndex }"
                            >
                                <img :src="icSetting" alt="설정">
                            </button>
    
                            <ul 
                                v-if="activeMenuIndex === rowIndex"
                                class="setting-dropdown"
                                :style="{ left: menuPosition.x + 'px', top: menuPosition.y + 'px' }"
                            >
                                <li @click="handleMenuAction('edit', row)">
                                    <img :src="icEdit" alt="수정아이콘">
                                    옵션수정
                                </li>
                                <li @click="handleMenuAction('copy', row)">
                                    <img :src="icCopy" alt="복사아이콘">
                                    옵션복사
                                </li>
                                <li @click="handleMenuAction('delete', row)">
                                    <img :src="icDel" alt="삭제아이콘">
                                    옵션삭제
                                </li>
                            </ul>
                        </div>
                    </template>
                </CommonTable>
            </div>
        </div>

        <!-- 미리보기 영역 -->
        <div class="right">
            <div class="preview-wrapper">
                <div class="preview-title">
                    <p class="heading-s">미리보기</p>
                </div>
                <div class="preview-contents">
                    <!-- 선택 -->
                    <CustomSingleSelect 
                        v-model="selectedProduct"
                        :options="productOptions"
                        placeholder="상품을 선택해주세요"
                    />

                    <!-- 미리보기 -->
                    <div class="preview-section">
                        <!-- TODO: 옵션 화면 -->
                        
                        <!-- 옵션 없는 경우 -->
                        <div class="empty-box">
                            <img :src="icEmpty" alt="비어있음 아이콘">
                            <span class="title-s">선택한 옵션이 없습니다.</span>
                            <p class="body-m">상품과 함께 예약 받을 옵션을 선택해 주세요.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 카테고리 관리 모달 -->
    <Modal
        v-if="modalStore.categorySettingModal.isVisible"
        size="s"
        modal-width="400px"
        modal-height="662px"
        :title="modalStore.categorySettingModal.title"
        :modal-state="modalStore.categorySettingModal"
    >
        <CategorySetting />
    </Modal>

    <!-- 옵션 등록, 수정, 복사 모달 -->
    <Modal
        v-if="modalStore.optionSettingModal.isVisible"
        size="s"
        modal-width="400px"
        :title="modalStore.optionSettingModal.title"
        :modal-state="modalStore.optionSettingModal"
    >
        <OptionSetting :is-edit="isEdit" />
    </Modal>

    <!-- 옵션 삭제 -->
    <ConfirmModal
        v-if="modalStore.confirmModal.isVisible"
        title="옵션 삭제"
        confirm-btn-text="삭제"
    >
        <p>옵션을 삭제하시겠습니까?<br/>삭제하면 옵션정보, 설정 등 모든 정보가 사라지고<br/>다시 복원할 수 없습니다.</p>
    </ConfirmModal>
</template>

<style lang="scss" scoped>
    .contents-flex-row-layout {
        width: 100%;
        height: 100%;
        display: flex;
        gap:16px;
    }

    .left {
        flex: 1;
        min-width: 0;

        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .category-scroll-area {
        flex: 1;
        display: flex;
        gap: 8px;
        overflow-x: auto;
        white-space: nowrap;
        min-width: 0;

        padding: 2px 0;

        /* 스크롤바 숨기기 */
        scrollbar-width: none; // Firefox
        &::-webkit-scrollbar {
            display: none; // Chrome, Safari
        }

        .tab-btn {
            flex-shrink: 0; // 버튼이 찌그러지지 않게 고정
        }
    }

    .right {
        // flex: 1;
        width: 400px;
        flex: 0 0 400px;

        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .table-wrapper {
        height: 100%;
    }

    .preview-wrapper {
        display: flex;
        flex-direction: column;
        gap:16px;
        height: 100%;
        // width: 400px;
        padding: 16px;

        border-radius: 8px;
        border: 1px solid $gray-200;
        background-color: $gray-00;
    }

    .table-title-right {
        .line {
            width: 1px;
            height: 22px;

            background-color: $gray-200;
        }
    }

    // 테이블 > 상품연결 버튼
    .connect_btn {
        display: flex;
        gap: 4px;

        color: $primary-700;
        cursor: pointer;

        &:hover {
            text-decoration: underline;    
        }
    }

    // 테이블 > 관리 메뉴
    .setting-dropdown {
        display: none;
        position: absolute;

        display: flex;
        flex-direction: column;
        padding: 10px;

        border-radius: 4px;
        border: 1px solid $gray-200;
        background-color: $gray-00;
        box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.06);

        li {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 0 5px;
            height: 32px;

            border-radius: 4px;
            cursor: pointer;

            @include typo($body-m-size, $body-m-weight, $body-m-spacing, $body-m-line);

            &:hover {
                background-color: $gray-50;
            }
        }

    }



    // 미리보기
    .preview-contents {
        height: 100%;
        display:flex;
        flex-direction: column;
        gap: 16px;

        .select {width: 100%;}

        .preview-section {
            height: 100%;
            padding: 24px;
            min-height: 0;
            overflow-y: auto;

            border-top: 1px solid $gray-200;

            .empty-box {
                height: 100%;
            }
        }
    }
</style>