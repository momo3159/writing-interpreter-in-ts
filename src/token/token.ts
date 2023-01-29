export type TokenKind = string;

export type Token = {
  kind: TokenKind;
  literal: string;
};

export const [
  // 構文解析器が処理を停止して良いかどうかをこれらを用いて判別する
  ILLEGAL,
  EOF,
  // 識別子, リテラル
  IDENT,
  INT,
  STRING,
  // 演算子
  ASSIGN,
  PLUS,
  MINUS,
  BANG,
  ASTERISK,
  SLASH,
  LT,
  GT,
  EQ,
  NOT_EQ,
  // デリミタ
  COMMA,
  SEMICOLON,
  // 記号
  LPAREN,
  RPAREN,
  LBRACE,
  RBRACE,
  // キーワード
  FUNCTION,
  LET,
  IF,
  ELSE,
  RETURN,
  TRUE,
  FALSE,
]: TokenKind[] = [
  "ILLEGAL",
  "EOF",
  "IDENT",
  "INT",
  "STRING",
  "ASSIGN",
  "PLUS",
  "MINUS",
  "BANG",
  "ASTERISK",
  "SLASH",
  "LT",
  "GT",
  "EQ",
  "NOT_EQ",
  "COMMA",
  "SEMICOLON",
  "LPAREN",
  "RPAREN",
  "LBRACE",
  "RBRACE",
  "FUNCTION",
  "LET",
  "IF",
  "ELSE",
  "RETURN",
  "TRUE",
  "FALSE",
];

const keywords: ReadonlyMap<string, TokenKind> = new Map([
  ["fn", FUNCTION],
  ["let", LET],
  ["if", IF],
  ["else", ELSE],
  ["return", RETURN],
  ["true", TRUE],
  ["false", FALSE],
]);

export const lookupIdent = (ident: string): TokenKind => {
  if (keywords.has(ident)) return keywords.get(ident) as string;
  else return IDENT;
};
