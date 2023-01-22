import {
  ASTNode,
  ASTIntegerLiteral,
  Program,
  ASTExpressionStatement,
  ASTStatement,
} from "../ast/ast";
import { Integer, Object_ } from "../object/object";

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

  return null;
};

const evaluateStatements = (statements: ASTStatement[]): Object_ | null => {
  let result: Object_ | null = null;
  statements.forEach((stmt) => {
    result = evaluate(stmt);
  });

  return result;
};
