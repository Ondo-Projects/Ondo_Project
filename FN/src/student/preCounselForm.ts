import type {
  PreCounselingProfile,
  PreCounselingProfileSaveRequest,
} from '../api/types/student';

export interface PreCounselFormState {
  studentPhone: string;
  parentPhone: string;
  mbti: string;
  futureHope: string;
  favoriteWords: string;
  personalityStrength: string;
  personalityWeakness: string;
  hobbiesSpecialtiesInterests: string;
  happiestMoment: string;
  stressfulMoment: string;
  stressReliefMethod: string;
  memorableSchoolMoment: string;
  desiredFriendType: string;
  desiredClassRole: string;
}

export const EMPTY_PRE_COUNSEL_FORM: PreCounselFormState = {
  studentPhone: '',
  parentPhone: '',
  mbti: '',
  futureHope: '',
  favoriteWords: '',
  personalityStrength: '',
  personalityWeakness: '',
  hobbiesSpecialtiesInterests: '',
  happiestMoment: '',
  stressfulMoment: '',
  stressReliefMethod: '',
  memorableSchoolMoment: '',
  desiredFriendType: '',
  desiredClassRole: '',
};

export function mapProfileToForm(profile: PreCounselingProfile): PreCounselFormState {
  return {
    studentPhone: profile.studentPhone ?? '',
    parentPhone: profile.parentPhone ?? '',
    mbti: profile.mbti ?? '',
    futureHope: profile.futureHope ?? '',
    favoriteWords: profile.favoriteWords ?? '',
    personalityStrength: profile.personalityStrength ?? '',
    personalityWeakness: profile.personalityWeakness ?? '',
    hobbiesSpecialtiesInterests: profile.hobbiesSpecialtiesInterests ?? '',
    happiestMoment: profile.happiestMoment ?? '',
    stressfulMoment: profile.stressfulMoment ?? '',
    stressReliefMethod: profile.stressReliefMethod ?? '',
    memorableSchoolMoment: profile.memorableSchoolMoment ?? '',
    desiredFriendType: profile.desiredFriendType ?? '',
    desiredClassRole: profile.desiredClassRole ?? '',
  };
}

export function mapFormToSaveRequest(form: PreCounselFormState): PreCounselingProfileSaveRequest {
  return {
    studentPhone: form.studentPhone.trim(),
    parentPhone: form.parentPhone.trim(),
    mbti: form.mbti.trim(),
    futureHope: form.futureHope.trim(),
    favoriteWords: form.favoriteWords.trim(),
    personalityStrength: form.personalityStrength.trim(),
    personalityWeakness: form.personalityWeakness.trim(),
    hobbiesSpecialtiesInterests: form.hobbiesSpecialtiesInterests.trim(),
    happiestMoment: form.happiestMoment.trim(),
    stressfulMoment: form.stressfulMoment.trim(),
    stressReliefMethod: form.stressReliefMethod.trim(),
    memorableSchoolMoment: form.memorableSchoolMoment.trim(),
    desiredFriendType: form.desiredFriendType.trim(),
    desiredClassRole: form.desiredClassRole.trim(),
  };
}
