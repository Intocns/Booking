<!-- 알림톡 미리보기 -->
<script setup></script>

<template>
    <div class="talk_wrapper">
        <div>
            <!-- 메세지 -->
            <div class="talk_message_wrapper">
                <!-- 발신명 -->
                <span class="talk_name" id="">인투씨엔에스</span>
                <!-- 메세지 말풍선 -->
                <div class="talk_message" id="">
                    <p class="talk_title">알림톡 도착</p>

                    <div class="message_box">
                        <!-- p태그 안에 메세지 내용 들어감 -->
                        <p>
                            <!-- 아래내용은 예시입니다. -->
                            [검사 결과 안내]
                            <br>
                            #{동물병원}에서  <br>
                            '#{동물명}'(이)의 건강검진 결과가 도착했어요.  
                            <br> 
                            <br>
                            ※ 결과 안내사항
                            <br>
                            1. 검사 결과에 대한 자세한 설명이 필요하시면 병원으로 문의해주세요.  
                            <br>
                            2. 필요 시 추가 검사나 치료가 권장될 수 있습니다.  
                            <br> 
                            <br>
                            ※ 검사결과 문의
                            <br>
                            문의전화: #{병원전화번호}
                        </p>

                        <!-- 버튼의 경우 -->
                        <div class="talk_buttons">
                            <!-- 예시입니다. -->
                            <div class="talk_button mt-1">문진 작성하기</div>
                            <div class="talk_button mt-1">추가버튼인 경우</div>
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
    min-width: 200px; 
    border-radius: 10px;
    background-color: $--white-color; 
    overflow: hidden; 
    margin-top: 7px;
}
.talk_title {
    padding: 10px;
    background-color: $--yellow-color;
    font-size: 10pt;
}
.talk_name {font-size: 10pt;}
.message_box {padding: 10px;}
.message_box p {font-size: 9.5pt; word-break: break-all;}
.talk_buttons {margin-top: 10px;}
.talk_button {border-radius: 5px; width: 100%; background-color: $--light-gray-color-1; text-align: center; padding: 8px 0; font-size: 10pt;}
</style>