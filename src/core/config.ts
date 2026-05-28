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
    name: 'Pi',
    value: 'pi',
    available: true,
    successLabel: 'Pi',
    skillsDir: '.agents',
    detectionPaths: ['.agents/skills/c3spec-start/SKILL.md'],
  },
];
