import { getActivePerson } from './storage.ts';

/** 写入手札时附带：这次问谁 */
export type ReadingSubjectMeta = {
  subjectId: string;
  subjectName: string;
};

export function currentReadingSubject(): ReadingSubjectMeta {
  const person = getActivePerson();
  return {
    subjectId: person.id,
    subjectName: person.nickname,
  };
}
