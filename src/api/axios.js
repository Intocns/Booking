import axios from "axios";
import { ref } from "vue";
import { showAlert } from "@/utils/ui";
import { COCODE } from "@/constants/common";

const api = axios.create({
    baseURL: '', //import.meta.env.VITE_API_URL,
    timeout: 120000, // 2분
    headers : {
        'Content-Type': 'application/json;charset=utf-8',
    },
    withCredentials: true, // 자격증명 포함
})

api.ing = ref(false) // 응답 상태에 따라 dom 요소에서 사용할 상태변수를 생성 (로딩스피너사용)

// 요청 인터셉터
api.interceptors.request.use(
    (config) => {
        // 요청 발신 전
        if (config.skipLoading !== true) {
            // skipLoading이 true가 아닌 경우에만 로딩 상태를 변경
            api.ing.value = true // 로딩 상태를 true로 설정
        }

        // const accessToken = Cookies.get('INTOLINK_RESERVE_ACCESS') // 토큰값 가져오기 
        // config.headers.Authorization = `Bearer ${accessToken}` // 요청 헤더에 포함
        config.headers.Authorization = 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJib29raW5nLXBsYWNlIiwidXNlck5hbWUiOiJkbHN4bjIwMjUhIiwiZXhwIjoxNzk3MjkyNjc3LCJ1c2VySWQiOiJpbnRvY25zMCIsImlhdCI6MH0.q4ewsivkWaEhH1ht0IRV1c-R9X0FS6BqPty4cpHktic' // TODO: 토큰값  요청 헤더에 포함

        // URL 내 '{cocode}' 템플릿 문자를 실제 관리 코드(COCODE)로 치환
        // TODO: 추후 로그인 기능 구현 시, 상수가 아닌 로그인 cocode와 연동 필요
        if (config.url.includes('{cocode}')) {
            config.url = config.url.replace('{cocode}', COCODE);
        }

        return config
    },
    (error) => {
        // 요청실패
        return Promise.reject(error)
    }
)

// 응답 인터셉터
api.interceptors.response.use(
    async (response) => {
        if (!response.config.skipLoading) {
            api.ing.value = false;
        }

        const res = response.data; // 서버에서 보낸 실제 데이터 바디

        // 비즈니스 로직 에러 처리
        if(res && res.status_code >  300) {
            // 공통 알럿 처리 (skipAlert가 아닐 때만)
            const message = res.message || '요청 처리 중 오류가 발생했습니다.';
            showAlert(message, response.config)

            // 성공 핸들러지만 reject를 던져서 스토어를 catch로 보냄
            return Promise.reject(res);
        }

        // 진짜 성공일 때만 데이터를 반환
        return response
    },
    async (error) => {
        // 오류 응답이 수신될 경우 실행되는 로직
        api.ing.value = false

        const originalRequest = error.config //원래 시도했던 요청 객체 불러옴

        if (!error.response) {
            // error.response가 없는 경우 처리
            showAlert('서버 에러입니다. 잠시 후 다시 시도해주세요.', originalRequest)
            return Promise.reject(error)
        }

        const status = error.response.status;
        const errorData = error.response.data; // 서버에서 보내준 에러 객체

        switch (status) {
            case 401: // 토큰만료
                // if (!originalRequest._retry) {
                //     originalRequest._retry = true

                //     const refreshToken = Cookies.get('INTOPG_REFRESH')
                //     const isAdmin = Cookies.get('INTOPG_IS_MANAGER') == 1 ? true : false

                //     if (!refreshToken) {
                //         // refreshToken 없음
                //         Cookies.remove('INTOPG_ACCESS')
                //         Cookies.remove('INTOPG_REFRESH')
                //         Cookies.remove('INTOPG_IS_MANAGER')
                //         if (isAdmin) {
                //             showAlert('로그인이 만료되었습니다. 다시 로그인해주세요.')
                //             // window.location.href = '/admin/login'
                //             router.push('/admin/login')
                //         } else {
                //             showAlert('연결이 종료되었습니다. 새 창에서 이용해 주세요.')
                //             router.push({ name: 'login', query: { closeWebview: '1' } })
                //         }
                //         return Promise.reject(error)
                //     }

                //     // 동시 401 방지: 리프레시 한 번만 수행
                //     if (!isRefreshing) {
                //         isRefreshing = true
                //         refreshPromise = HttpClient.post(
                //             '/auth/refresh',
                //             { refresh_token: refreshToken }, // 바디
                //             {
                //                 headers: {
                //                     'X-Refresh-Token': refreshToken, // 헤더
                //                 },
                //             },
                //         )
                //             .then((res) => {
                //                 const ok =
                //                     res.status === 200 &&
                //                     String(res.data?.code) === '200' &&
                //                     res.data?.token
                //                 if (!ok) throw new Error('Refresh failed')
                //                 const newAccessToken = res.data.token
                //                 Cookies.set('INTOPG_ACCESS', newAccessToken, { expires: 7 })
                //                 return newAccessToken
                //             })
                //             .finally(() => {
                //                 isRefreshing = false
                //             })
                //     }

                //     try {
                //         const newAccessToken = await refreshPromise
                //         originalRequest.headers = originalRequest.headers || {}
                //         originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
                //         return HttpClient(originalRequest) // 원요청 재시도
                //     } catch (e) {
                //         // 리프레시 실패
                //         Cookies.remove('INTOPG_ACCESS')
                //         Cookies.remove('INTOPG_REFRESH')
                //         Cookies.remove('INTOPG_IS_MANAGER')
                //         if (isAdmin) {
                //             showAlert('로그인이 만료되었습니다. 다시 로그인해주세요.')
                //             window.location.href = '/admin/login'
                //         } else {
                //             showAlert('연결이 종료되었습니다. 새 창에서 이용해 주세요.')
                //             router.push({ name: 'login', query: { closeWebview: '1' } })
                //         }
                //         return Promise.reject(e)
                //     }
                // }
                showAlert('인증이 만료되었습니다. 다시 로그인해주세요.', originalRequest);
                break
            case 500: // 500 -> 서버
                showAlert('서버 에러입니다. 잠시 후 다시 시도해주세요.', originalRequest)
                break
            case 408: // 408 -> 요청시간 초과
                showAlert('요청 시간이 초과되었습니다. 다시 시도해주세요', originalRequest)
                break
            default:
                if (errorData.message) {
                    showAlert(`에러가 발생했습니다: ${errorData.message}\n관리자에게 문의 바랍니다.`)
                } else {
                    showAlert(`에러가 발생했습니다: ${error.message}\n관리자에게 문의 바랍니다.`, originalRequest)
                }
                break
        }
        return Promise.reject(error)
    },
)

export { api }