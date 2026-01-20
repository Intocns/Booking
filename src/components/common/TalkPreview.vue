<!-- 알림톡 미리보기 -->
<script setup>
import { computed } from 'vue';

const props = defineProps({
    template: {
        type: Object,
        default: null
    }
});

// template_content를 HTML로 변환
const formatTemplateContent = (content) => {
    if (!content) return '';
    
    return content
        .replace(/₩n/g, '<br>')
        .replace(/\\n/g, '<br>')
        .replace(/#\{([^}]+)\}/g, '<strong>#{$1}</strong>');
};

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
                <!-- 발신명 -->
                <span class="talk_name" id="">인투씨엔에스</span>
                <!-- 메세지 말풍선 -->
                <div class="talk_message">
                    <p class="talk_title">알림톡 도착</p>

                    <div class="message_box">
                        <!-- p태그 안에 메세지 내용 들어감 -->
                        <p v-if="template && template.template_content">
                            <span v-html="formatTemplateContent(template.template_content)"></span>
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
/*
    본 html은 부트스트랩의 클래스를 사용하고 있습니다.
    부트스트랩을 사용하지 않는 경우, 아래의 스타일이 필요합니다.
*/
.mt-1 {margin-top: .25rem !important;}

/* 
    p태그의 경우 margin: 0 을 기본값으로 합니다.
*/
p {margin: 0;}

/* 
    .talk_wrapper 는 부모요소의 너비가 지정되어 있어야합니다.
*/
.talk_wrapper {
    background-color: $--bg-blue-color;
    border-radius: 10px; 
    padding: 20px; 
    // margin-top: 20px; 
    min-height: 300px; 
    height: 100%;
    width: 100%;
}
.talk_wrapper .talk_profile {
    background-color: $--white-color; 
    width: 45px; 
    height: 45px; 
    border-radius: 19px;
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
    overflow-y: auto;
    flex: 1;
    min-height: 0;
}
.message_box p {font-size: 9.5pt; word-break: break-all;}
.talk_buttons {margin-top: 10px;}
.talk_button {border-radius: 5px; width: 100%; background-color: $--light-gray-color-1; text-align: center; padding: 8px 0; font-size: 10pt;}
</style>