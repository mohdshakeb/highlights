import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Document {
    id: string;
    title: string;
    content: string;
    updatedAt: string;
    _count?: {
        highlights: number;
    };
}

interface DocumentPreviewCardProps {
    doc: Document;
    isActive: boolean;
    isDragOver: boolean;
    onDragOver: (e: React.DragEvent, id: string) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, id: string) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onTitleUpdate: (id: string, newTitle: string) => void;
    autoFocus?: boolean;
}

export default function DocumentPreviewCard({
    doc,
    isActive,
    isDragOver,
    onDragOver,
    onDragLeave,
    onDrop,
    onDelete,
    onTitleUpdate,
    autoFocus = false
}: DocumentPreviewCardProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(doc.title);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus if requested
    if (autoFocus && inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
    }

    const handleTitleBlur = () => {
        setIsEditing(false);
        if (title !== doc.title) {
            onTitleUpdate(doc.id, title);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.currentTarget as HTMLInputElement).blur();
        }
    };

    return (
        <div
            data-id={doc.id}
            className="document-wrapper"
            onDragOver={(e) => onDragOver(e, doc.id)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, doc.id)}
            style={{
                scrollSnapAlign: 'center',
                width: '100%',
                maxWidth: '650px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-4)',
                opacity: 1, // Always fully visible
                transition: 'opacity 0.3s ease',
                padding: '0 20px', // Add side padding to ensure it doesn't touch edges
            }}
        >
            {/* The Paper */}
            <div
                onClick={() => router.push(`/documents/${doc.id}`)}
                style={{
                    width: '100%',
                    maxWidth: '450px', // Increased size
                    aspectRatio: '1 / 1.414',
                    backgroundColor: 'hsl(var(--surface))',
                    boxShadow: isDragOver
                        ? '0 0 0 4px hsl(var(--primary) / 0.2), var(--shadow-xl)'
                        : isActive ? 'var(--shadow-xl)' : 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: '40px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    overflow: 'hidden',
                    position: 'relative',
                    transform: isActive ? 'scale(1)' : 'scale(0.95)', // Slightly smaller inactive state
                    border: isDragOver ? '2px solid hsl(var(--primary))' : 'none',
                }}
                className="document-paper group"
            >
                {/* Title Row */}
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-4)',
                    gap: '12px'
                }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            onKeyDown={handleKeyDown}
                            style={{
                                fontSize: '1.5rem',
                                fontFamily: 'var(--font-heading)',
                                fontWeight: 600,
                                color: 'hsl(var(--foreground))',
                                border: 'none',
                                background: 'transparent',
                                width: '100%',
                                outline: 'none',
                                cursor: 'text',
                                paddingRight: '24px',
                            }}
                            placeholder="Untitled Document"
                        />
                    </div>

                    <button
                        onClick={(e) => onDelete(doc.id, e)}
                        className="delete-btn"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'hsl(var(--muted))',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        title="Delete Document"
                    >
                        <i className="ri-delete-bin-line" style={{ fontSize: '1.2rem' }}></i>
                    </button>
                </div>

                <div style={{
                    fontSize: '0.875rem',
                    color: 'hsl(var(--muted))',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    display: '-webkit-box',
                    WebkitLineClamp: 12, // Reduced clamp to fit smaller size
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}>
                    {doc.content || (
                        <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Empty document...</span>
                    )}
                </div>

                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '40px',
                    fontSize: '0.75rem',
                    color: 'hsl(var(--muted))',
                }}>
                    {doc._count?.highlights || 0} Highlights
                </div>
            </div>

            <style jsx>{`
        :global(.document-paper:hover) {
          transform: translateY(-2px);
        }
        /* Input placeholder style */
        input::placeholder {
          color: hsl(var(--muted) / 0.5);
        }
        
        /* Delete button hover effect */
        .delete-btn {
            opacity: 0;
        }
        .document-wrapper:hover .delete-btn {
            opacity: 1;
        }
        .delete-btn:hover {
            color: #ef4444 !important;
            background-color: hsl(var(--muted) / 0.1) !important;
        }
      `}</style>
        </div>
    );
}
