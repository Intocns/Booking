<script setup>
// 컴포넌트
import PageTitle from '@/components/common/PageTitle.vue';
import CommonTable from '@/components/common/CommonTable.vue';
import Modal from '@/components/common/Modal.vue';
import CategorySetting from '@/components/common/modal-content/CategorySetting.vue';
import OptionSetting from '@/components/common/modal-content/OptionSetting.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
import OptionPreview from '@/components/common/OptionPreview.vue';
// 아이콘 이미지
import icSettingW from '@/assets/icons/ic_setting_w.svg'
import icSetting from '@/assets/icons/ic_setting.svg'
import icArrowLeft from '@/assets/icons/ic_arrow_left.svg'
import icArrowRight from '@/assets/icons/ic_arrow_right.svg'
import icArrowRightBlue from '@/assets/icons/ic_arrow_right_blue.svg'
import icEdit from '@/assets/icons/ic_edit.svg'
import icCopy from '@/assets/icons/ic_copy.svg'
import icDel from '@/assets/icons/ic_del.svg'

import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
// 스토어
import { useModalStore } from '@/stores/modalStore';
import { useOptionStore } from '@/stores/optionStore';
import { useProductStore } from '@/stores/productStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useDragScroll } from '@/composables/useDragScroll';
import { showAlert } from '@/utils/ui';

const modalStore = useModalStore();
const optionStore = useOptionStore();
const productStore = useProductStore();
const categoryStore = useCategoryStore();

// 상태 관리
const activeTab = ref(null); // 현재 선택된 카테고리
const selectedProduct = ref(''); // 미리보기에서 선택된 상품 (단일 선택)
const selectionTypeCode = ref(''); // 선택된 카테고리의 유형(타입)
// 드롭다운 상태 관리
const activeMenuIndex = ref(null);
const menuPosition = ref({ x: 0, y: 0 });
// 미리보기 컴포넌트 참조
const optionPreviewRef = ref(null);

// 카테고리 스크롤 영역 드래그 스크롤 기능
const { scrollRef: scrollViewport, handleMouseDown: handleCategoryMouseDown } = useDragScroll();

// 카테고리
const currentIndex = computed(() => {
    const index = categoryStore.categoryList.findIndex(cat => cat.categoryId === activeTab.value);
    return index === -1 ? 0 : index; // 찾지 못할 경우 0번으로 리턴
});

// 카테고리 이전 버튼 핸들러
const prevTab = async () => {
    if (currentIndex.value > 0) {
        const prevCategoryId = categoryStore.categoryList[currentIndex.value - 1].categoryId;
        await setTab(prevCategoryId);
        // 스크롤 왼쪽으로 이동
        scrollViewport.value?.scrollBy({ left: -100, behavior: 'smooth' });
    }
};

// 카테고리 다음 버튼 핸들러
const nextTab = async () => {
    if (currentIndex.value < categoryStore.categoryList.length - 1) {
        const nextCategoryId = categoryStore.categoryList[currentIndex.value + 1].categoryId;
        await setTab(nextCategoryId);
        // 스크롤 오른쪽으로 이동
        scrollViewport.value?.scrollBy({ left: 100, behavior: 'smooth' });
    }
};


const optionTableColumns = [ // th에 tooltip이 필요한 경우 여기서 추가
    { key: 'name', label: '옵션명' },
    { key: 'priceText', label: '판매가', tooltip: '해당 옵션의 판매 가격을 의미합니다.' },
    { key: 'count', label: '재고 수', tooltip: '하루 기준으로 옵션의 예약 가능한 수량을 의미합니다.\n해당 수량만큼 예약이 이루어지면 더이상 해당 옵션의 선택은 불가합니다.' },
    { key: 'maxBookingCount', label: '선택가능', tooltip: '고객은 해당 수량 안에서 선택 가능합니다.' },
    { key: 'operatingPeriod', label: '운영기간', tooltip: '운영기간이 설정되면 기간 내 날짜를 예약 할 경우에만 해당 옵션 선택이 가능합니다.', width: '18%' },
    { key: 'visibleBtn', label: '노출설정' },
    { key: 'connect', label: '상품연결', width: '8%' },
    { key: 'settingBtn', label: '설정' },
]

// 테이블 데이터 맵 (카테고리별 옵션 리스트 저장) - 반응형으로 생성
const dataMap = ref({});

// 선택된 카테고리에 따라 rows반환
const currentRows = computed(() => {
    return dataMap.value[activeTab.value] || [];
});

// 탭버튼 변경 (dateMap업데이트)
const setTab = async (tabId) => {
    activeTab.value = tabId;

    // 전체 리스트에서 현재 클릭한 tabId(categoryId)와 일치하는 카테고리 찾음
    const currentCategory = optionStore.optionList.find(
        (cat) => String(cat.categoryId) === String(tabId)
    );
    
    selectionTypeCode.value = categoryStore.categoryList.find((cat) => cat.categoryId == tabId).selectionTypeCode; //currentCategory.selectionTypeCode;

    if (currentCategory) {
        dataMap.value[tabId] = currentCategory.options;
        
    } else {
        dataMap.value[tabId] = [];
    }
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

    await productStore.getProductList(); // 상품 리스트 불러옴    
    await categoryStore.getCategoryList(); // 카테고리 리스트 불러옴
    await optionStore.getOptionListByCategory(); // 카테고리+옵션리스트 전체 불러옴

    if (categoryStore.categoryList.length > 0) {
        const firstCategoryId = categoryStore.categoryList[0].categoryId;
        await setTab(firstCategoryId);
    }
});

onUnmounted(() => {
    window.removeEventListener('click', closeMenu);
});

const isEdit = ref(false); // 수정 모드 여부 상태 추가

// 노출설정 토글 핸들러
const toggleOptionVisibility = async (row) => {
    const optionId = row.optionId;
    
    if (!optionId) {
        showAlert('옵션 ID를 찾을 수 없습니다.');
        return;
    }

    // rawData가 없으면 현재 row 데이터로 업데이트 데이터 구성
    const rawData = row.rawData || {
        idx: row.idx,
        optionId: optionId,
        categoryId: activeTab.value,
        name: row.name || '',
        desc: row.desc,
        minBookingCount: null,
        maxBookingCount: null,
        stock: null,
        price: null,
        normalPrice: null,
        priceDesc: null,
        startDate: row.startDate || null,
        endDate: row.endDate || null,
        serviceDuration: null,
        isImp: row.isImp ? 1 : 0,
        order: row.order || 0
    };

    try {
        // 현재 isImp 값을 반대로 변경
        const newIsImp = row.isImp ? 0 : 1;
        
        // 옵션 수정 API 호출 (isImp만 변경, 나머지는 기존 값 유지)
        const updateData = {
            idx: row.idx,
            optionId: optionId,
            categoryId: rawData.categoryId,
            name: rawData.name,
            desc: rawData.desc || null,
            serviceDuration: rawData.serviceDuration || null,
            minBookingCount: rawData.minBookingCount,
            maxBookingCount: rawData.maxBookingCount,
            stock: rawData.stock,
            price: rawData.price,
            normalPrice: rawData.normalPrice,
            priceDesc: rawData.priceDesc || null,
            startDate: rawData.startDate || null,
            endDate: rawData.endDate || null,
            isImp: newIsImp,
            useFlag: 1,
        };

        await optionStore.updateOption(optionId, updateData);

        // 옵션 리스트 새로고침
        if (activeTab.value) {
            await optionStore.getOptionListByCategory();
            await setTab(activeTab.value);
        }
    } catch (error) {
        console.error('노출설정 변경 실패:', error);
        
        // 409 에러인 경우 특별한 메시지 표시
        if (error.message && error.message.includes('옵션을 찾을 수 없습니다')) {
            showAlert('옵션을 찾을 수 없습니다. 옵션이 삭제되었거나 존재하지 않을 수 있습니다.\n리스트를 새로고침합니다.')
        } else {
            showAlert('노출설정 변경 중 오류가 발생했습니다.');
        }
        
        // 에러 발생 시 체크박스 상태를 원래대로 되돌리기 위해 리스트 새로고침
        if (activeTab.value) {
            await optionStore.getOptionListByCategory();
            await setTab(activeTab.value);
        }
    }
};

// 메뉴 아이템 클릭 시 처리
const handleMenuAction = async (action, row) => {
    activeMenuIndex.value = null; // 메뉴 닫기
    
    if (action === 'edit') {
        isEdit.value = true; // 수정
        modalStore.optionSettingModal.setTitle('옵션 수정');
        // 이미 가져온 옵션 리스트의 rawData 활용 (별도 API 호출 불필요)
        modalStore.optionSettingModal.openModal({ 
            optionData: row.rawData
        });
    } else if (action === 'copy') {
        isEdit.value = false; // 복사는 등록과 같은 로직
        modalStore.optionSettingModal.setTitle('옵션 복사');
        // 복사할 옵션 데이터 전달
        modalStore.optionSettingModal.openModal({ 
            optionData: row.rawData,
            isCopy: true
        });
    } else if (action === 'delete') {
        // 삭제 확인 모달 열기 (삭제할 옵션 데이터 저장)
        modalStore.confirmModal.openModal({ 
            title: '옵션 삭제',
            text: '옵션을 삭제하시겠습니까?\n삭제하면 옵션정보, 설정 등 모든 정보가 사라지고\n다시 복원할 수 없습니다.',
            confirmBtnText: '삭제',
            onConfirm: () => { handleDeleteOption() },
            optionData: row.rawData 
        });
    }
};

// 테이블 행 클릭 시 처리
const handelTableRowClick = (row) => {
    isEdit.value = true; // 수정
    modalStore.optionSettingModal.setTitle('옵션 수정');
    // 이미 가져온 옵션 리스트의 rawData 활용 (별도 API 호출 불필요)
    modalStore.optionSettingModal.openModal({ 
        optionData: row.rawData
    });
}

// 옵션 삭제 핸들러
const handleDeleteOption = async () => {
    const optionData = modalStore.confirmModal.data?.optionData;
    if (!optionData || !optionData.optionId) {
        showAlert('옵션 ID를 찾을 수 없습니다.');
        return;
    }

    try {
        const optionId = optionData.optionId;
        
        // 옵션 삭제 API 호출
        await optionStore.deleteOption(optionId);
        
        showAlert('옵션이 삭제되었습니다.');

        // 삭제 성공 후 옵션 리스트 새로고침
        if (activeTab.value) {
            await optionStore.getOptionListByCategory(); // 1. 전체 데이터 갱신
            await setTab(activeTab.value);             // 2. dataMap 업데이트
        }
        
    } catch (error) {
        console.error('옵션 삭제 실패:', error);
    }
};

// 상품연결 클릭 핸들러 (수정 팝업 열기 + 상품연결 탭으로 이동)
const handleProductConnectClick = (row) => {
    isEdit.value = true; // 수정 모드
    modalStore.optionSettingModal.setTitle('옵션 수정');
    // 상품연결 탭으로 바로 이동하도록 initialTab 전달
    modalStore.optionSettingModal.openModal({ 
        optionData: row.rawData,
        initialTab: 'CONNECT'
    });
};

// 옵션 설정 모달이 닫힐 때 dataMap 업데이트 및 미리보기 리로드
watch(() => modalStore.optionSettingModal.isVisible, async (isVisible) => {
    if (!isVisible && activeTab.value) {
        // OptionSetting에서 이미 getOptionListByCategoryId를 호출했으므로 dataMap만 업데이트
        // dataMap.value[activeTab.value] = optionStore.optionList || [];
        await setTab(activeTab.value); // setTab에서 dateMap업데이트됨
        
        // 미리보기에 상품이 선택되어 있으면 리로드 (상품 연결 변경사항 반영)
        if (selectedProduct.value && optionPreviewRef.value) {
            optionPreviewRef.value.reload();
        }
    }
});
</script>

<template>
    <PageTitle title="옵션 관리" />

    <div class="contents-flex-row-layout">
        <div class="left">
            <!-- 상단 바 -->
            <div class="top-bar">
                <div 
                    class="category-scroll-area" 
                    ref="scrollViewport"
                    @mousedown="handleCategoryMouseDown"
                >
                    <!-- 카테고리 버튼 -->
                    <button 
                        v-for="cat in categoryStore.categoryList" 
                        :key="cat.categoryId"
                        class="tab-btn btn--size-32"
                        :class="{ 'active': activeTab === cat.categoryId }" 
                        @click="setTab(cat.categoryId)"
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
                        :disabled="currentIndex === categoryStore.categoryList.length - 1"
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
                    @row-click="handelTableRowClick"
                    :is-click-able="true"
                >
                    <template #right>
                        <div class="d-flex gap-16 align-center table-title-right">
                            <div class="d-flex gap-8 align-center">
                                <span class="title-m">{{ selectionTypeCode === 'CHECK' ? '체크형' : '수량형' }}</span>
                                <div>
                                    <span class="title-m">{{ currentRows.length }}</span>
                                    <span class="title-m"> 개</span>
                                </div>
                            </div>
                            <div class="line"></div>
                            <button class="btn btn--size-32 btn--black" @click.stop="optionRegisterBtnClick">옵션등록</button>
                        </div>
                    </template>


                    <!-- 노출설정 커스텀 슬롯 td -->
                    <template #visibleBtn="{ row, rowIndex }">
                        <label class="toggle" @click.stop> 
                            <input 
                                type="checkbox" 
                                :checked="row.isImp" 
                                @change="toggleOptionVisibility(row)"
                            />
                            <span class="toggle-img"></span>
                        </label>
                    </template>

                    <!-- 상품연결 커스텀 슬롯 td -->
                    <template #connect="{ row, rowIndex }" @click.stop>
                        <div class="connect_btn" @click.stop="handleProductConnectClick(row)" style="cursor: pointer;">
                            <span class="title-s">{{ row.is_connect }}</span>
                            <img :src="icArrowRightBlue" alt="">
                        </div>
                    </template>

                    <!-- 설정버튼 커스텀 슬롯 td -->
                    <!-- 설정 -->
                    <template #settingBtn="{ row, rowIndex }" @click.stop>
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
            <OptionPreview ref="optionPreviewRef" v-model:selected-product="selectedProduct" />
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
</template>

<style lang="scss" scoped>
    .contents-flex-row-layout {
        width: 100%;
        height: 100%;
        min-height: 0;
        max-height: 100%;
        display: flex;
        gap:16px;
        overflow: hidden;
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
        cursor: grab;

        padding: 2px 0;

        /* 스크롤바 숨기기 */
        scrollbar-width: none; // Firefox
        &::-webkit-scrollbar {
            display: none; // Chrome, Safari
        }

        &:active {
            cursor: grabbing;
        }

        .tab-btn {
            flex-shrink: 0; // 버튼이 찌그러지지 않게 고정
        }
    }

    .right {
        // flex: 1;
        width: 400px;
        flex: 0 0 400px;
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 16px;
        overflow: hidden;
    }

    .table-wrapper {
        height: 100%;
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
</style>