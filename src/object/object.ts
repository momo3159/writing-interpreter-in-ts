export type ObjectType =
  | "INTEGER"
  | "BOOLEAN"
  | "NULL"
  | "RETURN_VALUE"
  | "ERROR";
export const INTEGER_OBJ: ObjectType = "INTEGER";
export const BOOLEAN_OBJ: ObjectType = "BOOLEAN";
export const NULL_OBJ: ObjectType = "NULL";
export const RETURN_VALUE_OBJ: ObjectType = "RETURN_VALUE";
export const ERROR_OBJ: ObjectType = "ERROR";

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

export class ReturnValue implements Object_ {
  value: Object_;
  constructor(value: Object_) {
    this.value = value;
  }

  type(): ObjectType {
    return RETURN_VALUE_OBJ;
  }
  inspect(): string {
    return this.value.inspect();
  }
}

export class ErrorObj implements Object_ {
  message: string;
  constructor(message: string) {
    this.message = message;
  }

  type(): ObjectType {
    return ERROR_OBJ;
  }

  inspect(): string {
    return `MESSAGE: ${this.message}`;
  }
}
