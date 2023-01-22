import { Lexer } from "../lexer/lexer";
import { Boolean_, Integer, Object_ } from "../object/object";
import { Parser } from "../parser/parser";
import { evaluate } from "./evaluator";

test("整数の評価", () => {
  const tests = [
    { input: "5", expected: 5 },
    { input: "10", expected: 10 },
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
  ];

  tests.forEach(({ input, expected }) => {
    const evaluated = testEval(input);
    if (evaluated === null) {
      throw new Error("null is invalid in this test case");
    }

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
