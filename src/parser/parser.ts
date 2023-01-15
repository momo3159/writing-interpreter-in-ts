import {
  ASTExpression,
  ASTExpressionStatement,
  ASTIdentifier,
  ASTLetStatement,
  ASTReturnStatement,
  ASTStatement,
  Program,
} from "../ast/ast";
import { Lexer } from "../lexer/lexer";
import {
  ASSIGN,
  EOF,
  IDENT,
  ILLEGAL,
  LET,
  RETURN,
  SEMICOLON,
  Token,
  TokenKind,
} from "../token/token";
import { iota } from "../util/iota";

export type PrefixParseFn = () => ASTExpression;
export type InfixParseFn = (leftValue: ASTExpression) => ASTExpression;

const { LOWEST, EQUALS, LESSGREATER, SUM, PRODUCT, PREFIX, CALL } = iota();

export class Parser {
  l: Lexer;
  curToken: Token = { kind: ILLEGAL, literal: "" };
  peekToken: Token = { kind: ILLEGAL, literal: "" };
  errors: string[] = [];

  prefixParseFns: Map<TokenKind, PrefixParseFn> = new Map();
  infixParseFns: Map<TokenKind, InfixParseFn> = new Map();

  constructor(l: Lexer) {
    this.l = l;
    this.nextToken();
    this.nextToken();

    this.registerPrefix(IDENT, this.parseIdentifier);
  }

  nextToken() {
    this.curToken = this.peekToken;
    this.peekToken = this.l.nextToken();
  }

  parseProgram(): Program {
    const program: Program = new Program();

    while (this.curToken.kind !== EOF) {
      const stmt = this.parseStatement();
      if (stmt !== null) {
        program.statements.push(stmt);
      }

      this.nextToken();
    }

    return program;
  }

  parseStatement(): ASTStatement | null {
    switch (this.curToken.kind) {
      case LET:
        return this.parseLetStatement();
      case RETURN:
        return this.parseReturnStatement();
      default:
        return this.parseExpressionStatement();
    }
  }

  parseLetStatement(): ASTLetStatement | null {
    const stmt = new ASTLetStatement(this.curToken);
    if (!this.expectPeek(IDENT)) {
      return null;
    }

    // IDENTIFIERの解析
    stmt.name = new ASTIdentifier(this.curToken, this.curToken.literal);

    if (!this.expectPeek(ASSIGN)) {
      return null;
    }

    // TODO: 式の解析
    while (!this.curTokenIs(SEMICOLON)) {
      this.nextToken();
    }

    return stmt;
  }

  parseReturnStatement(): ASTReturnStatement | null {
    const stmt = new ASTReturnStatement(this.curToken);
    this.nextToken();

    // TOOD: 式の解析
    while (!this.curTokenIs(SEMICOLON)) {
      this.nextToken();
    }

    return stmt;
  }

  parseExpressionStatement(): ASTExpressionStatement | null {
    const stmt = new ASTExpressionStatement(this.curToken);
    stmt.expression = this.parseExpression(LOWEST);

    if (this.peekTokenIs(SEMICOLON)) {
      this.nextToken();
    }

    return stmt;
  }

  parseExpression(precedence: number): ASTExpression | null {
    const prefix = this.prefixParseFns.get(this.curToken.kind);
    console.log(prefix);
    if (!prefix) return null;

    const leftExp = prefix();
    return leftExp;
  }

  parseIdentifier = (): ASTExpression => {
    return new ASTIdentifier(this.curToken, this.curToken.literal);
  };

  curTokenIs(tk: TokenKind) {
    return this.curToken.kind === tk;
  }

  peekTokenIs(tk: TokenKind) {
    return this.peekToken.kind === tk;
  }

  expectPeek(tk: TokenKind): boolean {
    if (this.peekTokenIs(tk)) {
      this.nextToken();
      return true;
    } else {
      this.peekError(tk);
      return false;
    }
  }

  getErrors(): string[] {
    return this.errors;
  }

  peekError(t: TokenKind) {
    const msg = `expected next token to be ${t}, bug got ${this.peekToken.kind}`;
    this.errors.push(msg);
  }

  registerPrefix(tt: TokenKind, fn: PrefixParseFn) {
    this.prefixParseFns.set(tt, fn);
  }

  registerInfix(tt: TokenKind, fn: InfixParseFn) {
    this.infixParseFns.set(tt, fn);
  }
}
