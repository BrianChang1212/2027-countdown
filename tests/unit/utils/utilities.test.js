/**
 * Helpers (utilities.js) 單元測試
 * 測試共用工具函數庫
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Helpers 工具函數庫', () => {
    let Helpers;

    beforeEach(async () => {
        // 動態載入模組
        const module = await import('../../../src/scripts/utils/utilities.js');
        Helpers = module.default || window.Helpers;
    });

    describe('padNumber() - 數字補零', () => {
        it('應該將單位數字補零', () => {
            expect(Helpers.padNumber(5)).toBe('05');
            expect(Helpers.padNumber(9)).toBe('09');
        });

        it('應該保持雙位數不變', () => {
            expect(Helpers.padNumber(10)).toBe('10');
            expect(Helpers.padNumber(99)).toBe('99');
        });

        it('應該支援自訂位數', () => {
            expect(Helpers.padNumber(5, 3)).toBe('005');
            expect(Helpers.padNumber(42, 4)).toBe('0042');
        });

        it('應該處理零', () => {
            expect(Helpers.padNumber(0)).toBe('00');
            expect(Helpers.padNumber(0, 3)).toBe('000');
        });
    });

    describe('stripHtml() - 移除 HTML 標籤', () => {
        it('應該移除所有 HTML 標籤', () => {
            const html = '<p>Hello <strong>World</strong></p>';
            expect(Helpers.stripHtml(html)).toBe('Hello World');
        });

        it('應該處理複雜的 HTML', () => {
            const html = '<div class="test"><h1>Title</h1><p>Content</p></div>';
            expect(Helpers.stripHtml(html)).toBe('TitleContent');
        });

        it('應該處理空字串', () => {
            expect(Helpers.stripHtml('')).toBe('');
            expect(Helpers.stripHtml(null)).toBe('');
            expect(Helpers.stripHtml(undefined)).toBe('');
        });

        it('應該處理純文字', () => {
            expect(Helpers.stripHtml('Plain text')).toBe('Plain text');
        });
    });

    describe('truncateText() - 截斷文字', () => {
        it('應該截斷過長的文字', () => {
            const text = 'This is a very long text that needs to be truncated';
            expect(Helpers.truncateText(text, 20)).toBe('This is a very long ...');
        });

        it('應該保持短文字不變', () => {
            const text = 'Short text';
            expect(Helpers.truncateText(text, 20)).toBe('Short text');
        });

        it('應該支援自訂後綴', () => {
            const text = 'Long text here';
            expect(Helpers.truncateText(text, 8, '…')).toBe('Long tex…');
        });

        it('應該處理空字串', () => {
            expect(Helpers.truncateText('', 10)).toBe('');
            expect(Helpers.truncateText(null, 10)).toBe(null);
        });

        it('應該處理剛好等於最大長度的文字', () => {
            const text = '12345';
            expect(Helpers.truncateText(text, 5)).toBe('12345');
        });
    });

    describe('formatLargeNumber() - 格式化大數字', () => {
        it('應該格式化百萬級數字', () => {
            expect(Helpers.formatLargeNumber(1500000)).toBe('1.5M');
            expect(Helpers.formatLargeNumber(2000000)).toBe('2.0M');
        });

        it('應該格式化千級數字', () => {
            expect(Helpers.formatLargeNumber(5000)).toBe('5K');
            expect(Helpers.formatLargeNumber(1500)).toBe('2K'); // 四捨五入
        });

        it('應該保持小數字不變', () => {
            expect(Helpers.formatLargeNumber(999)).toBe('999');
            expect(Helpers.formatLargeNumber(500)).toBe('500');
        });

        it('應該處理零', () => {
            expect(Helpers.formatLargeNumber(0)).toBe('0');
        });
    });

    describe('debounce() - 防抖函數', () => {
        it('應該延遲執行函數', async () => {
            const fn = vi.fn();
            const debounced = Helpers.debounce(fn, 100);

            debounced();
            expect(fn).not.toHaveBeenCalled();

            await new Promise(resolve => setTimeout(resolve, 150));
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('應該在連續調用時只執行最後一次', async () => {
            const fn = vi.fn();
            const debounced = Helpers.debounce(fn, 100);

            debounced();
            debounced();
            debounced();

            await new Promise(resolve => setTimeout(resolve, 150));
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('應該傳遞正確的參數', async () => {
            const fn = vi.fn();
            const debounced = Helpers.debounce(fn, 50);

            debounced('arg1', 'arg2');

            await new Promise(resolve => setTimeout(resolve, 100));
            expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
        });
    });

    describe('throttle() - 節流函數', () => {
        it('應該限制函數執行頻率', async () => {
            const fn = vi.fn();
            const throttled = Helpers.throttle(fn, 100);

            throttled(); // 第 1 次：立即執行
            throttled(); // 第 2 次：被節流
            throttled(); // 第 3 次：被節流

            expect(fn).toHaveBeenCalledTimes(1);

            await new Promise(resolve => setTimeout(resolve, 150));

            throttled(); // 第 4 次：可以執行
            expect(fn).toHaveBeenCalledTimes(2);
        });

        it('應該傳遞正確的參數', () => {
            const fn = vi.fn();
            const throttled = Helpers.throttle(fn, 100);

            throttled('test', 123);
            expect(fn).toHaveBeenCalledWith('test', 123);
        });
    });

    describe('safeJsonParse() - 安全的 JSON 解析', () => {
        it('應該解析有效的 JSON', () => {
            const json = '{"key": "value", "number": 42}';
            const result = Helpers.safeJsonParse(json);

            expect(result).toEqual({ key: 'value', number: 42 });
        });

        it('應該在解析失敗時返回預設值', () => {
            const invalidJson = '{invalid json}';
            const result = Helpers.safeJsonParse(invalidJson, { default: true });

            expect(result).toEqual({ default: true });
        });

        it('應該在未提供預設值時返回 null', () => {
            const invalidJson = 'not json';
            const result = Helpers.safeJsonParse(invalidJson);

            expect(result).toBe(null);
        });

        it('應該解析陣列', () => {
            const json = '[1, 2, 3]';
            const result = Helpers.safeJsonParse(json);

            expect(result).toEqual([1, 2, 3]);
        });
    });

    describe('isValidUrl() - URL 驗證', () => {
        it('應該驗證有效的 URL', () => {
            expect(Helpers.isValidUrl('https://example.com')).toBe(true);
            expect(Helpers.isValidUrl('http://test.org/path')).toBe(true);
            expect(Helpers.isValidUrl('https://sub.domain.com/path?query=value')).toBe(true);
        });

        it('應該拒絕無效的 URL', () => {
            expect(Helpers.isValidUrl('not a url')).toBe(false);
            expect(Helpers.isValidUrl('htp://wrong')).toBe(false);
            expect(Helpers.isValidUrl('')).toBe(false);
        });

        it('應該處理相對路徑（無效）', () => {
            expect(Helpers.isValidUrl('/relative/path')).toBe(false);
            expect(Helpers.isValidUrl('./file.html')).toBe(false);
        });
    });

    describe('generateId() - 產生唯一 ID', () => {
        it('應該產生唯一 ID', () => {
            const id1 = Helpers.generateId();
            const id2 = Helpers.generateId();

            expect(id1).toBeTruthy();
            expect(id2).toBeTruthy();
            expect(id1).not.toBe(id2);
        });

        it('應該產生字串型別的 ID', () => {
            const id = Helpers.generateId();
            expect(typeof id).toBe('string');
        });

        it('應該產生長度合理的 ID', () => {
            const id = Helpers.generateId();
            expect(id.length).toBeGreaterThan(10);
        });
    });

    describe('sleep() - 等待指定時間', () => {
        it('應該等待指定的毫秒數', async () => {
            const start = Date.now();
            await Helpers.sleep(100);
            const end = Date.now();

            expect(end - start).toBeGreaterThanOrEqual(90); // 允許一些誤差
        });

        it('應該返回 Promise', () => {
            const result = Helpers.sleep(10);
            expect(result).toBeInstanceOf(Promise);
        });
    });

    describe('getNestedProperty() - 取得巢狀物件屬性', () => {
        const testObj = {
            a: {
                b: {
                    c: 'value'
                }
            },
            x: 42
        };

        it('應該取得巢狀屬性', () => {
            expect(Helpers.getNestedProperty(testObj, 'a.b.c')).toBe('value');
            expect(Helpers.getNestedProperty(testObj, 'x')).toBe(42);
        });

        it('應該在屬性不存在時返回預設值', () => {
            expect(Helpers.getNestedProperty(testObj, 'a.b.d', 'default')).toBe('default');
            expect(Helpers.getNestedProperty(testObj, 'y.z', null)).toBe(null);
        });

        it('應該處理未定義的屬性路徑', () => {
            expect(Helpers.getNestedProperty(testObj, 'x.y.z')).toBe(undefined);
        });

        it('應該返回 undefined（如果沒有提供預設值）', () => {
            expect(Helpers.getNestedProperty(testObj, 'not.exist')).toBe(undefined);
        });
    });

    describe('formatRelativeTime() - 格式化相對時間', () => {
        it('應該格式化分鐘前', () => {
            const now = new Date();
            const past = new Date(now.getTime() - 30 * 60000); // 30 分鐘前

            const result = Helpers.formatRelativeTime(past);
            expect(result).toContain('30');
            expect(result).toContain('分鐘前');
        });

        it('應該格式化小時前', () => {
            const now = new Date();
            const past = new Date(now.getTime() - 3 * 3600000); // 3 小時前

            const result = Helpers.formatRelativeTime(past);
            expect(result).toContain('3');
            expect(result).toContain('小時前');
        });

        it('應該格式化天數前', () => {
            const now = new Date();
            const past = new Date(now.getTime() - 2 * 86400000); // 2 天前

            const result = Helpers.formatRelativeTime(past);
            expect(result).toContain('2');
            expect(result).toContain('天前');
        });

        it('應該處理無效日期', () => {
            const result = Helpers.formatRelativeTime('invalid-date');
            expect(result).toBe('');
        });
    });
});
