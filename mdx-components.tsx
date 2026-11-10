import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: (props) => (
      <h2 className="text-xl font-semibold tracking-tight text-foreground" {...props} />
    ),
    h3: (props) => (
      <h3 className="text-lg font-semibold tracking-tight text-foreground" {...props} />
    ),
    p: (props) => (
      <p className="text-sm leading-7 text-muted-foreground" {...props} />
    ),
    ul: (props) => (
      <ul className="ml-5 flex list-disc flex-col gap-2 text-sm text-muted-foreground" {...props} />
    ),
    li: (props) => <li {...props} />,
    ...components,
  };
}
