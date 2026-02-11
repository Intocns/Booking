import axios from 'axios'; // 인터셉터 없는 순수 axios (헤더 없이 보내기용)
import { AesCbc } from './crypto';
import { useHospitalStore } from '@/stores/hospitalStore';
import { showAlert } from './ui';

// 스크립트 로드 
export const loadSSOScript = () => {
    return new Promise((resolve) => {
        if (document.getElementById('into-sso-script')) return resolve();
        const script = document.createElement('script');
        script.id = 'into-sso-script';
        script.src = `${import.meta.env.VITE_SSO_URL}js/into_sso_v2.1.js?v=${new Date().getTime()}`;
        script.onload = () => resolve();
        document.head.appendChild(script);
    });
};

// sso 강제 로그인 (차트사용)
export const forceSsoLogin = async (_businessNo = null, next_url = null) => {
    const urlParams = new URLSearchParams(window.location.search);
    const bizNo = urlParams.get('biz_No') || '123-12-12345' // TODO:차트에서 보내주는 사업자번호로 변경 //compnum
    const cocode = urlParams.get('cocode') || '2592'; // TODO: 2592 추후삭제 차트에서 보내주는 cocode값으로 변경 
    // const cocode = localStorage.getItem('HOSUUID') || '2592'; // TODO: 2592 추후삭제 차트에서 보내주는 cocode값으로 변경

    if(!bizNo) {
        showAlert('사업자번호가 존재하지 않습니다.');
        return;
    }

    if(!cocode) {
        showAlert('병원코드가 존재하지 않습니다.');
        return;
    }

    if(Number(cocode) >= 10000) {
        showAlert('인투링크 예약 서비스를 이용 중인 병원만 접근할 수 있는 메뉴입니다.');
        // window.close();
        // return {data: {returnUrl: '', message:'인투링크 예약 서비스를 이용 중인 병원만 접근할 수 있는 메뉴입니다.'}};
        return;
    }

    // if(!_businessNo) {
    //     return {data: {returnUrl: '', status : 101, message:'사업자번호가 존재하지 않습니다.'}};
    // }

    // if(!cocode) {
    //     return {data: {returnUrl: '', status : 102, message:'병원코드가 존재하지 않습니다.'}};
    // }

    const isDev = import.meta.env.VITE_IS_TEST === 'true';

    let finalNextUrl = isDev ? window.location.origin : import.meta.env.VITE_MAIN_URL;

    const sendData = { 
        cocode: cocode, 
        // user_id: '',
        biz_no: bizNo, 
        next: finalNextUrl
    };

    const encryptedData = AesCbc.encrypt(
        JSON.stringify(sendData), 
        import.meta.env.VITE_SSO_KEY, 
        import.meta.env.VITE_SSO_IV
    );

    // const decryptData = AesCbc.decrypt(encryptedData,import.meta.env.VITE_SSO_KEY, import.meta.env.VITE_SSO_IV )
    // console.log(decryptData)

    try { // 강제 로그인 시도
        const response = await axios.post( isDev ? '/sso-api/autoSignIn' : `${import.meta.env.VITE_SSO_URL}api/autoSignIn`, 
            { encodeData: encryptedData },
            { headers: { 'Content-Type': 'application/json' } }
        );
        
        // const result = response.json();
        // console.log("-----",result);
        // return result;

        if(response.data.data) {
            if (response.data?.data?.returnUrl) {
                // console.log(response.data.data.returnUrl);
                window.location.href = response.data.data.returnUrl; // returnUrl로 이동
            }
        } else {
            alert('인증에 실패했습니다.');
            // 브라우저 창닫기 
            window.close();
        }
    } catch (err) {
        // alert('인증에 실패했습니다.');
        console.error("SSO 로그인 실패:", err);
        // 브라우저 창닫기
        // window.close();
    }
};

// SSO 초기화 및 로직 
export const initSSOCheck = (onResult) => {
    const isSession = false; // 현재 사이트 자체 세션 유무
    const isDev = import.meta.env.VITE_IS_TEST === 'true';
    const sso = new INTOSSO('intobooking', true, isDev);  // test일경우 마지막 인자값 true, live일 경우 false

    const callback = function(data) {
        // console.log(data);
        if(Number(data.cocode) >= 10000) {
            showAlert('인투링크 예약 서비스를 이용 중인 병원만 접근할 수 있는 메뉴입니다.');
            return;
        }

        const hospitalStore = useHospitalStore();
        hospitalStore.hospitalData = data;
        if (onResult) onResult('success');
    };

    const logout = function() {
        // console.log('logout');
        // TODO: 로그아웃
        if (onResult) onResult('fail');
    };

    try {
        sso.init(callback, logout, isSession);
    } catch(err) {
        alert('sso 로그인 확인 오류')
        console.error(err);
        if (onResult) onResult('error');
    }
};
