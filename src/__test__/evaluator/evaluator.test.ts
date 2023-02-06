import { Lexer } from "../../lexer/lexer";
import {
  ArrayObj,
  Boolean_,
  ErrorObj,
  FunctionObj,
  Integer,
  Null,
  Object_,
  ReturnValue,
  StringObj,
} from "../../object/object";
import { Parser } from "../../parser/parser";
import { evaluate } from "../../evaluator/evaluator";
import { Environment } from "../../object/environment";

test("整数の評価", () => {
  const tests = [
    { input: "5", expected: 5 },
    { input: "10", expected: 10 },
    { input: "-5", expected: -5 },
    { input: "-10", expected: -10 },
    { input: "5 + 5 + 5 + 5 - 10", expected: 10 },
    { input: "2 * 2 * 2 * 2 * 2", expected: 32 },
    { input: "-50 + 100 + -50", expected: 0 },
    { input: "5 * 2 + 10", expected: 20 },
    { input: "5 + 2 * 10", expected: 25 },
    { input: "20 + 2 * -10", expected: 0 },
    { input: "50 / 2 * 2 + 10", expected: 60 },
    { input: "2 * (5 + 10)", expected: 30 },
    { input: "3 * 3 * 3 + 10", expected: 37 },
    { input: "3 * (3 * 3) + 10", expected: 37 },
    { input: "(5 + 10 * 2 + 15 / 3) * 2 + -10", expected: 50 },
  ];

  tests.forEach(({ input, expected }) => {
    const evaluated = testEval(input);
    if (evaluated === null)
      throw new Error("null is invalid in this test case");
    testIntegerObject(evaluated, expected);
  });
});

test("真偽値の評価", () => {
  const tests = [
    { input: "true", expected: true },
    { input: "false", expected: false },
    { input: "1 < 2", expected: true },
    { input: "1 > 2", expected: false },
    { input: "1 < 1", expected: false },
    { input: "1 > 1", expected: false },
    { input: "1 == 1", expected: true },
    { input: "1 != 1", expected: false },
    { input: "1 == 2", expected: false },
    { input: "1 != 2", expected: true },
    { input: "true == true", expected: true },
    { input: "false == false", expected: true },
    { input: "true == false", expected: false },
    { input: "true != false", expected: true },
    { input: "false == true", expected: false },
    { input: "(1 < 2) == true", expected: true },
    { input: "(1 < 2) == false", expected: false },
    { input: "(1 > 2) == true", expected: false },
    { input: "(1 > 2) == false", expected: true },
  ];

  tests.forEach(({ input, expected }) => {
    const evaluated = testEval(input);
    if (evaluated === null) {
      throw new Error("null is invalid in this test case");
    }

    testBooleanObject(evaluated, expected);
  });
});

test("!演算子の評価", () => {
  const tests = [
    { input: "!true", expected: false },
    { input: "!false", expected: true },
    { input: "!5", expected: false },
    { input: "!!true", expected: true },
    { input: "!!false", expected: false },
    { input: "!!5", expected: true },
  ];

  tests.forEach(({ input, expected }) => {
    const evaluated = testEval(input);
    if (evaluated === null) throw new Error("null is invalid");
    testBooleanObject(evaluated, expected);
  });
});

test("if-else式の評価", () => {
  const tests = [
    { input: "if (true) { 10 }", expected: 10 },
    { input: "if (false) { 10 }", expected: null },
    { input: "if (1) { 10 }", expected: 10 },
    { input: "if (1 < 2) { 10 }", expected: 10 },
    { input: "if (1 > 2) { 10 }", expected: null },
    { input: "if (1 > 2) { 10 } else { 20 }", expected: 20 },
    { input: "if (1 < 2) { 10 } else { 20 }", expected: 10 },
  ];

  tests.forEach(({ input, expected }, i) => {
    const evaluated = testEval(input);
    if (evaluated === null) throw new Error("null is invalid");

    if (expected === null) {
      testNullObject(evaluated);
    } else {
      testIntegerObject(evaluated, expected);
    }
  });
});

test("return文の評価", () => {
  const tests = [
    { input: "return 10;", expected: 10 },
    { input: "return 10; 9;", expected: 10 },
    { input: "return 2 * 5; 9;", expected: 10 },
    { input: "9; return 2 * 5; 9;", expected: 10 },
    {
      input: `if (10 > 1) { if (10 > 1) { return 10; }; return 1; }`,
      expected: 10,
    },
    {
      input: `
        let f = fn(x) {
          return x;
          x + 10;
        };
        f(10);`,
      expected: 10,
    },
    {
      input: `
        let f = fn(x) {
          let result = x + 10;
          return result;
          return 10;
        };
        f(10);`,
      expected: 20,
    },
  ];

  tests.forEach(({ input, expected }, i) => {
    const evaluated = testEval(input);

    if (evaluated === null) throw new Error("null is invalid");

    testIntegerObject(evaluated, expected);
  });
});

test("エラーハンドリング", () => {
  const tests = [
    { input: "5 + true", expectedMessage: "type mismatch: INTEGER + BOOLEAN" },
    {
      input: "5 + true; 5;",
      expectedMessage: "type mismatch: INTEGER + BOOLEAN",
    },
    { input: "-true", expectedMessage: "unknown operator: -BOOLEAN" },
    {
      input: "true + false",
      expectedMessage: "unknown operator: BOOLEAN + BOOLEAN",
    },
    {
      input: "5; true + false; 5;",
      expectedMessage: "unknown operator: BOOLEAN + BOOLEAN",
    },
    {
      input: "if (10 > 1) { true + false }",
      expectedMessage: "unknown operator: BOOLEAN + BOOLEAN",
    },
    {
      input: "if (10 > 1) { if (10 > 1) { return true + false; } return 1; }",
      expectedMessage: "unknown operator: BOOLEAN + BOOLEAN",
    },
    { input: "foobar", expectedMessage: "identifier not found: foobar" },
    {
      input: `"hello" - "world"`,
      expectedMessage: "unknown operator: STRING - STRING",
    },
  ];

  tests.forEach(({ input, expectedMessage }) => {
    const evaluated = testEval(input);

    if (evaluated === null) throw new Error("no error object returned.");
    expect(evaluated instanceof ErrorObj).toBe(true);
    expect((evaluated as ErrorObj).message).toBe(expectedMessage);
  });
});

test("let 文の評価", () => {
  const tests = [
    { input: "let a = 5; a;", expected: 5 },
    { input: "let a = 5 * 5; a;", expected: 25 },
    { input: "let a = 5; let b = a; b;", expected: 5 },
    { input: "let a = 5; let b = a; let c = a + b + 5; c;", expected: 15 },
  ];

  tests.forEach(({ input, expected }) => {
    const evaluated = testEval(input);
    if (evaluated === null) throw new Error("null is invalid");
    expect(evaluated instanceof Integer).toBe(true);
    testIntegerObject(evaluated, expected);
  });
});

test("関数リテラルの評価", () => {
  const input = "fn (x) { x + 2; }";
  const evaluated = testEval(input);
  if (evaluated === null) throw new Error("null is invalid");

  expect(evaluated instanceof FunctionObj).toBe(true);
  const func = evaluated as FunctionObj;
  expect(func.parameters.length).toBe(1);
  expect(func.body.String()).toBe("(x + 2)");
});

test("関数呼び出しの評価", () => {
  const tests: { input: string; expected: number }[] = [
    { input: "let identity = fn(x) { x; }; identity(5)", expected: 5 },
    { input: "let identity = fn(x) { return x; }; identity(5)", expected: 5 },
    { input: "let double = fn(x) { x*2; }; double(5)", expected: 10 },
    { input: "let add = fn(x, y) { x + y; }; add(5, 5)", expected: 10 },
    {
      input: "let add = fn(x, y) { x + y; }; add(5 + 5, add(5, 5))",
      expected: 20,
    },
    { input: "fn(x) { x; }(5)", expected: 5 },
  ];

  for (const { input, expected } of tests) {
    const evaluated = testEval(input);
    if (evaluated === null) throw new Error("null is invalid");
    testIntegerObject(evaluated, expected);
  }
});

test("クロージャの評価", () => {
  const input = `
    let newAdder = fn (x) {
      fn (y) { x + y; }
    };
    let addTwo = newAdder(2);
    addTwo(2);
  `;

  const evaluated = testEval(input);
  if (evaluated === null) throw new Error("null is invalid");
  testIntegerObject(evaluated, 4);
});

test("文字列リテラルの評価", () => {
  const input = `"hello, world!"`;
  const evaluated = testEval(input);

  if (evaluated === null) throw new Error("null is invalid");
  expect(evaluated instanceof StringObj).toBe(true);
  const result = evaluated as StringObj;
  expect(result.value).toBe("hello, world!");
});

test("文字列結合", () => {
  const input = `"hello" + " " + "world!"`;
  const evaluated = testEval(input);
  if (evaluated === null) throw new Error("null is invalid");
  const str = evaluated as StringObj;
  expect(str.value).toBe("hello world!");
});

test("配列リテラルの評価", () => {
  const input = "[1, 2 * 2, 3 + 3]";
  const evaluated = testEval(input);
  if (evaluated === null) throw new Error("null is invalid");

  expect(evaluated instanceof ArrayObj).toBe(true);
  const arr = evaluated as ArrayObj;

  expect(arr.elements.length).toBe(3);
  testIntegerObject(arr.elements[0], 1);
  testIntegerObject(arr.elements[1], 4);
  testIntegerObject(arr.elements[2], 6);
});

test("配列の添字演算子式の評価", () => {
  const tests: { input: string; expected: any }[] = [
    { input: "[1, 2, 3][0]", expected: 1 },
    { input: "[1, 2, 3][1]", expected: 2 },
    { input: "[1, 2, 3][2]", expected: 3 },
    { input: "let i = 0; [1, 2, 3][i]", expected: 1 },
    { input: "[1, 2, 3][1 + 1]", expected: 3 },
    { input: "let myArray = [1, 2, 3]; myArray[2]", expected: 3 },
    {
      input: "let myArray = [1, 2, 3]; myArray[0] + myArray[1] + myArray[2];",
      expected: 6,
    },
    {
      input: "let myArray = [1, 2, 3]; let i = myArray[0]; myArray[i]",
      expected: 2,
    },
    { input: "[1, 2, 3][3]", expected: null },
    { input: "[1, 2, 3][-1]", expected: null },
  ];

  for (const { input, expected } of tests) {
    const evaluated = testEval(input);
    if (evaluated === null) throw new Error("null is invalid");
    if (expected === null) {
      testNullObject(evaluated);
    } else {
      testIntegerObject(evaluated, expected);
    }
  }
});

test("組み込み関数の評価", () => {
  const tests: { input: string; expected: number | string }[] = [
    { input: `len("");`, expected: 0 },
    { input: `len("four");`, expected: 4 },
    { input: `len("hello world");`, expected: 11 },
    {
      input: `len(1);`,
      expected: "argument to `len` not supported, got INTEGER",
    },
    {
      input: `len("one", "two");`,
      expected: "wrong number of arguments. got=2, want=1",
    },
  ];

  for (const { input, expected } of tests) {
    const evaluated = testEval(input);
    if (evaluated === null) throw new Error("null is invalid");

    switch (typeof expected) {
      case "number":
        testIntegerObject(evaluated, expected);
        break;
      case "string":
        expect(evaluated instanceof ErrorObj).toBe(true);
        const err = evaluated as ErrorObj;
        expect(err.message).toBe(expected);
        break;
    }
  }
});
const testEval = (input: string): Object_ | null => {
  const l = new Lexer(input);
  const p = new Parser(l);
  const program = p.parseProgram();
  const env = new Environment();
  return evaluate(program, env);
};

const testIntegerObject = (obj: Object_, expected: number) => {
  expect(obj instanceof Integer).toBe(true);
  const result = obj as Integer;

  expect(result.value).toBe(expected);
};

const testBooleanObject = (obj: Object_, expected: boolean) => {
  expect(obj instanceof Boolean_).toBe(true);
  const result = obj as Boolean_;

  expect(result.value).toBe(expected);
};

const testNullObject = (obj: Object_) => {
  expect(obj instanceof Null).toBe(true);
};
