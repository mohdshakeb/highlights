'use client';

import { useState } from 'react';
import { getCategoryStyles } from '@/utils/categories';

interface HighlightProps {
    id: string;
    text: string;
    url: string;
    title?: string | null;
    favicon?: string | null;
    createdAt: string;
    documentId?: string | null;
    documents?: { id: string; title: string }[];
    onDelete?: (id: string) => void;
    onMove?: (documentId: string | null) => void;
}

export default function HighlightCard({
    id,
    text,
    url,
    title,
    favicon,
    createdAt,
    documentId,
    documents = [],
    onDelete,
    onMove
}: HighlightProps) {
    const [showActions, setShowActions] = useState(false);
    const [showMoveMenu, setShowMoveMenu] = useState(false);

    const styles = getCategoryStyles(url);

    const date = new Date(createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this highlight?')) return;

        try {
            await fetch(`/api/highlights/${id}`, { method: 'DELETE' });
            onDelete?.(id);
        } catch (error) {
            console.error('Error deleting highlight:', error);
        }
    };

    const handleMove = async (targetDocId: string | null) => {
        try {
            await fetch(`/api/highlights/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId: targetDocId }),
            });
            onMove?.(targetDocId);
            setShowMoveMenu(false);
        } catch (error) {
            console.error('Error moving highlight:', error);
        }
    };

    return (
        <div
            className="card"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            style={{
                position: 'relative',
                backgroundColor: styles.color,
                border: 'none',
                borderRadius: '2px', // Sharper corners
                boxShadow: '2px 2px 5px rgba(0,0,0,0.1)', // Subtle shadow
                padding: 'var(--space-4)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                transform: showActions ? 'scale(1.05) rotate(-2deg)' : 'rotate(0deg)', // Increased scale/rotation for effect
                color: styles.textColor,
                aspectRatio: '1 / 1', // Force square
                display: 'flex',
                flexDirection: 'column',
                zIndex: showActions ? 20 : 1, // Ensure it pops out above others
            }}
        >
            {showActions && (
                <div style={{
                    position: 'absolute',
                    top: 'var(--space-2)',
                    right: 'var(--space-2)',
                    display: 'flex',
                    gap: 'var(--space-2)',
                    zIndex: 10,
                }}>
                    {!documentId && documents.length > 0 && (
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowMoveMenu(!showMoveMenu)}
                                style={{
                                    padding: 'var(--space-1) var(--space-2)',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    backgroundColor: 'rgba(255,255,255,0.8)',
                                    color: styles.textColor,
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                }}
                            >
                                Move to...
                            </button>
                            {showMoveMenu && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: 'var(--space-1)',
                                    backgroundColor: '#fff',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: 'var(--radius-md)',
                                    boxShadow: 'var(--shadow-lg)',
                                    minWidth: '150px',
                                    zIndex: 10,
                                }}>
                                    {documents.map((doc) => (
                                        <button
                                            key={doc.id}
                                            onClick={() => handleMove(doc.id)}
                                            style={{
                                                width: '100%',
                                                padding: 'var(--space-2) var(--space-3)',
                                                border: 'none',
                                                backgroundColor: 'transparent',
                                                color: 'hsl(var(--foreground))',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem',
                                            }}
                                        >
                                            {doc.title}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        onClick={handleDelete}
                        style={{
                            padding: 'var(--space-1) var(--space-2)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(0,0,0,0.1)',
                            backgroundColor: 'rgba(255,255,255,0.8)',
                            color: '#ef4444',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                        }}
                    >
                        Delete
                    </button>
                </div>
            )}

            <blockquote style={{
                fontSize: '1rem',
                lineHeight: '1.4',
                marginBottom: 'var(--space-4)',
                fontFamily: 'var(--font-heading)', // Keep heading font for "handwritten" feel
                color: styles.textColor,
                borderLeft: 'none', // Remove default blockquote border
                paddingLeft: 0,
                margin: 0,
            }}>
                {text}
            </blockquote>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'auto', opacity: 0.7 }}>
                {favicon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={favicon} alt="" style={{ width: 16, height: 16, borderRadius: 2 }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: styles.textColor,
                            textDecoration: 'none',
                        }}
                    >
                        {title || new URL(url).hostname}
                    </a>
                    <span style={{ fontSize: '0.7rem', color: styles.textColor, opacity: 0.8 }}>
                        {date}
                    </span>
                </div>
            </div>
        </div>
    );
}
