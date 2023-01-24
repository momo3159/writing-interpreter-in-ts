import {
  ASTNode,
  ASTIntegerLiteral,
  Program,
  ASTExpressionStatement,
  ASTStatement,
  ASTBooleanLiteral,
  ASTPrefixExpression,
  ASTInfixExpression,
  ASTIfExpression,
  ASTBlockStatement,
  ASTExpression,
  ASTReturnStatement,
} from "../ast/ast";
import {
  Boolean_,
  BOOLEAN_OBJ,
  ErrorObj,
  Integer,
  INTEGER_OBJ,
  Null,
  Object_,
  ReturnValue,
} from "../object/object";
const TRUE = new Boolean_(true);
const FALSE = new Boolean_(false);
const NULL = new Null();

export const evaluate = (node: ASTNode | null): Object_ | null => {
  if (node instanceof Program) {
    return evaluateProgram(node);
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
    if (isError(right)) return right;

    return evaluatePrefixExpression(node.operator, right);
  }
  if (node instanceof ASTIfExpression) {
    const condition = node.condition;
    const consequence = node.consequence;
    const alternative = node.alternative;

    return evaluateIfExpression(condition, consequence, alternative);
  }
  if (node instanceof ASTBlockStatement) {
    return evaluateBlockStatement(node);
  }
  if (node instanceof ASTInfixExpression) {
    const left = evaluate(node.left);
    const right = evaluate(node.right);
    if (left === null || right === null) return null;
    if (isError(left)) return left;
    if (isError(right)) return right;

    return evaluateInfixExpression(node.operator, left, right);
  }
  if (node instanceof ASTReturnStatement) {
    const value = evaluate(node.returnValue);
    if (value === null) return null;
    if (isError(value)) return value;
    return new ReturnValue(value);
  }

  return null;
};

const evaluateProgram = (program: Program): Object_ | null => {
  let result: Object_ | null = null;

  for (const stmt of program.statements) {
    result = evaluate(stmt);
    if (result instanceof ReturnValue) {
      return result.value;
    }

    if (result instanceof ErrorObj) {
      return result;
    }
  }

  return result;
};

const evaluateBlockStatement = (block: ASTBlockStatement): Object_ | null => {
  let result: Object_ | null = null;

  for (const stmt of block.statements) {
    result = evaluate(stmt);
    if (result instanceof ReturnValue) {
      return result;
    }
    if (result instanceof ErrorObj) {
      return result;
    }
  }

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
      return new ErrorObj(`unknown operator: ${operator} ${right.type()}`);
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
    return new ErrorObj(`unknown operator: -${right.type()}`);
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
  } else if (left.type() !== right.type()) {
    return new ErrorObj(
      `type mismatch: ${left.type()} ${operator} ${right.type()}`
    );
  } else {
    return new ErrorObj(
      `unknown operator: ${left.type()} ${operator} ${right.type()}`
    );
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
      return nativeBoolToBoolObj(left.value < right.value);
    case ">":
      return nativeBoolToBoolObj(left.value > right.value);
    case "==":
      return nativeBoolToBoolObj(left.value === right.value);
    case "!=":
      return nativeBoolToBoolObj(left.value !== right.value);
    default:
      return new ErrorObj(
        `unknown operator: ${left.type()} ${operator} ${right.type()}`
      );
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
      return new ErrorObj(
        `unknown operator: ${left.type()} ${operator} ${right.type()}`
      );
  }
};

const evaluateIfExpression = (
  condition: ASTExpression | null,
  consequence: ASTBlockStatement | null,
  alternative: ASTBlockStatement | null
): Object_ | null => {
  const conditionObj = evaluate(condition);
  if (conditionObj === null) return null;
  if (isError(conditionObj)) return conditionObj;

  if (isTruthy(conditionObj)) {
    return evaluate(consequence);
  } else if (alternative !== null) {
    return evaluate(alternative);
  } else return NULL;
};

const isTruthy = (obj: Object_ | null): boolean => {
  switch (obj) {
    case NULL:
      return false;
    case TRUE:
      return true;
    case FALSE:
      return false;
    default:
      return true;
  }
};

const nativeBoolToBoolObj = (cond: boolean): Boolean_ => {
  if (cond) return TRUE;
  else return FALSE;
};

const isError = (obj: Object_): boolean => {
  return obj instanceof ErrorObj;
};
