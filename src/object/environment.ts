import { Object_ } from "./object";

export class Environment {
  store: Map<string, Object_> = new Map();

  get(name: string) {
    const obj = this.store.get(name);
    return { value: obj, exist: !!obj };
  }

  set(name: string, obj: Object_) {
    this.store.set(name, obj);
    return obj;
  }
}
