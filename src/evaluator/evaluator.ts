import {
  ASTNode,
  ASTIntegerLiteral,
  Program,
  ASTExpressionStatement,
  ASTStatement,
  ASTBooleanLiteral,
  ASTPrefixExpression,
} from "../ast/ast";
import { Boolean_, Integer, Null, Object_ } from "../object/object";
const TRUE = new Boolean_(true);
const FALSE = new Boolean_(false);
const NULL = new Null();

export const evaluate = (node: ASTNode | null): Object_ | null => {
  if (node instanceof Program) {
    return evaluateStatements(node.statements);
  }
  if (node instanceof ASTExpressionStatement) {
    return evaluate(node.expression);
  }
  if (node instanceof ASTIntegerLiteral) {
    return new Integer(node.value);
  }
  if (node instanceof ASTBooleanLiteral) {
    if (node.value) return TRUE;
    else return FALSE;
  }
  if (node instanceof ASTPrefixExpression) {
    const right = evaluate(node.right);
    if (right === null) throw new Error("null is invalid ");

    return evaluatePrefixExpression(node.operator, right);
  }

  return null;
};

const evaluateStatements = (statements: ASTStatement[]): Object_ | null => {
  let result: Object_ | null = null;
  statements.forEach((stmt) => {
    result = evaluate(stmt);
  });

  return result;
};

const evaluatePrefixExpression = (
  operator: string,
  right: Object_
): Object_ => {
  switch (operator) {
    case "!":
      return evalBangOperatorExpression(right);
    default:
      return NULL;
  }
};

const evalBangOperatorExpression = (right: Object_): Object_ => {
  switch (right) {
    case TRUE:
      return FALSE;
    case FALSE:
      return TRUE;
    case NULL:
      return TRUE;
    default:
      return FALSE;
  }
};
