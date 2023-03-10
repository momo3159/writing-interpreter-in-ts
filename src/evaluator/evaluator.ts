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
  ASTLetStatement,
  ASTIdentifier,
  ASTFunctionLiteral,
  ASTCallExpression,
  ASTStringLiteral,
  ASTArrayLiteral,
  ASTIndexExpression,
  ASTHashLiteral,
} from "../ast/ast";
import { createEnclosedEnvironment, Environment } from "../object/environment";
import {
  ARRAY,
  ArrayObj,
  Boolean_,
  BOOLEAN_OBJ,
  Builtin,
  builtins,
  ErrorObj,
  FunctionObj,
  HASH,
  Hash,
  HashKey,
  HashPair,
  Integer,
  INTEGER_OBJ,
  Null,
  NULL_OBJ,
  Object_,
  ReturnValue,
  StringObj,
  STRING_OBJ,
} from "../object/object";
const TRUE = new Boolean_(true);
const FALSE = new Boolean_(false);
const NULL = new Null();

export const evaluate = (
  node: ASTNode | null,
  env: Environment
): Object_ | null => {
  if (node instanceof Program) {
    return evaluateProgram(node, env);
  }
  if (node instanceof ASTExpressionStatement) {
    return evaluate(node.expression, env);
  }
  if (node instanceof ASTIntegerLiteral) {
    return new Integer(node.value);
  }
  if (node instanceof ASTBooleanLiteral) {
    if (node.value) return TRUE;
    else return FALSE;
  }
  if (node instanceof ASTPrefixExpression) {
    const right = evaluate(node.right, env);
    if (right === null) return null;
    if (isError(right)) return right;

    return evaluatePrefixExpression(node.operator, right);
  }
  if (node instanceof ASTIfExpression) {
    const condition = node.condition;
    const consequence = node.consequence;
    const alternative = node.alternative;

    return evaluateIfExpression(condition, consequence, alternative, env);
  }
  if (node instanceof ASTBlockStatement) {
    return evaluateBlockStatement(node, env);
  }
  if (node instanceof ASTInfixExpression) {
    const left = evaluate(node.left, env);
    const right = evaluate(node.right, env);
    if (left === null || right === null) return null;
    if (isError(left)) return left;
    if (isError(right)) return right;

    return evaluateInfixExpression(node.operator, left, right);
  }
  if (node instanceof ASTReturnStatement) {
    const value = evaluate(node.returnValue, env);
    if (value === null) return null;
    if (isError(value)) return value;
    return new ReturnValue(value);
  }
  if (node instanceof ASTLetStatement) {
    const value = evaluate(node.value, env);
    if (value === null) return null;
    if (isError(value)) return value;

    const name = node.name;
    env.set(name.value, value);
  }
  if (node instanceof ASTIdentifier) {
    return evaluateIdentifier(node, env);
  }
  if (node instanceof ASTFunctionLiteral) {
    const parameters = node.parameters;
    const body = node.body;
    return new FunctionObj(parameters, body, env);
  }
  if (node instanceof ASTCallExpression) {
    /**
     * 1. node.func ??? Identifier ?????????
     *  identifier ????????????????????????????????????????????? FunctionObject ?????????
     * 2. node.func ??? FunctionLiteral ?????????
     *  FunctionLiteral ??????????????????FunctionObject ?????????
     */
    const func = evaluate(node.func, env);
    if (func === null) return null;
    if (isError(func)) {
      return func;
    }

    const args = evaluateExpressions(node.args, env);
    if (args === null) return null;
    if (args.length === 1 && isError(args[0])) {
      return args[0];
    }

    return applyFunc(func, args);
  }
  if (node instanceof ASTStringLiteral) {
    return new StringObj(node.value);
  }
  if (node instanceof ASTArrayLiteral) {
    const elements = evaluateExpressions(node.elements, env);
    if (elements === null) return null;
    if (elements?.length === 1 && isError(elements[0])) {
      return elements[0];
    }

    return new ArrayObj(elements);
  }
  if (node instanceof ASTIndexExpression) {
    const left = evaluate(node.left, env);
    if (left === null) return null;
    if (isError(left)) {
      return left;
    }

    const index = evaluate(node.index, env);
    if (index === null) return null;
    if (isError(index)) {
      return index;
    }

    return evaluateIndexExpression(left, index);
  }
  if (node instanceof ASTHashLiteral) {
    return evaluateHashLiteral(node, env);
  }
  return null;
};

const evaluateProgram = (
  program: Program,
  env: Environment
): Object_ | null => {
  let result: Object_ | null = null;

  for (const stmt of program.statements) {
    result = evaluate(stmt, env);
    if (result instanceof ReturnValue) {
      return result.value;
    }

    if (result instanceof ErrorObj) {
      return result;
    }
  }

  return result;
};

const evaluateBlockStatement = (
  block: ASTBlockStatement,
  env: Environment
): Object_ | null => {
  let result: Object_ | null = null;

  for (const stmt of block.statements) {
    result = evaluate(stmt, env);
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
  } else if (left.type() === STRING_OBJ && right.type() === STRING_OBJ) {
    return evalStringInfixExpression(
      operator,
      left as StringObj,
      right as StringObj
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

const evalStringInfixExpression = (
  operator: string,
  left: StringObj,
  right: StringObj
): StringObj | ErrorObj => {
  switch (operator) {
    case "+":
      return new StringObj(`${left.value}${right.value}`);
    default:
      return new ErrorObj(
        `unknown operator: ${left.type()} ${operator} ${right.type()}`
      );
  }
};

const evaluateIfExpression = (
  condition: ASTExpression | null,
  consequence: ASTBlockStatement | null,
  alternative: ASTBlockStatement | null,
  env: Environment
): Object_ | null => {
  const conditionObj = evaluate(condition, env);
  if (conditionObj === null) return null;
  if (isError(conditionObj)) return conditionObj;

  if (isTruthy(conditionObj)) {
    return evaluate(consequence, env);
  } else if (alternative !== null) {
    return evaluate(alternative, env);
  } else return NULL;
};

const evaluateIdentifier = (node: ASTIdentifier, env: Environment): Object_ => {
  const { value, exist } = env.get(node.value);
  if (exist) return value as Object_;

  const builtin = builtins.get(node.value);
  if (!!builtin) return builtin as Builtin;

  return new ErrorObj(`identifier not found: ${node.value}`);
};

const evaluateExpressions = (
  exps: ASTExpression[],
  env: Environment
): Object_[] | null => {
  const result: Object_[] = [];

  for (const exp of exps) {
    const evaluated = evaluate(exp, env);
    if (evaluated === null) {
      return null;
    }
    if (isError(evaluated)) {
      return [evaluated];
    }

    result.push(evaluated);
  }

  return result;
};

const applyFunc = (func: Object_, args: Object_[]): Object_ | null => {
  if (func instanceof FunctionObj) {
    const extendedEnv = extendFuncEnv(func, args);
    const evaluated = evaluate(func.body, extendedEnv);
    return unwrapReturnValue(evaluated);
  }

  if (func instanceof Builtin) {
    return func.fn(...args);
  }

  console.log(func);

  throw new Error(`not a function: ${func.type()}`);

  /**
   * ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
   *   ?????? let newAdder = fn(x) { fn(y) {x + y; } }; let addTwo = newAdder(2); addTwo(2);
   *   fn(x) {...}(...) ???????????????????????????????????????????????? ???????????????????????????????????????????????????
   *  ???addTwo ???????????????????????????????????????????????????????????????????????????????????????????????? newAdder(2) ??? "2" ?????????????????????????????????????????????
   *
   *   ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
   *
   */
};

const evaluateHashLiteral = (
  node: ASTHashLiteral,
  env: Environment
): Object_ | null => {
  const pairs = new Map<string, HashPair>();

  for (const [keyNode, valueNode] of node.pairs.entries()) {
    const key_ = evaluate(keyNode, env);

    if (key_ === null) {
      return null;
    }
    if (isError(key_)) {
      return key_;
    }

    if (
      key_ instanceof StringObj ||
      key_ instanceof Boolean_ ||
      key_ instanceof Integer
    ) {
      const value = evaluate(valueNode, env);
      if (value === null) return null;
      if (isError(value)) {
        return value;
      }

      const hashed = key_.hashKey();
      pairs.set(hashed.toString(), new HashPair(key_, value));
    } else {
      return new ErrorObj(`unusable as hash key: ${key_.type()}`);
    }
  }

  return new Hash(pairs);
};

const evaluateIndexExpression = (left: Object_, index: Object_): Object_ => {
  if (left.type() === ARRAY && index.type() === INTEGER_OBJ) {
    return evaluateArrayIndexExpression(left as ArrayObj, index as Integer);
  } else if (left.type() === HASH) {
    return evaluateHashIndexExpression(left, index);
  } else {
    return new ErrorObj(`index operator not supported: ${left.type()}`);
  }
};

const evaluateArrayIndexExpression = (
  left: ArrayObj,
  index: Integer
): Object_ => {
  const arr = left.elements;
  const idx = index.value;

  if (idx < 0 || idx >= arr.length) {
    return NULL;
  } else {
    return arr[idx];
  }
};

const evaluateHashIndexExpression = (
  left: Object_,
  index: Object_
): Object_ => {
  const hashObj = left as Hash;
  if (
    index instanceof Boolean_ ||
    index instanceof Integer ||
    index instanceof StringObj
  ) {
    const pair = hashObj.pairs.get(index.hashKey().toString());
    if (pair == undefined) return NULL;
    else return pair.value;
  } else {
    return new ErrorObj(`unusable as hash key: ${index.type()}`);
  }
};

const extendFuncEnv = (func: FunctionObj, args: Object_[]): Environment => {
  const env = createEnclosedEnvironment(func.env);
  func.parameters.forEach((param, idx) => {
    env.set(param.value, args[idx]);
  });

  return env;
};

const unwrapReturnValue = (obj: Object_ | null): Object_ | null => {
  if (obj === null) return null;
  if (obj instanceof ReturnValue) return obj.value;
  return obj;
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
