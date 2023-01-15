import { Token } from "../token/token";

export interface ASTNode {
  tokenLiteral(): string;
  String(): string;
}

export interface ASTStatement extends ASTNode {
  statementNode(): void;
}

export interface ASTExpression extends ASTNode {
  expressionNode(): void;
}

// ルートノード
export class Program implements ASTNode {
  statements: ASTStatement[] = [];

  tokenLiteral(): string {
    if (this.statements.length > 0) {
      return this.statements[0].tokenLiteral();
    } else {
      return "";
    }
  }

  String(): string {
    return this.statements.map((s) => s.String()).join();
  }
}

export class ASTLetStatement implements ASTStatement {
  token: Token;
  name: ASTIdentifier | null = null; // 木の左側の子
  value: ASTExpression | null = null; // 木の右側の子

  constructor(
    token: Token,
    name: ASTIdentifier | null = null,
    value: ASTExpression | null = null
  ) {
    this.token = token;
    this.name = name;
    this.value = value;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }

  statementNode(): void {}

  String(): string {
    return `${this.tokenLiteral()} ${this.name?.String()} = ${this.value?.String()};`;
  }
}

export class ASTReturnStatement implements ASTStatement {
  token: Token;
  returnValue: ASTExpression | null = null;

  constructor(token: Token, returnValue: ASTExpression | null = null) {
    this.token = token;
    this.returnValue = returnValue;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }
  statementNode(): void {}

  String(): string {
    return `${this.token.literal} ${this.returnValue?.String()};`;
  }
}

export class ASTExpressionStatement implements ASTStatement {
  token: Token;
  expression: ASTExpression | null;

  constructor(token: Token, expression: ASTExpression | null = null) {
    this.token = token;
    this.expression = expression;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }
  statementNode(): void {}

  String(): string {
    if (this.expression !== null) {
      return this.expression.String();
    } else {
      return "";
    }
  }
}

/**
 * 簡単のため，Identifierノードを式として扱う
 * IDENTが左辺にある場合は値を生成せず，右辺にある場合は値を生成する
 * これらをとりあえず同一視して扱う
 */
export class ASTIdentifier implements ASTExpression {
  token: Token;
  value: string;

  constructor(token: Token, value: string) {
    this.token = token;
    this.value = value;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }
  expressionNode(): void {}

  String(): string {
    return this.value;
  }
}

export class ASTIntegerLiteral implements ASTExpression {
  token: Token;
  value: number;

  constructor(token: Token, value: number) {
    this.token = token;
    this.value = value;
  }

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }
  String(): string {
    return this.token.literal;
  }
}
