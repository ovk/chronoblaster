function rpad(str: string, char: string, length: number): string {
  return str + char.repeat(Math.max(0, length - str.length));
}

export {
  rpad
};
