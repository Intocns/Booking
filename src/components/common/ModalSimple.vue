<!-- 모달 (header x)(content는 slot으로 사용)  -->
<script setup>
import icBtnClose from '@/assets/icons/ic_btn_close_b.svg'

const props = defineProps({
    title: String,
    smallTitle: String,
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
    modalHeight: {type: String, default: ''}
})

// 닫기 메서드는 Prop으로 받은 객체의 closeModal을 호출하도록 
const close = () => {
    console.log('close')
    // Prop으로 전달받은 스토어 상태 객체의 closeModal 메서드 호출
    props.modalState.closeModal();
};

</script>

<template>
    <teleport to="#app">
        <div class="modal-backdrop" @click="close">
            <div class="modal-container simple"  @click.stop :style="{width: modalWidth, height: modalHeight}">
                <!-- 모달 헤더 -->
                <div class="modal-header"></div>
                <!-- 모달 콘텐츠 -->
                <div class="modal-contents">
                    <div class="modal-header-custom">
                        <p v-if="smallTitle" class="title-s">{{ smallTitle }}</p>
                        <p v-else class="heading-s">{{ title }}</p>
                        
                        <button class="modal-close" @click="close">
                            <img :src="icBtnClose" alt="닫기 버튼">
                        </button>
                    </div>
                    <!-- 각 모달 별 콘텐츠 들어감 -->
                    <slot />  
                </div>
            </div>
        </div>
    </teleport>
</template>

<style lang="scss" scoped>
    .modal-header {
        display: none;
        // background-color: $gray-00;
    }
    .modal-contents {
        border-radius: 8px;
    }
    .modal-header-custom {
        display: flex;
        align-items: center;
        padding: 20px 20px 0px 20px;

        p {
            display: flex;
            justify-content: center;
            flex: 1;

        }
    }
</style>