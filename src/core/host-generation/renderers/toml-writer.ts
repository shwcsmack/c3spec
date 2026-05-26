export function formatTomlBasicString(value: string): string {
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

export function formatTomlMultilineString(value: string): string {
  const escaped = value.replace(/\\/g, '\\\\').replace(/"""/g, '\\"""');
  return `"""\n${escaped}\n"""`;
}

export function formatTomlString(value: string): string {
  if (value.includes('\n') || value.includes('"') || value.includes('\\')) {
    return formatTomlMultilineString(value);
  }
  return formatTomlBasicString(value);
}

export function formatTomlKeyValue(key: string, value: string): string {
  return `${key} = ${formatTomlString(value)}`;
}

export function formatTomlInteger(key: string, value: number): string {
  return `${key} = ${value}`;
}

export function formatTomlTableHeader(name: string): string {
  return `[${name}]`;
}
