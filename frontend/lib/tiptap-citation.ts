import { Mark, mergeAttributes } from "@tiptap/core";

/** Inline mark that keeps citation id + verification status on the text. */
export const CitationMark = Mark.create({
  name: "citation",
  inclusive: false,
  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-cite-id"),
        renderHTML: (a) => (a.id ? { "data-cite-id": a.id as string } : {}),
      },
      status: {
        default: "pending",
        parseHTML: (el) => el.getAttribute("data-status") || "pending",
        renderHTML: (a) => ({ "data-status": a.status as string }),
      },
    };
  },
  parseHTML() { return [{ tag: "span[data-cite-id]" }]; },
  renderHTML({ HTMLAttributes }) { return ["span", mergeAttributes({ class: "cite" }, HTMLAttributes), 0]; },
});
