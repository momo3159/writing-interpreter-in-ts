import {
  ASTNode,
  ASTIntegerLiteral,
  Program,
  ASTExpressionStatement,
  ASTStatement,
  ASTBooleanLiteral,
} from "../ast/ast";
import { Boolean_, Integer, Object_ } from "../object/object";
const TRUE = new Boolean_(true);
const FALSE = new Boolean_(false);

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

  return null;
};

const evaluateStatements = (statements: ASTStatement[]): Object_ | null => {
  let result: Object_ | null = null;
  statements.forEach((stmt) => {
    result = evaluate(stmt);
  });

  return result;
};
