'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Document {
    id: string;
    title: string;
    content: string;
    _count?: {
        highlights: number;
    };
}

interface DocumentCardProps {
    document?: Document;
    isCreateCard?: boolean;
    onCreateDocument?: () => void;
    onDelete?: (id: string) => void;
}

export default function DocumentCard({ document, isCreateCard, onCreateDocument, onDelete }: DocumentCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!document) return;

        if (!confirm(`Are you sure you want to delete "${document.title}"? This will also delete all highlights in this document.`)) {
            return;
        }

        try {
            await fetch(`/api/documents/${document.id}`, { method: 'DELETE' });
            onDelete?.(document.id);
        } catch (error) {
            console.error('Error deleting document:', error);
        }
    };

    if (isCreateCard) {
        return (
            <div
                onClick={onCreateDocument}
                style={{
                    padding: 'var(--space-6)',
                    border: '2px dashed hsl(var(--border))',
                    borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '200px',
                    backgroundColor: 'hsl(var(--surface))',
                    transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'hsl(var(--primary))';
                    e.currentTarget.style.backgroundColor = 'hsl(var(--primary) / 0.05)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'hsl(var(--border))';
                    e.currentTarget.style.backgroundColor = 'hsl(var(--surface))';
                }}
            >
                <div style={{
                    fontSize: '3rem',
                    color: 'hsl(var(--muted))',
                    marginBottom: 'var(--space-2)',
                }}>
                    +
                </div>
                <span style={{ fontSize: '0.875rem', color: 'hsl(var(--muted))' }}>
                    New Document
                </span>
            </div>
        );
    }

    if (!document) return null;

    const preview = document.content.slice(0, 150) + (document.content.length > 150 ? '...' : '');

    return (
        <Link
            href={`/documents/${document.id}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                display: 'block',
                padding: 'var(--space-6)',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'hsl(var(--surface))',
                transition: 'all 0.2s ease',
                position: 'relative',
                minHeight: '200px',
                borderColor: isHovered ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: isHovered ? 'var(--shadow-md)' : 'none',
            }}
        >
            {isHovered && (
                <button
                    onClick={handleDelete}
                    style={{
                        position: 'absolute',
                        top: 'var(--space-2)',
                        right: 'var(--space-2)',
                        padding: 'var(--space-1) var(--space-2)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid hsl(var(--border))',
                        backgroundColor: 'hsl(var(--surface))',
                        color: '#ef4444',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                    }}
                >
                    Delete
                </button>
            )}

            <h3 style={{
                fontSize: '1.25rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                marginBottom: 'var(--space-2)',
                color: 'hsl(var(--foreground))',
            }}>
                {document.title}
            </h3>

            {preview && (
                <p style={{
                    fontSize: '0.875rem',
                    color: 'hsl(var(--muted))',
                    lineHeight: '1.6',
                    marginBottom: 'var(--space-4)',
                }}>
                    {preview}
                </p>
            )}

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 'auto',
            }}>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted))' }}>
                    {document._count?.highlights || 0} highlights
                </span>
            </div>
        </Link>
    );
}
