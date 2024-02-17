type Delimiter = "\t" | "," | "|";

export class ColumnDelimiter {
  private static readonly _values: ColumnDelimiter[] = [];

  static readonly TAB = new ColumnDelimiter("Tab", "\t");
  static readonly COMMA = new ColumnDelimiter("Comma", ",");
  static readonly PIPE = new ColumnDelimiter("Pipe", "|");

  private constructor(
    readonly name: string,
    readonly value: Delimiter,
  ) {
    ColumnDelimiter._values.push(this);
  }

  static fromName(name: string): ColumnDelimiter {
    return ColumnDelimiter._values.find((x) => x.name === name)!;
  }

  static values(): ColumnDelimiter[] {
    return ColumnDelimiter._values;
  }
}
