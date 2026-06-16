function resolveBase() {
  const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";

  if (!repository || repository.endsWith(".github.io")) {
    return "/";
  }

  return `/${repository}/`;
}

export default {
  site: process.env.SITE_URL ?? "https://example.github.io",
  base: resolveBase(),
  output: "static"
};
