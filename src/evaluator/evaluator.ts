import {
  ASTNode,
  ASTIntegerLiteral,
  Program,
  ASTExpressionStatement,
  ASTStatement,
  ASTBooleanLiteral,
} from "../ast/ast";
import { Boolean_, Integer, Object_ } from "../object/object";

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
    return new Boolean_(node.value);
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
