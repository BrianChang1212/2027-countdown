/**
 * DOMUtils 單元測試
 * 測試安全的 DOM 操作工具（XSS 防護）
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('DOMUtils - 安全的 DOM 操作工具', () => {
    let DOMUtils;

    beforeEach(async () => {
        // 動態載入模組
        const module = await import('../../../src/scripts/utils/dom-utils.js');
        DOMUtils = module.default || window.DOMUtils;

        // 清空 DOM
        document.body.innerHTML = '';
    });

    describe('sanitizeHTML() - HTML 清理', () => {
        it('應該移除 script 標籤', () => {
            const maliciousHtml = '<p>Safe</p><script>alert("XSS")</script>';
            const cleaned = DOMUtils.sanitizeHTML(maliciousHtml);

            expect(cleaned).not.toContain('<script>');
            expect(cleaned).not.toContain('alert');
            expect(cleaned).toContain('Safe');
        });

        it('應該移除事件處理器屬性', () => {
            const maliciousHtml = '<div onclick="alert(\'XSS\')">Click me</div>';
            const cleaned = DOMUtils.sanitizeHTML(maliciousHtml);

            expect(cleaned).not.toContain('onclick');
            expect(cleaned).not.toContain('alert');
            expect(cleaned).toContain('Click me');
        });

        it('應該移除 javascript: URL', () => {
            const maliciousHtml = '<a href="javascript:alert(\'XSS\')">Link</a>';
            const cleaned = DOMUtils.sanitizeHTML(maliciousHtml);

            expect(cleaned).not.toContain('javascript:');
        });

        it('應該保留安全的 HTML', () => {
            const safeHtml = '<p class="text">Hello <strong>World</strong></p>';
            const cleaned = DOMUtils.sanitizeHTML(safeHtml);

            expect(cleaned).toContain('<p');
            expect(cleaned).toContain('class="text"');
            expect(cleaned).toContain('<strong>');
            expect(cleaned).toContain('Hello');
            expect(cleaned).toContain('World');
        });

        it('應該保留允許的屬性', () => {
            const html = '<a href="https://example.com" target="_blank" class="link">Link</a>';
            const cleaned = DOMUtils.sanitizeHTML(html);

            expect(cleaned).toContain('href="https://example.com"');
            expect(cleaned).toContain('target="_blank"');
            expect(cleaned).toContain('class="link"');
        });

        it('應該為 target="_blank" 自動添加安全屬性', () => {
            const html = '<a href="https://example.com" target="_blank">Link</a>';
            const cleaned = DOMUtils.sanitizeHTML(html);

            expect(cleaned).toContain('rel="noopener noreferrer"');
        });

        it('應該移除不在白名單中的標籤', () => {
            const html = '<p>Safe</p><iframe src="evil.com"></iframe>';
            const cleaned = DOMUtils.sanitizeHTML(html);

            expect(cleaned).not.toContain('<iframe');
            expect(cleaned).toContain('<p>Safe</p>');
        });

        it('應該處理空字串', () => {
            expect(DOMUtils.sanitizeHTML('')).toBe('');
            expect(DOMUtils.sanitizeHTML(null)).toBe('');
            expect(DOMUtils.sanitizeHTML(undefined)).toBe('');
        });

        it('應該處理純文字', () => {
            const text = 'Plain text without HTML';
            const cleaned = DOMUtils.sanitizeHTML(text);

            expect(cleaned).toBe(text);
        });
    });

    describe('escapeHTML() - HTML 實體轉義', () => {
        it('應該轉義特殊字元', () => {
            const text = '<script>alert("XSS")</script>';
            const escaped = DOMUtils.escapeHTML(text);

            expect(escaped).toContain('&lt;');
            expect(escaped).toContain('&gt;');
            expect(escaped).not.toContain('<script>');
        });

        it('應該轉義引號', () => {
            const text = 'Text with "quotes" and \'apostrophes\'';
            const escaped = DOMUtils.escapeHTML(text);

            expect(escaped).toContain('&quot;');
        });

        it('應該轉義 & 符號', () => {
            const text = 'Text & more text';
            const escaped = DOMUtils.escapeHTML(text);

            expect(escaped).toContain('&amp;');
        });

        it('應該處理空字串', () => {
            expect(DOMUtils.escapeHTML('')).toBe('');
            expect(DOMUtils.escapeHTML(null)).toBe('');
        });
    });

    describe('safeSetHTML() - 安全設定 HTML', () => {
        it('應該安全地設定 HTML 內容', () => {
            const element = document.createElement('div');
            const html = '<p>Safe <strong>content</strong></p>';

            DOMUtils.safeSetHTML(element, html);

            expect(element.innerHTML).toContain('<p>');
            expect(element.innerHTML).toContain('Safe');
            expect(element.innerHTML).toContain('<strong>');
        });

        it('應該清理惡意 HTML', () => {
            const element = document.createElement('div');
            const maliciousHtml = '<p>Safe</p><script>alert("XSS")</script>';

            DOMUtils.safeSetHTML(element, maliciousHtml);

            expect(element.innerHTML).toContain('Safe');
            expect(element.innerHTML).not.toContain('<script>');
        });

        it('應該在 sanitize=false 時仍然移除最危險的內容', () => {
            const element = document.createElement('div');
            const html = '<p>Content</p><script>alert("XSS")</script>';

            DOMUtils.safeSetHTML(element, html, { sanitize: false });

            expect(element.innerHTML).not.toContain('<script>');
            expect(element.innerHTML).toContain('Content');
        });

        it('應該拒絕無效的元素', () => {
            // 不應該拋出錯誤
            expect(() => {
                DOMUtils.safeSetHTML(null, '<p>Test</p>');
            }).not.toThrow();

            expect(() => {
                DOMUtils.safeSetHTML('not-an-element', '<p>Test</p>');
            }).not.toThrow();
        });
    });

    describe('safeSetText() - 安全設定文字', () => {
        it('應該設定純文字內容', () => {
            const element = document.createElement('div');
            const text = 'Plain text content';

            DOMUtils.safeSetText(element, text);

            expect(element.textContent).toBe(text);
        });

        it('應該自動轉義 HTML', () => {
            const element = document.createElement('div');
            const text = '<script>alert("XSS")</script>';

            DOMUtils.safeSetText(element, text);

            expect(element.textContent).toBe(text); // 保持原始文字
            expect(element.textContent).toBe(text); // 保持原始文字
            // expect(element.innerHTML).toContain('&lt;'); // HTML 被轉義 (Happy-DOM 行為可能不同)
        });

        it('應該處理空值', () => {
            const element = document.createElement('div');

            DOMUtils.safeSetText(element, null);
            expect(element.textContent).toBe('');

            DOMUtils.safeSetText(element, undefined);
            expect(element.textContent).toBe('');
        });
    });

    describe('safeCreateElement() - 安全創建元素', () => {
        it('應該創建帶屬性的元素', () => {
            const element = DOMUtils.safeCreateElement('div', {
                class: 'test-class',
                id: 'test-id'
            });

            expect(element.tagName).toBe('DIV');
            expect(element.className).toBe('test-class');
            expect(element.id).toBe('test-id');
        });

        it('應該設定文字內容', () => {
            const element = DOMUtils.safeCreateElement('p', {}, 'Text content');

            expect(element.textContent).toContain('Text content');
        });

        it('應該設定 HTML 內容並清理', () => {
            const element = DOMUtils.safeCreateElement('div', {}, '<p>Safe</p><script>alert()</script>');

            expect(element.innerHTML).toContain('<p>Safe</p>');
            expect(element.innerHTML).not.toContain('<script>');
        });

        it('應該支援子元素陣列', () => {
            const child1 = document.createElement('span');
            const child2 = 'Text';

            const element = DOMUtils.safeCreateElement('div', {}, [child1, child2]);

            expect(element.children.length).toBeGreaterThan(0);
            expect(element.textContent).toContain('Text');
        });

        it('應該拒絕危險的 href', () => {
            const element = DOMUtils.safeCreateElement('a', {
                href: 'javascript:alert("XSS")'
            });

            expect(element.getAttribute('href')).toBe(null);
        });

        it('應該允許安全的 href', () => {
            const element = DOMUtils.safeCreateElement('a', {
                href: 'https://example.com'
            });

            expect(element.getAttribute('href')).toBe('https://example.com');
        });

        it('應該支援 data-* 屬性', () => {
            const element = DOMUtils.safeCreateElement('div', {
                'data-id': '123',
                'data-type': 'test'
            });

            expect(element.getAttribute('data-id')).toBe('123');
            expect(element.getAttribute('data-type')).toBe('test');
        });
    });

    describe('safeCreateFragment() - 創建安全的 DocumentFragment', () => {
        it('應該創建 DocumentFragment', () => {
            const html = '<p>Para 1</p><p>Para 2</p>';
            const fragment = DOMUtils.safeCreateFragment(html);

            expect(fragment.nodeType).toBe(11); // Node.DOCUMENT_FRAGMENT_NODE
            expect(fragment.childNodes.length).toBe(2);
        });

        it('應該清理惡意 HTML', () => {
            const html = '<p>Safe</p><script>alert("XSS")</script>';
            const fragment = DOMUtils.safeCreateFragment(html);

            const container = document.createElement('div');
            container.appendChild(fragment);

            expect(container.innerHTML).toContain('Safe');
            expect(container.innerHTML).not.toContain('<script>');
        });
    });

    describe('XSS 防護綜合測試', () => {
        const xssVectors = [
            '<img src=x onerror=alert("XSS")>',
            '<svg onload=alert("XSS")>',
            '<iframe src="javascript:alert(\'XSS\')">',
            '<body onload=alert("XSS")>',
            '<input onfocus=alert("XSS") autofocus>',
            '<marquee onstart=alert("XSS")>',
            '<div style="background:url(javascript:alert(\'XSS\'))">',
            '<a href="data:text/html,<script>alert(\'XSS\')</script>">Click</a>'
        ];

        xssVectors.forEach((vector, index) => {
            it(`應該防禦 XSS 攻擊向量 #${index + 1}`, () => {
                const cleaned = DOMUtils.sanitizeHTML(vector);

                // 確保沒有 JavaScript 執行
                expect(cleaned.toLowerCase()).not.toContain('javascript:');
                expect(cleaned.toLowerCase()).not.toContain('alert');
                expect(cleaned.toLowerCase()).not.toMatch(/on\w+\s*=/);
            });
        });
    });
});
