import { describe, expect, it } from 'vitest';
import {
  birthFieldsFromValue,
  hourWheelLabel,
  lunarToSolar,
  shichenOfHour,
  solarToLunar,
  valueFromBirthFields,
} from './birth-datetime.ts';

describe('birth-datetime', () => {
  it('maps clock hour to 时辰 label', () => {
    expect(shichenOfHour(12)).toBe('午');
    expect(hourWheelLabel(12)).toBe('12午时');
    expect(shichenOfHour(0)).toBe('子');
    expect(shichenOfHour(23)).toBe('子');
  });

  it('round-trips 农历五月初三 ↔ 公历 1980-06-15', () => {
    const solar = lunarToSolar(1980, 5, 3, 12, 30);
    expect(solar).toMatchObject({
      year: 1980,
      month: 6,
      day: 15,
      hour: 12,
      minute: 30,
    });
    const lunar = solarToLunar(solar);
    expect(lunar).toMatchObject({ year: 1980, month: 5, day: 3 });
  });

  it('stores clock hour string for parseBirthParts', () => {
    const fields = birthFieldsFromValue({
      year: 2005,
      month: 1,
      day: 1,
      hour: 12,
      minute: 0,
    });
    expect(fields.birthHour).toBe('12:00');
    expect(valueFromBirthFields(fields.birthYear, fields.birthMonth, fields.birthDay, fields.birthHour)).toEqual({
      year: 2005,
      month: 1,
      day: 1,
      hour: 12,
      minute: 0,
    });
  });
});
