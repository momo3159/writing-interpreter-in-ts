import { ASTBlockStatement, ASTIdentifier } from "../ast/ast";
import { Environment } from "./environment";

export type ObjectType =
  | "INTEGER"
  | "BOOLEAN"
  | "NULL"
  | "RETURN_VALUE"
  | "ERROR"
  | "FUNCTION"
  | "STRING";
export const INTEGER_OBJ: ObjectType = "INTEGER";
export const BOOLEAN_OBJ: ObjectType = "BOOLEAN";
export const NULL_OBJ: ObjectType = "NULL";
export const RETURN_VALUE_OBJ: ObjectType = "RETURN_VALUE";
export const ERROR_OBJ: ObjectType = "ERROR";
export const FUNCTION_OBJ: ObjectType = "FUNCTION";
export const STRING_OBJ: ObjectType = "STRING";

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

export class String implements Object_ {
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
}
