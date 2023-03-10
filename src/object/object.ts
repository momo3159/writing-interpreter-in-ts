import { ASTBlockStatement, ASTIdentifier } from "../ast/ast";
import { Environment } from "./environment";
import { createHash } from "crypto";
export type ObjectType =
  | "INTEGER"
  | "BOOLEAN"
  | "NULL"
  | "RETURN_VALUE"
  | "ERROR"
  | "FUNCTION"
  | "STRING"
  | "BUILTIN"
  | "ARRAY"
  | "HASH";
export const INTEGER_OBJ: ObjectType = "INTEGER";
export const BOOLEAN_OBJ: ObjectType = "BOOLEAN";
export const NULL_OBJ: ObjectType = "NULL";
export const RETURN_VALUE_OBJ: ObjectType = "RETURN_VALUE";
export const ERROR_OBJ: ObjectType = "ERROR";
export const FUNCTION_OBJ: ObjectType = "FUNCTION";
export const STRING_OBJ: ObjectType = "STRING";
export const BUILTIN: ObjectType = "BUILTIN";
export const ARRAY: ObjectType = "ARRAY";
export const HASH: ObjectType = "HASH";

type BuiltinFunction = (...args: Object_[]) => Object_;

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

  hashKey(): HashKey {
    return new HashKey(this.type(), this.value.toString());
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

  hashKey(): HashKey {
    return new HashKey(this.type(), this.value ? "1" : "0");
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

export class FunctionObj implements Object_ {
  parameters: ASTIdentifier[];
  body: ASTBlockStatement;
  env: Environment;

  constructor(
    parameters: ASTIdentifier[],
    body: ASTBlockStatement,
    env: Environment
  ) {
    this.parameters = parameters;
    this.body = body;
    this.env = env;
  }

  type(): ObjectType {
    return FUNCTION_OBJ;
  }

  inspect(): string {
    return `fn (${this.parameters.map((p) => p.String()).join(", ")} {
      ${this.body.String()}
    })`;
  }
}

export class StringObj implements Object_ {
  value: string;
  constructor(value: string) {
    this.value = value;
  }

  type(): ObjectType {
    return STRING_OBJ;
  }
  inspect(): string {
    return this.value;
  }

  hashKey(): HashKey {
    const hash = createHash("sha256");
    hash.update(this.value);

    return new HashKey(this.type(), hash.digest("hex"));
  }
}

export class ArrayObj implements Object_ {
  elements: Object_[];
  constructor(elements: Object_[]) {
    this.elements = elements;
  }

  type(): ObjectType {
    return ARRAY;
  }
  inspect(): string {
    return `[${this.elements.map((e) => e.inspect()).join(", ")}]`;
  }
}

export class Builtin implements Object_ {
  fn: BuiltinFunction;
  constructor(fn: BuiltinFunction) {
    this.fn = fn;
  }

  type(): ObjectType {
    return BUILTIN;
  }

  inspect(): string {
    return "builtin function";
  }
}

export class Hash implements Object_ {
  pairs: Map<string, HashPair>;
  constructor(pairs: Map<string, HashPair>) {
    this.pairs = pairs;
  }

  type(): ObjectType {
    return HASH;
  }

  inspect(): string {
    const arr = Array.from(this.pairs, function (entry) {
      return { key: entry[0], value: entry[1] };
    });

    return `{${arr
      .map(({ value }) => `${value.key.inspect()}: ${value.value.inspect()}`)
      .join(", ")}}`;
  }
}

export class HashPair {
  key: Object_;
  value: Object_;

  constructor(key: Object_, value: Object_) {
    this.key = key;
    this.value = value;
  }
}

export class HashKey {
  type: ObjectType;
  value: string;

  constructor(type: ObjectType, value: string) {
    this.type = type;
    this.value = value;
  }

  toString() {
    return JSON.stringify(this);
  }
}

export const builtins = new Map<string, Builtin>([
  [
    "len",
    new Builtin((...args: Object_[]): Object_ => {
      if (args.length !== 1) {
        return new ErrorObj(
          `wrong number of arguments. got=${args.length}, want=1`
        );
      }

      if (args[0] instanceof StringObj) {
        return new Integer(args[0].value.length);
      } else if (args[0] instanceof ArrayObj) {
        return new Integer(args[0].elements.length);
      } else {
        return new ErrorObj(
          `argument to \`len\` not supported, got ${args[0].type()}`
        );
      }
    }),
  ],
]);
