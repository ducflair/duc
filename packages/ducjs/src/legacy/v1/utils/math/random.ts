import { nanoid } from "nanoid";

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

class Random {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    if (this.seed) {
      return ((2 ** 31 - 1) & (this.seed = Math.imul(48271, this.seed))) / 2 ** 31;
    } else {
      return Math.random();
    }
  }
}

let random = new Random(Date.now());
let testIdBase = 0;

export const randomInteger = () => Math.floor(random.next() * 2 ** 31);

export const reseed = (seed: number) => {
  random = new Random(seed);
  testIdBase = 0;
};

export const randomId = () => nanoid();
