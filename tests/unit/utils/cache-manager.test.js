/**
 * CacheManager 單元測試
 * 測試快取管理器的核心功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('CacheManager', () => {
    let CacheManager;

    beforeEach(async () => {
        // 動態載入模組（避免 IIFE 污染全域）
        const module = await import('../../../src/scripts/utils/cache-manager.js');
        CacheManager = module.default || window.CacheManager;

        // 清空所有快取
        CacheManager.remove();
    });

    describe('基本功能測試', () => {
        it('應該能夠設定與取得快取', () => {
            const key = 'test-key';
            const value = { data: 'test-data' };

            const setResult = CacheManager.set(key, value);
            expect(setResult).toBe(true);

            const cachedValue = CacheManager.get(key);
            expect(cachedValue).toEqual(value);
        });

        it('應該能夠檢查快取是否存在', () => {
            const key = 'test-key';
            const value = 'test-value';

            expect(CacheManager.has(key)).toBe(false);

            CacheManager.set(key, value);
            expect(CacheManager.has(key)).toBe(true);
        });

        it('應該能夠刪除指定快取', () => {
            const key = 'test-key';
            const value = 'test-value';

            CacheManager.set(key, value);
            expect(CacheManager.has(key)).toBe(true);

            const deleteResult = CacheManager.remove(key);
            expect(deleteResult).toBe(true);
            expect(CacheManager.has(key)).toBe(false);
        });

        it('應該能夠清除所有快取', () => {
            CacheManager.set('key1', 'value1');
            CacheManager.set('key2', 'value2');
            CacheManager.set('key3', 'value3');

            CacheManager.remove(); // 不傳參數則清除全部

            expect(CacheManager.has('key1')).toBe(false);
            expect(CacheManager.has('key2')).toBe(false);
            expect(CacheManager.has('key3')).toBe(false);
        });
    });

    describe('快取過期測試', () => {
        it('應該在快取過期後返回 null', async () => {
            const key = 'expiring-key';
            const value = 'expiring-value';
            const duration = 100; // 100ms

            CacheManager.set(key, value, duration);
            expect(CacheManager.get(key)).toBe(value);

            // 等待快取過期
            await new Promise(resolve => setTimeout(resolve, 150));

            expect(CacheManager.get(key)).toBe(null);
            expect(CacheManager.has(key)).toBe(false);
        });

        it('應該能夠清除過期的快取', async () => {
            CacheManager.set('key1', 'value1', 100); // 100ms 過期
            CacheManager.set('key2', 'value2', 10000); // 10s 過期

            // 等待第一個快取過期
            await new Promise(resolve => setTimeout(resolve, 150));

            const clearedCount = CacheManager.clearExpired();
            expect(clearedCount).toBe(1);

            expect(CacheManager.has('key1')).toBe(false);
            expect(CacheManager.has('key2')).toBe(true);
        });
    });

    describe('參數驗證測試', () => {
        it('應該拒絕無效的 key（非字串）', () => {
            expect(CacheManager.set(null, 'value')).toBe(false);
            expect(CacheManager.set(undefined, 'value')).toBe(false);
            expect(CacheManager.set(123, 'value')).toBe(false);
            expect(CacheManager.set({}, 'value')).toBe(false);
        });

        it('應該對無效的 key 返回 null', () => {
            expect(CacheManager.get(null)).toBe(null);
            expect(CacheManager.get(undefined)).toBe(null);
            expect(CacheManager.get(123)).toBe(null);
        });

        it('應該能夠快取各種類型的值', () => {
            CacheManager.set('string', 'text');
            CacheManager.set('number', 42);
            CacheManager.set('boolean', true);
            CacheManager.set('object', { a: 1 });
            CacheManager.set('array', [1, 2, 3]);
            CacheManager.set('null', null);

            expect(CacheManager.get('string')).toBe('text');
            expect(CacheManager.get('number')).toBe(42);
            expect(CacheManager.get('boolean')).toBe(true);
            expect(CacheManager.get('object')).toEqual({ a: 1 });
            expect(CacheManager.get('array')).toEqual([1, 2, 3]);
            expect(CacheManager.get('null')).toBe(null);
        });
    });

    describe('統計資訊測試', () => {
        it('應該能夠取得快取統計資訊', async () => {
            CacheManager.set('key1', 'value1', 10000);
            CacheManager.set('key2', 'value2', 100);
            CacheManager.set('key3', 'value3', 10000);

            let stats = CacheManager.getStats();
            expect(stats.total).toBe(3);
            expect(stats.valid).toBe(3);
            expect(stats.expired).toBe(0);

            // 等待一個快取過期
            await new Promise(resolve => setTimeout(resolve, 150));

            stats = CacheManager.getStats();
            expect(stats.total).toBe(3);
            expect(stats.valid).toBe(2);
            expect(stats.expired).toBe(1);
        });
    });

    describe('cached() 包裝函數測試', () => {
        it('應該能夠快取異步函數的結果', async () => {
            let callCount = 0;
            const asyncFn = async () => {
                callCount++;
                return 'result';
            };

            const result1 = await CacheManager.cached('async-key', asyncFn);
            expect(result1).toBe('result');
            expect(callCount).toBe(1);

            // 第二次調用應該使用快取
            const result2 = await CacheManager.cached('async-key', asyncFn);
            expect(result2).toBe('result');
            expect(callCount).toBe(1); // 沒有再次調用
        });

        it('應該在函數執行失敗時不快取結果', async () => {
            let callCount = 0;
            const failingFn = async () => {
                callCount++;
                throw new Error('Function failed');
            };

            // 第一次調用失敗
            await expect(
                CacheManager.cached('failing-key', failingFn)
            ).rejects.toThrow('Function failed');
            expect(callCount).toBe(1);

            // 第二次調用應該重新執行（因為沒有快取）
            await expect(
                CacheManager.cached('failing-key', failingFn)
            ).rejects.toThrow('Function failed');
            expect(callCount).toBe(2);
        });

        it('應該在快取過期後重新執行函數', async () => {
            let callCount = 0;
            const asyncFn = async () => {
                callCount++;
                return `result-${callCount}`;
            };

            const result1 = await CacheManager.cached('expiring-async', asyncFn, 100);
            expect(result1).toBe('result-1');
            expect(callCount).toBe(1);

            // 等待快取過期
            await new Promise(resolve => setTimeout(resolve, 150));

            const result2 = await CacheManager.cached('expiring-async', asyncFn, 100);
            expect(result2).toBe('result-2');
            expect(callCount).toBe(2);
        });
    });

    describe('邊界情況測試', () => {
        it('應該能夠處理空字串 key', () => {
            expect(CacheManager.set('', 'value')).toBe(false);
            expect(CacheManager.get('')).toBe(null);
            expect(CacheManager.has('')).toBe(false);
        });

        it('應該能夠覆蓋已存在的快取', () => {
            const key = 'override-key';

            CacheManager.set(key, 'value1');
            expect(CacheManager.get(key)).toBe('value1');

            CacheManager.set(key, 'value2');
            expect(CacheManager.get(key)).toBe('value2');
        });

        it('應該能夠處理極短的過期時間', async () => {
            CacheManager.set('short-lived', 'value', 1); // 1ms

            await new Promise(resolve => setTimeout(resolve, 10));

            expect(CacheManager.get('short-lived')).toBe(null);
        });
    });
});
