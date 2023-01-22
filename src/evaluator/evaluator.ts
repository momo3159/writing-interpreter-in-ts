import {
  ASTNode,
  ASTIntegerLiteral,
  Program,
  ASTExpressionStatement,
  ASTStatement,
  ASTBooleanLiteral,
  ASTPrefixExpression,
  ASTInfixExpression,
} from "../ast/ast";
import {
  Boolean_,
  BOOLEAN_OBJ,
  Integer,
  INTEGER_OBJ,
  Null,
  Object_,
} from "../object/object";
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
    if (right === null) return null;

    return evaluatePrefixExpression(node.operator, right);
  }
  if (node instanceof ASTInfixExpression) {
    const left = evaluate(node.left);
    const right = evaluate(node.right);
    if (left === null || right === null) return null;

    return evaluateInfixExpression(node.operator, left, right);
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
    case "-":
      return evalMinusPrefixExpression(right);
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

const evalMinusPrefixExpression = (right: Object_): Object_ => {
  if (right.type() !== INTEGER_OBJ) {
    return NULL;
  }
  const value = (right as Integer).value;
  return new Integer(-value);
};

const evaluateInfixExpression = (
  operator: string,
  left: Object_,
  right: Object_
): Object_ => {
  if (left.type() === INTEGER_OBJ && right.type() === INTEGER_OBJ) {
    return evalIntegerInfixExpression(
      operator,
      left as Integer,
      right as Integer
    );
  } else if (left.type() === BOOLEAN_OBJ && right.type() === BOOLEAN_OBJ) {
    return evalBooleanInfixExpression(
      operator,
      left as Boolean_,
      right as Boolean_
    );
  } else {
    return NULL;
  }
};

const evalIntegerInfixExpression = (
  operator: string,
  left: Integer,
  right: Integer
): Object_ => {
  switch (operator) {
    case "+":
      return new Integer(left.value + right.value);
    case "-":
      return new Integer(left.value - right.value);
    case "*":
      return new Integer(left.value * right.value);
    case "/":
      return new Integer(Math.floor(left.value / right.value));
    case "<":
      return new Boolean_(left.value < right.value);
    case ">":
      return new Boolean_(left.value > right.value);
    case "==":
      return new Boolean_(left.value === right.value);
    case "!=":
      return new Boolean_(left.value !== right.value);
    default:
      return NULL;
  }
};

const evalBooleanInfixExpression = (
  operator: string,
  left: Boolean_,
  right: Boolean_
): Boolean_ | Null => {
  switch (operator) {
    case "==":
      return new Boolean_(left.value === right.value);
    case "!=":
      return new Boolean_(left.value !== right.value);
    default:
      return NULL;
  }
};
