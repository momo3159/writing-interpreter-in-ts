import {
  ASSIGN,
  ASTERISK,
  BANG,
  COMMA,
  EOF,
  EQ,
  GT,
  ILLEGAL,
  INT,
  LBRACE,
  LBRACKET,
  lookupIdent,
  LPAREN,
  LT,
  MINUS,
  NOT_EQ,
  PLUS,
  RBRACE,
  RBRACKET,
  RPAREN,
  SEMICOLON,
  SLASH,
  STRING,
  Token,
  TokenKind,
} from "../token/token";

export class Lexer {
  input: string;
  position: number; // 現在の文字の位置
  readPosition: number; // これから読み込む位置
  ch: string; // 現在検査中の文字

  constructor(input: string) {
    this.input = input;
    this.position = 0;
    this.readPosition = 0;
    this.ch = "";

    this.readChar();
  }

  nextToken(): Token {
    let tok: Token;
    this.skipWhitespace();

    switch (this.ch) {
      case "=":
        if (this.peekChar() === "=") {
          const pos = this.position;
          this.readChar();
          tok = {
            kind: EQ,
            literal: this.input.substring(pos, this.readPosition),
          };
        } else {
          tok = this.newToken(ASSIGN, this.ch);
        }
        break;
      case ";":
        tok = this.newToken(SEMICOLON, this.ch);
        break;
      case "(":
        tok = this.newToken(LPAREN, this.ch);
        break;
      case ")":
        tok = this.newToken(RPAREN, this.ch);
        break;
      case ",":
        tok = this.newToken(COMMA, this.ch);
        break;
      case "+":
        tok = this.newToken(PLUS, this.ch);
        break;
      case "{":
        tok = this.newToken(LBRACE, this.ch);
        break;
      case "}":
        tok = this.newToken(RBRACE, this.ch);
        break;
      case "-":
        tok = this.newToken(MINUS, this.ch);
        break;
      case "*":
        tok = this.newToken(ASTERISK, this.ch);
        break;
      case "/":
        tok = this.newToken(SLASH, this.ch);
        break;
      case ">":
        tok = this.newToken(GT, this.ch);
        break;
      case "<":
        tok = this.newToken(LT, this.ch);
        break;
      case "!":
        if (this.peekChar() === "=") {
          const pos = this.position;
          this.readChar();
          tok = {
            kind: NOT_EQ,
            literal: this.input.substring(pos, this.readPosition),
          };
        } else {
          tok = this.newToken(BANG, this.ch);
        }
        break;
      case `"`:
        const stringLiteral = this.readStringLiteral();
        if (this.peekChar() === `"`) {
          this.readChar();
          tok = { kind: STRING, literal: `${stringLiteral}` };
        } else {
          this.readChar();
          tok = this.newToken(ILLEGAL, this.ch);
        }
        break;
      case "[":
        tok = this.newToken(LBRACKET, this.ch);
        break;
      case "]":
        tok = this.newToken(RBRACKET, this.ch);
        break;
      case "\0":
        tok = { kind: EOF, literal: "\0" };
        break;
      default:
        if (this.isLetter(this.ch)) {
          // 現在の文字が英字の場合，識別子 or キーワード
          const literal = this.readIdentifier();
          tok = { kind: lookupIdent(literal), literal: literal };
          return tok;
        } else if (this.isDigit(this.ch)) {
          tok = { kind: INT, literal: this.readNumber() };
          return tok;
        } else {
          tok = this.newToken(ILLEGAL, this.ch);
        }
    }

    this.readChar();
    return tok;
  }

  readStringLiteral() {
    const position = this.position;
    while (this.peekChar() !== `"` && this.peekChar() !== "\0") {
      this.readChar();
    }

    return this.input.substring(position + 1, this.position + 1);
  }

  readChar() {
    if (this.readPosition >= this.input.length) {
      this.ch = "\0";
    } else {
      this.ch = this.input[this.readPosition];
    }

    this.position = this.readPosition;
    this.readPosition += 1;
  }

  peekChar(): string {
    if (this.readPosition >= this.input.length) {
      return "\0";
    } else {
      return this.input[this.readPosition];
    }
  }

  private newToken(tokenKind: TokenKind, ch: string): Token {
    return { kind: tokenKind, literal: ch };
  }

  private readIdentifier(): string {
    const position = this.position;
    while (this.isLetter(this.ch)) {
      this.readChar();
    }

    return this.input.substring(position, this.position);
  }

  private readNumber(): string {
    const position = this.position;
    while (this.isDigit(this.ch)) {
      this.readChar();
    }

    return this.input.substring(position, this.position);
  }

  private isLetter(ch: string): boolean {
    // この判定によって，identiferに含めることができる文字が決まる
    return ("a" <= ch && ch <= "z") || ("A" <= ch && ch <= "Z") || ch === "_";
  }

  private isDigit(ch: string): boolean {
    return "0" <= ch && ch <= "9";
  }
  private skipWhitespace() {
    while (
      this.ch === " " ||
      this.ch === "\t" ||
      this.ch === "\n" ||
      this.ch === "\r"
    ) {
      this.readChar();
    }
  }
}
