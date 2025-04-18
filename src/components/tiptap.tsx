"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

interface TiptapProps {
  value: string;
  onChange: (html: string) => void;
  setEditorInstance?: (editor: any) => void;
}

export default function Tiptap({
  value,
  onChange,
  setEditorInstance,
}: TiptapProps) {
  const editor = useEditor({
    extensions: [StarterKit.configure({
      paragraph: {
        HTMLAttributes: {
          class: 'paragraph',
        },
      },
    })],
    content: value || '',
    editorProps: {
      attributes: {
        class: "prose prose-sm m-0 focus:outline-none dark:prose-invert",
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          view.dispatch(
            view.state.tr
              .replaceSelectionWith(
                view.state.schema.nodes.paragraph.create()
              )
              .scrollIntoView()
          );
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getText());
    },
  });

  useEffect(() => {
    if (editor && setEditorInstance) {
      setEditorInstance(editor);
    }
  }, [editor]);

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const currentText = editor.getText();
      if (value !== currentText) {
        editor.commands.setContent(value || '');
      }
    }
  }, [value, editor]);

  useEffect(() => {
    if (editor) {
      editor.commands.focus();
    }
  }, [editor]);

  return (
    <div className="absolute w-full h-full resize-none focus:outline-none z-10 bg-transparent" onClick={() => editor.commands.focus()}>
      <EditorContent className="h-full" editor={editor} />
    </div>
  );
}