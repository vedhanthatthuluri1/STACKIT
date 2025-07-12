
"use client";

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { useCallback, useRef } from 'react';
import { 
    Bold, Italic, Strikethrough, List, ListOrdered, Link2, Image as ImageIcon, 
    AlignLeft, AlignCenter, AlignRight 
} from 'lucide-react';

import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface EditorToolbarProps {
    editor: Editor | null;
}

const EditorToolbar = ({ editor }: EditorToolbarProps) => {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!editor) return;
        const file = event.target.files?.[0];
        if (!file) return;

        const toastId = toast({ description: 'Uploading image...' }).id;

        try {
            const storageRef = ref(storage, `editor-images/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            editor.chain().focus().setImage({ src: downloadURL }).run();
            toast({id: toastId, description: 'Image uploaded successfully!', title: "Success" });
        } catch (error) {
            console.error('Image upload failed:', error);
            toast({id: toastId, variant: 'destructive', title: 'Upload failed', description: 'Could not upload the image.' });
        }
    };
    
    if (!editor) return null;

    return (
        <div className="border border-input rounded-t-md p-2 flex flex-wrap items-center gap-1">
            <Toggle
                size="sm"
                pressed={editor.isActive('bold')}
                onPressedChange={() => editor.chain().focus().toggleBold().run()}
            >
                <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive('italic')}
                onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            >
                <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive('strike')}
                onPressedChange={() => editor.chain().focus().toggleStrike().run()}
            >
                <Strikethrough className="h-4 w-4" />
            </Toggle>
            <Separator orientation="vertical" className="h-8 mx-1" />
            <Toggle
                size="sm"
                pressed={editor.isActive('bulletList')}
                onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
            >
                <List className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                pressed={editor.isActive('orderedList')}
                onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
            >
                <ListOrdered className="h-4 w-4" />
            </Toggle>
            <Separator orientation="vertical" className="h-8 mx-1" />
             <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: 'left' })}
                onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
            >
                <AlignLeft className="h-4 w-4" />
            </Toggle>
             <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: 'center' })}
                onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
            >
                <AlignCenter className="h-4 w-4" />
            </Toggle>
             <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: 'right' })}
                onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
            >
                <AlignRight className="h-4 w-4" />
            </Toggle>

            <Separator orientation="vertical" className="h-8 mx-1" />
            <Button size="sm" variant="ghost" onClick={handleLink}>
                <Link2 className="h-4 w-4" />
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*"
            />
            <Button size="sm" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="h-4 w-4" />
            </Button>
        </div>
    );
};


interface RichTextEditorProps {
    value: string;
    onChange: (richText: string) => void;
    placeholder?: string;
}

export const RichTextEditor = ({ value, onChange, placeholder }: RichTextEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false,
                blockquote: false,
                heading: false,
            }),
            Link.configure({
                openOnClick: false,
                autolink: true,
            }),
            Image.configure({
                inline: false,
            }),
            Placeholder.configure({
                placeholder,
            }),
            TextAlign.configure({
                types: ['paragraph'],
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class:
                    'prose dark:prose-invert min-h-[150px] w-full rounded-md rounded-t-none border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            },
        },
    });

    return (
        <div className="flex flex-col justify-stretch">
            <EditorToolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
};
