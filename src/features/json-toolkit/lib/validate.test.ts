import { describe, expect, it } from "vitest";
import { locateSyntaxError } from "./validate";

describe("locateSyntaxError", () => {
  it("reads line and column from a V8 message", () => {
    const issue = locateSyntaxError(
      '{\n  "a": 1,\n  x\n}',
      new SyntaxError("Unexpected token } in JSON at position 16 (line 4 column 1)")
    );

    expect(issue).toEqual({
      line: 4,
      column: 1,
      position: 16,
      message: "Unexpected token } in JSON at position 16 (line 4 column 1)",
    });
  });

  it("derives line and column from a bare position", () => {
    // position 14 is the `x` on the third line, third column
    const issue = locateSyntaxError('{\n  "a": 1,\n  x\n}', new SyntaxError("at position 14"));

    expect(issue.line).toBe(3);
    expect(issue.column).toBe(3);
    expect(issue.position).toBe(14);
  });

  it("keeps the original message when no location can be parsed", () => {
    const issue = locateSyntaxError("{", new SyntaxError("Unexpected end of JSON input"));

    expect(issue.line).toBe(0);
    expect(issue.column).toBe(0);
    expect(issue.position).toBe(-1);
    expect(issue.message).toBe("Unexpected end of JSON input");
  });
});
