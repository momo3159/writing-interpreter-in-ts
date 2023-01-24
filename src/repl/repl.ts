import * as fs from "fs";
import { evaluate } from "../evaluator/evaluator";
const readline = require("readline");
import { Lexer } from "../lexer/lexer";
import { Environment } from "../object/environment";
import { Parser } from "../parser/parser";
import { EOF, Token } from "../token/token";

const PROMPT = ">> ";

export const start = async () => {
  const env = new Environment();

  while (true) {
    const input = await prompt();
    const l = new Lexer(input);
    const p = new Parser(l);

    const program = p.parseProgram();
    if (p.errors.length !== 0) {
      printParserErrors(p.errors);
      continue;
    }

    const evaluated = evaluate(program, env);
    if (evaluated !== null) {
      console.log(evaluated.inspect());
    }
  }
};

const prompt = async (prompt = PROMPT) => {
  const answer = (await question(PROMPT)) as string;
  return answer;
};

const question = (question: string) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      resolve(answer);
      rl.close();
    });
  });
};

const printParserErrors = (errors: string[]) => {
  errors.forEach((error) => console.log(`¥t${error}`));
};
