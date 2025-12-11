import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// 웹폰트
import "pretendard/dist/web/static/pretendard.css";

// 전역 스타일
import './assets/styles/base.scss'
import './assets/styles/layout.scss'
import './assets/styles/components.scss'

// datepicker css
import '@vuepic/vue-datepicker/dist/main.css';

const app = createApp(App)

app.use(createPinia()) // pinia
app.use(router) // router

app.mount('#app')
