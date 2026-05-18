import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { uploadContentImage } from "@/lib/api";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function RichEditor({ value, onChange, placeholder, minHeight = 200 }: Props) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-orange-400 underline" } }),
      Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full h-auto" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: `prose prose-invert max-w-none focus:outline-none px-4 py-3 text-sm text-white`,
        style: `min-height: ${minHeight}px`,
      },
    },
  });

  if (!editor) return null;

  const btn = (active: boolean) =>
    `w-8 h-8 rounded-md flex items-center justify-center text-sm transition-colors ${
      active ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
             : "text-white/55 hover:text-orange-300 hover:bg-orange-500/10"
    }`;

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL ссылки:", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const onPickFile = () => fileRef.current?.click();
  const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadContentImage(file);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch (err) {
      alert("Не удалось загрузить изображение: " + (err as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="bg-[#0d1017] border border-[#1e2230] rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-[#1e2230] bg-[#141720]">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
          className={btn(editor.isActive("bold"))} title="Жирный (Ctrl+B)"><Icon name="Bold" size={14} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btn(editor.isActive("italic"))} title="Курсив (Ctrl+I)"><Icon name="Italic" size={14} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btn(editor.isActive("underline"))} title="Подчёркнутый"><Icon name="Underline" size={14} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()}
          className={btn(editor.isActive("strike"))} title="Зачёркнутый"><Icon name="Strikethrough" size={14} /></button>
        <div className="w-px h-5 bg-[#1e2230] mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btn(editor.isActive("heading", { level: 2 }))} title="Заголовок H2">H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={btn(editor.isActive("heading", { level: 3 }))} title="Заголовок H3">H3</button>
        <button type="button" onClick={() => editor.chain().focus().setParagraph().run()}
          className={btn(editor.isActive("paragraph"))} title="Обычный текст"><Icon name="Type" size={14} /></button>
        <div className="w-px h-5 bg-[#1e2230] mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btn(editor.isActive("bulletList"))} title="Маркированный список"><Icon name="List" size={14} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btn(editor.isActive("orderedList"))} title="Нумерованный список"><Icon name="ListOrdered" size={14} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btn(editor.isActive("blockquote"))} title="Цитата"><Icon name="Quote" size={14} /></button>
        <div className="w-px h-5 bg-[#1e2230] mx-1" />
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={btn(editor.isActive({ textAlign: "left" }))} title="По левому"><Icon name="AlignLeft" size={14} /></button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={btn(editor.isActive({ textAlign: "center" }))} title="По центру"><Icon name="AlignCenter" size={14} /></button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={btn(editor.isActive({ textAlign: "right" }))} title="По правому"><Icon name="AlignRight" size={14} /></button>
        <div className="w-px h-5 bg-[#1e2230] mx-1" />
        <button type="button" onClick={setLink}
          className={btn(editor.isActive("link"))} title="Ссылка"><Icon name="Link" size={14} /></button>
        <button type="button" onClick={onPickFile} disabled={uploading}
          className={btn(false) + " disabled:opacity-40"} title="Вставить картинку">
          <Icon name={uploading ? "Loader" : "Image"} size={14} className={uploading ? "animate-spin" : ""} />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChosen} />
        <div className="w-px h-5 bg-[#1e2230] mx-1" />
        <button type="button" onClick={() => editor.chain().focus().undo().run()}
          className={btn(false)} title="Отменить"><Icon name="Undo2" size={14} /></button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()}
          className={btn(false)} title="Повторить"><Icon name="Redo2" size={14} /></button>
      </div>

      {/* Editor area */}
      <div className="relative">
        <EditorContent editor={editor} />
        {!editor.getText() && placeholder && (
          <div className="absolute top-3 left-4 text-white/25 text-sm pointer-events-none">{placeholder}</div>
        )}
      </div>
    </div>
  );
}
