export function escapeYamlValue(value: string): string {
  const needsQuoting = /[:\n\r#{}[\],&*!|>'"%@`]|^\s|\s$/.test(value);
  if (needsQuoting) {
    const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    return `"${escaped}"`;
  }
  return value;
}

export function buildYamlFrontmatter(fields: Record<string, string | boolean>): string {
  const lines = Object.entries(fields).map(([key, value]) => {
    if (typeof value === 'boolean') {
      return `${key}: ${value ? 'true' : 'false'}`;
    }
    return `${key}: ${escapeYamlValue(value)}`;
  });

  return `---\n${lines.join('\n')}\n---\n\n`;
}

export function toPosixPath(...segments: string[]): string {
  return segments.filter(Boolean).join('/');
}
