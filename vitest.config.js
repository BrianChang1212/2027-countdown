import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        // 使用 Happy-DOM 作為測試環境（輕量、快速的 DOM 實現）
        environment: 'happy-dom',

        // 全域設定
        globals: true,

        // 測試覆蓋率設定
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'tests/',
                'config/',
                'docs/',
                '*.config.js',
                'src/scripts/main.js',
                'src/scripts/init.js'
            ],
            include: [
                'src/scripts/**/*.js'
            ],
            // 設定覆蓋率目標
            thresholds: {
                lines: 50,
                functions: 50,
                branches: 50,
                statements: 50
            }
        },

        // 測試檔案位置
        include: ['tests/**/*.{test,spec}.js'],

        // 設定檔案
        setupFiles: ['./tests/setup/test-setup.js'],

        // 測試超時時間
        testTimeout: 10000,

        // 監控模式設定
        watch: false,

        // 報告器
        reporters: ['verbose']
    },

    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@scripts': path.resolve(__dirname, './src/scripts'),
            '@utils': path.resolve(__dirname, './src/scripts/utils'),
            '@services': path.resolve(__dirname, './src/scripts/services'),
            '@components': path.resolve(__dirname, './src/scripts/components'),
            '@views': path.resolve(__dirname, './src/scripts/views')
        }
    }
});
