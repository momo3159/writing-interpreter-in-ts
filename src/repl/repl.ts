import * as fs from "fs";
const readline = require("readline");
import { Lexer } from "../lexer/lexer";
import { EOF, Token } from "../token/token";

const PROMPT = ">> ";

export const start = async () => {
  while (true) {
    const input = await prompt();
    const l = new Lexer(input);

    while (true) {
      const tok = l.nextToken();
      if (tok.kind === EOF) break;
      console.log(tok);
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
