<!-- 상품등록/수정 페이지  > 기본 정보 탭 -->
<script setup>
import { ref } from 'vue';
import InputTextBox from '@/components/common/InputTextBox.vue';
import TextAreaBox from '@/components/common/TextAreaBox.vue';
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
// 아이콘
import icPlus from '@/assets/icons/ic_plus_blue.svg'
import icClear from '@/assets/icons/ic_clear.svg'
import icAddBtn from '@/assets/icons/ic_add_btn.svg'
import icDragHandel from '@/assets/icons/ic_drag_handel.svg'

const doctorAssignType = ref('assign'); // 담당의 설정 타입 (default: 'assign' - 승인 시 배정)
const selectedDoctor = ref([]); // 선택된 담당의 ID
const doctorOptions = [ // 담당의 목록 (예시 데이터)
    { label: '김철수 원장', value: 'doc_01' },
    { label: '이영희 과장', value: 'doc_02' },
];

// 상세 설명 항목 상태관리 (예시)
const detailList = ref([]);

// 항목 추가 함수 (예시)
const addDetailItem = () => {
    detailList.value.push({
        title: '',
        content: '',
        image: null,
        url: ''
    });
};

// 항목 삭제 함수 (임시로 넣음)
const removeDetailItem = (index) => {
    detailList.value.splice(index, 1);
};
</script>

<template>
    <ul class="form-container">
        <!-- 상품명 -->
        <li class="form-item">
            <div class="form-label required">상품명</div>
            <div class="form-content">
                <InputTextBox :max-length="50" />
            </div>
        </li>

        <!-- 상품 노출 여부 -->
        <li class="form-item">
            <div class="form-label">상품 노출 여부</div>
            <div class="form-content">
                <label class="toggle">
                    <input type="checkbox" />
                    <span class="toggle-img"></span>
                </label>
            </div>
        </li>

        <!-- 상품사진 -->
        <li class="form-item">
            <div class="form-label required">상품 사진</div>
            <div class="form-content">
                <div class="photo-upload__grid">
                    <label class="photo-upload__btn">
                        <input 
                            type="file" 
                            hidden 
                            multiple 
                            accept="image/*"
                        >
                        <img :src="icAddBtn" alt="추가" class="icon-plus" width="32">
                    </label>

                    <div class="photo-upload__item">
                        <img src="" alt="업로드 이미지" class="preview-img"> 
                        <!-- 드래그핸들 -->
                        <div class="drag-handle"><img :src="icDragHandel" alt="드래그아이콘"></div>
                        <!-- 삭제 버튼 -->
                        <button class="delete-btn">
                            <img :src="icClear" alt="삭제" width="20">
                        </button>
                        <!-- 대표 이미지의 경우 -->
                        <div class="main-badge">
                            <span class="caption">대표이미지</span>
                        </div>
                    </div>
                </div>
            </div>
        </li>

        <!-- 상품소개 -->
        <li class="form-item">
            <div class="form-label">상품 소개</div>
            <div class="form-content">
                <TextAreaBox :max-length="1000 " />
            </div>
        </li>

        <!-- 유의사항 -->
        <li class="form-item">
            <div class="form-label">유의사항</div>
            <div class="form-content">
                <TextAreaBox :max-length="1000 " />
            </div>
        </li>

        <!-- 상세 설명 추가 -->
        <li class="form-item">
            <div class="form-label">상세 설명 추가</div>
            
            <div class="form-content detail-explanation-section">
                <button type="button" class="text-button text-button--blue add-item-btn" @click="addDetailItem">
                    <img :src="icPlus" alt="">항목 추가
                </button>

                <div class="detail-item-list">
                    <div v-for="(item, index) in detailList" :key="index" class="detail-item">
                        
                        <button class="detail-item__remove-btn" @click="removeDetailItem(index)" v-if="detailList.length > 1">
                            <img :src="icClear" alt="항목 삭제" width="16">
                        </button>

                        <div class="detail-item__fields">
                            <InputTextBox 
                                v-model="item.title"
                                placeholder="제목을 입력해 주세요" 
                                :max-length="40" 
                            />
                            <TextAreaBox 
                                v-model="item.content"
                                placeholder="내용을 입력해 주세요" 
                                :max-length="1000" 
                            />

                            <div class="detail-item__media-group">
                                <div class="photo-upload-single">
                                    <label class="photo-upload__btn">
                                        <input type="file" hidden accept="image/*">
                                        <img :src="icAddBtn" alt="추가" width="24">
                                    </label>
                                    </div>

                                <InputTextBox 
                                    v-model="item.url"
                                    class="url-input"
                                    placeholder="연결 URL 입력(선택)" 
                                />
                            </div>
                            <span class="caption">※ 한 장당 최대 20MB, 최대3장</span>
                        </div>
                    </div>
                </div>
            </div>
        </li>

        <!-- 담당의 설정 -->
        <li class="form-item">
            <div class="form-label required">담당의 설정</div>
            <div class="form-content">
                <div class="doctor-setting-container">
                <div class="segment-wrapper">
                    <label class="segment">
                    <input 
                        type="radio" 
                        name="doctorType" 
                        value="assign" 
                        v-model="doctorAssignType" 
                    />
                    <span class="label">승인 시 배정</span>
                    </label>
                    
                    <label class="segment">
                    <input 
                        type="radio" 
                        name="doctorType" 
                        value="select" 
                        v-model="doctorAssignType" 
                    />
                    <span class="label">기본 담당의 선택</span>
                    </label>
                </div>

                <div v-if="doctorAssignType === 'select'" class="doctor-select-area">
                    <CustomSingleSelect 
                    v-model="selectedDoctor" 
                    :options="doctorOptions" 
                    placeholder="담당의를 선택해 주세요"
                    />
                    </div>
                </div>
            </div>
            </li>
    </ul>

    <div class="button-wrapper">
        <button class="btn btn--size-40 btn--black">목록으로</button>
        <button class="btn btn--size-40 btn--blue">다음</button>
    </div>
</template>

<style lang="scss" scoped>
    .button-wrapper {
        padding-top: 16px;
        // padding-top: 40px;
        display: flex;
        gap: 8px;

        background-color: $gray-00;

        button {
            flex: 1;
        }
    }

    :deep(.segment-wrapper) {
        width: 400px;
    }

    // 항목 추가 영역
    .detail-explanation-section {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .add-item-btn {
            width: 100%;
            height: 32px;
            margin-bottom: 4px;

            border-radius: 5px;
            border: 1px solid $gray-200;
        }

        .detail-item-list {
            display: flex;
            flex-direction: column;
            gap: 20px; // 항목 간의 간격
        }

        .detail-item {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 8px;

            background-color: $gray-00;

            // &__remove-btn {
            //     position: absolute;
            //     top: 12px;
            //     right: 12px;
            //     padding: 4px;
            //     cursor: pointer;
            // }

            &__fields {
                display: flex;
                flex-direction: column;
                gap: 8px; // 제목, 내용, 미디어그룹 사이 간격
            }

            &__media-group {
                display: flex;
                align-items: flex-end;
                gap: 12px;

                .photo-upload-single { 
                    flex-shrink: 0;
                    width: 96px;
                    height: 96px;

                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #fff;
                }

                .url-input {
                    flex: 1; // URL 입력창이 남은 너비 차지
                }
            }
        }
    }

    // 담당의 설정 전용 컨테이너
    .doctor-setting-container {
        position: relative;
        width: fit-content;
    }

    .doctor-select-area {
        position: absolute;
        right: 4px;
        width: 194px;
    }
</style>