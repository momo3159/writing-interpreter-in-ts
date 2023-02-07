import { StringObj } from "../../object/object";

test("文字列オブジェクトのハッシュキー", () => {
  const hello1 = new StringObj("Hello World");
  const hello2 = new StringObj("Hello World");
  const diff1 = new StringObj("My name is johnny");
  const diff2 = new StringObj("My name is johnny");

  expect(hello1.hashKey().value).toBe(hello2.hashKey().value);
  expect(diff1.hashKey().value).toBe(diff2.hashKey().value);
  expect(hello1.hashKey().value).not.toBe(diff1.hashKey().value);
});
