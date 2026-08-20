/* eslint-env jest */
import fs from 'fs';
import os from 'os';
import path from 'path';
import config from '../../services/configstore';
import { getSanitizedRecords, updateToolZOffsetByNumber } from '../toolLibrary';

describe('toolLibrary', () => {
  let tmpFile;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `cncjs-toollibrary-test-${Date.now()}-${Math.random()}.json`);
    fs.writeFileSync(tmpFile, JSON.stringify({
      toolLibrary: [
        { id: 'a', number: 1, name: 'Endmill 1', zOffset: 0, zOffsetTime: 0 },
        { id: 'b', number: 2, name: 'Endmill 2', zOffset: 0, zOffsetTime: 0 },
      ]
    }));
    // Set the file and reload directly rather than calling config.load(),
    // which also starts an fs.watchFile() watcher with no matching teardown
    // here -- that handle keeps Jest's process alive after the run.
    config.file = tmpFile;
    config.reload();
  });

  afterEach(() => {
    fs.unlinkSync(tmpFile);
  });

  describe('updateToolZOffsetByNumber', () => {
    it('persists the offset against the record with the matching tool number', () => {
      const ok = updateToolZOffsetByNumber(2, -12.345);

      expect(ok).toBe(true);

      const records = getSanitizedRecords();
      const tool1 = records.find((record) => record.number === 1);
      const tool2 = records.find((record) => record.number === 2);

      expect(tool2.zOffset).toBe(-12.345);
      expect(tool2.zOffsetTime).toBeGreaterThan(0);
      // Unrelated tools are left untouched
      expect(tool1.zOffset).toBe(0);
      expect(tool1.zOffsetTime).toBe(0);
    });

    it('does nothing when no record matches the tool number', () => {
      const ok = updateToolZOffsetByNumber(99, -1);

      expect(ok).toBe(false);

      const records = getSanitizedRecords();
      expect(records.every((record) => record.zOffset === 0)).toBe(true);
    });

    it('coerces the tool number for comparison so a string T-word still matches', () => {
      const ok = updateToolZOffsetByNumber('1', -5);

      expect(ok).toBe(true);

      const records = getSanitizedRecords();
      const tool1 = records.find((record) => record.number === 1);
      expect(tool1.zOffset).toBe(-5);
    });
  });
});
