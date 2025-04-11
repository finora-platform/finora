"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

interface TiptapProps {
  value: string;
  onChange: (richText: string) => void;
  setEditorInstance?: (editor: any) => void;
}

export default function Tiptap({
  value,
  onChange,
  setEditorInstance,
}: TiptapProps) {
  const editor = useEditor({
    extensions: [StarterKit.configure()],
    content: value,
    editorProps: {
      attributes: {
        class: "prose prose-sm m-0 focus:outline-none dark:prose-invert",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && setEditorInstance) {
      setEditorInstance(editor);
    }
  }, [editor]);

  useEffect(() => {
    if (editor && !editor.isDestroyed && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  useEffect(() => {
    if (editor) {
      editor.commands.focus(); // Focus the editor
    }
  }, [editor]);

  return (
    <div className="absolute w-full h-full resize-none focus:outline-none z-10 bg-transparent">
      <EditorContent className="h-full" editor={editor} />
    </div>
  );
}
