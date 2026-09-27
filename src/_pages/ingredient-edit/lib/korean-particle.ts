const HANGUL_SYLLABLE_START = 0xac00;
const HANGUL_SYLLABLE_END = 0xd7a3;
const JONGSEONG_COUNT = 28;

/**
 * 재료 이름 뒤에 붙는 주격 조사를 받침에 맞춰 고른다.
 * 이름에는 영문·숫자도 들어올 수 있어 한글 음절이 아니면 `이(가)`로 둔다.
 */
export function withSubjectParticle(word: string) {
  const lastCharacter = word.at(-1) ?? "";
  const code = lastCharacter.charCodeAt(0);

  if (code < HANGUL_SYLLABLE_START || code > HANGUL_SYLLABLE_END) {
    return `${word}이(가)`;
  }

  const hasJongseong = (code - HANGUL_SYLLABLE_START) % JONGSEONG_COUNT !== 0;

  return `${word}${hasJongseong ? "이" : "가"}`;
}
