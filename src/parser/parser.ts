import {
  ASTBlockStatement,
  ASTBooleanLiteral,
  ASTCallExpression,
  ASTExpression,
  ASTExpressionStatement,
  ASTFunctionLiteral,
  ASTIdentifier,
  ASTIfExpression,
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
  TRUE,
  FALSE,
  RPAREN,
  LPAREN,
  IF,
  LBRACE,
  RBRACE,
  ELSE,
  FUNCTION,
  COMMA,
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
  [LPAREN, CALL],
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
    this.registerPrefix(TRUE, this.parseBooleanLiteral);
    this.registerPrefix(FALSE, this.parseBooleanLiteral);
    this.registerPrefix(LPAREN, this.parseGroupedExpression);
    this.registerPrefix(IF, this.parseIfExpression);
    this.registerPrefix(FUNCTION, this.parseFunctionLiteral);

    this.registerInfix(PLUS, this.parseInfixExpression);
    this.registerInfix(MINUS, this.parseInfixExpression);
    this.registerInfix(SLASH, this.parseInfixExpression);
    this.registerInfix(ASTERISK, this.parseInfixExpression);
    this.registerInfix(EQ, this.parseInfixExpression);
    this.registerInfix(NOT_EQ, this.parseInfixExpression);
    this.registerInfix(LT, this.parseInfixExpression);
    this.registerInfix(GT, this.parseInfixExpression);
    this.registerInfix(LPAREN, this.parseCallExpression);
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
    const token = this.curToken;
    if (!this.expectPeek(IDENT)) {
      return null;
    }

    // Identifier の解析
    const name = new ASTIdentifier(this.curToken, this.curToken.literal);
    if (!this.expectPeek(ASSIGN)) {
      return null;
    }

    this.nextToken();

    // 右辺の解析
    const value = this.parseExpression(LOWEST);
    if (this.peekTokenIs(SEMICOLON)) this.nextToken();

    return value ? new ASTLetStatement(token, name, value) : null;
  }

  parseReturnStatement(): ASTReturnStatement | null {
    const token = this.curToken;
    this.nextToken();

    const returnValue = this.parseExpression(LOWEST);
    if (this.peekTokenIs(SEMICOLON)) this.nextToken();

    return returnValue ? new ASTReturnStatement(token, returnValue) : null;
  }

  parseExpressionStatement(): ASTExpressionStatement | null {
    const token = this.curToken;
    const expression = this.parseExpression(LOWEST);

    if (this.peekTokenIs(SEMICOLON)) {
      this.nextToken();
    }

    return expression ? new ASTExpressionStatement(token, expression) : null;
  }

  parseExpression(precedence: number): ASTExpression | null {
    const prefix = this.prefixParseFns.get(this.curToken.kind);
    if (!prefix) {
      this.noPrefixParseFnError(this.curToken.kind);
      return null;
    }

    let leftExp = prefix(); // 今まで構文解析した式
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
    const token = this.curToken;
    const operator = this.curToken.literal;

    this.nextToken();

    const right = this.parseExpression(PREFIX);
    return right ? new ASTPrefixExpression(token, operator, right) : null;
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
    const token = this.curToken;
    const operator = this.curToken.literal;

    const precedence = this.curPrecedence();
    this.nextToken();

    const right = this.parseExpression(precedence);

    return left !== null && right !== null
      ? new ASTInfixExpression(token, operator, left, right)
      : null;
  };

  parseBooleanLiteral = (): ASTExpression => {
    const exp = new ASTBooleanLiteral(this.curToken, this.curTokenIs(TRUE));
    return exp;
  };

  parseGroupedExpression = (): ASTExpression | null => {
    this.nextToken();
    const exp = this.parseExpression(LOWEST);

    if (!this.expectPeek(RPAREN)) {
      return null;
    }

    return exp;
  };

  parseIfExpression = (): ASTExpression | null => {
    const ifToken = this.curToken;

    if (!this.expectPeek(LPAREN)) {
      return null;
    }

    this.nextToken();
    const condition = this.parseExpression(LOWEST);

    if (!condition) return null;
    if (!this.expectPeek(RPAREN)) {
      return null;
    }
    if (!this.expectPeek(LBRACE)) {
      return null;
    }

    const consequence = this.parseBlockStatement();
    if (!consequence) return null;

    if (this.peekTokenIs(ELSE)) {
      this.nextToken();
      if (!this.expectPeek(LBRACE)) {
        return null;
      }

      const alternative = this.parseBlockStatement();
      return new ASTIfExpression(ifToken, condition, consequence, alternative);
    }

    return new ASTIfExpression(ifToken, condition, consequence, null);
  };

  parseBlockStatement(): ASTBlockStatement | null {
    const token = this.curToken;
    const stmts: ASTStatement[] = [];

    this.nextToken();

    while (!this.curTokenIs(RBRACE) && !this.curTokenIs(EOF)) {
      const stmt = this.parseStatement();
      if (stmt !== null) stmts.push(stmt);
      this.nextToken();
    }

    return new ASTBlockStatement(token, stmts);
  }

  parseFunctionLiteral = (): ASTFunctionLiteral | null => {
    const token = this.curToken;

    if (!this.expectPeek(LPAREN)) {
      return null;
    }

    const parameters = this.parseFunctionParameters();
    if (parameters === null) return null;
    if (!this.expectPeek(LBRACE)) {
      return null;
    }

    const body = this.parseBlockStatement();
    if (!body) return null;

    return new ASTFunctionLiteral(token, parameters, body);
  };

  parseFunctionParameters = (): ASTIdentifier[] | null => {
    const parameters: ASTIdentifier[] = [];
    if (this.peekTokenIs(RPAREN)) {
      this.nextToken();
      return parameters;
    }

    this.nextToken();
    parameters.push(new ASTIdentifier(this.curToken, this.curToken.literal));

    while (this.peekTokenIs(COMMA)) {
      this.nextToken();
      this.nextToken();
      parameters.push(new ASTIdentifier(this.curToken, this.curToken.literal));
    }

    if (!this.expectPeek(RPAREN)) return null;
    return parameters;
  };

  parseCallExpression = (func: ASTExpression): ASTExpression | null => {
    const token = this.curToken;
    const args = this.parseCallArguments();
    return args ? new ASTCallExpression(token, func, args) : null;
  };

  parseCallArguments(): ASTExpression[] | null {
    const args: ASTExpression[] = [];
    if (this.peekTokenIs(RPAREN)) {
      this.nextToken();
      return args;
    }

    this.nextToken();
    // add(2*3, 1)を考える
    // LOWEST でないと，　２がaddに吸い寄せられる場合がある
    const firstArg = this.parseExpression(LOWEST);
    if (!firstArg) return null;
    args.push(firstArg);

    while (this.peekTokenIs(COMMA)) {
      this.nextToken();
      this.nextToken();

      // LOWEST でないと，curTokenだけで解析が終わってしまう場合がる
      const arg = this.parseExpression(LOWEST);
      if (!arg) return null;
      args.push(arg);
    }

    if (!this.expectPeek(RPAREN)) {
      return null;
    }

    return args;
  }
}
