export type ObjectType = "INTEGER" | "BOOLEAN" | "NULL";
export const INTEGER_OBJ: ObjectType = "INTEGER";
export const BOOLEAN_OBJ: ObjectType = "BOOLEAN";
export const NULL_OBJ: ObjectType = "NULL";

export interface Object_ {
  type(): ObjectType;
  inspect(): string;
}

export class Integer implements Object_ {
  value: number;
  constructor(value: number) {
    this.value = value;
  }

  type(): ObjectType {
    return INTEGER_OBJ;
  }
  inspect(): string {
    return `${this.value}`;
  }
}

export class Boolean_ implements Object_ {
  value: boolean;
  constructor(value: boolean) {
    this.value = value;
  }

  type(): ObjectType {
    return BOOLEAN_OBJ;
  }
  inspect(): string {
    return `${this.value}`;
  }
}

export class Null implements Object_ {
  type(): ObjectType {
    return NULL_OBJ;
  }
  inspect(): string {
    return "null";
  }
}