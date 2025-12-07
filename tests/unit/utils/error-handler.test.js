import { describe, it, expect, vi, beforeEach } from 'vitest';
import ErrorHandler from '../../../src/scripts/utils/error-handler.js';

describe('ErrorHandler', () => {
    beforeEach(() => {
        // test-setup.js provides global.Logger mock
        vi.clearAllMocks();
        // Reset config to defaults
        ErrorHandler.config.enableLogging = false;
        ErrorHandler.config.maxRetries = 3;
    });

    describe('Error Type Detection', () => {
        it('should identify network errors', () => {
            const fetchError = new TypeError('Failed to fetch');
            const corsError = new Error('CORS error');
            const netError = new Error('network connection lost');

            expect(ErrorHandler.getErrorType(fetchError)).toBe(ErrorHandler.ErrorType.NETWORK);
            expect(ErrorHandler.getErrorType(corsError)).toBe(ErrorHandler.ErrorType.NETWORK);
            expect(ErrorHandler.getErrorType(netError)).toBe(ErrorHandler.ErrorType.NETWORK);
        });

        it('should identify API errors', () => {
            const error = new Error('API Error');
            error.status = 500;
            expect(ErrorHandler.getErrorType(error)).toBe(ErrorHandler.ErrorType.API);
        });

        it('should identify validation errors', () => {
            const error1 = new Error('validation failed');
            const error2 = new Error('invalid input');
            error2.name = 'ValidationError';

            expect(ErrorHandler.getErrorType(error1)).toBe(ErrorHandler.ErrorType.VALIDATION);
            expect(ErrorHandler.getErrorType(error2)).toBe(ErrorHandler.ErrorType.VALIDATION);
        });

        it('should default to RUNTIME/UNKNOWN error', () => {
            const error = new Error('Random crash');
            expect(ErrorHandler.getErrorType(error)).toBe(ErrorHandler.ErrorType.RUNTIME);
            expect(ErrorHandler.getErrorType(null)).toBe(ErrorHandler.ErrorType.UNKNOWN);
        });
    });

    describe('Logging', () => {
        it('should log errors when logging is enabled', () => {
            ErrorHandler.config.enableLogging = true;
            const error = new Error('Test Error');

            ErrorHandler.logError(error, 'TestContext');

            expect(global.Logger.error).toHaveBeenCalledTimes(1);
            expect(global.Logger.error).toHaveBeenCalledWith(
                '[ErrorHandler]',
                expect.objectContaining({
                    message: 'Test Error',
                    context: 'TestContext'
                })
            );
        });

        it('should not log errors when logging is disabled', () => {
            ErrorHandler.config.enableLogging = false;
            ErrorHandler.logError(new Error('Test Error'));
            expect(global.Logger.error).not.toHaveBeenCalled();
        });
    });

    describe('Safe Execution', () => {
        it('should return function result on success', async () => {
            const fn = vi.fn().mockResolvedValue('success');
            const result = await ErrorHandler.safeExecute(fn);
            expect(result).toBe('success');
        });

        it('should return fallback on failure and log error', async () => {
            ErrorHandler.config.enableLogging = true;
            const fn = vi.fn().mockRejectedValue(new Error('fail'));
            const result = await ErrorHandler.safeExecute(fn, 'context', 'fallback');

            expect(result).toBe('fallback');
            expect(global.Logger.error).toHaveBeenCalled();
        });
    });

    describe('Retry Logic', () => {
        it('should retry failed operations', async () => {
            const fn = vi.fn()
                .mockRejectedValueOnce(new Error('fail 1'))
                .mockRejectedValueOnce(new Error('fail 2'))
                .mockResolvedValue('success');

            // Speed up retries
            const result = await ErrorHandler.retryExecute(fn, 'ctx', 3, 1);

            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(3);
        });

        it('should throw after max retries', async () => {
            ErrorHandler.config.enableLogging = true;
            const fn = vi.fn().mockRejectedValue(new Error('fail always'));

            await expect(ErrorHandler.retryExecute(fn, 'ctx', 2, 1))
                .rejects.toThrow('fail always');

            expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
            expect(global.Logger.error).toHaveBeenCalled();
        });
    });

    describe('Safe Fetch', () => {
        it('should return response if ok', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: true });
            const res = await ErrorHandler.safeFetch('url');
            expect(res.ok).toBe(true);
        });

        it('should throw processed error if response not ok', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: async () => ({ message: 'Custom Message' })
            });

            await expect(ErrorHandler.safeFetch('url'))
                .rejects.toThrow('Custom Message');
        });

        it('should handle network errors', async () => {
            global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
            ErrorHandler.config.enableLogging = true;

            await expect(ErrorHandler.safeFetch('url'))
                .rejects.toThrow();

            expect(global.Logger.error).toHaveBeenCalledWith(
                '[ErrorHandler]',
                expect.objectContaining({ type: ErrorHandler.ErrorType.NETWORK })
            );
        });
    });
});
