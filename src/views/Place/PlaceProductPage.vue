<!-- 상품관리 -->
<script setup>
// 컴포넌트
import PageTitle from '@/components/common/PageTitle.vue';
import Modal from '@/components/common/Modal.vue';
import ProductInfoUpdateAll from '@/components/common/modal-content/ProductInfoUpdateAll.vue';
import CustomSelect from '@/components/common/CustomSelect.vue';
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

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const productStore = useProductStore();
const modalStore = useModalStore();


// 상태관리
const isVisible = ref('1')
const dragList = ref([...productStore.productList]); // 상품 순서

/**
 * 이벤트 핸들러
 */
// 상품 순서 변경
const clickProductOrderUpdateBtn = (() => {
    modalStore.productOrderUpdateModal.openModal()
})
// 상품 일괄설정 
const clickProductVisibleUpdateBtn = (() => {
    modalStore.productVisibleUpdateModal.openModal()
})
// 정보 일괄 변경
const clickProductInfoUpdataAllBtn = (() => {
    modalStore.productInfoUpdateAllModal.openModal()
})
// 인투펫 진료실 불러오기
const clickIntoPetImportBtn = (() => {
    modalStore.intoPetImportModal.openModal()
})
// 상품 등록 페이지로 이동
const goProductDetail = (id = null) => {
    if (id) {
        // 수정 모드: 쿼리나 파라미터로 id 전달
        router.push({ name: 'placeProductDetail', query: { id: id } });
    } else {
        // 신규 등록 모드
        router.push({ name: 'placeProductDetail' });
    }
};
onMounted(() => {
    productStore.getProductList();
})
</script>

<template>
    <PageTitle title="상품 관리" />

    <!-- 상단 바 -->
    <div class="top-bar">
        <div class="d-flex gap-16 align-center">

            <p class="title-m total-wrapper">전체 <span class="total-num">987</span></p>

            <div class="line"></div>

            <label class="checkbox">
                <input type="checkbox" />
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
                설정
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
            <div v-for="product in productStore.productList" class="item-box">
                <!-- top -->
                <div class="top">
                    <div class="item-box__img">

                        <img v-if="product.imageUrls" src="" alt="상품이미지">

                        <p>{{ product.name }}</p>
                    </div>

                    <div class="d-flex align-center justify-between">
                        <p class="body-l">노출중</p>
    
                        <label class="toggle"> 
                            <input type="checkbox" />
                            <span class="toggle-img"></span>
                        </label>
                    </div>
    
                    <span class="item-box__sub-text body-xs">관리자 확인 후 확정</span>
                </div>

                <!-- bottom -->
                <div class="bottom">
                    <div class="d-flex gap-16">
                        <button><img :src="icEdit" alt="수정아이콘" width="16"></button>
                        <button><img :src="icCopy" alt="복사아이콘"></button>
                        <button><img :src="icDel" alt="삭제 아이콘"></button>
                    </div>

                    <div>
                        <button class="btn btn--size-24 btn--black-outline">미리보기</button>
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
                v-model="productStore.productList" 
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
            <button 
                class="btn btn--size-32 btn--blue-outline" 
                @click="modalStore.productOrderUpdateModal.closeModal()"
            >취소</button>
            <button class="btn btn--size-32 btn--blue">저장</button>
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
                        <input type="radio" name="visibleStatus" v-model="isVisible" :value="1" />
                        <span class="label">노출</span>
                    </label>
                    <label class="segment">
                        <input type="radio" name="visibleStatus" v-model="isVisible" :value="0" />
                        <span class="label">비노출</span>
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
    >
        <ProductInfoUpdateAll />
    </Modal>

    <!-- 진료실 불러오기 모달 -->
    <Modal
        v-if="modalStore.intoPetImportModal.isVisible"
        title="인투펫 진료실 불러오기"
        :modal-state="modalStore.intoPetImportModal"
    >
        <div class="modal-contents-inner">
            <div class="d-flex gap-8">
                <p class="title-s modal-label">진료실 선택</p>

                <CustomSelect caption="등록되어 있는 정보 그대로 불러오기 됩니다." />
            </div>
        </div>

        <div class="modal-button-wrapper">
            <button 
                class="btn btn--size-24 btn--c btn--black-outline" 
                @click="modalStore.intoPetImportModal.closeModal()"
            >취소</button>
            <button class="btn btn--size-24 btn--c btn--black">불러오기</button>
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
    }

    .item-box {
        display: flex;
        flex-direction: column;

        padding: 16px;

        border: 1px solid $gray-200;
        border-radius: 8px;
        background-color: $gray-00;

        .top {
            display: flex;
            flex-direction: column;
        }

        &__img {
            height: 168px;
            @include flex-center;
            overflow: hidden;
            margin-bottom: 8px;

            border-radius: 4px;
            border: 1px solid $gray-200;
        }
        &__sub-text {
            margin: 4px 0;
            color: $gray-500;
        }

        .bottom {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;

            border-top: 1px solid $gray-200;
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
}
</style>