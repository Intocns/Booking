import axios from "axios";
import { ref } from "vue";

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
        config.headers.Authorization = 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJuYXZlci1wbGFjZSIsInVzZXJOYW1lIjoiZGxzeG4yMDI1ISIsImV4cCI6MTc4NDcwMzA2NSwidXNlcklkIjoiaW50b2NuczAiLCJpYXQiOjB9.Esw9L6woqw61P9GQcQ5NTr3A9DVQhaxqPgFZzA3Wrpw' // 요청 헤더에 포함

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
        // 응답이 수신된 후, 본격적으로 응답을 처리하기 전에 실행되는 로직
        try {
            // console.log('응답 수신:', response);
        } finally {
            if (!response.config.skipLoading) {
                // skipLoading이 true가 아닌 경우에만 로딩 상태를 변경
                api.ing.value = false // 로딩 상태를 false로 설정
            }
        }
        return response
    },
    async (error) => {
        // 오류 응답이 수신될 경우 실행되는 로직
        api.ing.value = false
        // console.log('오류 수신:', error);
        const originalRequest = error.config //원래 시도했던 요청 객체 불러옴

        const showAlert = (message) => {
            // 에러메세지 보여주는 함수
            if (!originalRequest.skipAlert) {
                // 요청에 skipAlert값이 없을떄만 alert창 띄움.
                alert(message)
            }
        }

        if (!error.response) {
            // error.response가 없는 경우 처리
            showAlert('서버 에러입니다. 잠시 후 다시 시도해주세요.')
            return Promise.reject(error)
        }

        // switch (error.response.status) {
        //     case 401: // 토큰만료
        //         if (!originalRequest._retry) {
        //             originalRequest._retry = true

        //             const refreshToken = Cookies.get('INTOPG_REFRESH')
        //             const isAdmin = Cookies.get('INTOPG_IS_MANAGER') == 1 ? true : false

        //             if (!refreshToken) {
        //                 // refreshToken 없음
        //                 Cookies.remove('INTOPG_ACCESS')
        //                 Cookies.remove('INTOPG_REFRESH')
        //                 Cookies.remove('INTOPG_IS_MANAGER')
        //                 if (isAdmin) {
        //                     showAlert('로그인이 만료되었습니다. 다시 로그인해주세요.')
        //                     // window.location.href = '/admin/login'
        //                     router.push('/admin/login')
        //                 } else {
        //                     showAlert('연결이 종료되었습니다. 새 창에서 이용해 주세요.')
        //                     router.push({ name: 'login', query: { closeWebview: '1' } })
        //                 }
        //                 return Promise.reject(error)
        //             }

        //             // 동시 401 방지: 리프레시 한 번만 수행
        //             if (!isRefreshing) {
        //                 isRefreshing = true
        //                 refreshPromise = HttpClient.post(
        //                     '/auth/refresh',
        //                     { refresh_token: refreshToken }, // 바디
        //                     {
        //                         headers: {
        //                             'X-Refresh-Token': refreshToken, // 헤더
        //                         },
        //                     },
        //                 )
        //                     .then((res) => {
        //                         const ok =
        //                             res.status === 200 &&
        //                             String(res.data?.code) === '200' &&
        //                             res.data?.token
        //                         if (!ok) throw new Error('Refresh failed')
        //                         const newAccessToken = res.data.token
        //                         Cookies.set('INTOPG_ACCESS', newAccessToken, { expires: 7 })
        //                         return newAccessToken
        //                     })
        //                     .finally(() => {
        //                         isRefreshing = false
        //                     })
        //             }

        //             try {
        //                 const newAccessToken = await refreshPromise
        //                 originalRequest.headers = originalRequest.headers || {}
        //                 originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        //                 return HttpClient(originalRequest) // 원요청 재시도
        //             } catch (e) {
        //                 // 리프레시 실패
        //                 Cookies.remove('INTOPG_ACCESS')
        //                 Cookies.remove('INTOPG_REFRESH')
        //                 Cookies.remove('INTOPG_IS_MANAGER')
        //                 if (isAdmin) {
        //                     showAlert('로그인이 만료되었습니다. 다시 로그인해주세요.')
        //                     window.location.href = '/admin/login'
        //                 } else {
        //                     showAlert('연결이 종료되었습니다. 새 창에서 이용해 주세요.')
        //                     router.push({ name: 'login', query: { closeWebview: '1' } })
        //                 }
        //                 return Promise.reject(e)
        //             }
        //         }
        //         break
        //     case 500: // 500 -> 서버
        //         showAlert('서버 에러입니다. 잠시 후 다시 시도해주세요.')
        //         break
        //     case 408: // 408 -> 요청시간 초과
        //         showAlert('요청 시간이 초과되었습니다. 다시 시도해주세요')
        //         break
        //     default:
        //         if (error.response.data.result) {
        //             showAlert(error.response.data.result)
        //         } else {
        //             showAlert(`에러가 발생했습니다: ${error.message}\n관리자에게 문의 바랍니다.`)
        //         }
        //         break
        // }
        return Promise.reject(error)
    },
)

export { api }