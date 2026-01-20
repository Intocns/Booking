<!-- 알림톡 미리보기 -->
<script setup>
import { computed } from 'vue';
import { buildTemplateVariables, formatTemplateContent } from '@/utils/alimtalkTemplate.js';

const props = defineProps({
    template: {
        type: Object,
        default: null
    },
    reservationData: {
        type: Object,
        default: () => ({})
    }
});

const variableMap = computed(() => buildTemplateVariables(props.reservationData));
const formattedContent = computed(() =>
    formatTemplateContent(props.template?.template_content || '', variableMap.value)
);
const senderName = computed(() => {
    const isDefaultTemplate = props.template?.is_default == 1

    if (isDefaultTemplate) {
        return '인투링크';
    }
// TODO: cocode 기반 실제 병원명으로 교체
    return (
        props.reservationData?.hospitalName ||
        props.reservationData?.hospital_name ||
        '병원명'
    );
});

// 버튼 설정
const buttons = computed(() => {
    if (!props.template?.btn_setting || !Array.isArray(props.template.btn_setting)) {
        return [];
    }
    return props.template.btn_setting;
});
</script>

<template>
    <div class="talk_wrapper">
        <div>
            <!-- 메세지 -->
            <div class="talk_message_wrapper">
                <!-- 발신명: 템플릿이 있으면 병원명, 없으면 기본값 -->
                <span class="talk_name">{{ senderName }}</span>
                <!-- 메세지 말풍선 -->
                <div class="talk_message">
                    <p class="talk_title">알림톡 도착</p>

                    <div class="message_box">
                        <!-- p태그 안에 메세지 내용 들어감 -->
                        <p v-if="template && template.template_content">
                            <span v-html="formattedContent"></span>
                        </p>
                        <p v-else class="empty-message">
                            템플릿을 선택해주세요.
                        </p>

                        <!-- 버튼의 경우 -->
                        <div class="talk_buttons" v-if="buttons.length > 0">
                            <div 
                                v-for="(button, index) in buttons" 
                                :key="index"
                                class="talk_button mt-1"
                            >
                                {{ button.name || button.button_name || `버튼 ${index + 1}` }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    $--white-color: #fff;
    $--bg-blue-color: #C4DAEB;
    $--yellow-color: #FFEC32;
    $--light-gray-color-1: #f2f2f5;

.mt-1 {margin-top: .25rem !important;}
p {margin: 0;}

.talk_wrapper {
    background-color: $--bg-blue-color;
    border-radius: 10px; 
    padding: 20px; 
    min-height: 300px;
    width: 100%;
}
.talk_message_wrapper {
    max-height: calc(440px - 40px);
    overflow-y: auto;
    overflow-x: hidden;
    width: 290px;
    padding-right: 12px;
    scrollbar-gutter: stable;
    box-sizing: border-box;
}
.talk_message {
    max-width: 280px; 
    min-width: 280px; 
    max-height: 450px;
    border-radius: 10px;
    background-color: $--white-color; 
    overflow: hidden;
    margin-top: 7px;
    display: flex;
    flex-direction: column;
}
.talk_title {
    padding: 10px;
    background-color: $--yellow-color;
    font-size: 10pt;
    flex-shrink: 0;
}
.talk_name {font-size: 10pt;}
.message_box {
    padding: 10px;
}
.message_box p {font-size: 9.5pt; word-break: break-all;}
.talk_buttons {margin-top: 10px;}
.talk_button {border-radius: 5px; width: 100%; background-color: $--light-gray-color-1; text-align: center; padding: 8px 0; font-size: 10pt;}
</style>