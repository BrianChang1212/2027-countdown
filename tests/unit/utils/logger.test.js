import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Logger Utility', () => {
    let Logger;

    beforeEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
        // Clear global config and window attachment
        delete global.CONFIG;
        if (typeof window !== 'undefined') {
            delete window.Logger;
        }
    });

    it('should default to WARN level when CONFIG is undefined (Production)', async () => {
        // Dynamic import to ensure IIFE runs with current global state
        const module = await import('../../../src/scripts/utils/logger.js');
        Logger = module.default || module; // Handle ESM/CJS differences if any

        const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => { });
        const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => { });
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        Logger.debug('should not show');
        Logger.info('should not show');
        Logger.warn('should show');
        Logger.error('should show');

        expect(debugSpy).not.toHaveBeenCalled();
        expect(infoSpy).not.toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('should show'));
    });

    it('should enable DEBUG level when CONFIG.DEBUG is true', async () => {
        global.CONFIG = { DEBUG: true };

        const module = await import('../../../src/scripts/utils/logger.js');
        Logger = module.default || module;

        const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => { });

        Logger.debug('debug message');

        expect(debugSpy).toHaveBeenCalledTimes(1);
        expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('debug message'));
    });

    it('should include module name in logs', async () => {
        global.CONFIG = { DEBUG: true };
        const module = await import('../../../src/scripts/utils/logger.js');
        Logger = module.default || module;

        const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => { });

        Logger.info('test message', 'MyModule');

        expect(infoSpy).toHaveBeenCalledWith(expect.stringMatching(/\[MyModule\]/));
        expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('test message'));
    });

    it('should handle success logs correctly', async () => {
        global.CONFIG = { DEBUG: true };
        const module = await import('../../../src/scripts/utils/logger.js');
        Logger = module.default || module;

        const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => { });

        Logger.success('Job done', 'Worker');

        expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Job done'));
        expect(infoSpy).toHaveBeenCalledWith(expect.stringMatching(/\[Worker\]/));
    });

    it('should clear console if supported and allowed', async () => {
        global.CONFIG = { DEBUG: true };
        const module = await import('../../../src/scripts/utils/logger.js');
        Logger = module.default || module;

        // console.clear might not be mockable depending on env, but we try
        const clearSpy = vi.spyOn(console, 'clear').mockImplementation(() => { });

        Logger.clear();

        expect(clearSpy).toHaveBeenCalled();
    });
});
