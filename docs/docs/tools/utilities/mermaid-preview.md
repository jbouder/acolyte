---
sidebar_position: 2
title: Mermaid Preview
---

# Mermaid Preview

**Route:** `/mermaid-preview`

Author and preview [Mermaid](https://mermaid.js.org/) diagrams with live
rendering.

## Features

- **Live preview** — diagrams render as you type.
- **Many diagram types** — flowcharts, sequence diagrams, class diagrams, state
  diagrams, Gantt charts, and more.
- **Import / export** — load and save `.mmd`, `.mermaid`, and `.txt` files.
- **Copy to clipboard** — grab the diagram source.
- **Character and line counts.**
- **Syntax error detection** with clear messages.

## Using it

1. Open **Mermaid Preview** from the sidebar.
2. Write Mermaid syntax in the editor, for example:

   ```mermaid
   flowchart LR
     A[Start] --> B{Decision}
     B -->|Yes| C[Do it]
     B -->|No| D[Skip it]
   ```

3. The rendered diagram updates live; fix any reported syntax errors.

## Related

- [Markdown Preview](./markdown-preview.md)
