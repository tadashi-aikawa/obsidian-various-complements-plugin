export function basename(path: string, ext?: string): string {
  const name = path.match(/.+[\\/]([^\\/]+)[\\/]?$/)?.[1] ?? path;
  return ext && name.endsWith(ext) ? name.replace(ext, "") : name;
}

export function extname(path: string): string {
  const ext = basename(path).split(".").slice(1).pop();
  return ext ? `.${ext}` : "";
}

export function dirname(path: string): string {
  return path.match(/(.+)[\\/].+$/)?.[1] ?? ".";
}
