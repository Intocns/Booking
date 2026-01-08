<!-- 상품관리 > 정보 일괄 변경 -->
<script setup>
// 아이콘
import icCheckMarkOff from '@/assets/icons/ic_check_mark_off.svg'
import icCheckMarkOn from '@/assets/icons/ic_check_mark_on.svg'
import icPlus from '@/assets/icons/ic_plus_blue.svg'
import icDel from '@/assets/icons/ic_del.svg'
import icAddBtn from '@/assets/icons/ic_add_btn.svg'
import icClear from '@/assets/icons/ic_clear.svg'
// 컴포넌트
import TextAreaBox from '@/components/common/TextAreaBox.vue';

import { useModalStore } from '@/stores/modalStore';
import { useProductStore } from '@/stores/productStore';
import { ref, watch, computed } from 'vue';
import InputTextBox from '../InputTextBox.vue';

const modalStore = useModalStore();
const productStore = useProductStore();

// 상태관리
const mode = ref('CHOICE');
const updateProductList = ref([]); //상품 선택(1 페이지)
const updateItemDesc = ref({
    "desc" : "",
    "bookingPrecautionJson" : {
        "desc" : ""
    }
});
const additionalItems = ref([]); //항목 추가(상세 페이지)

/**
 * 이벤트 핸들러
 */

// 모드 변경 감시 -> 스토어 타이틀 업데이트
watch(mode, (newMode) => {
    if (newMode === 'CHOICE') {
        productStore.productList.forEach( item =>{
            updateProductList.value.push({
                'bizItemId' : item.bizItemId,
                'name' : item.name,
                'isChecked' : false
            })
        })
    }
}, { immediate: true });

// 항목 추가
const addSection = () => {
    additionalItems.value.push({
        // id: Date.now(), // 고유 키값
        title: '',
        context: '',
        images: [] // 각 항목별 사진 리스트
    });
};

// 항목 삭제
const removeSection = (index) => {
    additionalItems.value.splice(index, 1);
};

// 개별 리스트 클릭 시 토글 처리 함수 추가
const toggleCheck = (product) => {
    product.isChecked = !product.isChecked;
};

// 정보 일괄 변경 상품 선택
const isCheckedAll = (checked) => {
    updateProductList.value.forEach(item => {
        item.isChecked = checked
    })
}


/**
 * 이미지 추가 핸들러
 * @param {Event} event - input change 이벤트
 * @param {number} itemIndex - 추가할 항목의 index
 */
const handleImageUpload = (event, itemIndex) => {
    const files = Array.from(event.target.files);
    
    if (!files.length) return;

    files.forEach(file => {
        // 미리보기용 임시 URL 생성
        const imageUrl = URL.createObjectURL(file);
        
        // 해당 섹션의 images 배열 마지막에 추가
        additionalItems.value[itemIndex].images.push({
            file: file, // 서버 전송 시 필요
            url: imageUrl // 미리보기용
        });
    });

    // 동일한 파일 재업로드 가능하도록 input 초기화
    event.target.value = '';
};
// 사진 삭제 (예시)
const removeImage = (itemIndex, imgIndex) => {
    additionalItems.value[itemIndex].images.splice(imgIndex, 1);
};

const goInfo = (() => {
    let selectedList = updateProductList.value.filter( item => item.isChecked)

    if(selectedList.length > 0){
        mode.value = 'INFO'
    }else{
        alert('상품을 선택해주세요.'); //confirm모달로 변경 예정
    }
})

//정보변경 일괄 저장
const eventSave = (async() => {
    //선택한 상품 리스트 bizItemIds string (,) 형식으로 가져옴
    let itemList = updateProductList.value
                    .filter( item => item.isChecked)
                    .map(item => item.bizItemId)
                    .join(',');

    let params = {
        "bizItemIds" : itemList,
        "desc" : updateItemDesc.value.desc,
        "bookingPrecautionJson" : updateItemDesc.value.bookingPrecautionJson,
        "extraDescJson" : additionalItems.value
    };

    let response = await productStore.setItemDesc(params);

    if(response.status_code <= 300){
        modalStore.productInfoUpdateAllModal.closeModal()
    }
})

// 선택된 상품 개수 계산
const selectedCount = computed(() => {
    return updateProductList.value.filter(item => item.isChecked).length;
});
</script>

<template>
    <!-- 정보 일괄 변경 상품 선택 -->
    <template v-if="mode === 'CHOICE'">
        <div class="modal-contents-inner">
            <div class="modal-header-desc">
                <p class="body-m">정보를 일괄 변경할 상품을 선택해 주세요.</p>
            </div>
            
            <div class="selection-control">
                <label class="checkbox">
                    <input type="checkbox" @click="isCheckedAll($event.target.checked)"/>
                    <span class="box"></span>
                    <span class="label">전체</span>
                </label>
            </div>
    
            <ul class="modal-product-list">
                <li 
                    v-for="product in updateProductList" 
                    :key="product.bizItemId" 
                    class="modal-product-list__item"
                    :class="{ 'is-selected': product.isChecked }" 
                    @click="toggleCheck(product)"
                >
                    <span class="name body-m">{{ product.name }}</span>
                    <label class="checkbox" @click.stop>
                        <input type="checkbox" v-model="product.isChecked"/>
                        <span class="checkMark"></span>
                    </label>
                </li>
            </ul>
        </div>
    
        <div class="modal-button-wrapper">
            <div class="buttons">
                <button 
                    class="btn btn--size-32 btn--blue-outline" 
                    @click="modalStore.productInfoUpdateAllModal.closeModal()"
                >취소</button>
                <button class="btn btn--size-32 btn--blue"  @click="goInfo">다음</button>
            </div>
        </div>
    </template>

    <!-- 정보 일괄 변경 내용 입력  -->
    <template v-else-if="mode === 'INFO'">
        <div class="modal-contents-inner">
            <div class="modal-header-desc">
                <p class="body-m">선택한 <span class="highlight-blue">{{ selectedCount }}</span>개의 상품의 기본 정보가 아래 입력한 내용으로 모두 변경됩니다.</p>
            </div>

            <div class="update-form">
                <div class="update-form__group">
                    <p class="title-s update-form__label">상품 소개 글을 적어주세요.</p>
                    <TextAreaBox placeholder="상품 소개글을 적어주세요." :max-length="1000" v-model="updateItemDesc.desc" />
                </div>

                <div class="update-form__group">
                    <p class="title-s update-form__label">예약 및 방문 관련 유의사항을 적어주세요.</p>
                    <TextAreaBox placeholder="예약 및 방문 관련 유의사항을 적어주세요." :max-length="1000" v-model="updateItemDesc.bookingPrecautionJson.desc" />
                </div>

                <div class="update-form__section">
                    <div class="section-header">
                        <div class="text-group">
                            <p class="title-s">더 자세히 소개하고 싶다면?</p>
                            <p class="body-s text-gray-500">사진과 함께 더 자세한 설명을 할 수 있어요!</p>
                        </div>
                    </div>
                </div>

                <div v-for="(item, index) in additionalItems" :key="item.id" class="add-item-card">
                    <div class="add-item-card__header">
                        <button class="btn btn--size-24 btn--black-outline" @click="removeSection(index)">
                            <img :src="icDel" alt="삭제" width="13">
                            삭제
                        </button>
                    </div>

                    <div class="add-item-card__body">
                        <InputTextBox 
                            v-model="item.title"
                            placeholder="제목을 입력해주세요" 
                            :max-length="40"
                            :min-length="3"
                        />
                        <TextAreaBox 
                            v-model="item.context"
                            placeholder="내용을 입력해주세요"
                            :max-length="1000" 
                        />

                        <div class="photo-upload">
                            <p class="photo-upload__title title-s">사진 추가</p>
                            <div class="photo-upload__grid">
                                <label class="photo-upload__btn">
                                    <input 
                                        type="file" 
                                        hidden 
                                        multiple 
                                        accept="image/*"
                                        @change="handleImageUpload($event, index)"
                                    >
                                    <img :src="icAddBtn" alt="추가" class="icon-plus" width="32">
                                </label>

                                <div v-for="(img, imgIdx) in item.images" :key="imgIdx" class="photo-upload__item">
                                    <img :src="img.url" alt="업로드 이미지" class="preview-img">
                                    <button class="delete-btn" @click="removeImage(index, imgIdx)">
                                        <img :src="icClear" alt="삭제" width="20">
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <button class="text-button text-button--blue add-section-btn" @click="addSection">
                    항목추가
                    <img :src="icPlus" alt="추가 아이콘">
                </button>
            </div>
        </div>

        <div class="modal-button-wrapper">
            <div class="buttons">
                <button class="btn btn--size-32 btn--blue" @click="eventSave()">저장</button>
            </div>
        </div>
    </template>
</template>

<style lang="scss" scoped>
/* 공통 헤더 설명 영역 */
.modal-header-desc {
    padding-bottom: 16px;
    margin-bottom: 16px;
    border-bottom: 1px solid $gray-200;

    .highlight-blue {
        color: $primary-500;
        font-weight: 700;
    }
}

/* 선택 제어 (전체선택 등) */
.selection-control {
    margin-bottom: 12px;
}

/* 상품 리스트 */
.modal-product-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    // max-height: 320px;
    // overflow-y: auto;

    &__item {
        display: flex;
        align-items: center;
        padding: 6px 10px;
        gap: 10px;
        border-radius: 4px;
        border: 1px solid $gray-200;
        background-color: $gray-00;
        cursor: pointer;

        &:hover {
            background-color: $gray-50;
        }

        /* 선택되었을 때 클래스 추가 */
        &.is-selected {
            border-color: $primary-500;
            background-color: $primary-50;
        }

        .name {
            flex: 1;
            @include ellipsis(1);
        }
    }
}

/* 정보 입력 폼 */
.update-form {
    display: flex;
    flex-direction: column;
    gap: 16px;

    &__group {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    &__label {
        color: $gray-900;
    }

    &__section {
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 16px;

            border-bottom: 1px solid $gray-200;
            
            .text-group {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
        }
    }
}

/* 추가되는 카드 스타일 */
.add-item-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-bottom: 16px;

    border-bottom: 1px solid $gray-200;

    &__header {
        display: flex;
        justify-content: flex-end;
    }

    &__body {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
}

/* 사진 업로드 영역 (이미지와 동일하게) */
// TODO: 추후,, 공통 css로 
.photo-upload {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 4px;

    &__grid {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
    }

    /* 추가 버튼 박스 */
    &__btn {
        width: 96px;
        height: 96px;
        // padding: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;

        background-color: $gray-00;
        border: 1px solid $gray-200;
        border-radius: 4px;
        cursor: pointer;

        .icon-plus {
            width: 32px;
        }

        &:hover {
            border-color: $primary-500;
        }
    }

    /* 이미지 아이템 박스 */
    &__item {
        position: relative;
        width: 96px;
        height: 96px;
        border-radius: 4px;
        overflow: hidden;

        background-color: $gray-00;
        border: 1px solid $gray-200;
        border-radius: 4px;

        .preview-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .delete-btn {
            position: absolute;
            top: 4px;
            right: 4px;

            display: flex;
            align-items: center;
            justify-content: center;
        }
    }
}
</style>