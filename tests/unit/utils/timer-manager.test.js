import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TimerManager from '../../../src/scripts/utils/timer-manager.js';

describe('TimerManager', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        TimerManager.clearAll();
    });

    afterEach(() => {
        vi.useRealTimers();
        TimerManager.clearAll();
    });

    it('should create a timer and execute callback', () => {
        const callback = vi.fn();
        const id = TimerManager.create('test-timer', callback, 1000);

        expect(id).toBe('test-timer');
        expect(TimerManager.has('test-timer')).toBe(true);

        vi.advanceTimersByTime(1000);
        expect(callback).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(2000);
        expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should auto-generate name if not provided', () => {
        const callback = vi.fn();
        const id1 = TimerManager.create(null, callback, 1000);
        const id2 = TimerManager.create(null, callback, 1000);

        expect(id1).toMatch(/^timer_\d+$/);
        expect(id2).toMatch(/^timer_\d+$/);
        expect(id1).not.toBe(id2);
    });

    it('should clear a specific timer', () => {
        const callback = vi.fn();
        TimerManager.create('test-timer', callback, 1000);

        const result = TimerManager.clear('test-timer');
        expect(result).toBe(true);
        expect(TimerManager.has('test-timer')).toBe(false);

        vi.advanceTimersByTime(2000);
        expect(callback).not.toHaveBeenCalled();
    });

    it('should return false when clearing non-existent timer', () => {
        const result = TimerManager.clear('non-existent');
        expect(result).toBe(false);
    });

    it('should clear all timers', () => {
        const callback1 = vi.fn();
        const callback2 = vi.fn();

        TimerManager.create('t1', callback1, 1000);
        TimerManager.create('t2', callback2, 1000);

        expect(TimerManager.getStats().total).toBe(2);

        const count = TimerManager.clearAll();
        expect(count).toBe(2);
        expect(TimerManager.getStats().total).toBe(0);

        vi.advanceTimersByTime(2000);
        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).not.toHaveBeenCalled();
    });

    it('should replace existing timer if created with same name', () => {
        const callback1 = vi.fn();
        const callback2 = vi.fn();

        TimerManager.create('shared-name', callback1, 1000);

        // Advance check
        vi.advanceTimersByTime(1000);
        expect(callback1).toHaveBeenCalledTimes(1);

        // Overwrite
        TimerManager.create('shared-name', callback2, 500);

        vi.advanceTimersByTime(500);
        expect(callback2).toHaveBeenCalledTimes(1);

        // callback1 should stop firing
        vi.advanceTimersByTime(500);
        expect(callback1).toHaveBeenCalledTimes(1); // still 1
    });

    it('should retrieve timer info', () => {
        const callback = vi.fn();
        TimerManager.create('info-test', callback, 500);

        const info = TimerManager.get('info-test');
        expect(info).toBeDefined();
        expect(info.delay).toBe(500);
        expect(info.callback).toBe(callback);
        expect(info).toHaveProperty('createdAt');
    });

    it('should list all timer names', () => {
        TimerManager.create('a', () => { }, 100);
        TimerManager.create('b', () => { }, 100);

        const list = TimerManager.list();
        expect(list).toContain('a');
        expect(list).toContain('b');
        expect(list.length).toBe(2);
    });
});
