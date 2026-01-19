<!-- 상품등록/수정 페이지  > 기본 정보 탭 -->
<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { getFieldError } from '@/utils/common';
// 컴포넌트
import InputTextBox from '@/components/common/InputTextBox.vue';
import TextAreaBox from '@/components/common/TextAreaBox.vue';
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
// 아이콘
import icPlus from '@/assets/icons/ic_plus_blue.svg'
import icClear from '@/assets/icons/ic_clear.svg'
import icAddBtn from '@/assets/icons/ic_add_btn.svg'
import icDragHandel from '@/assets/icons/ic_drag_handel.svg'
import icDel from '@/assets/icons/ic_del.svg'
// 라이브러리
import draggable from 'vuedraggable'; 

import { useProductStore } from '@/stores/productStore';
import { useHospitalStore } from '@/stores/hospitalStore';
import { useModalStore } from '@/stores/modalStore';
import { parseJSON } from 'date-fns';
import { useRouter } from 'vue-router';
import { uploadImage } from '@/utils/fileUpload';

const productStore = useProductStore();
const hospitalStore = useHospitalStore();
const modalStore = useModalStore();
const router = useRouter();

const doctorAssignType = ref("assign"); // 담당의 설정 타입 (default: 'assign' - 승인 시 배정)
const selectedDoctor = ref(""); // 선택된 담당의 ID
// const currentTab = ref('basic');
// 저장 버튼이 한 번이라도 눌렸는지 확인하는 상태
const isSubmitted = ref(false);

// 담당의 옵션 (CustomSingleSelect용)
const doctorOptions = computed(() => {
    const options = [];
    
    // 기본 옵션 추가 (매칭 안된 경우를 대비)
    options.push({
        value: null,
        label: '담당의 선택'
    });
    
    // 담당의 리스트 옵션 추가
    if (hospitalStore.doctorList && hospitalStore.doctorList.length > 0) {
        hospitalStore.doctorList.forEach(doc => {
            options.push({
                value: doc.id,
                label: doc.userName || doc.name || ''
            });
        });
    }
    
    return options;
});

//PlaceProductDetail.vue에서 선언한component 옵션 사용
const props = defineProps({
    savedItemId: {type: String},
    isSavedSchedule: {type: Boolean},
    viewType: {type: String, default:null},
    previewName: { type: String },
    previewDesc: { type: String },
    previewDetails: { type: Array },
    previewNotice: { type: String }
})

const emit = defineEmits([
    'update:previewName', 
    'update:previewDesc', 
    'update:previewDetails', 
    'update:previewNotice',
    'update:nextTab',
    'update:previewMainImage'
]);

// 상품 관련 입력 항목
const basicInput = ref({
    "name" : "",//상품명
    "isImp" : "",//상품 노출 여부
    "imageUrls" : [],//상품 이미지
    "desc" : "",//상품 소개
    "bookingPrecautionJson" : [{"desc" : ""}],//유의 사항
    "extraDescJson" : [],//상세 설명 추가 >> detailList값 > 다음 버튼 클릭 시 삽입
    "doctor" : "",//담당의 설정
    "doctorId" : ""//담당의 설정
});

// 상세 설명 항목 상태관리 (예시)
const detailList = ref([]);

// 값이 바뀔 때마다 부모의 미리보기 데이터 업데이트
watch(() => basicInput.value.name, (newVal) => emit('update:previewName', newVal));
watch(() => basicInput.value.desc, (newVal) => emit('update:previewDesc', newVal));
watch(detailList, (newVal) => emit('update:previewDetails', newVal), { deep: true });
watch(() => basicInput.value.bookingPrecautionJson[0].desc, (newVal) => {emit('update:previewNotice', newVal);});

/**
 * 상품 사진 업로드 핸들러
 */
const handleMainImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
        for (const file of files) {
            const uploadedUrl = await uploadImage(file);
            if (uploadedUrl) {
                basicInput.value.imageUrls.push(uploadedUrl);
            }
        }
    } catch (error) {
        alert(error.message);
    } finally {
        event.target.value = '';
    }
};

/**
 * 메인 상품 사진 삭제
 */
const removeMainImage = (index) => {
    basicInput.value.imageUrls.splice(index, 1);
};

// 첫 번째 이미지를 대표 이미지로 추출하는 computed
const representImage = computed(() => {
    return basicInput.value.imageUrls?.length > 0 ? basicInput.value.imageUrls[0] : '';
});

// 대표 이미지가 바뀔 때마다 부모(미리보기)에게 알림
watch(representImage, (newImg) => {
    emit('update:previewMainImage', newImg); 
}, { deep: true });

// 담당의 선택 시 basicInput 업데이트
watch(selectedDoctor, (newId) => {
    // 1. ID 저장
    basicInput.value.doctorId = newId;

    // 2. 이름 저장
    if (!newId) {
        basicInput.value.doctor = ""; // 선택 해제 시
    } else {
        // doctorOptions에서 현재 선택된 ID와 일치하는 label(이름) 찾기
        const selectedOpt = doctorOptions.value.find(opt => opt.value === newId);
        basicInput.value.doctor = selectedOpt ? selectedOpt.label : "";
    }
});

// 만약 라디오 버튼이 '승인 시 배정'으로 돌아가면 값 초기화
watch(doctorAssignType, (newType) => {
    if (newType === 'assign') {
        selectedDoctor.value = "";
        basicInput.value.doctorId = "";
        basicInput.value.doctor = "현장데스크(관리자)";
    }
});

// 항목 추가 함수 (예시)
const addDetailItem = () => {
    detailList.value.push({
        title: '',
        context: '',
        images: [],
    });
};

// 항목 삭제 함수 (임시로 넣음)
const removeDetailItem = (index) => {
    detailList.value.splice(index, 1);
};

/**
 * 상세 설명 항목의 이미지 업로드 핸들러
 */
const handleDetailImageUpload = async (event, itemIndex) => {
    const file = event.target.files[0];
    if (!file) return;

    // 최대 3장
    if (detailList.value[itemIndex].images && detailList.value[itemIndex].images.length >= 3) {
        alert('이미지는 최대 3장까지 추가할 수 있습니다.');
        event.target.value = '';
        return;
    }

    try {
        const uploadedUrl = await uploadImage(file);

        if (uploadedUrl) {
            // 3. 해당 항목의 images 배열이 없으면 초기화 후 push
            if (!detailList.value[itemIndex].images) {
                detailList.value[itemIndex].images = [];
            }
            
            detailList.value[itemIndex].images.push({
                src: uploadedUrl, // 서버에서 받은 주소
                url: '' // 사용자가 입력할 연결 URL(선택사항)
            });
        }
    } catch (error) {
        alert(error.message);
    } finally {
        event.target.value = ''; // 같은 파일 재업로드 가능하게 초기화
    }
};

/**
 * 상세 설명 이미지 삭제
 */
const removeDetailImage = (itemIndex, imgIndex) => {
    detailList.value[itemIndex].images.splice(imgIndex, 1);
};

// 다음 버튼 클릭 -> 저장 및 다음 페이지(예약 정보 페이지로 이동)
const clickNextBtn = (async() => {
    let params = basicInput.value;//기본 정보
    //params.imageUrls = '';//이미지 추가
    params.extraDescJson = detailList.value;//상세 설명 추가

    if(await checkedRequired(params) == false){
        return false;
    }

    // if(doctorAssignType === 'assign'){//승인 시 배정일 경우 doctor는 현장데스크(관리자), doctorId는 없음
    //     params.doctorId ="";
    //     params.doctor = "현장데스크(관리자)";
    // }

    let response = '';

    //저장, 수정 체크
    if(props.savedItemId != ""){
        //수정
        response = await productStore.modifyItem(props.savedItemId, params);
    }else{
        //등록
        response = await productStore.addItem(params);
    }

    if(response != '' && response.status_code <= 300){
        //다음 페이지로 이동
        if(props.viewType == 'update'){
            //수정
            modalStore.confirmModal.openModal({
                text: '수정이 완료되었습니다.',
                noCancelBtn: true,
                onConfirm: () => {
                    //수정 완료 시 이동
                    router.push({ name: 'placeProduct' });
                }
            })
        }else{
            //등록
            let reponseDecode = JSON.parse(response.data);//등록 api를 탄 경우 bizmItemId를 넘겨줌

            if(props.savedItemId == ""){//첫 등록인 경우에만 삽입
                props.savedItemId = reponseDecode.bizItemId;
            }

            emit('update:nextTab', 'booking', reponseDecode.bizItemId, isSavedSchedule); //등록 완료 시 다음 탭으로 이동
        }
        
    } else{
        alert('오류가 발생했습니다. 관리자에게 문의해주세요.');
    }
})

// 목록으로 이동 버튼
const goToList = () => {
    if(props.savedItemId == "") {
        modalStore.confirmModal.openModal({
            title: '목록으로 이동',
            text: '목록으로 이동하시겠습니까?\n목록으로 이동 시 입력한 정보는 모두 사라집니다.',
            confirmBtnText: '목록으로',
            onConfirm: () => {
                router.push({ name: 'placeProduct'});
            }
        })
    } else {
        router.push({ name: 'placeProduct'});
    }
    
}

const checkedRequired = (async(params) => {
    isSubmitted.value = true;
    
    // 상품명 체크
    if(!params.name || params.name.trim() === ""){
        openErrorModal('예약 상품명을 입력해주세요.');
        return false;
    }

    const nameError = getFieldError(params.name, 0, 50);
    if (nameError.isError) {
        openErrorModal(`입력하신 상품명을 확인해주세요.`);
        return false;
    }

    const descError = getFieldError(params.desc, 0, 1000);
    if(descError.isError) {
        openErrorModal('입력하신 상품 소개를 확인해주세요.');
        return false;
    }

    const precautionError = getFieldError(params.bookingPrecautionJson[0].desc, 0, 1000);
    if(precautionError.isError) {
        openErrorModal('입력하신 유의사항을 확인해주세요.');
        return false;
    }

    //상품 사진 체크
    if(!params.imageUrls || params.imageUrls.length === 0){
        openErrorModal(`상품 사진을 최소 1장 이상 추가해주세요.`);
        return false;
    }

    // 상세 설명
    if (detailList.value && detailList.value.length > 0) {
        for (let i = 0; i < detailList.value.length; i++) {
            const item = detailList.value[i];
            
            // 상세 설명 내 제목/내용 길이 체크
            if (getFieldError(item.title, 0, 40).isError) {
                openErrorModal(`상세 설명 ${i + 1}번째 제목 형식을 확인해주세요.`);
                return false;
            }
            if (getFieldError(item.context, 0, 1000).isError) {
                openErrorModal(`상세 설명 ${i + 1}번째 내용 형식을 확인해주세요.`);
                return false;
            }
        }
    }

    if (doctorAssignType.value === 'select' && !selectedDoctor.value) {
        openErrorModal('담당의를 선택해주세요.');
        return false;
    }

    return true;
})

// 모달 오픈 공통 함수
const openErrorModal = (text) => {
    modalStore.confirmModal.openModal({
        text: text,
        noCancelBtn: true,
        onConfirm: () => { modalStore.confirmModal.closeModal(); }
    });
};

//화면에 데이터 전달 JSON 파싱할 항목 리스트
const JSON_FIELDS = [
  "bookingPrecautionJson",
  "extraDescJson",
  "imageUrls"
];

//상품 정보가 있는 경우 화면에 데이터 전달
const setInputData = (async() => {
    Object.keys(basicInput.value).forEach((key) => {
        const value = productStore.itemDetailInfo[key];
        if (value === undefined) return;

        if (JSON_FIELDS.includes(key)) {
            let decodeValue = JSON.parse(value);

            switch (key) {
                case 'bookingPrecautionJson':
                    if (decodeValue?.[0]?.desc !== undefined) {
                        basicInput.value[key] = decodeValue
                    }
                    break
                default :
                    basicInput.value[key] = decodeValue
            }
        } else {
            basicInput.value[key] = value;
        }
    });

    //상세 설명 추가 세팅
    detailList.value = basicInput.value.extraDescJson;

    // 로드된 첫 번째 이미지를 부모에게 즉시 전달
    if (basicInput.value.imageUrls?.length > 0) {
        emit('update:previewMainImage', basicInput.value.imageUrls[0]);
    }

    //담당의 세팅
    doctorAssignType.value = (basicInput.value.doctorId == "") ? "assign" : "select";
    selectedDoctor.value = basicInput.value.doctorId??"";
})

//초기 세팅
onMounted(async() => {
    await hospitalStore.getDoctorList();

    if(props.savedItemId != ""){
        await productStore.getItemDetailInfo(props.savedItemId);
        setInputData();
    }
    
})
</script>

<template>
    <ul class="form-container" style="margin-bottom: 40px;">
        <!-- 상품명 -->
        <li class="form-item">
            <div class="form-label required">상품명</div>
            <div class="form-content">
                <InputTextBox 
                    :max-length="50"
                    v-model="basicInput.name"
                    :is-error="isSubmitted && !basicInput.name ? true : getFieldError(basicInput.name, 0, 50).isError"
                    :error-message="isSubmitted && !basicInput.name ? '필수 입력 항목입니다.' : getFieldError(basicInput.name, 0, 50).message"
                />
            </div>
        </li>

        <!-- 상품 노출 여부 -->
        <li v-if="savedItemId" class="form-item">
            <div class="form-label">상품 노출 여부</div>
            <div class="form-content">
                <label class="toggle">
                    <input type="checkbox" v-model="basicInput.isImp" />
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
                            @change="handleMainImageUpload"
                        >
                        <img :src="icAddBtn" alt="추가" class="icon-plus" width="32">
                    </label>

                    <draggable
                        v-model="basicInput.imageUrls"
                        item-key="index"
                        class="draggable-container"
                        handle=".drag-handle"
                        ghost-class="ghost"
                        drag-class="drag-item-moving" 
                        :force-fallback="true"
                        :scroll="true"
                        :scroll-sensitivity="100"
                        :animation="200"
                    >
                        <template #item="{element, index}">
                            <div
                                class="photo-upload__item"
                            >
                                <img :src="element" alt="상품 이미지" class="preview-img">
                                <!-- 드래그핸들 -->
                                <div class="drag-handle"><img :src="icDragHandel" alt="드래그아이콘"></div>
                                <!-- 삭제 버튼 -->
                                <button class="delete-btn" @click="removeMainImage(index)">
                                    <img :src="icClear" alt="삭제" width="20">
                                </button>
                                <!-- 대표 이미지의 경우 -->
                                <div v-if="index === 0" class="main-badge">
                                    <span class="caption">대표이미지</span>
                                </div>
                            </div>
                        </template>
                    </draggable>
                </div>
            </div>
        </li>

        <!-- 상품소개 -->
        <li class="form-item">
            <div class="form-label">상품 소개</div>
            <div class="form-content">
                <TextAreaBox 
                    :max-length="1000" 
                    v-model="basicInput.desc"
                    :is-error="getFieldError(basicInput.desc, 0, 1000).isError"
                    :error-message="getFieldError(basicInput.desc, 0, 1000).message"
                />
            </div>
        </li>

        <!-- 유의사항 -->
        <li class="form-item">
            <div class="form-label">유의사항</div>
            <div class="form-content">
                <TextAreaBox 
                    :max-length="1000" 
                    v-model="basicInput.bookingPrecautionJson[0].desc"
                    :is-error="getFieldError(basicInput.bookingPrecautionJson[0].desc, 0, 1000).isError"
                    :error-message="getFieldError(basicInput.bookingPrecautionJson[0].desc, 0, 1000).message"
                />
            </div>
        </li>

        <!-- 상세 설명 추가 -->
        <li class="form-item">
            <div class="form-label">상세 설명 추가</div>
            
            <div class="form-content detail-explanation-section">
                <div class="detail-item-list">
                    <div v-for="(item, index) in detailList" :key="index" class="detail-item">
                        
                        <div class="detail-item__remove-btn">
                            <button 
                                class="btn btn--size-24 btn--black-outline" 
                                @click="removeDetailItem(index)" 
                            >
                                <img :src="icDel" alt="항목 삭제" width="16">항목 삭제
                            </button>
                        </div>

                        <div class="detail-item__fields">
                            <InputTextBox 
                                v-model="item.title"
                                placeholder="제목을 입력해 주세요" 
                                :max-length="40" 
                                :is-error="getFieldError(item.title, 0, 40).isError"
                                :error-message="getFieldError(item.title, 0, 40).message"
                            />
                            <TextAreaBox 
                                v-model="item.context"
                                placeholder="내용을 입력해 주세요" 
                                :max-length="1000" 
                                :is-error="getFieldError(item.context, 0, 1000).isError"
                                :error-message="getFieldError(item.context, 0, 1000).message"
                            />

                            <div v-for="(image, imgIndex) in item.images" :key="imgIndex" class="detail-item__media-group">
                                <div class="photo-upload-single">
                                    <img :src="image.src" alt="상세 이미지">
                                    <button class="img-del-btn" @click="removeDetailImage(index, imgIndex)">
                                        <img :src="icClear" alt="삭제" width="20">
                                    </button>
                                </div>

                                <InputTextBox 
                                    v-model="image.url"
                                    class="url-input"
                                    placeholder="연결 URL 입력(선택)" 
                                />
                            </div>

                            <div v-if="!item.images || item.images.length < 3" class="detail-item__media-group">
                                <div>
                                    <label class="photo-upload__btn">
                                        <input 
                                            type="file" 
                                            hidden 
                                            accept="image/*"
                                            @change="handleDetailImageUpload($event, index)"
                                        >
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

                <button type="button" class="text-button text-button--blue add-item-btn" @click="addDetailItem">
                    <img :src="icPlus" alt="">항목 추가
                </button>
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
        <button class="btn btn--size-40 btn--black" @click="goToList()">목록으로</button>
        <button class="btn btn--size-40 btn--blue" @click="clickNextBtn()">{{ savedItemId == "" ? "다음" : "저장"}}</button>
    </div>
</template>

<style lang="scss" scoped>
    .draggable-container {
        display: flex;
        flex-wrap: wrap;
        gap: 12px; // 아이템 간 간격
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
            margin-top: 5px;
        }

        .detail-item {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 8px;

            background-color: $gray-00;

            &__remove-btn {
                cursor: pointer;
                width: 100%;
                display: flex;
                justify-content: flex-end;
            }

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
                    overflow: hidden;
                    position: relative;

                    border-radius: 4px;
                    border: 1px solid $gray-200;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #fff;

                    img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }

                    .img-del-btn {
                        position: absolute;
                        top: 2px;
                        right: 2px;

                        img {width:20px;}
                    }
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