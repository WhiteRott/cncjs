import castArray from 'lodash/castArray';
import isPlainObject from 'lodash/isPlainObject';
import uuid from 'uuid';
import logger from './logger';
import config from '../services/configstore';

const log = logger('lib:toolLibrary');

export const CONFIG_KEY = 'toolLibrary';

export const toRecordFields = (record) => {
  const {
    id,
    mtime,
    number = 0,
    name = '',
    type = '',
    diameter = 0,
    fluteLength = 0,
    length = 0,
    flutes = 0,
    notes = '',
    active = false,
    // Z length offset (mm), measured by the TLO tool-change probe cycle and
    // persisted here so it survives past that single tool change.
    zOffset = 0,
    zOffsetTime = 0
  } = { ...record };

  return { id, mtime, number, name, type, diameter, fluteLength, length, flutes, notes, active, zOffset, zOffsetTime };
};

export const getSanitizedRecords = () => {
  const records = castArray(config.get(CONFIG_KEY, []));

  let shouldUpdate = false;
  for (let i = 0; i < records.length; ++i) {
    if (!isPlainObject(records[i])) {
      records[i] = {};
    }

    const record = records[i];

    if (!record.id) {
      record.id = uuid.v4();
      shouldUpdate = true;
    }
  }

  if (shouldUpdate) {
    log.debug(`update sanitized records: ${JSON.stringify(records)}`);

    // Pass `{ silent changes }` will suppress the change event
    config.set(CONFIG_KEY, records, { silent: true });
  }

  return records;
};

// Persists a freshly-measured Z offset (in mm) against the tool library
// record matching `toolNumber`. Matches on tool number rather than the
// UI's "active" flag so the write follows the T-word the tool-change
// routine actually probed for, not a separately-toggled UI selection that
// could be stale. No-op if no record has that tool number -- writing an
// offset against a made-up record would be worse than not writing it.
export const updateToolZOffsetByNumber = (toolNumber, zOffsetMm) => {
  const records = getSanitizedRecords();
  const index = records.findIndex((record) => Number(record.number) === Number(toolNumber));

  if (index < 0) {
    log.warn(`No tool library record for tool number ${toolNumber}; Z offset not saved`);
    return false;
  }

  records[index] = toRecordFields({
    ...records[index],
    zOffset: Number(zOffsetMm) || 0,
    zOffsetTime: new Date().getTime()
  });
  config.set(CONFIG_KEY, records);

  return true;
};
