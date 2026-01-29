<!-- 상품관리 -->
<script setup>
// 컴포넌트
import PageTitle from '@/components/common/PageTitle.vue';
import Modal from '@/components/common/Modal.vue';
import ProductInfoUpdateAll from '@/components/common/modal-content/ProductInfoUpdateAll.vue';
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';
// 아이콘
import icList from '@/assets/icons/ic_list.svg';
import icSetting from '@/assets/icons/ic_setting.svg';
import icEdit from '@/assets/icons/ic_edit.svg';
import icPlusW from '@/assets/icons/ic_plus_w.svg';
import icCopy from '@/assets/icons/ic_copy.svg';
import icDel from '@/assets/icons/ic_del.svg';
import icDragHandel from '@/assets/icons/ic_drag_handel.svg'
// 라이브러리
import draggable from 'vuedraggable'; 
// 스토어
import { useProductStore } from '@/stores/productStore';
import { useModalStore } from '@/stores/modalStore';

import { nextTick, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

//util
import { IS_IMP_TYPE } from "@/constants";
import InputTextBox from '@/components/common/InputTextBox.vue';
import { showAlert } from '@/utils/ui';

const router = useRouter();
const productStore = useProductStore();
const modalStore = useModalStore();


// 상태관리
const dragList = ref([...productStore.productList])
const isCheckImpType = ref(false) // 미노출 제외 체크 값
const itemOrderList = ref([...productStore.productList])
const copyProductName = ref(''); // 상품 복사 모달 > 복사할 새 상품명
const currentCopyId = ref(null); // 상품 복사 모달 > 현재 복사 대상 상품의 ID(idx)
const copyOptionBooking = ref(1) // 상품 복사 모달 > 복사 옵션 예약정보
const copyOptionItem = ref(1) // 상품 복사 모달 > 복사 옵션 기본정보
const importIntoPetRoomIdx = ref(null) // 인투펫 진료실 불러오기 > 불러올 진료실 idx

// 미노출 제외 체크박스 감시
watch(
  [
    isCheckImpType,
    () => productStore.productList
  ],
  ([checkedImp, list]) => {
    if (!checkedImp) {
      // 상단 전체 / 미노출 제외 플래그
      dragList.value = list
      return
    }

    // 상품별 노출/미노출 기준 필터링
    dragList.value = list.filter(item =>item.isImp)
  },
  {
    immediate: true
  }
)

/**
 * 이벤트 핸들러
 */
// 상품 순서 변경
const clickProductOrderUpdateBtn = (() => {
    itemOrderList.value = productStore.productList//상품 순서 변경 모달창 오픈 시 초기화
    modalStore.productOrderUpdateModal.openModal()
})
// 상품 일괄설정 
const clickProductVisibleUpdateBtn = (() => {
    modalStore.productVisibleUpdateModal.openModal()
})
// 정보 일괄 변경
const clickProductInfoUpdataAllBtn = (async() => {
    modalStore.productInfoUpdateAllModal.openModal();
})
// 인투펫 진료실 목록 불러오기
const clickIntoPetImportBtn = (async () => {
    importIntoPetRoomIdx.value = null;

    try {
        await productStore.getItemRoomList();

        modalStore.intoPetImportModal.openModal({
            roomList: productStore.itemRoomList.map(room => {
                return {
                    label: room.name,
                    value: room.idx,
                }
            })
        });
    } catch (error) {
        console.error(error);
    }
});
// 인투펫 진료실 불러오기(선택한 진료실을 불러옴)
const importIntoPetRoom = async() => {
    if(!importIntoPetRoomIdx.value) {
        showAlert('진료실을 선택해주세요.')
        return;
    }
    try {
        await productStore.getLinkItemInfo(importIntoPetRoomIdx.value);
        modalStore.intoPetImportModal.closeModal();
    } catch(error) {
        console.error(error)
    }
}
// 상품 등록 페이지로 이동
const goProductDetail = (id = null) => {
    if (id) {
        router.push({ name: 'placeProductEdit', params: { id: id } });
    } else {
        // 신규 등록 모드
        router.push({ name: 'placeProductDetail' });
    }
};
// 상품별 노출/미노출 체크 변경
const clickProductImpUpdateBtn = (async(itemId, isImp) => {
    let params = [
        {
            "bizItemId" : itemId,
            "isImp" : isImp,
        }
    ]

    let response = await productStore.setItemShow(params);

    if(response.status_code <= 300){
        if(isCheckImpType.value){//미노출 제외인 경우
            dragList.value = dragList.value.filter(item => item.isImp && item.bizItemId != itemId)
        }
    }
})
// 상품별 일괄 노출/미노출 체크 변경
const clickTotalProductImpUpdateBtn = (isImp) => {
    modalStore.productVisibleUpdateModal.closeModal();

    const config = isImp === 1 
        ? { title: '전체상품 노출', text: '전체 상품을 노출 하시겠습니까?', subText: '노출된 상품은 고객이 직접 예약할 수 있습니다.', btn: '노출' }
        : { title: '전체상품 미노출', text: '전체 상품을 미노출 하시겠습니까?', subText: '미노출된 상품은 예약할 수 없습니다.', btn: '미노출' };

    
    modalStore.confirmModal.openModal({
        title: config.title,
        text: config.text,
        subText: config.subText,
        confirmBtnText: config.btn,
        onConfirm: () => {
            totalProductImpUpdate(isImp);
        }
    });
    
}
// 노출/미노출 체크 변경 
const totalProductImpUpdate = (async(isImp) => {
    let params = [];

    dragList.value.forEach((item, key)  => {
        params.push(
            {
                "bizItemId" : item.bizItemId,
                "isImp" : isImp,
            }
        );
    });

    let response = await productStore.setItemShow(params);

    if(response.status_code <= 300){
        await productStore.getProductList();//상품 관리 기존 화면 새로고침용
        modalStore.productVisibleUpdateModal.closeModal()
    }
})
// 상품 순서 변경 저장
const saveItemOrder = (async() => {
    let params = [];

    //순서변경 모달창 상품 순서 가져오기
    itemOrderList.value.forEach((item, key)  => {
        params.push(
            {
                "order" : (key + 1),
                "bizItemId" : item.bizItemId
            }
        );
    });

    //상품 순서 변경 api 호출
    let response = await productStore.setItemOrder(params)

    if(response.status_code <= 300){
        await productStore.getProductList();//상품 관리 기존 화면 새로고침용
        modalStore.productOrderUpdateModal.closeModal()
    }
})

// 상품 삭제 버튼 클릭 이벤트
const clickDeleteItem = ((itemName, itemId) => {
    modalStore.confirmModal.openModal({
        title: '상품 삭제',
        text: `[${itemName}]\n상품 정보, 설정 등 모든 정보가 삭제되며\n다시 복원할 수 없습니다.`,
        confirmBtnText: '삭제',
        onConfirm: (() => {
            productStore.delItem(itemId)
        })
    })
})

// 상품 복사 버튼 클릭 이벤트
const clickCopyItem = ((id) => {
    currentCopyId.value = id; // 대상 id 저장
    copyProductName.value = ''; // 상품명 입력필드 초기화
    copyOptionItem.value = 1; // 열 때마다 초기화
    copyOptionBooking.value = 1;
    modalStore.productCopyModal.openModal();
})

// 상품 복사 > 옵션 클릭 토글 이벤트
const toggleCopyOption = (target) => {
    if (target === 'item') {
        copyOptionItem.value = copyOptionItem.value === 1 ? 0 : 1;
    } else if (target === 'booking') {
        copyOptionBooking.value = copyOptionBooking.value === 1 ? 0 : 1;
    }
};

// 상품 복사 실행 버튼 (모달 안의 '복사' 버튼)
const submitCopyItem = () => {
    // 1. 상품명 입력 확인 (공백 제거 후 체크)
    if (!copyProductName.value || copyProductName.value.trim() === '') {
        showAlert('새로운 상품명을 입력해주세요.');
        return;
    }

    // 2. 상품명 글자수 체크 (30자 초과)
    if (copyProductName.value.length > 30) {
        showAlert('상품명은 최대 30자까지 입력 가능합니다.');
        return;
    }

    // 3. 복사 옵션 선택 확인 (둘 다 체크 해제된 경우)
    if (copyOptionItem.value == 0 && copyOptionBooking.value == 0) {
        showAlert('복사할 정보(기본 정보 또는 예약 정보)를 최소 하나 이상 선택해주세요.');
        return;
    }

    const params = {
        'itemName': copyProductName.value,
        'bookingYn': copyOptionBooking.value == 1 ? 'y' : 'n',
        'itemYn': copyOptionItem.value == 1 ? 'y' : 'n',
    }

    productStore.copyItem(currentCopyId.value, params)
    modalStore.productCopyModal.closeModal(); 
};

// 상품 미리보기 페이지 이동
const goToPreviewPage = (businessId, itemId) => {
    window.open(`https://m.booking.naver.com/booking/13/bizes/${businessId}/items/${itemId}`)
}
onMounted(async () => {
    await productStore.getProductList();
})
</script>

<template>
    <PageTitle title="상품 관리" />

    <!-- 상단 바 -->
    <div class="top-bar">
        <div class="d-flex gap-16 align-center">

            <p class="title-m total-wrapper">전체 <span class="total-num">{{ dragList.length }}</span></p>

            <div class="line"></div>

            <label class="checkbox">
                <input type="checkbox" v-model="isCheckImpType"/>
                <span class="box"></span>
                <span class="label">미노출 제외</span>
            </label>

        </div >

        <!-- 버튼들 -->
        <div class="button-group">
            <button class="btn btn--size-32 btn--black-outline" @click="clickProductOrderUpdateBtn">
                <img :src="icList" alt="리스트 아이콘" />
                순서
            </button>
            <button class="btn btn--size-32 btn--black-outline" @click="clickProductVisibleUpdateBtn">
                <img :src="icSetting" alt="설정 아이콘">
                노출 설정
            </button>
            <button class="btn btn--size-32 btn--black-outline" @click="clickProductInfoUpdataAllBtn">
                <img :src="icEdit" alt="편집 아이콘">
                정보변경
            </button>
            <button class="btn btn--size-32 btn--blue-outline" @click="clickIntoPetImportBtn">
                인투펫 진료실 불러오기
            </button>
            <button class="btn btn--size-32 btn--blue" @click="goProductDetail()">
                <img :src="icPlusW" alt="플러스 아이콘">
                예약상품 등록하기
            </button>
        </div>
    </div> 

    <div class="contents-wrapper">
        <div class="grid-wrapper">
            <!-- 상품 리스트 테이블 -->
            <div v-for="product in dragList" class="item-box" :key="product.bizItemId">
                <!-- top -->
                <div class="top">
                    <div class="item-box__img">

                        <img
                            v-if="JSON.parse(product.imageUrls)?.length"
                            :src="JSON.parse(product.imageUrls)[0]"
                            alt="상품이미지"
                        />

                        <p class="item-box__name">{{ product.name }}</p>
                    </div>

                    <div class="item-box__content">
                        <div class="d-flex align-center justify-between">
                            <p class="body-l">{{ IS_IMP_TYPE[Number(product.isImp)].label }}</p>
        
                            <label class="toggle"> 
                                <input type="checkbox" v-model="product.isImp" @change="clickProductImpUpdateBtn(product.bizItemId, product.isImp)" />
                                <span class="toggle-img"></span>
                            </label>
                        </div>
        
                        <span class="item-box__sub-text body-xs">관리자 확인 후 확정</span>
                    </div>
                </div>

                <!-- bottom -->
                <div class="bottom">
                    <div class="d-flex gap-16">
                        <button title="수정" @click="goProductDetail(product.bizItemId)"><img :src="icEdit" alt="수정아이콘" width="16"></button>
                        <button title="복사" @click="clickCopyItem(product.bizItemId)"><img :src="icCopy" alt="복사아이콘"></button>
                        <button title="삭제" @click="clickDeleteItem(product.name, product.bizItemId)"><img :src="icDel" alt="삭제 아이콘"></button>
                    </div>

                    <div>
                        <button class="btn btn--size-24 btn--black-outline" @click="goToPreviewPage(product.businessId, product.bizItemId )">미리보기</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 순서 변경 모달 -->
    <Modal
        v-if="modalStore.productOrderUpdateModal.isVisible"
        title="순서 변경"
        :modal-state="modalStore.productOrderUpdateModal"
    >
        <div class="modal-contents-inner">
            <div class="modal-title">
                <p class="body-m">고객에게 보여지는 예약 상품의 순서를<br/>마우스로 선택, 드래그해서 변경하실 수 있습니다.</p>
            </div>
            <draggable 
                v-model="itemOrderList" 
                tag="ul"
                class="modal-product-list"
                item-key="id" 
                handle=".drag-handel"
                ghost-class="ghost"
                drag-class="drag-item-moving" 
                :force-fallback="true" 
                :scroll="true"
                :scroll-sensitivity="100"
                :animation="200"
            >
                <template #item="{ element }">
                    <li class="modal-product-list__item">
                        <span class="name body-m">{{ element.name }}</span>
                        <span class="drag-handel">
                            <img :src="icDragHandel" alt="드래그 핸들">
                        </span>
                    </li>
                </template>
            </draggable>
        </div>

        <div class="modal-button-wrapper">
            <div class="buttons">
                <button 
                    class="btn btn--size-32 btn--blue-outline" 
                    @click="modalStore.productOrderUpdateModal.closeModal()"
                >취소</button>
                <button class="btn btn--size-32 btn--blue" @click="saveItemOrder()">저장</button>
            </div>
        </div>
    </Modal>

    <!-- 상품 일괄 설정 모달 -->
    <Modal
        v-if="modalStore.productVisibleUpdateModal.isVisible"
        title="상품 일괄 설정"
        :modal-state="modalStore.productVisibleUpdateModal"
    >
        <div class="modal-contents-inner">
            <div class="d-flex gap-8">
                <p class="title-s modal-label">노출 설정</p>
    
                <div class="segment-wrapper">
                    <label class="segment">
                        <input type="radio" name="visibleStatus" @click="clickTotalProductImpUpdateBtn(1)"/>
                        <span class="label">노출</span>
                    </label>
                    <label class="segment">
                        <input type="radio" name="visibleStatus" @click="clickTotalProductImpUpdateBtn(0)"/>
                        <span class="label">미노출</span>
                    </label>
                </div>
            </div>
        </div>
    </Modal>

    <!-- 정보 일괄 변경 모달 -->
    <Modal
        v-if="modalStore.productInfoUpdateAllModal.isVisible"
        title="정보 일괄 변경"
        :modal-state="modalStore.productInfoUpdateAllModal"
        modal-width="400px"
    >
        <ProductInfoUpdateAll />
    </Modal>

    <!-- 진료실 불러오기 모달 -->
    <Modal
        v-if="modalStore.intoPetImportModal.isVisible"
        title="인투펫 진료실 불러오기"
        :modal-state="modalStore.intoPetImportModal"
        size="xs"
        modal-height="410px"
    >
        <div class="modal-contents-inner">
            <div class="d-flex gap-8">
                <p class="title-s modal-label">진료실 선택</p>

                <CustomSingleSelect 
                    v-model="importIntoPetRoomIdx"
                    :options="modalStore.intoPetImportModal.data.roomList"
                    caption="등록되어 있는 정보 그대로 불러오기 됩니다."
                />
            </div>
        </div>

        <div class="modal-button-wrapper">
            <div class="buttons">
                <button 
                    class="btn btn--size-32 btn--blue-outline" 
                    @click="modalStore.intoPetImportModal.closeModal()"
                >취소</button>
                <button class="btn btn--size-32 btn--blue"  @click="importIntoPetRoom()">불러오기</button>
            </div>
        </div>
    </Modal>

    <!-- 상품 복사 모달 -->
    <Modal
        v-if="modalStore.productCopyModal.isVisible"
        title="상품 복사"
        size="xs"
        :modal-state="modalStore.productCopyModal"
    >
        <div class="modal-contents-inner">
            <div class="d-flex flex-col gap-6">
                <span class="title-s">상품명</span>
                <InputTextBox 
                    v-model="copyProductName"
                    :max-length="30" 
                    placeholder="새로운 상품명을 입력해주세요" 
                    :is-error="copyProductName.length > 30"
                    :error-message="'30자까지만 입력 가능합니다.'"
                />
            </div>

            <div class="d-flex flex-col gap-6" style="margin-top:16px;">
                <span class="title-s">복사할 정보 선택</span>

                <ul class="modal-product-list">
                    <li 
                        class="modal-product-list__item" 
                        :class="{ 'is-active': copyOptionItem === 1 }"
                        @click="toggleCopyOption('item')"
                    >
                        <span class="name body-m">기본 정보</span>
                        <label class="checkbox" @click.stop>
                            <input type="checkbox" :checked="copyOptionItem === 1" />
                            <span class="checkMark"></span>
                        </label>
                    </li>
                    <li 
                        class="modal-product-list__item" 
                        :class="{ 'is-active': copyOptionBooking === 1 }"
                        @click="toggleCopyOption('booking')"
                    >
                        <span class="name body-m">예약 정보</span>
                        <label class="checkbox" @click.stop>
                            <input type="checkbox" :checked="copyOptionBooking === 1" />
                            <span class="checkMark"></span>
                        </label>
                    </li>
                </ul>
            </div>
        </div>

        <div class="modal-button-wrapper">
            <div class="buttons">
                <button class="btn btn--size-32 btn--blue-outline" @click="modalStore.productCopyModal.closeModal()">취소</button>
                <button class="btn btn--size-32 btn--blue" @click="submitCopyItem">복사</button>
            </div>
        </div>
    </Modal>
</template>

<style lang="scss" scoped> 
    .line {
        width: 1px;
        height: 16px;
        background-color: $gray-200;
    }
    .total-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;

        .total-num {
            color: #3D56F0;
        }
    }

    .grid-wrapper {
        height: 100%;
        overflow-y: auto;
        display: grid;
        grid-template-columns: repeat(6, 1fr); // 한 줄에 6개, 동일한 너비로
        gap: 16px;
        align-items: start;
        padding-right: 8px;
    }

    .item-box {
        display: flex;
        flex-direction: column;

        border: 1px solid $gray-200;
        border-radius: 8px;
        background-color: $gray-00;

        .top {
            display: flex;
            flex-direction: column;
        }

        &__img {
            position: relative;
            height: 184px;
            @include flex-center;
            overflow: hidden;

            border-radius: 8px 8px 0 0;

            &::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                pointer-events: none;
            }

            img {
                width: 100%;
            }
        }

        &__name {
            position: absolute;
            bottom: 16px;
            left: 16px;
            width: calc(100% - 32px);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            z-index: 1;

            @include typo($title-l-size, $title-l-weight, $title-l-spacing, $title-l-line);
            color: $gray-00;
        }

        &__content {
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            
            border-bottom: 1px solid $gray-200;
        }


        &__sub-text {

            color: $gray-500;
        }

        .bottom {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
        }
    }

    .modal-title {
        padding-bottom: 16px;
        margin-bottom: 16px;

        border-bottom: 1px solid $gray-200;
    }

    .modal-label {
        display: flex;
        align-items: center;
        width: 68px;
        height: 32px; // 버튼이나 인풋 높이에 맞춤
        flex-shrink: 0;
        word-break: keep-all;
    }

    // 순서변경 모달
    .modal-product-list {
        display: flex;
        min-height: 0;
        // max-height: 400px;
        // overflow-y: auto;

        flex-direction: column;
        gap: 12px;

        &__item {
            display: flex;
            align-items: center;
            height: 32px;
            padding: 7px 10px;
            gap: 10px;

            border-radius: 4px;
            border: 1px solid $gray-200;
            background-color: $gray-00;

            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;

            .name {
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }
    }

.ghost {
    opacity: 0.5;
    background: $primary-50 !important;
    border: 1px dashed $primary-500 !important;
}
/* 실제로 마우스에 붙어 움직이는 요소 */
.drag-item-moving {
    opacity: 1 !important; // 투명도 방지
    background-color: $gray-00 !important;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    border: 1px solid $primary-500 !important;
    z-index: 9999;
}

.modal-product-list__item {
    cursor: default; // 기본 커서
    
    .drag-handel {
        cursor: grab; // 잡을 수 있는 모양의 커서
        &:active {
            cursor: grabbing; // 잡았을 때 모양
        }
    }

    &.is-active {
        border-color: $primary-700;
        background-color: $primary-50;
    }
}
</style>