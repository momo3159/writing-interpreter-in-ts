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
  ASTIfExpression,
  ASTBlockStatement,
  ASTFunctionLiteral,
  ASTCallExpression,
  ASTStringLiteral,
  ASTArrayLiteral,
  ASTIndexExpression,
  ASTHashLiteral,
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

    const tests: {
      input: string;
      expectedIdentifier: string;
      expectedValue: any;
    }[] = [
      { input: "let x = 5;", expectedIdentifier: "x", expectedValue: 5 },
      { input: "let y = 10;", expectedIdentifier: "y", expectedValue: 10 },
      {
        input: "let foobar = 838383;",
        expectedIdentifier: "foobar",
        expectedValue: 838383,
      },
    ];

    expect(program.statements.length).toBe(3);
    tests.forEach((tt, i) => {
      const stmt = program.statements[i] as ASTLetStatement;
      testLetStatement(stmt, tests[i].expectedIdentifier);

      const val = stmt.value;
      testLiteralExpression(val, tt.expectedValue);
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
    const tests: { input: string; operator: string; value: any }[] = [
      { input: "!5", operator: "!", value: 5 },
      { input: "-15", operator: "-", value: 15 },
      { input: "!true;", operator: "!", value: true },
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

      testLiteralExpression(exp.right as ASTExpression, tt.value);
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
      { input: "1 + (2 + 3) + 4", expected: "((1 + (2 + 3)) + 4)" },
      {
        input: "(5 + 5) * 2",
        expected: "((5 + 5) * 2)",
      },
      {
        input: "-(5 + 5)",
        expected: "(-(5 + 5))", // ((-5) + 5)ではない
      },
      {
        input: "a * [1, 2, 3, 4][b * c] * d",
        expected: "((a * ([1, 2, 3, 4][(b * c)])) * d)",
      },
      {
        input: "add(a * b[2], b[1], 2 * [1, 2][1])",
        expected: "add((a * (b[2])), (b[1]), (2 * ([1, 2][1])))",
      },
    ];

    tests.forEach((tt) => {
      const l = new Lexer(tt.input);
      const p = new Parser(l);
      const program = p.parseProgram();
      checkParserErrors(p);

      expect(program.String()).toBe(tt.expected);
    });
  });

  test("if式の解析", () => {
    const input = "if (x < y) { x }";
    const l = new Lexer(input);
    const p = new Parser(l);
    const program = p.parseProgram();
    checkParserErrors(p);

    expect(program.statements.length).toBe(1);
    expect(program.statements[0] instanceof ASTExpressionStatement).toBe(true);

    const stmt = program.statements[0] as ASTExpressionStatement;
    expect(stmt.expression).not.toBe(null);

    const exp = stmt.expression as ASTExpression;
    expect(exp instanceof ASTIfExpression).toBe(true);

    const ifExp = exp as ASTIfExpression;
    expect(ifExp.condition).not.toBe(null);

    testInfixExpression(ifExp.condition as ASTInfixExpression, "x", "<", "y");
    expect(ifExp.consequence?.statements.length).toBe(1);

    expect(
      ifExp.consequence?.statements[0] instanceof ASTExpressionStatement
    ).toBe(true);
    const consequence = ifExp.consequence
      ?.statements[0] as ASTExpressionStatement;

    testIdentifier(consequence.expression, "x");
    expect(ifExp.alternative).toBe(null);
  });

  test("if-else式の解析", () => {
    const input = "if (x < y) { x } else { y }";
    const l = new Lexer(input);
    const p = new Parser(l);
    const program = p.parseProgram();
    checkParserErrors(p);

    expect(program.statements.length).toBe(1);
    expect(program.statements[0] instanceof ASTExpressionStatement).toBe(true);

    const stmt = program.statements[0] as ASTExpressionStatement;
    expect(stmt.expression).not.toBe(null);

    const exp = stmt.expression as ASTExpression;
    expect(exp instanceof ASTIfExpression).toBe(true);

    const ifExp = exp as ASTIfExpression;
    expect(ifExp.condition).not.toBe(null);

    testInfixExpression(ifExp.condition as ASTInfixExpression, "x", "<", "y");
    expect(ifExp.consequence?.statements.length).toBe(1);

    expect(
      ifExp.consequence?.statements[0] instanceof ASTExpressionStatement
    ).toBe(true);
    const consequence = ifExp.consequence
      ?.statements[0] as ASTExpressionStatement;

    testIdentifier(consequence.expression, "x");

    const alt = ifExp.alternative?.statements[0] as ASTExpressionStatement;
    testIdentifier(alt.expression, "y");
  });

  test("関数リテラルの解析", () => {
    const input = `fn(x, y) { x + y; }`;
    const l = new Lexer(input);
    const p = new Parser(l);
    const program = p.parseProgram();
    checkParserErrors(p);

    expect(program.statements.length).toBe(1);
    expect(program.statements[0] instanceof ASTExpressionStatement).toBe(true);

    const stmt = program.statements[0] as ASTExpressionStatement;
    expect(stmt.expression instanceof ASTFunctionLiteral).toBe(true);

    const fl = stmt.expression as ASTFunctionLiteral;
    expect(fl.parameters).not.toBe(null);

    const parameters = fl.parameters as ASTIdentifier[];
    expect(parameters.length).toBe(2);
    testLiteralExpression(parameters[0], "x");
    testLiteralExpression(parameters[1], "y");
    const body = fl.body as ASTBlockStatement;
    expect(body.statements.length).toBe(1);
    expect(body.statements[0] instanceof ASTExpressionStatement).toBe(true);
    const bodyExp = body.statements[0] as ASTExpressionStatement;
    expect(bodyExp.expression).not.toBe(null);

    testInfixExpression(bodyExp.expression as ASTExpression, "x", "+", "y");

    const tests: { input: string; expectedParams: string[] }[] = [
      { input: "fn() {}", expectedParams: [] },
      { input: "fn(x) {}", expectedParams: ["x"] },
      { input: "fn(x, y) {}", expectedParams: ["x", "y"] },
    ];

    tests.forEach((tt) => {
      const l = new Lexer(tt.input);
      const p = new Parser(l);
      const program = p.parseProgram();
      checkParserErrors(p);

      const stmt = program.statements[0] as ASTExpressionStatement;
      const fn = stmt.expression as ASTFunctionLiteral;

      const parameters = fn.parameters as ASTIdentifier[];

      expect(parameters.length).toBe(tt.expectedParams.length);
      tt.expectedParams.forEach((t, i) => {
        testLiteralExpression(parameters[i], t);
      });
    });
  });

  test("関数呼び出し式の解析", () => {
    const input = "add(1, 2 * 3, 4 + 5)";
    const l = new Lexer(input);
    const p = new Parser(l);
    const program = p.parseProgram();
    checkParserErrors(p);

    expect(program.statements.length).toBe(1);
    expect(program.statements[0] instanceof ASTExpressionStatement).toBe(true);
    const stmt = program.statements[0] as ASTExpressionStatement;

    expect(stmt.expression instanceof ASTCallExpression).toBe(true);
    const exp = stmt.expression as ASTCallExpression;

    testIdentifier(exp.func, "add");
    if (!Array.isArray(exp.args)) throw new Error("invalid args");
    expect(exp.args.length).toBe(3);

    testLiteralExpression(exp.args[0], 1);
    testInfixExpression(exp.args[1] as ASTExpression, 2, "*", 3);
    testInfixExpression(exp.args[2] as ASTExpression, 4, "+", 5);
  });

  test("文字列リテラルの解析", () => {
    const input = `"hello, world!"`;
    const l = new Lexer(input);
    const p = new Parser(l);
    const program = p.parseProgram();
    checkParserErrors(p);

    expect(program.statements.length).toBe(1);
    expect(program.statements[0] instanceof ASTExpressionStatement).toBe(true);
    const stmt = program.statements[0] as ASTExpressionStatement;

    expect(stmt.expression instanceof ASTStringLiteral).toBe(true);
    const strLiteral = stmt.expression as ASTStringLiteral;

    testStringLiteral(strLiteral, "hello, world!");
  });

  test("配列リテラルの解析", () => {
    const input = "[1, 2 * 2, 3 + 3];";
    const l = new Lexer(input);
    const p = new Parser(l);
    const program = p.parseProgram();
    checkParserErrors(p);

    expect(program.statements.length).toBe(1);

    expect(program.statements[0] instanceof ASTExpressionStatement).toBe(true);
    const stmt = program.statements[0] as ASTExpressionStatement;

    expect(stmt.expression instanceof ASTArrayLiteral).toBe(true);
    const arr = stmt.expression as ASTArrayLiteral;

    expect(arr.elements.length).toBe(3);
    testIntegerLiteral(arr.elements[0], 1);
    testInfixExpression(arr.elements[1], 2, "*", 2);
    testInfixExpression(arr.elements[2], 3, "+", 3);
  });

  test("添字演算子式の解析", () => {
    const input = "myArray[1 + 1]";
    const l = new Lexer(input);
    const p = new Parser(l);
    const program = p.parseProgram();
    checkParserErrors(p);

    expect(program.statements[0] instanceof ASTExpressionStatement).toBe(true);
    const stmt = program.statements[0] as ASTExpressionStatement;

    expect(stmt.expression instanceof ASTIndexExpression).toBe(true);
    const indexExp = stmt.expression as ASTIndexExpression;

    testIdentifier(indexExp.left, "myArray");
    testInfixExpression(indexExp.index, 1, "+", 1);
  });

  test("ハッシュリテラルの解析", () => {
    const input = '{"one": 1, "two": 2, "three": 3}';
    const l = new Lexer(input);
    const p = new Parser(l);
    const program = p.parseProgram();
    checkParserErrors(p);

    expect(program.statements[0] instanceof ASTExpressionStatement).toBe(true);
    const stmt = program.statements[0] as ASTExpressionStatement;

    expect(stmt.expression instanceof ASTHashLiteral).toBe(true);
    const hash = stmt.expression as ASTHashLiteral;

    const arr = Array.from(hash.pairs, function (entry) {
      return { key: entry[0], value: entry[1] };
    });

    const isProperty = (
      value: string
    ): value is keyof { one: 1; two: 2; three: 3 } => {
      return value === "one" || value === "two" || value === "three";
    };

    for (const { key, value } of arr) {
      expect(key instanceof ASTStringLiteral).toBe(true);
      let key_ = (key as ASTStringLiteral).String();
      key_ = key_.substring(1, key_.length - 1);
      if (isProperty(key_)) {
        testIntegerLiteral(value, { one: 1, two: 2, three: 3 }[key_]);
      } else {
        throw new Error("key is illegal");
      }
    }
  });

  test("空のハッシュリテラルの解析", () => {
    const input = "{}";
    const l = new Lexer(input);
    const p = new Parser(l);
    const program = p.parseProgram();
    checkParserErrors(p);

    expect(program.statements[0] instanceof ASTExpressionStatement).toBe(true);
    const stmt = program.statements[0] as ASTExpressionStatement;

    expect(stmt.expression instanceof ASTHashLiteral).toBe(true);
    const hash = stmt.expression as ASTHashLiteral;

    expect(hash.pairs.size).toBe(0);
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

const testStringLiteral = (s: ASTExpression | null, value: string) => {
  expect(s instanceof ASTStringLiteral).toBe(true);
  const str = s as ASTStringLiteral;

  expect(str.value).toBe(value);
  expect(str.tokenLiteral()).toBe(`${value}`);
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
