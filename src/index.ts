import { start } from "./repl/repl";
const os = require("os");

const main = () => {
  const userName = os.userInfo().username;
  console.log(`Hello ${userName}! This is the Monkey programming language!`);
  console.log("Feel free to type in commands");
  start();
};

main();
