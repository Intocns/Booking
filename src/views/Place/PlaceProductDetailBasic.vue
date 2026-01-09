<!-- 상품등록/수정 페이지  > 기본 정보 탭 -->
<script setup>
import { ref, onMounted, computed } from 'vue';
import InputTextBox from '@/components/common/InputTextBox.vue';
import TextAreaBox from '@/components/common/TextAreaBox.vue';
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
// 아이콘
import icPlus from '@/assets/icons/ic_plus_blue.svg'
import icClear from '@/assets/icons/ic_clear.svg'
import icAddBtn from '@/assets/icons/ic_add_btn.svg'
import icDragHandel from '@/assets/icons/ic_drag_handel.svg'

import { useProductStore } from '@/stores/productStore';
import { useHospitalStore } from '@/stores/hospitalStore';
import { parseJSON } from 'date-fns';
import { useRouter } from 'vue-router';

const productStore = useProductStore();
const hospitalStore = useHospitalStore();
const router = useRouter();

const doctorAssignType = ref(""); // 담당의 설정 타입 (default: 'assign' - 승인 시 배정)
const selectedDoctor = ref(""); // 선택된 담당의 ID
const currentTab = ref('basic');

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
    viewType: {type: String, default:null}
})

// 상품 관련 입력 항목
const basicInput = ref({
    "name" : "",//상품명
    // "isImp" : "",//상품 노출 여부 >> 
    "imageUrls" : [],//상품 이미지
    "desc" : "",//상품 소개
    "bookingPrecautionJson" : [{"desc" : ""}],//유의 사항
    "extraDescJson" : [],//상세 설명 추가 >> detailList값 > 다음 버튼 클릭 시 삽입
    "doctor" : "",//담당의 설정
    "doctorId" : ""//담당의 설정
});

// 상세 설명 항목 상태관리 (예시)
const detailList = ref([]);

// 항목 추가 함수 (예시)
const addDetailItem = () => {
    detailList.value.push({
        title: '',
        context: '',
        images: null
    });
};

// 항목 삭제 함수 (임시로 넣음)
const removeDetailItem = (index) => {
    detailList.value.splice(index, 1);
};

// 다음 버튼 클릭 -> 저장 및 다음 페이지(예약 정보 페이지로 이동)
const clickNextBtn = (async() => {
    let params = basicInput.value;//기본 정보
    //params.imageUrls = '';//이미지 추가
    params.extraDescJson = detailList.value;//상세 설명 추가

    if(await checkedRequired(params) == false){
        return false;
    }

    if(doctorAssignType === 'assign'){//승인 시 배정일 경우 doctor는 현장데스크(관리자), doctorId는 없음
        params.doctorId ="";
        params.doctor = "현장데스크(관리자)";
    }

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
            alert('수정이 완료되었습니다.');
            //수정 완료 시 이동
            router.push({ name: 'placeProduct' });
        }else{
            //등록
            let reponseDecode = JSON.parse(response.data);//등록 api를 탄 경우 bizmItemId를 넘겨줌

            if(props.savedItemId == ""){//첫 등록인 경우에만 삽입
                props.savedItemId = reponseDecode.bizItemId;
            }

            currentTab.value = 'booking'//등록 완료 시 다음 탭으로 이동
        }
        
    } else{
        alert('오류가 발생했습니다. 관리자에게 문의해주세요.');
    }
})

const checkedRequired = (async(params) => {
    //상품명 체크
    if(params.name == ""){
        alert('예약 상품명을 입력해주세요.');
        return false;
    }

    //상품 사진 체크
    // if(params.images != ""){
    //     alert('사진을 추가해주세요');
    //     return false;
    // }

    return true;
})

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
            basicInput.value[key] = JSON.parse(value);
        } else {
            basicInput.value[key] = value;
        }
    });
    
    //상세 설명 추가 세팅
    detailList.value = basicInput.value.extraDescJson;

    //담당의 세팅
    doctorAssignType.value = (basicInput.value.doctorId == "") ? "assign" : "select";
    selectedDoctor.value = basicInput.value.doctorId??"";
})

//초기 세팅
onMounted(async() => {
    if(props.savedItemId != ""){
        await productStore.getItemDetailInfo(props.savedItemId);
        await hospitalStore.getDoctorList();
        setInputData();
    }
    
})
</script>

<template>
    <ul class="form-container">
        <!-- 상품명 -->
        <li class="form-item">
            <div class="form-label required">상품명</div>
            <div class="form-content">
                <InputTextBox :max-length="50" v-model="basicInput.name" />
            </div>
        </li>

        <!-- 상품 노출 여부 -->
        <!-- <li class="form-item">
            <div class="form-label">상품 노출 여부</div>
            <div class="form-content">
                <label class="toggle">
                    <input type="checkbox" />
                    <span class="toggle-img"></span>
                </label>
            </div>
        </li> -->

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
                <TextAreaBox :max-length="1000" v-model="basicInput.desc" />
            </div>
        </li>

        <!-- 유의사항 -->
        <li class="form-item">
            <div class="form-label">유의사항</div>
            <div class="form-content">
                <TextAreaBox :max-length="1000" v-model="basicInput.bookingPrecautionJson[0].desc" />
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
                                v-model="item.context"
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
        <button class="btn btn--size-40 btn--black" @click="router.push({ name: 'placeProduct'})">목록으로</button>
        <button class="btn btn--size-40 btn--blue" @click="clickNextBtn()">다음</button>
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