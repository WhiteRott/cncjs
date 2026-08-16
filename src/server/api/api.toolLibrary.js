import find from 'lodash/find';
import castArray from 'lodash/castArray';
import isPlainObject from 'lodash/isPlainObject';
import uuid from 'uuid';
import settings from '../config/settings';
import logger from '../lib/logger';
import config from '../services/configstore';
import { getPagingRange } from './paging';
import {
  ERR_BAD_REQUEST,
  ERR_NOT_FOUND,
  ERR_INTERNAL_SERVER_ERROR
} from '../constants';

const log = logger('api:toolLibrary');
const CONFIG_KEY = 'toolLibrary';

const toRecordFields = (record) => {
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
    notes = ''
  } = { ...record };

  return { id, mtime, number, name, type, diameter, fluteLength, length, flutes, notes };
};

const getSanitizedRecords = () => {
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

export const fetch = (req, res) => {
  const records = getSanitizedRecords();
  const paging = !!req.query.paging;

  if (paging) {
    const { page = 1, pageLength = 10 } = req.query;
    const totalRecords = records.length;
    const [begin, end] = getPagingRange({ page, pageLength, totalRecords });
    const pagedRecords = records.slice(begin, end);

    res.send({
      pagination: {
        page: Number(page),
        pageLength: Number(pageLength),
        totalRecords: Number(totalRecords)
      },
      records: pagedRecords.map(toRecordFields)
    });
  } else {
    res.send({
      records: records.map(toRecordFields)
    });
  }
};

export const create = (req, res) => {
  const { name } = { ...req.body };

  if (!name) {
    res.status(ERR_BAD_REQUEST).send({
      msg: 'The "name" parameter must not be empty'
    });
    return;
  }

  try {
    const records = getSanitizedRecords();
    const record = toRecordFields({
      ...req.body,
      id: uuid.v4(),
      mtime: new Date().getTime(),
      name
    });

    records.push(record);
    config.set(CONFIG_KEY, records);

    res.send({ err: null });
  } catch (err) {
    res.status(ERR_INTERNAL_SERVER_ERROR).send({
      msg: 'Failed to save ' + JSON.stringify(settings.rcfile)
    });
  }
};

export const read = (req, res) => {
  const id = req.params.id;
  const records = getSanitizedRecords();
  const record = find(records, { id: id });

  if (!record) {
    res.status(ERR_NOT_FOUND).send({
      msg: 'Not found'
    });
    return;
  }

  res.send(toRecordFields(record));
};

export const update = (req, res) => {
  const id = req.params.id;
  const records = getSanitizedRecords();
  const record = find(records, { id: id });

  if (!record) {
    res.status(ERR_NOT_FOUND).send({
      msg: 'Not found'
    });
    return;
  }

  const { name = record.name } = { ...req.body };

  if (!name) {
    res.status(ERR_BAD_REQUEST).send({
      msg: 'The "name" parameter must not be empty'
    });
    return;
  }

  try {
    const updatedRecord = toRecordFields({
      ...record,
      ...req.body,
      id: record.id,
      mtime: new Date().getTime(),
      name
    });

    const index = records.findIndex(r => r.id === id);
    records[index] = updatedRecord;
    config.set(CONFIG_KEY, records);

    res.send({ err: null });
  } catch (err) {
    res.status(ERR_INTERNAL_SERVER_ERROR).send({
      msg: 'Failed to save ' + JSON.stringify(settings.rcfile)
    });
  }
};

export const __delete = (req, res) => {
  const id = req.params.id;
  const records = getSanitizedRecords();
  const record = find(records, { id: id });

  if (!record) {
    res.status(ERR_NOT_FOUND).send({
      msg: 'Not found'
    });
    return;
  }

  try {
    const filteredRecords = records.filter(record => {
      return record.id !== id;
    });
    config.set(CONFIG_KEY, filteredRecords);

    res.send({ err: null });
  } catch (err) {
    res.status(ERR_INTERNAL_SERVER_ERROR).send({
      msg: 'Failed to save ' + JSON.stringify(settings.rcfile)
    });
  }
};
