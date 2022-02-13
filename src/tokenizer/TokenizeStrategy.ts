type Name = "default" | "english-only" | "japanese" | "arabic";

export class TokenizeStrategy {
  private static readonly _values: TokenizeStrategy[] = [];

  static readonly DEFAULT = new TokenizeStrategy("default", 3);
  static readonly ENGLISH_ONLY = new TokenizeStrategy("english-only", 3);
  static readonly JAPANESE = new TokenizeStrategy("japanese", 2);
  static readonly ARABIC = new TokenizeStrategy("arabic", 3);

  private constructor(readonly name: Name, readonly triggerThreshold: number) {
    TokenizeStrategy._values.push(this);
  }

  static fromName(name: string): TokenizeStrategy {
    return TokenizeStrategy._values.find((x) => x.name === name)!;
  }

  static values(): TokenizeStrategy[] {
    return TokenizeStrategy._values;
  }
}
