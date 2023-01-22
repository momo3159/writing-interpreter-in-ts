import { Lexer } from "../lexer/lexer";
import { Boolean_, Integer, Object_ } from "../object/object";
import { Parser } from "../parser/parser";
import { evaluate } from "./evaluator";

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

const testEval = (input: string): Object_ | null => {
  const l = new Lexer(input);
  const p = new Parser(l);
  const program = p.parseProgram();
  return evaluate(program);
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
