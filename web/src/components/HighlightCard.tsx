'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

    const [isExpanded, setIsExpanded] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [originRect, setOriginRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        setMounted(true);
        if (isExpanded) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isExpanded]);

    const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setOriginRect(rect);
        setIsExpanded(true);
    };

    const Modal = () => {
        if (!mounted) return null;

        let initialProps = { opacity: 0, scale: 0.8, x: 0, y: 0 };

        if (originRect) {
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            // Calculate center of the screen
            const cx = windowWidth / 2;
            const cy = windowHeight / 2;

            // Calculate center of the original element
            const ox = originRect.left + originRect.width / 2;
            const oy = originRect.top + originRect.height / 2;

            // Calculate delta
            const dx = ox - cx;
            const dy = oy - cy;

            initialProps = {
                opacity: 0,
                scale: originRect.width / 500, // Approximate scale based on max width
                x: dx,
                y: dy
            };
        }

        return createPortal(
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { delay: 0.15, duration: 0.15 } }} // Wait for note to exit
                transition={{ duration: 0.15 }} // Default duration for entry
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(255, 255, 255, 0.75)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 9999,
                    backdropFilter: 'blur(8px)',
                }}
                onClick={() => setIsExpanded(false)}
            >
                <motion.div
                    initial={initialProps}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        x: 0,
                        y: 0,
                        transition: { type: 'spring', stiffness: 500, damping: 30, delay: 0.05 } // Delay entry
                    }}
                    exit={{
                        ...initialProps,
                        transition: { type: 'spring', stiffness: 500, damping: 30, delay: 0 } // No delay on exit
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        backgroundColor: styles.color,
                        width: '90%',
                        maxWidth: '500px',
                        aspectRatio: '1 / 1',
                        borderRadius: '4px',
                        padding: '40px',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        color: styles.textColor,
                        transform: 'rotate(-1deg)',
                    }}
                >
                    <button
                        onClick={() => setIsExpanded(false)}
                        style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            color: styles.textColor,
                            opacity: 0.6,
                        }}
                    >
                        ×
                    </button>

                    <blockquote style={{
                        fontSize: '1.25rem',
                        lineHeight: '1.6',
                        fontFamily: 'var(--font-heading)',
                        margin: 0,
                        flex: 1,
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                        paddingRight: '10px',
                    }}>
                        {text}
                    </blockquote>

                    <div style={{
                        marginTop: '24px',
                        paddingTop: '16px',
                        borderTop: `1px solid ${styles.textColor}40`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {favicon && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={favicon} alt="" style={{ width: 24, height: 24, borderRadius: 4 }} />
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        color: styles.textColor,
                                        textDecoration: 'none',
                                    }}
                                >
                                    {title || new URL(url).hostname}
                                </a>
                                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                    {date}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>,
            document.body
        );
    };

    return (
        <>
            <div
                className="card"
                onClick={handleCardClick}
                onMouseEnter={() => setShowActions(true)}
                onMouseLeave={() => setShowActions(false)}
                style={{
                    position: 'relative',
                    backgroundColor: styles.color,
                    border: 'none',
                    borderRadius: '2px',
                    boxShadow: '2px 2px 5px rgba(0,0,0,0.1)',
                    padding: '12px',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    transform: showActions ? 'scale(1.05) rotate(-2deg)' : 'rotate(0deg)',
                    color: styles.textColor,
                    aspectRatio: '1 / 1',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: showActions ? 20 : 1,
                    cursor: 'pointer',
                }}
            >
                {showActions && (
                    <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        display: 'flex',
                        gap: '4px',
                        zIndex: 10,
                    }} onClick={(e) => e.stopPropagation()}>
                        {!documentId && documents.length > 0 && (
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setShowMoveMenu(!showMoveMenu)}
                                    style={{
                                        padding: '2px 6px',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        backgroundColor: 'rgba(255,255,255,0.8)',
                                        color: styles.textColor,
                                        fontSize: '0.7rem',
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
                                        marginTop: '4px',
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
                                                    padding: '6px 10px',
                                                    border: 'none',
                                                    backgroundColor: 'transparent',
                                                    color: 'hsl(var(--foreground))',
                                                    textAlign: 'left',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem',
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
                                padding: '2px 6px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid rgba(0,0,0,0.1)',
                                backgroundColor: 'rgba(255,255,255,0.8)',
                                color: '#ef4444',
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                            }}
                        >
                            Delete
                        </button>
                    </div>
                )}

                <blockquote style={{
                    fontSize: '0.875rem',
                    lineHeight: '1.4',
                    marginBottom: '16px',
                    fontFamily: 'var(--font-heading)',
                    color: styles.textColor,
                    borderLeft: 'none',
                    paddingLeft: 0,
                    margin: 0,
                    marginBottom: '16px', // Ensure margin is applied
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 6,
                    WebkitBoxOrient: 'vertical',
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
                            onClick={(e) => e.stopPropagation()}
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
            <AnimatePresence>
                {isExpanded && <Modal />}
            </AnimatePresence>
        </>
    );
}
