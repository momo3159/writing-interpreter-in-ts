import {
  ASSIGN,
  COMMA,
  LBRACE,
  LPAREN,
  PLUS,
  RBRACE,
  RPAREN,
  SEMICOLON,
  TokenKind,
  EOF,
  LET,
  IDENT,
  INT,
  FUNCTION,
  LT,
  GT,
  BANG,
  MINUS,
  SLASH,
  ASTERISK,
  IF,
  RETURN,
  TRUE,
  ELSE,
  FALSE,
  EQ,
  NOT_EQ,
  STRING,
  LBRACKET,
  RBRACKET,
  COLON,
} from "../../token/token";
import { Lexer } from "../../lexer/lexer";

describe("nextToken", () => {
  test("入力が1文字のトークンで構成されているとき", () => {
    const input = "=+(){},;!-/* 5 < 10 > 5";
    const l = new Lexer(input);
    const tests: { expectedKind: TokenKind; expectedLiteral: string }[] = [
      { expectedKind: ASSIGN, expectedLiteral: "=" },
      { expectedKind: PLUS, expectedLiteral: "+" },
      { expectedKind: LPAREN, expectedLiteral: "(" },
      { expectedKind: RPAREN, expectedLiteral: ")" },
      { expectedKind: LBRACE, expectedLiteral: "{" },
      { expectedKind: RBRACE, expectedLiteral: "}" },
      { expectedKind: COMMA, expectedLiteral: "," },
      { expectedKind: SEMICOLON, expectedLiteral: ";" },
      { expectedKind: BANG, expectedLiteral: "!" },
      { expectedKind: MINUS, expectedLiteral: "-" },
      { expectedKind: SLASH, expectedLiteral: "/" },
      { expectedKind: ASTERISK, expectedLiteral: "*" },
      { expectedKind: INT, expectedLiteral: "5" },
      { expectedKind: LT, expectedLiteral: "<" },
      { expectedKind: INT, expectedLiteral: "10" },
      { expectedKind: GT, expectedLiteral: ">" },
      { expectedKind: INT, expectedLiteral: "5" },
      { expectedKind: EOF, expectedLiteral: "\0" },
    ];

    tests.forEach((tt, i) => {
      const tok = l.nextToken();
      try {
        expect(tok.kind).toBe(tt.expectedKind);
      } catch (e) {
        console.error(
          `tests[${i}] - tokenkind wrong. expected=${tt.expectedKind} got=${tok.kind}`
        );
        throw e;
      }

      try {
        expect(tok.literal).toBe(tt.expectedLiteral);
      } catch (e) {
        console.error(
          `tests[${i}] - literal wrong. expected=${tt.expectedLiteral} got=${tok.literal}`
        );
        throw e;
      }
    });
  });

  test("入力に2文字以上のトークンで構成されているとき", () => {
    const input = `let five = 5;
    let ten = 10;
    let add = fn (x, y) {
      x + y;
    };

    let result = add(five, ten);
    if (5 < 10) {
      return true;
    } else {
      return false;
    }
    10 == 10;
    5 != 10;
    "foobar";
    "foo bar";
    "";
    [1, 2];
    {"foo": "bar"};
    `;
    const l = new Lexer(input);
    const tests: { expectedKind: TokenKind; expectedLiteral: string }[] = [
      { expectedKind: LET, expectedLiteral: "let" },
      { expectedKind: IDENT, expectedLiteral: "five" },
      { expectedKind: ASSIGN, expectedLiteral: "=" },
      { expectedKind: INT, expectedLiteral: "5" },
      { expectedKind: SEMICOLON, expectedLiteral: ";" },

      { expectedKind: LET, expectedLiteral: "let" },
      { expectedKind: IDENT, expectedLiteral: "ten" },
      { expectedKind: ASSIGN, expectedLiteral: "=" },
      { expectedKind: INT, expectedLiteral: "10" },
      { expectedKind: SEMICOLON, expectedLiteral: ";" },

      { expectedKind: LET, expectedLiteral: "let" },
      { expectedKind: IDENT, expectedLiteral: "add" },
      { expectedKind: ASSIGN, expectedLiteral: "=" },
      { expectedKind: FUNCTION, expectedLiteral: "fn" },
      { expectedKind: LPAREN, expectedLiteral: "(" },
      { expectedKind: IDENT, expectedLiteral: "x" },
      { expectedKind: COMMA, expectedLiteral: "," },
      { expectedKind: IDENT, expectedLiteral: "y" },
      { expectedKind: RPAREN, expectedLiteral: ")" },
      { expectedKind: LBRACE, expectedLiteral: "{" },
      { expectedKind: IDENT, expectedLiteral: "x" },
      { expectedKind: PLUS, expectedLiteral: "+" },
      { expectedKind: IDENT, expectedLiteral: "y" },
      { expectedKind: SEMICOLON, expectedLiteral: ";" },
      { expectedKind: RBRACE, expectedLiteral: "}" },
      { expectedKind: SEMICOLON, expectedLiteral: ";" },
      { expectedKind: LET, expectedLiteral: "let" },
      { expectedKind: IDENT, expectedLiteral: "result" },
      { expectedKind: ASSIGN, expectedLiteral: "=" },
      { expectedKind: IDENT, expectedLiteral: "add" },
      { expectedKind: LPAREN, expectedLiteral: "(" },
      { expectedKind: IDENT, expectedLiteral: "five" },
      { expectedKind: COMMA, expectedLiteral: "," },
      { expectedKind: IDENT, expectedLiteral: "ten" },
      { expectedKind: RPAREN, expectedLiteral: ")" },
      { expectedKind: SEMICOLON, expectedLiteral: ";" },

      { expectedKind: IF, expectedLiteral: "if" },
      { expectedKind: LPAREN, expectedLiteral: "(" },
      { expectedKind: INT, expectedLiteral: "5" },
      { expectedKind: LT, expectedLiteral: "<" },
      { expectedKind: INT, expectedLiteral: "10" },
      { expectedKind: RPAREN, expectedLiteral: ")" },
      { expectedKind: LBRACE, expectedLiteral: "{" },
      { expectedKind: RETURN, expectedLiteral: "return" },
      { expectedKind: TRUE, expectedLiteral: "true" },
      { expectedKind: SEMICOLON, expectedLiteral: ";" },
      { expectedKind: RBRACE, expectedLiteral: "}" },
      { expectedKind: ELSE, expectedLiteral: "else" },
      { expectedKind: LBRACE, expectedLiteral: "{" },
      { expectedKind: RETURN, expectedLiteral: "return" },
      { expectedKind: FALSE, expectedLiteral: "false" },
      { expectedKind: SEMICOLON, expectedLiteral: ";" },
      { expectedKind: RBRACE, expectedLiteral: "}" },

      { expectedKind: INT, expectedLiteral: "10" },
      { expectedKind: EQ, expectedLiteral: "==" },
      { expectedKind: INT, expectedLiteral: "10" },
      { expectedKind: SEMICOLON, expectedLiteral: ";" },
      { expectedKind: INT, expectedLiteral: "5" },
      { expectedKind: NOT_EQ, expectedLiteral: "!=" },
      { expectedKind: INT, expectedLiteral: "10" },
      { expectedKind: SEMICOLON, expectedLiteral: ";" },

      { expectedKind: STRING, expectedLiteral: "foobar" },
      { expectedKind: SEMICOLON, expectedLiteral: ";" },

      { expectedKind: STRING, expectedLiteral: "foo bar" },
      { expectedKind: SEMICOLON, expectedLiteral: ";" },

      { expectedKind: STRING, expectedLiteral: "" },
      { expectedKind: SEMICOLON, expectedLiteral: ";" },

      { expectedKind: LBRACKET, expectedLiteral: "[" },
      { expectedKind: INT, expectedLiteral: "1" },
      { expectedKind: COMMA, expectedLiteral: "," },
      { expectedKind: INT, expectedLiteral: "2" },
      { expectedKind: RBRACKET, expectedLiteral: "]" },
      { expectedKind: SEMICOLON, expectedLiteral: ";" },

      { expectedKind: LBRACE, expectedLiteral: "{" },
      { expectedKind: STRING, expectedLiteral: "foo" },
      { expectedKind: COLON, expectedLiteral: ":" },
      { expectedKind: STRING, expectedLiteral: "bar" },
      { expectedKind: RBRACE, expectedLiteral: "}" },
      { expectedKind: SEMICOLON, expectedLiteral: ";" },
      { expectedKind: EOF, expectedLiteral: "\0" },
    ];

    tests.forEach((tt, i) => {
      const tok = l.nextToken();
      try {
        expect(tok.kind).toBe(tt.expectedKind);
      } catch (e) {
        console.error(
          `tests[${i}] - tokenkind wrong. expected=${tt.expectedKind} got=${tok.kind}`
        );
        throw e;
      }

      try {
        expect(tok.literal).toBe(tt.expectedLiteral);
      } catch (e) {
        console.error(
          `tests[${i}] - literal wrong. expected=${tt.expectedLiteral} got=${tok.literal}`
        );
        throw e;
      }
    });
  });
});
