import {
  ASTExpressionStatement,
  ASTIdentifier,
  ASTLetStatement,
  ASTReturnStatement,
  ASTStatement,
  ASTIntegerLiteral,
  Program,
  ASTExpression,
  ASTPrefixExpression,
  ASTInfixExpression,
  ASTBooleanLiteral,
} from "../../ast/ast";
import { Lexer } from "../../lexer/lexer";
import { Parser } from "../../parser/parser";
import { IDENT, INT, LET } from "../../token/token";

describe("parser", () => {
  test("let文の解析", () => {
    const input = `let x = 5;
    let y = 10;
    let foobar = 838383;
    `;
    const l = new Lexer(input);
    const p = new Parser(l);
    const program = p.parseProgram();
    checkParserErrors(p);

    const tests: { expectedIdentifier: string }[] = [
      { expectedIdentifier: "x" },
      { expectedIdentifier: "y" },
      { expectedIdentifier: "foobar" },
    ];

    expect(program.statements.length).toBe(3);
    tests.forEach((tt, i) => {
      const stmt = program.statements[i];
      testLetStatement(stmt, tests[i].expectedIdentifier);
    });
  });

  test("return文の解析", () => {
    const input = `
      return 5;
      return 10;
    `;
    const l = new Lexer(input);
    const p = new Parser(l);
    const program = p.parseProgram();
    checkParserErrors(p);

    expect(program.statements.length).toBe(2);
    program.statements.forEach((stmt) => {
      expect(stmt instanceof ASTReturnStatement).toBe(true);
      expect(stmt.tokenLiteral()).toBe("return");
    });
  });

  test("識別子の解析", () => {
    const input = "foobar;";
    const l = new Lexer(input);
    const p = new Parser(l);
    const program = p.parseProgram();
    checkParserErrors(p);

    expect(program.statements.length).toBe(1);
    expect(program.statements[0] instanceof ASTExpressionStatement).toBe(true);

    const stmt = program.statements[0] as ASTExpressionStatement;
    expect(stmt.expression instanceof ASTIdentifier).toBe(true);

    const ident = stmt.expression as ASTIdentifier;
    expect(ident.value).toBe("foobar");
    expect(ident.tokenLiteral()).toBe("foobar");
  });

  test("整数リテラルの解析", () => {
    const input = "5;";
    const l = new Lexer(input);
    const p = new Parser(l);
    const program = p.parseProgram();
    checkParserErrors(p);

    expect(program.statements.length).toBe(1);
    expect(program.statements[0] instanceof ASTExpressionStatement).toBe(true);

    const stmt = program.statements[0] as ASTExpressionStatement;
    expect(stmt.expression instanceof ASTIntegerLiteral).toBe(true);

    const ident = stmt.expression as ASTIntegerLiteral;
    expect(ident.value).toBe(5);
    expect(ident.tokenLiteral()).toBe("5");
  });

  test("真偽値リテラルの解析", () => {
    const tests: { input: string; expectedBoolean: boolean }[] = [
      { input: "true;", expectedBoolean: true },
      { input: "false;", expectedBoolean: false },
    ];

    tests.forEach((tt) => {
      const l = new Lexer(tt.input);
      const p = new Parser(l);
      const program = p.parseProgram();
      checkParserErrors(p);

      expect(program.statements.length).toBe(1);
      expect(program.statements[0] instanceof ASTExpressionStatement).toBe(
        true
      );

      const stmt = program.statements[0] as ASTExpressionStatement;
      expect(stmt.expression instanceof ASTBooleanLiteral).toBe(true);

      const b = stmt.expression as ASTBooleanLiteral;
      expect(b.value).toBe(tt.expectedBoolean);
    });
  });

  test("前置演算子の解析", () => {
    const tests: { input: string; operator: string; integerValue: number }[] = [
      { input: "!5", operator: "!", integerValue: 5 },
      { input: "-15", operator: "-", integerValue: 15 },
    ];

    tests.forEach((tt) => {
      const l = new Lexer(tt.input);
      const p = new Parser(l);
      const program = p.parseProgram();
      checkParserErrors(p);

      expect(program.statements.length).toBe(1);
      expect(program.statements[0] instanceof ASTExpressionStatement).toBe(
        true
      );

      const stmt = program.statements[0] as ASTExpressionStatement;
      expect(stmt.expression instanceof ASTPrefixExpression).toBe(true);

      const exp = stmt.expression as ASTPrefixExpression;
      expect(exp.right).not.toBe(null);

      testIntegerLiteral(exp.right as ASTExpression, tt.integerValue);
    });
  });

  test("中値演算子の解析", () => {
    const tests: {
      input: string;
      leftValue: any;
      operator: string;
      rightValue: any;
    }[] = [
      { input: "5 + 5;", leftValue: 5, operator: "+", rightValue: 5 },
      { input: "5 - 5;", leftValue: 5, operator: "-", rightValue: 5 },
      { input: "5 * 5;", leftValue: 5, operator: "*", rightValue: 5 },
      { input: "5 / 5;", leftValue: 5, operator: "/", rightValue: 5 },
      { input: "5 > 5;", leftValue: 5, operator: ">", rightValue: 5 },
      { input: "5 < 5;", leftValue: 5, operator: "<", rightValue: 5 },
      { input: "5 == 5;", leftValue: 5, operator: "==", rightValue: 5 },
      { input: "5 !=5;", leftValue: 5, operator: "!=", rightValue: 5 },
      {
        input: "true == true",
        leftValue: true,
        operator: "==",
        rightValue: true,
      },
      {
        input: "true != false",
        leftValue: true,
        operator: "!=",
        rightValue: false,
      },
    ];

    tests.forEach((tt) => {
      const l = new Lexer(tt.input);
      const p = new Parser(l);
      const program = p.parseProgram();
      checkParserErrors(p);

      expect(program.statements.length).toBe(1);
      expect(program.statements[0] instanceof ASTExpressionStatement).toBe(
        true
      );

      const stmt = program.statements[0] as ASTExpressionStatement;
      expect(stmt.expression instanceof ASTInfixExpression).toBe(true);

      const exp = stmt.expression as ASTInfixExpression;
      testInfixExpression(exp, tt.leftValue, tt.operator, tt.rightValue);
    });
  });

  test("演算子の優先順位を反映した解析", () => {
    const tests: { input: string; expected: string }[] = [
      { input: "true", expected: "true" },
      { input: "false", expected: "false" },
      { input: "3 > 5 == false", expected: "((3 > 5) == false)" },
      { input: "3 < 5 == true", expected: "((3 < 5) == true)" },
    ];

    tests.forEach((tt) => {
      const l = new Lexer(tt.input);
      const p = new Parser(l);
      const program = p.parseProgram();
      checkParserErrors(p);

      expect(program.String()).toBe(tt.expected);
    });
  });

  test("String", () => {
    const program = new Program();
    program.statements = [
      new ASTLetStatement(
        { kind: LET, literal: "let" },
        new ASTIdentifier({ kind: IDENT, literal: "myVar" }, "myVar"),
        new ASTIdentifier({ kind: IDENT, literal: "anotherVar" }, "anotherVar")
      ),
    ];

    expect(program.String()).toBe("let myVar = anotherVar;");
  });
});

const testLetStatement = (s: ASTStatement, name: string): void => {
  expect(s.tokenLiteral()).toBe("let");
  expect(s instanceof ASTLetStatement).toBe(true);

  const letStmt = s as ASTLetStatement;

  expect(letStmt.name?.value).toBe(name);
  expect(letStmt.name?.tokenLiteral()).toBe(name);
};

const testIntegerLiteral = (s: ASTExpression | null, value: number) => {
  expect(s instanceof ASTIntegerLiteral).toBe(true);
  const integ = s as ASTIntegerLiteral;

  expect(integ.value).toBe(value);
  expect(integ.tokenLiteral()).toBe(value.toString());
};

const testBooleanLiteral = (s: ASTExpression | null, value: boolean) => {
  expect(s instanceof ASTBooleanLiteral).toBe(true);
  const bool = s as ASTBooleanLiteral;

  expect(bool.value).toBe(value);
  expect(bool.tokenLiteral()).toBe(String(value));
};

const testIdentifier = (exp: ASTExpression | null, value: string) => {
  expect(exp instanceof ASTIdentifier).toBe(true);
  const ident = exp as ASTIdentifier;

  expect(ident.value).toBe(value);
  expect(ident.tokenLiteral()).toBe(value);
};

const testLiteralExpression = (exp: ASTExpression | null, expected: any) => {
  switch (typeof expected) {
    case "number":
      testIntegerLiteral(exp, expected as number);
      break;
    case "string":
      testIdentifier(exp, expected as string);
      break;
    case "boolean":
      testBooleanLiteral(exp, expected as boolean);
      break;
    default:
      throw new Error(`invalid literal`);
  }
};

const testInfixExpression = (
  exp: ASTExpression,
  left: any,
  operator: string,
  right: any
) => {
  expect(exp instanceof ASTInfixExpression).toBe(true);
  const opExp = exp as ASTInfixExpression;

  testLiteralExpression(opExp.left, left);
  expect(opExp.operator).toBe(operator);
  testLiteralExpression(opExp.right, right);
};

const checkParserErrors = (p: Parser) => {
  const errors = p.getErrors();
  if (errors.length === 0) return;

  console.error(`parser has ${errors.length} errors`);
  errors.forEach((e) => {
    console.error(`parser error: ${e}`);
  });
};
