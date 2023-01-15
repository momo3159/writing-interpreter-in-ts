import {
  ASTExpressionStatement,
  ASTIdentifier,
  ASTLetStatement,
  ASTReturnStatement,
  ASTStatement,
  Program,
} from "../../ast/ast";
import { Lexer } from "../../lexer/lexer";
import { Parser } from "../../parser/parser";
import { IDENT, LET } from "../../token/token";

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

    const tests: { expectedIdentifer: string }[] = [
      { expectedIdentifer: "x" },
      { expectedIdentifer: "y" },
      { expectedIdentifer: "foobar" },
    ];

    expect(program.statements.length).toBe(3);
    tests.forEach((tt, i) => {
      const stmt = program.statements[i];
      testLetStatement(stmt, tests[i].expectedIdentifer);
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

const checkParserErrors = (p: Parser) => {
  const errors = p.getErrors();
  if (errors.length === 0) return;

  console.error(`parser has ${errors.length} errors`);
  errors.forEach((e) => {
    console.error(`parser error: ${e}`);
  });
};
