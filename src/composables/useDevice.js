
export function useDevice() {
    // 1. UserAgent 체크
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // 2. 화면 너비 체크 (일반적으로 1024px 미만을 모바일/태블릿으로 간주)
    const isSmallScreen = window.innerWidth < 1024;

    // 둘 중 하나라도 해당하면 모바일 환경으로 판단
    // console.log('use device is', isMobileUA, isSmallScreen)
    return isMobileUA || isSmallScreen;
}