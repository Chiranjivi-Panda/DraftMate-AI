"use client";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { motion } from "framer-motion";
import { Bold, Heading1, Heading2, Italic, List, Loader2, Redo2, Undo2 } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { plainText } from "@/lib/html";
import { useStore } from "@/lib/store";
import { CitationMark } from "@/lib/tiptap-citation";

export function DraftEditor() {
  const rev = useStore((s) => s.doc.rev);
  const html = useStore((s) => s.doc.html);
  const streaming = useStore((s) => s.streaming);
  const citations = useStore((s) => s.citations);
  const activeId = useStore((s) => s.activeCitationId);
  const flashKey = useStore((s) => s.flashKey);
  const scroller = useRef<HTMLDivElement>(null);
  const holder = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, CitationMark, Placeholder.configure({ placeholder: "Your draft appears here — or just start typing…" })],
    content: useStore.getState().doc.html,
    editorProps: {
      attributes: { class: "legal-doc", spellcheck: "true" },
      handleClick: (_v, _p, e) => {
        const el = (e.target as HTMLElement).closest("[data-cite-id]");
        if (el) useStore.getState().patch({ activeCitationId: el.getAttribute("data-cite-id") });
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => useStore.getState().setUserHtml(ed.getHTML()),
  });

  // External content (stream / edit / delete) → editor
  useEffect(() => {
    if (!editor) return;
    const d = useStore.getState().doc;
    if (d.source === "user") return;
    editor.commands.setContent(d.html, false);
  }, [rev, editor]);

  useEffect(() => { editor?.setEditable(!streaming); }, [streaming, editor]);

  // Citation statuses → marks in the text
  useEffect(() => {
    if (!editor) return;
    const type = editor.schema.marks.citation;
    if (!type) return;
    const map = new Map(citations.map((c) => [c.id, c.status]));
    const tr = editor.state.tr;
    let changed = false;
    editor.state.doc.descendants((node, pos) => {
      if (!node.isText) return;
      node.marks.forEach((m) => {
        if (m.type !== type) return;
        const st = map.get(m.attrs.id);
        if (st && st !== m.attrs.status) {
          tr.removeMark(pos, pos + node.nodeSize, m);
          tr.addMark(pos, pos + node.nodeSize, type.create({ ...m.attrs, status: st }));
          changed = true;
        }
      });
    });
    if (changed) { tr.setMeta("addToHistory", false); editor.view.dispatch(tr); }
  }, [citations, editor, rev]);

  // Active citation → highlight + scroll into view
  useEffect(() => {
    const root = holder.current;
    if (!root) return;
    root.querySelectorAll(".cite-active").forEach((n) => n.classList.remove("cite-active"));
    if (!activeId) return;
    const el = root.querySelector(`[data-cite-id="${activeId}"]`);
    if (el) { el.classList.add("cite-active"); el.scrollIntoView({ behavior: "smooth", block: "center" }); }
  }, [activeId, citations, rev]);

  // Follow the stream
  useEffect(() => {
    if (streaming && scroller.current) scroller.current.scrollTo({ top: scroller.current.scrollHeight });
  }, [rev, streaming]);

  const words = useMemo(() => { const t = plainText(html); return t ? t.split(/\s+/).length : 0; }, [html]);
  const Btn = ({ on, act, children, label }: { on?: boolean; act: () => void; children: React.ReactNode; label: string }) => (
    <button aria-label={label} title={label} onMouseDown={(e) => e.preventDefault()} onClick={act} disabled={streaming} className={`btn-icon !h-8 !w-8 ${on ? "!border-accent/70 !text-accent" : ""}`}>{children}</button>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 flex flex-wrap items-center gap-1.5 px-1">
        <Btn label="Bold" on={editor?.isActive("bold")} act={() => editor?.chain().focus().toggleBold().run()}><Bold size={14} /></Btn>
        <Btn label="Italic" on={editor?.isActive("italic")} act={() => editor?.chain().focus().toggleItalic().run()}><Italic size={14} /></Btn>
        <Btn label="Heading 1" on={editor?.isActive("heading", { level: 1 })} act={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 size={14} /></Btn>
        <Btn label="Heading 2" on={editor?.isActive("heading", { level: 2 })} act={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={14} /></Btn>
        <Btn label="Bullet list" on={editor?.isActive("bulletList")} act={() => editor?.chain().focus().toggleBulletList().run()}><List size={14} /></Btn>
        <span className="mx-1 h-5 w-px bg-line" />
        <Btn label="Undo" act={() => editor?.chain().focus().undo().run()}><Undo2 size={14} /></Btn>
        <Btn label="Redo" act={() => editor?.chain().focus().redo().run()}><Redo2 size={14} /></Btn>
        <div className="ml-auto hidden items-center gap-3 text-[11px] text-muted md:flex">
          {([["verified", "#10b981"], ["partial", "#f59e0b"], ["unverified", "#f43f5e"], ["pending", "#d4a64a"]] as const).map(([l, c]) => (
            <span key={l} className="flex items-center gap-1 capitalize"><i className="h-2 w-2 rounded-full" style={{ background: c }} />{l}</span>
          ))}
          <span>{words} words</span>
        </div>
      </div>

      <div ref={scroller} className="scroll-thin relative min-h-0 flex-1 overflow-y-auto rounded-xl bg-black/5 p-3 dark:bg-black/25">
        <motion.div ref={holder} className={`paper mx-auto max-w-[820px] ${streaming ? "streaming" : ""}`} initial={{ opacity: 0, y: 16, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.45 }}>
          {streaming && (
            <div className="absolute inset-x-0 top-0 z-10 h-[3px] overflow-hidden bg-gold-400/20">
              <div className="scanline h-full w-1/3 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
            </div>
          )}
          <motion.div key={flashKey} initial={flashKey ? { boxShadow: "inset 0 0 0 3px rgba(212,166,74,.65)" } : false} animate={{ boxShadow: "inset 0 0 0 0px rgba(212,166,74,0)" }} transition={{ duration: 1.4 }} className="pointer-events-none absolute inset-0 z-10 rounded-lg" />
          <EditorContent editor={editor} />
        </motion.div>
        {streaming && (
          <div className="pointer-events-none sticky bottom-2 mt-2 flex justify-center">
            <span className="glass flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"><Loader2 size={13} className="animate-spin text-accent" /> Drafting in your style…</span>
          </div>
        )}
      </div>
    </div>
  );
}
