'use client';

import { useState, useEffect, useRef } from 'react';

interface DocumentEditorProps {
    documentId: string;
    initialTitle: string;
    initialContent: string;
}

export default function DocumentEditor({ documentId, initialTitle, initialContent }: DocumentEditorProps) {
    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout>();

    // Initialize and sync content
    useEffect(() => {
        if (initialContent !== content) {
            // Only update if the server content is different and longer (to avoid overwriting unsaved work with stale data, 
            // but allow appending new highlights)
            // Note: This is a simple heuristic. For production, you'd want operational transformation or CRDTs.
            // For now, we assume if server content grew, it's likely a new highlight was added.
            if (initialContent.length > content.length) {
                setContent(initialContent);
                if (contentRef.current) {
                    contentRef.current.textContent = initialContent;
                }
            }
        }
    }, [initialContent]);

    // Initialize ref on mount
    useEffect(() => {
        if (contentRef.current && content !== contentRef.current.textContent) {
            contentRef.current.textContent = content;
        }
    }, []);

    // Auto-save on change
    useEffect(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            if (title !== initialTitle || content !== initialContent) {
                saveDocument();
            }
        }, 1000);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [title, content]);

    const saveDocument = async () => {
        setIsSaving(true);
        try {
            await fetch(`/api/documents/${documentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content }),
            });
            setLastSaved(new Date());
        } catch (error) {
            console.error('Error saving document:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleContentChange = () => {
        if (contentRef.current) {
            setContent(contentRef.current.textContent || '');
        }
    };

    return (
        <div style={{
            maxWidth: '680px',
            margin: '0 auto',
            padding: 'var(--space-8) var(--space-4)',
        }}>
            {/* Toolbar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-8)',
            }}>
                <a
                    href="/"
                    style={{
                        fontSize: '0.875rem',
                        color: 'hsl(var(--muted))',
                        textDecoration: 'none',
                    }}
                >
                    ← Back to Home
                </a>
                <span style={{
                    fontSize: '0.75rem',
                    color: 'hsl(var(--muted))',
                }}>
                    {isSaving ? 'Saving...' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : ''}
                </span>
            </div>

            {/* Title */}
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                    fontSize: '2.5rem',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    color: 'hsl(var(--foreground))',
                    width: '100%',
                    marginBottom: 'var(--space-4)',
                    padding: 0,
                }}
                placeholder="Untitled"
            />

            {/* Content */}
            <div
                ref={contentRef}
                contentEditable
                onInput={handleContentChange}
                style={{
                    minHeight: '400px',
                    outline: 'none',
                    fontSize: '1.125rem',
                    lineHeight: '1.8',
                    color: 'hsl(var(--foreground))',
                    fontFamily: 'var(--font-body)',
                    whiteSpace: 'pre-wrap',
                }}
            />
        </div>
    );
}
