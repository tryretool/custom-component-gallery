// Allow TypeScript to understand plain CSS imports (bundled by esbuild)
declare module '*.css' {
  const content: Record<string, string>
  export default content
}
