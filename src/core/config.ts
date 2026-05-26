export const C3SPEC_DIR_NAME = 'c3spec';

export const C3SPEC_MARKERS = {
  start: '<!-- C3SPEC:START -->',
  end: '<!-- C3SPEC:END -->'
};

export interface C3SpecConfig {
  aiTools: string[];
}

export interface AIToolOption {
  name: string;
  value: string;
  available: boolean;
  successLabel?: string;
  skillsDir?: string; // e.g., '.claude' - /skills suffix per Agent Skills spec
  detectionPaths?: string[]; // Override skillsDir for auto-detection; any path existing triggers detection
}

export const AI_TOOLS: AIToolOption[] = [
  {
    name: 'Claude Code',
    value: 'claude',
    available: true,
    successLabel: 'Claude Code',
    skillsDir: '.claude',
    detectionPaths: ['.claude/skills/c3spec-start/SKILL.md'],
  },
  {
    name: 'Codex',
    value: 'codex',
    available: true,
    successLabel: 'Codex',
    skillsDir: '.agents',
    detectionPaths: ['.codex/agents/implementer.toml'],
  },
  {
    name: 'Cursor',
    value: 'cursor',
    available: true,
    successLabel: 'Cursor',
    skillsDir: '.agents',
    detectionPaths: ['.cursor/agents/implementer.md'],
  },
];
