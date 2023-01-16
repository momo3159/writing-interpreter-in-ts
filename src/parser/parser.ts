import {
  ASTExpression,
  ASTExpressionStatement,
  ASTIdentifier,
  ASTInfixExpression,
  ASTIntegerLiteral,
  ASTLetStatement,
  ASTPrefixExpression,
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
  INT,
  LET,
  RETURN,
  SEMICOLON,
  Token,
  TokenKind,
  BANG,
  MINUS,
  EQ,
  NOT_EQ,
  LT,
  GT,
  PLUS,
  SLASH,
  ASTERISK,
} from "../token/token";
import { iota } from "../util/iota";

export type PrefixParseFn = () => ASTExpression | null;
export type InfixParseFn = (leftValue: ASTExpression) => ASTExpression | null;

const { LOWEST, EQUALS, LESSGREATER, SUM, PRODUCT, PREFIX, CALL } = iota();
const PRECEDENCES: ReadonlyMap<TokenKind, number> = new Map([
  [EQ, EQUALS],
  [NOT_EQ, EQUALS],
  [LT, LESSGREATER],
  [GT, LESSGREATER],
  [PLUS, SUM],
  [MINUS, SUM],
  [SLASH, PRODUCT],
  [ASTERISK, PRODUCT],
]);

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

    // IDENTとINTは演算子ではないが，便宜上このような形で実装する
    this.registerPrefix(IDENT, this.parseIdentifier);
    this.registerPrefix(INT, this.parseIntegerLiteral);
    this.registerPrefix(BANG, this.parsePrefixExpression);
    this.registerPrefix(MINUS, this.parsePrefixExpression);

    this.registerInfix(PLUS, this.parseInfixExpression);
    this.registerInfix(MINUS, this.parseInfixExpression);
    this.registerInfix(SLASH, this.parseInfixExpression);
    this.registerInfix(ASTERISK, this.parseInfixExpression);
    this.registerInfix(EQ, this.parseInfixExpression);
    this.registerInfix(NOT_EQ, this.parseInfixExpression);
    this.registerInfix(LT, this.parseInfixExpression);
    this.registerInfix(GT, this.parseInfixExpression);
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
    if (!prefix) {
      this.noPrefixParseFnError(this.curToken.kind);
      return null;
    }

    let leftExp = prefix();
    if (leftExp === null) {
      return null;
    }

    while (!this.peekTokenIs(SEMICOLON) && precedence < this.peekPrecedence()) {
      const infix = this.infixParseFns.get(this.peekToken.kind);
      if (infix === undefined) return leftExp;

      this.nextToken();

      leftExp = infix(leftExp as ASTExpression);
    }

    return leftExp;
  }

  parseIdentifier = (): ASTExpression => {
    return new ASTIdentifier(this.curToken, this.curToken.literal);
  };

  parseIntegerLiteral = (): ASTIntegerLiteral | null => {
    const literal = this.curToken.literal;
    const value = Number(literal);
    if (Number.isNaN(value)) {
      this.errors.push(`could not parse ${this.curToken.literal} as integer`);
      return null;
    }
    return new ASTIntegerLiteral(this.curToken, value);
  };

  parsePrefixExpression = (): ASTExpression | null => {
    const exp = new ASTPrefixExpression(this.curToken, this.curToken.literal);
    this.nextToken();

    exp.right = this.parseExpression(PREFIX);
    return exp;
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

  noPrefixParseFnError(tt: TokenKind) {
    const msg = `no prefix parse function for ${tt} found`;
    this.errors.push(msg);
  }

  curPrecedence(): number {
    const p = PRECEDENCES.get(this.curToken.kind);

    if (p !== undefined) return p;
    else return LOWEST;
  }

  peekPrecedence(): number {
    const p = PRECEDENCES.get(this.peekToken.kind);

    if (p !== undefined) return p;
    else return LOWEST;
  }

  parseInfixExpression = (left: ASTExpression): ASTExpression | null => {
    const exp = new ASTInfixExpression(
      this.curToken,
      this.curToken.literal,
      left
    );

    const precedence = this.curPrecedence();
    this.nextToken();
    exp.right = this.parseExpression(precedence);

    return exp;
  };
}
