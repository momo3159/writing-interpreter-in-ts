export const iota = (start = 0) => {
  let count = start;
  return new Proxy(
    {},
    {
      get(o: { [key: string | symbol]: number }, prop) {
        if (prop in o) return o[prop];
        else return (o[prop] = count++);
      },
    }
  );
};
