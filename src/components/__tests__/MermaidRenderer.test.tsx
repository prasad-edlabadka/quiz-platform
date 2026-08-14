import { describe, it, expect, vi } from 'vitest';
import { autoRepairMermaid } from '../MermaidRenderer';

// Mock store usage if any
vi.mock('../../store/testStore', () => ({
  useTestStore: () => ({ themeMode: 'light' })
}));

describe('Mermaid Auto-Repair Utility', () => {
  it('should auto-repair unquoted node labels with positive/negative signs', () => {
    const raw = 'graph LR\n  A((+q1)) -- "r = 0.20m" --- B((-q2))';
    const expected = 'graph LR\n  A(("+q1")) -- "r = 0.20m" --- B(("-q2"))';
    expect(autoRepairMermaid(raw)).toBe(expected);
  });

  it('should auto-repair unquoted node labels inside square brackets', () => {
    const raw = 'graph TD\n  NodeA[+5V] --> NodeB[-12V]';
    const expected = 'graph TD\n  NodeA["+5V"] --> NodeB["-12V"]';
    expect(autoRepairMermaid(raw)).toBe(expected);
  });

  it('should auto-repair unquoted node labels inside curly braces', () => {
    const raw = 'graph TD\n  Cond{?State} --> Yes';
    const expected = 'graph TD\n  Cond{"?State"} --> Yes';
    expect(autoRepairMermaid(raw)).toBe(expected);
  });

  it('should not wrap already quoted node labels', () => {
    const raw = 'graph LR\n  A(("Label 1")) --> B(["Label 2"])';
    expect(autoRepairMermaid(raw)).toBe(raw);
  });

  it('should trim spaces between shape brackets and double quotes', () => {
    const raw = 'graph LR\n  A(( "+4.0 \\mu C" )) --- B(( "-2.0 \\mu C" ))\n  C([ "Stadium Label" ]) --- D( "Round Label" )\n  E[ "Square Label" ] --- F{ "Decision Label" }';
    const expected = 'graph LR\n  A(("+4.0 μ C")) --- B(("-2.0 μ C"))\n  C(["Stadium Label"]) --- D("Round Label")\n  E["Square Label"] --- F{"Decision Label"}';
    expect(autoRepairMermaid(raw)).toBe(expected);
  });

  it('should strip double quotes inside link labels', () => {
    const raw = 'graph LR\n  A -.->| "Force F" | B\n  C -->|"Another Link Label"| D';
    const expected = 'graph LR\n  A -.->|Force F| B\n  C -->|Another Link Label| D';
    expect(autoRepairMermaid(raw)).toBe(expected);
  });

  it('should normalize double backslashes to single backslashes', () => {
    const raw = 'graph LR\n  A(("Label with \\\\mu C"))';
    const expected = 'graph LR\n  A(("Label with μ C"))';
    expect(autoRepairMermaid(raw)).toBe(expected);
  });

  it('should convert LaTeX commands to unicode symbols in diagram labels', () => {
    const raw = 'graph LR\n  A(("Value: \\\\mu C")) --- B(("Resist: 12 \\\\Omega"))';
    const expected = 'graph LR\n  A(("Value: μ C")) --- B(("Resist: 12 Ω"))';
    expect(autoRepairMermaid(raw)).toBe(expected);
  });
});
