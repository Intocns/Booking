import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd())
    
    return {
        plugins: [vue()],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
        css: {
            preprocessorOptions: {
                scss: {
                    // 모든 컴포넌트에서 공통 변수, mixin 자동으로 불러오게 함
                    additionalData: `
                        @use "@/assets/styles/variables.scss" as *;
                        @use "@/assets/styles/mixins.scss" as *;
                    `
                }
            }
        },
        build: {
            sourcemap: process.env.NODE_ENV !== 'production',
            rollupOptions: {
                output: {
                    // 파일 이름을 그대로 유지하도록 설정
                    manualChunks: undefined,
                    entryFileNames: 'assets/[name].[hash].js',
                    chunkFileNames: 'assets/[name].[hash].js',
                    assetFileNames: 'assets/[name].[hash].[ext]',
                },
            },
        },
        server: {
            host: true,  // 로컬환경에서 ip로 붙을수 있도록 추가(네이버 예약 연동 테스트 시 사용)
            proxy: {
                '/api': {
                    target: env.VITE_DEV_API,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api/, ''),
                },
                '/sso-api': {
                    target: env.VITE_SSO_URL,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/sso-api/, '/api'), // /sso-api를 /api로 바꿔서 서버에 전달
                },
            },
        },
    }
})
