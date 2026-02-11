<!-- 모달 틀 (content는 slot으로 사용) -->
<script setup>
import icBtnClose from '@/assets/icons/ic_btn_close_w.svg'
const props = defineProps({
    size: String,
    title: String,
    // 제어할 모달 스토어 상태 객체를 받음
    modalState: {
        type: Object,
        required: true,
        validator: (value) => {
            // 최소한 closeModal 메서드가 있는지 확인
            return typeof value.closeModal === 'function';
        }
    },
    modalWidth: {type: String, default: ''},
    modalHeight: {type: String, default: ''},
    // 특정 모달에서만 헤더 X 버튼을 숨기고 싶을 때 사용
    hideHeaderClose: {type: Boolean, default: false}
})
// 닫기 메서드는 Prop으로 받은 객체의 closeModal을 호출하도록 
const close = () => {
    // Prop으로 전달받은 스토어 상태 객체의 closeModal 메서드 호출
    props.modalState.closeModal();
};
</script>

<template>
    <teleport to="#app">
        <div class="modal-backdrop">
            <div class="modal-container" :class="`modal--${size}`" @click.stop :style="{width: modalWidth, height: modalHeight}">
                <!-- 모달 헤더 -->
                <div class="modal-header">
                    <p class="modal-header__title title-l">{{title}}</p>
                    <button
                        v-if="!hideHeaderClose"
                        class="modal-close"
                        @click="close"
                    >
                        <img :src="icBtnClose" alt="닫기 버튼">
                    </button>
                </div>
                <div class="modal-contents">
                    <!-- 각 모달 별 콘텐츠 들어감 -->
                    <slot />  
                </div>
            </div>
        </div>
    </teleport>
</template>