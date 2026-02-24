function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createSeededRng(seed: string) {
  let state = hashSeed(seed) || 0x9e3779b9;

  function next() {
    // xorshift32
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  }

  function pickIndex(length: number) {
    if (length <= 0) throw new Error("Cannot pick from empty array");
    return Math.floor(next() * length);
  }

  return { next, pickIndex };
}
