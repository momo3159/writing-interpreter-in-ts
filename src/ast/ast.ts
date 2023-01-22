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
  name: ASTIdentifier; // 木の左側の子
  value: ASTExpression; // 木の右側の子

  constructor(token: Token, name: ASTIdentifier, value: ASTExpression) {
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
  returnValue: ASTExpression;

  constructor(token: Token, returnValue: ASTExpression) {
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
  expression: ASTExpression;

  constructor(token: Token, expression: ASTExpression) {
    this.token = token;
    this.expression = expression;
  }

  tokenLiteral(): string {
    return this.token.literal;
  }
  statementNode(): void {}

  String(): string {
    return this.expression.String();
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

export class ASTPrefixExpression implements ASTExpression {
  token: Token;
  operator: string;
  right: ASTExpression;

  constructor(token: Token, operator: string, right: ASTExpression) {
    this.token = token;
    this.operator = operator;
    this.right = right;
  }

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }

  String(): string {
    return `(${this.operator}${this.right.String()})`;
  }
}

export class ASTInfixExpression implements ASTExpression {
  token: Token;
  left: ASTExpression;
  operator: string;
  right: ASTExpression;

  constructor(
    token: Token,
    operator: string,
    left: ASTExpression,
    right: ASTExpression
  ) {
    this.token = token;
    this.operator = operator;
    this.left = left;
    this.right = right;
  }

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }

  String(): string {
    return `(${this.left.String()} ${this.operator} ${this.right.String()})`;
  }
}

export class ASTBooleanLiteral implements ASTExpression {
  token: Token;
  value: boolean;

  constructor(token: Token, value: boolean) {
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

export class ASTIfExpression implements ASTExpression {
  token: Token;
  condition: ASTExpression;
  consequence: ASTBlockStatement;
  alternative: ASTBlockStatement | null;

  constructor(
    token: Token,
    condition: ASTExpression,
    consequence: ASTBlockStatement,
    alternative: ASTBlockStatement | null = null
  ) {
    this.token = token;
    this.condition = condition;
    this.consequence = consequence;
    this.alternative = alternative;
  }

  expressionNode(): void {}
  tokenLiteral(): string {
    return this.token.literal;
  }
  String(): string {
    return `if ${this.condition.String()} ${this.consequence.String()} ${
      this.alternative && "else" + this.alternative.String()
    }`;
  }
}

export class ASTBlockStatement implements ASTStatement {
  token: Token;
  statements: ASTStatement[];

  constructor(token: Token, statements: ASTStatement[]) {
    this.token = token;
    this.statements = statements;
  }

  statementNode(): void {}
  tokenLiteral(): string {
    return this.token.literal;
  }

  String(): string {
    return this.statements.map((st) => st.String()).join();
  }
}

export class ASTFunctionLiteral implements ASTExpression {
  token: Token;
  parameters: ASTIdentifier[];
  body: ASTBlockStatement;

  constructor(
    token: Token,
    parameters: ASTIdentifier[],
    body: ASTBlockStatement
  ) {
    this.token = token;
    this.parameters = parameters;
    this.body = body;
  }

  expressionNode(): void {}
  tokenLiteral(): string {
    return this.token.literal;
  }
  String(): string {
    const parameters = this.parameters?.map((p) => p.String()).join(", ");
    return `${this.tokenLiteral()}(${parameters}) ${this.body.String()}`;
  }
}

export class ASTCallExpression implements ASTExpression {
  token: Token;
  func: ASTExpression;
  args: ASTExpression[];

  constructor(token: Token, func: ASTExpression, args: ASTExpression[]) {
    this.token = token;
    this.func = func;
    this.args = args;
  }

  expressionNode(): void {}
  tokenLiteral(): string {
    return this.token.literal;
  }
  String(): string {
    return `${this.func.String()}(${this.args
      .map((arg) => arg.String())
      .join(", ")})`;
  }
}
