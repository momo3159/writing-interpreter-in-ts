import { Object_ } from "./object";

export class Environment {
  store: Map<string, Object_> = new Map();
  outer: Environment | null;
  constructor(outer: Environment | null = null) {
    this.outer = outer;
  }

  get(name: string) {
    let obj = this.store.get(name);
    if (!!!obj && this.outer !== null) {
      obj = this.outer.store.get(name);
    }
    return { value: obj, exist: !!obj };
  }

  set(name: string, obj: Object_) {
    this.store.set(name, obj);
    return obj;
  }
}

export const createEnclosedEnvironment = (outer: Environment) => {
  return new Environment(outer);
};
