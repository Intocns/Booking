<!-- 인투펫 관리 > 진료실 관리 -->
<script setup>
// 컴포넌트
import PageTitle from '@/components/common/PageTitle.vue';
import InputTextBox from '@/components/common/InputTextBox.vue';
import TextAreaBox from '@/components/common/TextAreaBox.vue';
import CustomSingleSelect from '@/components/common/CustomSingleSelect.vue';
import HolidayForm from '../Place/HolidayForm.vue';
import TimeSelect from '@/components/common/TimeSelect.vue';
import ClinicOperationTimeForm from './ClinicOperationTimeForm.vue';
import Modal from '@/components/common/Modal.vue';
import CustomSelect from '@/components/common/CustomSelect.vue';
import ModalDatePicker from '@/components/common/ModalDatePicker.vue';
// 아이콘
import icSet from '@/assets/icons/ic_setting.svg'
import icAddBtn from '@/assets/icons/ic_add_btn.svg'
import icDel from '@/assets/icons/ic_del.svg'
import icCopy from '@/assets/icons/ic_copy.svg'
import icClear from '@/assets/icons/ic_clear.svg'
import icDragHandel from '@/assets/icons/ic_drag_handel.svg'
import icInfo from '@/assets/icons/ic_infomation_b.svg'
import icPlus from '@/assets/icons/ic_plus_black.svg'

import draggable from 'vuedraggable';

import { onMounted, ref, computed, watch, nextTick} from 'vue';
import { formatDate } from '@/utils/dateFormatter';
import { uploadImage } from '@/utils/fileUpload';
import { storeToRefs } from 'pinia';
import { useModalStore } from '@/stores/modalStore';
import { useIntoPetStore } from '@/stores/intoPetStore';
import { useHospitalStore } from '@/stores/hospitalStore';
import { showAlert } from '@/utils/ui';
import { api } from '@/api/axios';

const modalStore = useModalStore();
const intoPetStore = useIntoPetStore();
const hospitalStore = useHospitalStore();

const { intoPetRoomList } = storeToRefs(intoPetStore);

const DAYS_OPTIONS = [
    { label: '월', value: 1 },
    { label: '화', value: 2 },
    { label: '수', value: 3 },
    { label: '목', value: 4 },
    { label: '금', value: 5 },
    { label: '토', value: 6 },
    { label: '일', value: 7 },
];

// 1일부터 31일까지 배열 생성
const DAY_OF_MONTH_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
    label: `${i + 1}일`,
    value: i + 1
}));

const dayToNumMap = { monday: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7, holiday: 8 };
const numToDayMap = { 1: 'monday', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat', 7: 'sun', 8: 'holiday' };

// 휴무일 설정 > 매월 선택된 값 computed (v-model)
const selectedMon = computed({
    get: () => selectedRoom.value?.impos?.mon || [],
    set: (val) => {
        if (selectedRoom.value?.impos) {
            selectedRoom.value.impos.mon = val;
        }
    }
});

/**
 * 상태관리
 */
const selectedRoom = ref({}); // 선택한 진료실
const holidayFormRef = ref(null)//저장 시 api에 맞춰 request형식으로 format하는 함수를 호출

// 담당의 옵션 (CustomSingleSelect용)
const doctorOptions = computed(() => {
    const options = [];
    
    // 기본 옵션 추가
    options.push({
        value: 0,
        label: '현장데스크(관리자)'
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

// 담당의 셀렉트 박스 변경 시 호출될 핸들러
const handleDoctorChange = (val) => {
    // 1. ID 업데이트 (v-model이 처리하지만 명시적으로 확인)
    selectedRoom.value.doctor_id = val;

    // 2. doctorOptions에서 선택된 label(이름) 찾기
    const selectedOption = doctorOptions.value.find(opt => opt.value === val);
    
    if (selectedOption) {
        // selectedRoom 객체의 doctor 필드에 이름 저장 (API 명세에 맞는 필드명 확인 필요)
        selectedRoom.value.doctor = selectedOption.label;
    }
};

// 휴무일 데이터 존재 여부만 체크하는 computed
const hasHolidayData = computed(() => {
    if (!selectedRoom.value?.impos) return false;
    return Object.values(selectedRoom.value.impos).some(arr => arr && arr.length > 0);
});

// 진료실 목록 버튼 클릭 이벤트
const handleRoomChange = (nextRoom) => {
    // 현재 수정 중인 복사본과 원본 리스트의 데이터를 비교 (단순 비교용)
    const original = intoPetRoomList.value.find(r => r.idx === selectedRoom.value.idx);
    const isDirty = JSON.stringify(original) !== JSON.stringify(selectedRoom.value);

    
    // if (isDirty) {
    //     // console.log(original)
    //     // console.log(selectedRoom.value)
    //     modalStore.confirmModal.openModal({
    //         text: '수정된 내용이 있습니다. 저장하지 않고 이동하시겠습니까?',
    //         confirmBtnText: '이동',
    //         onConfirm: () => selectRoom(nextRoom) // 저장 안 하고 그냥 이동
    //     });
    // } else {
    //     selectRoom(nextRoom);
    // }
    selectRoom(nextRoom);
};

// 진료실 바뀌거나 데이터가 생겼을 때 데이터를 자식에게 전달
watch([selectedRoom, hasHolidayData], async ([newRoom, hasData]) => {
    if (hasData) {
        // v-if로 인해 dom이 그려질 시간을 잠깐 기다림(nextTick)
        await nextTick();
        if (holidayFormRef.value) {
            holidayFormRef.value.initFormData(newRoom.impos);
        }
    }
}, { immediate: true, deep: true });

// 휴무일 설정 > 매주 > 요일 버튼 클릭 핸들러
const toggleDay = (val) => {
    const index = selectedRoom.value?.impos?.week?.indexOf(val);
    let isNowHoliday = false;

    if (index > -1) {
        selectedRoom.value.impos.week.splice(index, 1); // 있으면 제거
        isNowHoliday = false; // 휴무 취소 -> 운영함
    } else {
        selectedRoom.value.impos.week.push(val); // 없으면 추가
        isNowHoliday = true; // 휴무 설정 -> 운영 안 함
    }

    // 해당 요일의 운영 설정(pos) 직접 변경
    const dayKey = numToDayMap[val];
    const dayData = selectedRoom.value.pos?.[dayKey];

    if (dayData && Array.isArray(dayData)) {
        dayData.forEach(slot => {
            // 휴무면 1(disabled), 아니면 0
            slot.is_disabled = isNowHoliday ? 1 : 0;
            // console.log(dayKey, isNowHoliday)
        });
    }
};

// 휴무일 설정 > 특정일 휴무 삭제
const removeCustomHoliday = (index) => {
    if (selectedRoom.value?.impos?.sp_day) {
        selectedRoom.value.impos.sp_day.splice(index, 1);
    }
};

/**
 * 진료실 노출 설정 모달 관련
 */
const tempRoomList = ref([]); // 진료실 데이터 임시 복사본
// 진료실 설정 모달 오픈
const openIntoPetSettingModal = () => {
    tempRoomList.value = JSON.parse(JSON.stringify(intoPetRoomList.value));
    modalStore.intoPetRoomSettingModal.openModal();
}
// 진료실 노출 설정 저장
const handleSaveRoomSetting = async() => {
    // 현재 선택된 방의 mapping_idx 저장 (순서 변경 후에도 유지하기 위함)
    const currentSelectedIdx = selectedRoom.value?.mapping_idx;

    // index를 활용해 idx 값을 갱신
    tempRoomList.value.forEach((room, index) => {
        room.idx = index
    });

    try {
        const params = {
            idx: intoPetStore.intoPetRoomIdx,
            hosIdx: intoPetStore.intoPetRoomHosIdx,
            clinicInfo: tempRoomList.value,
        }
        // console.log(params);
        // return false;

        await intoPetStore.setIntoPetInfo(params);

        // 데이터 다시 불러오기 
        await intoPetStore.getIntoPetInfo(); 

        // 순서 변경 후에도 이전에 보고 있던 방을 다시 선택해줌
        if (currentSelectedIdx) {
            const found = intoPetStore.intoPetRoomList.find(r => r.mapping_idx === currentSelectedIdx);
            if (found) {
                selectedRoom.value = found; // 참조값 업데이트
            }
        }

        showAlert('진료실 설정이 저장되었습니다.');
        modalStore.intoPetRoomSettingModal.closeModal();

    } catch (error) {
        console.error(error);
    }
};
// 모달 내 토글 핸들러 (임시 데이터의 값만 변경)
const toggleRoomUseFlag = (index, event) => {
    tempRoomList.value[index].use_flag = event.target.checked ? 1 : 0;
};

/**
 * 진료실 삭제/복제 핸들러
 */

// 진료실 삭제 핸들러
const handleDeleteRoom = () => {
    if (!selectedRoom.value) return;

    // 사용자 확인 
    modalStore.confirmModal.openModal({
        text: `${selectedRoom.value.name || '이름 없음'}\n진료실을 삭제하시겠습니까?`,
        confirmBtnText: '삭제',
        onConfirm: () => delIntoPetRoom(),
        
    })
};

// 진료실 삭제 함수
const delIntoPetRoom = async() => {
    // 현재 선택된 방의 index 찾기
    const index = intoPetRoomList.value.findIndex(room => room.idx === selectedRoom.value.idx);

    if (index > -1) {
        intoPetRoomList.value.splice(index, 1);

        // 삭제 후 남은 방들의 idx 재번호
        intoPetRoomList.value.forEach((room, idx) => {
            room.idx = idx;
        });

        try {
            const params = {
                idx: intoPetStore.intoPetRoomIdx,
                hosIdx: intoPetStore.intoPetRoomHosIdx,
                clinicInfo: intoPetRoomList.value,
            }

            // console.log(params);
            // return false;

            await intoPetStore.setIntoPetInfo(params);
            // 데이터 다시 불러오기 
            await intoPetStore.getIntoPetInfo(); 

            // 삭제 후 처리: 남은 방이 있다면 첫 번째 방을 선택, 없으면 빈 객체
            if (intoPetRoomList.value.length > 0) {
                selectedRoom.value = intoPetRoomList.value[0];
            } else {
                selectedRoom.value = {};
            }
            
            showAlert('진료실이 삭제되었습니다.');

            if(index == newRoomIdx.value) {
                hasNewRoom.value = false;
                newRoomIdx.value = null;
            }  

        } catch (error) {
            console.error(error)
        }
    }
}

// 진료실 복제 핸들러
// const handleCopyRoom = () => {
//     if (!selectedRoom.value) return;

//     // 사용자 확인 
//     modalStore.confirmModal.openModal({
//         text: `${selectedRoom.value.name || '이름 없음'}\n진료실을 복제하시겠습니까?`,
//         confirmBtnText: '복제',
//         onConfirm: () => copyIntoPetRoom(),
        
//     })

// };

const hasNewRoom = ref(false); // 새 진료실 존재여부
const newRoomIdx = ref(null);
// 진료실 복제 함수
const copyIntoPetRoom = () => {
    if(hasNewRoom.value) {
        showAlert('이미 진료실 추가가 진행중입니다.');
        selectedRoom.value = intoPetRoomList.value[newRoomIdx.value];
        return;
    }
    // 현재 선택된 방 데이터를 깊은 복사 (참조 끊기)
    const newRoom = JSON.parse(JSON.stringify(selectedRoom.value));
    
    // 복제된 방의 고유 값 및 이름 수정
    newRoom.idx = Math.max(...intoPetRoomList.value.map(r => r.idx), 0) + 1; // 가장 큰 idx + 1
    newRoom.name = `${newRoom.name} 의 복제`;
    
    // 리스트에 추가
    intoPetRoomList.value.push(newRoom);
    selectedRoom.value = intoPetRoomList.value[intoPetRoomList.value.length - 1];
    
    hasNewRoom.value = true;
    newRoomIdx.value = selectedRoom.value.idx;
    // try {
    //     const params = {
    //         idx: intoPetStore.intoPetRoomIdx,
    //         hosIdx: intoPetStore.intoPetRoomHosIdx,
    //         clinicInfo: intoPetRoomList.value,
    //     }
    
    //     // console.log(params);
    //     // return false;
    
    //     await intoPetStore.setIntoPetInfo(params);
    //     // 데이터 다시 불러오기 
    //     await intoPetStore.getIntoPetInfo(); 
        
    //     showAlert('진료실이 복제되었습니다.');
    
    //     // 추가된 복사본으로 바로 선택 변경
    //     selectedRoom.value = intoPetRoomList.value[intoPetRoomList.value.length - 1];
    // } catch (error) {
    //     console.error(error);
    // }
}

// 진료실 추가 버튼 핸들러
const handleAddRoomBtn = () => {
    if(hasNewRoom.value) {
        showAlert('이미 진료실 추가가 진행중입니다.');
        selectedRoom.value = intoPetRoomList.value[newRoomIdx.value];
        return;
    }
    // 기본 타임슬롯 정의 
    const defaultTimeSlot = {
        st_hour: "10시",
        st_min: "00분",
        end_hour: "20시",
        end_min: "00분",
        is_disabled: 0,
        deadline_hour: "19시",
        deadline_min: "00분"
    };

    // 모든 요일에 기본값 채우기
    const defaultPos = {};
    const days = ['monday', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'holiday'];

    days.forEach(day => {
        // 객체 참조가 겹치지 않게 매번 깊은 복사(또는 새 객체 생성)해서 할당
        defaultPos[day] = [{ ...defaultTimeSlot }];
    });

    // TODO: 진료실 추가시 default 값 확인필요
    const newRoom = {
        del_images: [],
        doctor: '현장데스크(관리자)',
        doctor_id: 0,
        idx: intoPetRoomList.value.length,
        images: [],
        impos: { week: [], mon: [], sp_day: [] }, // 구조 미리 생성
        mapping_idx: 0, // TODO: 새로 추가하는 진료실의 mpapping_idx?
        memo: '',
        name: ('진료실' + (intoPetRoomList.value.length + 1)),
        pos: defaultPos,
        use_flag: 0,
        set_reserve: 1,
        use_weekday_time: 0,
    };

    intoPetRoomList.value.push(newRoom);

    selectedRoom.value = intoPetRoomList.value[intoPetRoomList.value.length - 1];

    hasNewRoom.value = true;
    newRoomIdx.value = selectedRoom.value.idx;
}

const fileInput = ref(null);

// const checkUploadLimit = () => {
//     const currentImages = selectedRoom.value.images;
//     if (currentImages && currentImages.length >= 30) {
//         showAlert('이미지는 최대 30장까지 추가할 수 있습니다.');
//         return;
//     }
//     // 개수가 여유 있다면 수동으로 input 클릭
//     fileInput.value.click();
// };

// file input change핸들러 (이미지 업로드)
const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
        for (const file of files) {
                const formData = new FormData();
                formData.append('image', file);
                
                const response = await api.post('/api/add/img', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                });

            const { imageUrl } = JSON.parse(response.data.data);

            if (imageUrl) {
                selectedRoom.value.images.push(imageUrl);
            }
        }
    } catch (error) {
        console.error(error);
    } finally {
        event.target.value = '';
    }
};

// 사진 삭제
const removeImage = (imgIndex) => {
    selectedRoom.value.images.splice(imgIndex, 1);
};

/**
 * 휴무일 설정 > 특정일 항목 추가 관련
 */
// 모달 제어 상태 추가
const isDatePickerOpen = ref(false);

// 특정일 항목 추가 버튼 클릭 시 모달 오픈
const openDatePicker = () => {
    isDatePickerOpen.value = true;
};

// 모달에서 '적용' 눌렀을 때 실행될 함수
const addCustomHoliday = (payload) => {
    // 날짜
    const formattedDate = formatDate(payload.date);
    // 반복 여부 변환 (YEARLY면 1, 아니면 0)
    const isRepeat = payload?.type === 'YEARLY' ? 1 : 0;

    // 
    const newHoliday = {
        date: formattedDate,
        is_repeat: isRepeat
    };
    
    if (!selectedRoom.value.impos.sp_day) {
        selectedRoom.value.impos.sp_day = [];
    }
    
    // 중복 체크 (동일한 날짜가 이미 있는지 확인)
    const isExist = selectedRoom.value.impos.sp_day.some(item => item.date === newHoliday.date);
    
    if (isExist) {
        showAlert('이미 추가된 날짜입니다.');
        return;
    }

    selectedRoom.value.impos.sp_day.push(newHoliday);
    isDatePickerOpen.value = false;
};
/**
 * // 휴무일 설정 > 특정일 항목 추가 관련
 */

// 진료시 저장 핸들러
const saveIntoPetRoomInfo = async() => {
    // 진료실 명 입력 체크
    if (!selectedRoom.value.name?.trim()) {
        showAlert('진료실 명을 입력해주세요.');
        return;
    }

    // 사용자설정 값 체크
    if(selectedRoom.value.doctor_id === '') {
        showAlert('사용자 설정을 확인해주세요.');
        return;
    }
    // TODO: 추후 필수값..추가되면 체크

    // 운영시간 체크
    const pos = selectedRoom.value.pos;
    const dayKeys = ['monday', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'holiday'];

    for (const day of dayKeys) {
        const slots = pos[day];

        for(let i = 0; i < slots.length; i++) {
            const current = slots[i];

            const stTime = parseInt(current.st_hour) * 100 + parseInt(current.st_min);
            const endTime = parseInt(current.end_hour) * 100 + parseInt(current.end_min);

            //  1. 시작 시간 - 마감 시간
            //  2. 시작 시간 - 마감 시간
            //  *시작시간 < 마감 시간 체크
            //  1.마감시간보다 < 2.시작시간 체크

            // [체크 1] 시작 시간 < 종료 시간 확인
            if (stTime >= endTime) {
                showAlert(`시작 시간은 종료 시간보다 빨라야 합니다.`);
                return;
            }

            // [체크 2] 이전 타임슬롯과의 중첩 확인 (두 번째 슬롯부터)
            if (i > 0) {
                const prev = slots[i - 1];
                const prevEndTime = parseInt(prev.end_hour) * 100 + parseInt(prev.end_min);

                if (stTime < prevEndTime) {
                    showAlert(`시작 시간은 이전 종료 시간보다 커야 합니다.`);
                    return;
                }
            }
        }
    }

    // 2. 현재 수정 중인 '복사본'을 '원본 리스트'에 업데이트
    // idx 
    const targetIdx = intoPetRoomList.value.findIndex(r => r.idx === selectedRoom.value.idx);
    
    if (targetIdx > -1) {
        // 원본 리스트의 해당 위치에 내가 수정한 내용을 덮어씌움
        intoPetRoomList.value[targetIdx] = JSON.parse(JSON.stringify(selectedRoom.value));
    }

    if(hasNewRoom.value) {
        intoPetRoomList.value.splice(newRoomIdx.value, 1);
    }

    try {
        const params = {
            idx: intoPetStore.intoPetRoomIdx,
            hosIdx: intoPetStore.intoPetRoomHosIdx,
            clinicInfo: intoPetRoomList.value,
        }

        // console.log(params);
        // console.log(selectedRoom.value)
        // return false;

        await intoPetStore.setIntoPetInfo(params);
        showAlert('저장되었습니다.');
        await intoPetStore.getIntoPetInfo();

        // 다시 현재 보고 있던 방을 최신 데이터로 업데이트 (참조 유지를 위해)
        const updatedRoom = intoPetRoomList.value.find(r => r.idx === selectedRoom.value.idx);
        if (updatedRoom) {
            selectRoom(updatedRoom); 
        }
        hasNewRoom.value = false;
        newRoomIdx.value = null;
    } catch(error) {
        console.log(error);
    }
}

//  ** store원본데이터 아닌 복사본 사용하도록
const selectRoom = (room) => {
    // 원본 데이터(store)와의 연결을 끊고 독립적인 복사본을 만듦
    selectedRoom.value = JSON.parse(JSON.stringify(room));
};

onMounted(async() => {
    await hospitalStore.getDoctorList(); // 담당의 리스트 불러오기
    await intoPetStore.getIntoPetInfo(); // 인투펫 진료실 리스트정보 불러오기

    // 화면에 처음으로 보여줄 진료실 정보(미노출 진료실 제외하고 첫번쨰 요소 선택)
    const firstActiveRoom = intoPetRoomList.value.find(room => room.use_flag === 1) 
                         || intoPetRoomList.value[0];

    if (firstActiveRoom) {
        selectRoom(firstActiveRoom); // 참조가 아닌 복사본 할당
    }
})
</script>

<template>
    <PageTitle title="진료실 관리" helperText="인투펫 앱 예약 시, 등록한 진료실 목록이 선택항목으로 노출됩니다." />

    <div class="top-bar">
        <button class="btn btn--size-32 btn--black-outline" @click="openIntoPetSettingModal">
            <img :src="icSet" alt="아이콘">
            진료실 설정
        </button>
    </div>

    <div class="contents-wrapper">
        <!-- 인투펫 진료실 목록 -->
        <div class="room-buttons">
            <div 
                v-for="(room, index) in intoPetRoomList" 
                :key="room.idx" 
                class="room-button"
                :class="{ 
                    'disabled' : room.use_flag !== 1,
                    'active' : selectedRoom.idx === room.idx // 선택된 방 표시
                }"
                @click="handleRoomChange(room)"
            >
                <div class="room-index">
                    <span class="title-m">{{ (index + 1) }}</span>
                </div>
                <span class="room-name title-m ">{{ room.doctor }} 수의사 : {{ room.name }}</span>
            </div>
            <div class="room-button add-room-button" @click="handleAddRoomBtn">
                <img :src="icAddBtn" alt="아이콘">
                <span class="title-m">진료실 추가</span>
            </div>
        </div>

        <!-- 진료실 정보  -->
        <ul class="form-container">

            <li class="form-item form-header">
                <div class="d-flex align-center gap-8">
                    <div class="room-index"><span class="title-m">{{ (selectedRoom.idx + 1) }}</span></div>
                    <span class="title-m room-title">진료실</span>
                </div>

                <div class="d-flex gap-8">
                    <button class="btn btn--size-24 btn--black-outline" @click="handleDeleteRoom">
                        <img :src="icDel" alt="아이콘" width="14">진료실 삭제</button>
                    <button class="btn btn--size-24 btn--black-outline" @click="copyIntoPetRoom">
                        <img :src="icCopy" alt="아이콘">진료실 복제</button>
                </div>
            </li>

            <!-- 진료실 명/진료실 사용 -->
            <li class="form-item">
                <div class="form-label required">진료실 명</div>
                <div class="form-content">
                    <InputTextBox v-model="selectedRoom.name" />
                </div>

                <div class="form-label required">진료실 사용</div>
                <div class="form-content">
                    <label class="toggle">
                        <input type="checkbox" :checked="selectedRoom.use_flag === 1" @change="selectedRoom.use_flag = $event.target.checked ? 1 : 0" />
                        <img class="toggle-img" />
                    </label>
                </div>
            </li>

            <!-- 진료실 메모 -->
            <li class="form-item">
                <div class="form-label">진료실 메모</div>
                <div class="form-content">
                    <TextAreaBox v-model="selectedRoom.memo" />
                </div>
            </li>
            
            <!-- 사용자 설정 -->
            <li class="form-item">
                <div class="form-label required">사용자 설정</div>
                <div class="form-content ">
                    <div class="d-flex align-center gap-8">
                        <CustomSingleSelect 
                            v-model="selectedRoom.doctor_id"
                            :options="doctorOptions" 
                            @update:model-value="handleDoctorChange"
                            select-width="200px" 
                        />

                        <div class="d-flex align-center gap-4">
                            <span class="body-s">진료실과 연결할 사용자를 선택해주세요.</span>
                            <div class="helper">
                                <img :src="icInfo" alt="아이콘">
        
                                <div class="tooltip-content">
                                    <ul>
                                        <li>현장 데스크(관리자)로 설정할 경우, 현장 데스크에서 담당 수의사를 지정합니다. 검진명이나 진료과목명으로 진료실을 등록한 경우, 현장 데스크(관리자) 항목을 선택하시면 관리가 용이합니다.단, 해당 진료실은 모든 예약이 관리자 확인 후 승인 가능한 상태로 설정됩니다.</li>
                                        <li>특정 사용자 설정 시, 연결된 사용자(담당자)로 예약이 등록됩니다. 원장님별로 진료실을 등록한 경우, 해당 원장님을 사용자로 선택하시면 관리가 용이합니다.</li>
                                        <li>'사용자 설정'에 제공되는 목록은 IntoVetGE 병원차트에 등록된 사용자 이름이 노출됩니다. 사용자 리스트를 추가/수정/삭제 하시려면, 차트 프로그램 에서 진행해주세요.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </li>

            <!-- 사진 -->
            <li class="form-item">
                <div class="form-label">사진</div>
                <div class="form-content">
                    <div class="photo-upload__grid">
                        <label class="photo-upload__btn">
                            <input 
                                ref="fileInput"
                                type="file" 
                                hidden 
                                multiple 
                                accept="image/*"
                                @change="handleImageUpload($event)"
                            >
                            <img :src="icAddBtn" alt="추가" class="icon-plus" width="32">
                        </label>

                        <draggable
                            v-model="selectedRoom.images"
                            item-key="index"
                            class="draggable-container"
                            handle=".drag-image-handle"
                            ghost-class="ghost"
                            drag-class="drag-item-moving"
                            :scroll="true"
                            :scroll-sensitivity="100"
                            :animation="200"
                        >
                            <template #item="{element, index}">
                                <div class="photo-upload__item">
                                    <img :src="element" alt="업로드 이미지" class="preview-img"> 
                                    <!-- 드래그핸들 -->
                                    <div class="drag-image-handle"><img :src="icDragHandel" alt="드래그아이콘"></div>
                                    <!-- 삭제 버튼 -->
                                    <button class="delete-btn" @click="removeImage(index)">
                                        <img :src="icClear" alt="삭제" width="20">
                                    </button>
                                    <!-- 대표 이미지의 경우 (가장 첫번째 이미지) -->
                                    <div v-if="index == 0" class="main-badge">
                                        <span class="caption">대표이미지</span>
                                    </div>
                                </div>
                            </template>
                        </draggable>
                    </div>
                </div>
            </li>

            <!-- 휴무일 설정 -->
            <li class="form-item">
                <div class="form-label">휴무일 설정</div>
                <div class="form-content form-no-padding d-flex flex-col">
                    <!-- 매주 -->
                    <div class="form-col-box">
                        <div class="form-title-box border-right">매주</div>

                        <!-- 요일버튼 -->
                        <div class="day-button-group d-flex gap-4" style="padding: 4px 10px;">
                            <button 
                                v-for="day in DAYS_OPTIONS" 
                                :key="day.value" 
                                type="button" 
                                class="btn-day"
                                :class="{ 'active': selectedRoom.impos?.week.includes(day.value) }"
                                @click="toggleDay(day.value)"
                            >
                                {{ day.label }}
                            </button>
                        </div>

                        <!-- 공휴일(대체휴무일 제외)체크박스 -->
                        <label class="checkbox">
                            <input type="checkbox" 
                                :checked="selectedRoom.impos?.week.includes(8)" 
                                @change="toggleDay(8)"
                            />
                            <span class="box"></span>
                            <span class="label">공휴일(대체휴무일 제외)</span>
                        </label>
                    </div>

                    <!-- 매월 -->
                    <div class="form-col-box">
                        <div class="form-title-box border-right">매월</div>
                        
                        <div class="d-flex align-center" style="padding: 4px 10px;">
                            <CustomSelect 
                                v-model="selectedMon"
                                :options="DAY_OF_MONTH_OPTIONS" 
                                placeholder="날짜 선택"
                            />
                        </div>
                    </div>

                    <!-- 특정일 -->
                    <div class="form-col-box">
                        <div class="form-title-box border-right">특정일</div>

                        <div class="d-flex align-center gap-16" style="padding: 4px 10px;">
                            <div class="d-flex flex-wrap gap-8">
                                <div 
                                    v-for="(date, idx) in selectedRoom.impos?.sp_day" 
                                    :key="idx" 
                                    class="btn-day active selected-date-tag"
                                >
                                    <span>{{ date.date }} {{ date.is_repeat == 1 ? '(매년 반복)' : '' }}</span>
                                    <button type="button" @click="removeCustomHoliday(idx)">
                                        <img :src="icClear" width="16" alt="삭제">
                                    </button>
                                </div>
                            </div>

                            <button 
                                type="button" 
                                class="btn btn--size-24 btn--black-outline"
                                @click="openDatePicker"
                            >
                                <img :src="icPlus" alt="아이콘">항목 추가
                            </button>
                        </div>
                    </div>

                </div>
            </li>    

            <!-- 모바일 예약 운영 시간 설정 -->
            <li class="form-item">
                <div class="form-label">모바일 예약 운영 시간 설정</div>
                <div class="form-content">
                    <ClinicOperationTimeForm v-model="selectedRoom" />
                </div>
            </li>

        </ul>

        <div class="button-wrapper">
            <button class="btn btn--size-40 btn--blue" @click="saveIntoPetRoomInfo">저장</button>
        </div>

    </div>

    <!-- 진료실 노출 설정 모달 -->
    <Modal
        v-if="modalStore.intoPetRoomSettingModal.isVisible"
        size="xs"
        title="진료실 노출 설정"
        :modal-state="modalStore.intoPetRoomSettingModal"
    >
        <div class="modal-contents-inner">
            <div class="modal-title">
                <p class="body-m">드래그하여 진료실 노출 순서를 변경하거나<br/>토글 버튼으로 진료실을 노출, 숨길 수 있습니다.</p>
            </div>

            <!-- 진료실 리스트 -->
            <draggable
                v-model="tempRoomList"
                tag="ul"
                class="modal-room-list"
                item-key="id"
                handle=".drag-handle"
                ghost-class="ghost"
                drag-class="drag-item-moving"
                :scroll="true"
                :scroll-sensitivity="100"
                :animation="200"
            >
                <template #item="{ element, index }">
                    <li class="modal-room-list__item-wrapper">
                        <span class="index body-s">{{ (index + 1) }}</span>

                        <div class="modal-room-list__item">
                            <span class="drag-handle">
                                <img :src="icDragHandel" alt="드래그 핸들">
                            </span>
                            <span class="name body-m">{{ element.name }}</span>
                            <span>
                                <label class="toggle">
                                    <input type="checkbox" :checked="element.use_flag == 1" @change="toggleRoomUseFlag(index, $event)" />
                                    <img class="toggle-img" />
                                </label>
                            </span>
                        </div>
                    </li>
                </template>
            </draggable>
        </div>

        <div class="modal-button-wrapper">
            <div class="buttons">
                <button class="btn btn--size-32 btn--blue-outline" @click="modalStore.intoPetRoomSettingModal.closeModal()">취소</button>
                <button class="btn btn--size-32 btn--blue" @click="handleSaveRoomSetting">저장</button>
            </div>
        </div>
    </Modal>

    <!-- 날짜로 휴무일 지정 datepicker 팝업 -->
    <ModalDatePicker 
        :is-modal-open="isDatePickerOpen" 
        repeat-mode="annual"
        @close="isDatePickerOpen = false"
        @add="addCustomHoliday"
    />
</template>

<style lang="scss" scoped>
    .contents-wrapper {
        overflow-y: auto;
    }
    .form-container {
        overflow-y: visible;
    }
    .form-header {
        padding: 0 10px;
        align-items: center;
        justify-content: space-between;

        background-color: $primary-50;

        .room-index {
            @include flex-center;
            flex-shrink: 0;
            width: 24px;
            padding: 1px 8px;
    
            border-radius: 50%;
            background-color: $primary-100;
            border: 1px solid $primary-200;
            color: $primary-700;
        }
        .room-title {color: $primary-700;}
    }
    .form-label {width: 165px;}
    .form-col-box {
        min-height: 40px;
        display: flex;
        border-bottom: 1px solid $gray-200;
    }
    .form-col-box:last-child {
        border-bottom: none;
    }

    .button-wrapper {
        padding-top: 16px;
        // padding-top: 40px;
        display: flex;
        justify-content: center;
        gap: 8px;

        background-color: $gray-00;

        button {
            width: 400px;
        }
    }

    // 진료실 버튼 리스트
    .room-buttons {
        display: grid;
        grid-template-columns: repeat(4, 1fr); 
        gap: 8px;
        width: 100%;
        margin-bottom: 16px;
    }
    .room-button {
        height: 48px;
        display: flex;
        align-items: center;
        padding: 8px 12px;
        gap: 8px;
        min-width: 0;

        border-radius: 100px;
        background-color: $primary-50;
        cursor: pointer;

        .room-index {
            @include flex-center;
            flex-shrink: 0;
            width: 24px;
            padding: 1px 8px;
    
            border-radius: 50%;
            background-color: $primary-100;
            border: 1px solid $primary-200;
            color: $primary-700;
        }
    
        .room-name {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: $gray-700;
        }

        &.disabled {
            cursor: default;
            background-color: $gray-100;
            .room-index {
                color: $gray-400;
                border-color: $gray-200;
                background-color: $gray-50;
            }
            .room-name {color: $gray-400;}
        }

        &.active {
            background-color: $primary-700;
            .room-index {
                border-color: $gray-00;
                background-color: $gray-00;
            }
            .room-name {color: $gray-00;}
        }
    }
    .add-room-button {
        justify-content: center;

        border: 1px solid $gray-200;
        background-color: $gray-00;
        color: $gray-400;

        &:hover {
            border-color: $primary-700;
            color: $primary-700;
        }
    }

    // 진료실 노출 설정 모달
    .modal-title {
        padding-bottom: 16px;
        margin-bottom: 16px;

        border-bottom: 1px solid $gray-200;
    }

    .modal-room-list {
        width: 100%;
        display: flex;
        min-height: 0;
        flex-direction: column;
        gap: 12px;

        &__item-wrapper {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 10px;

            .index {
                @include flex-center;
                line-height: 1;
                min-width: 20px;
                height: 20px;
                padding: 4px;
                border-radius: 999px;
                background-color: $gray-200;
                color: $gray-700;
                white-space: nowrap;
            }
        }

        &__item {
            width: 90%;
            flex:1;
            display: flex;
            align-items: center;
            height: 32px;
            padding: 7px 10px;
            gap: 10px;
            cursor: default; // 기본 커서

            border-radius: 4px;
            border: 1px solid $gray-200;
            background-color: $gray-00;

            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;

            span {
                line-height: 1;
            }

            .drag-handle {
                cursor: grab; // 잡을 수 있는 모양의 커서
                &:active {
                    cursor: grabbing; // 잡았을 때 모양
                }
            }

            &.is-active {
                border-color: $primary-700;
                background-color: $primary-50;
            }

            .name {
                flex: 1;
                overflow: hidden;
                white-space: nowrap;
                min-width: 0;
                text-overflow: ellipsis;
            }
        }
    }

    .draggable-container {
        display: flex;
        flex-wrap: wrap;
        gap: 12px; // 아이템 간 간격
    }
    .ghost {
        // opacity: 0.5;
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

    .selected-date-tag {
        display: flex;
        align-items: center;
        gap: 10px;

        span {line-height: 1;}
    }
</style>