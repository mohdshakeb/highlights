'use client';

import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import HighlightCard from '@/components/HighlightCard';
import { useRouter } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Highlight {
  id: string;
  text: string;
  url: string;
  title: string | null;
  favicon: string | null;
  createdAt: string;
  documentId: string | null;
}

interface Document {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  _count?: {
    highlights: number;
  };
}

export default function Home() {
  const router = useRouter();
  // Use SWR for real-time updates
  const { data: highlights = [], mutate: mutateHighlights } = useSWR<Highlight[]>('/api/highlights?documentId=null', fetcher, { refreshInterval: 2000 });
  const { data: documents = [], mutate: mutateDocuments } = useSWR<Document[]>('/api/documents', fetcher, { refreshInterval: 2000 });

  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [dragOverDocId, setDragOverDocId] = useState<string | null>(null);

  // Set up intersection observer to track active document
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveDocId(entry.target.getAttribute('data-id'));
          }
        });
      },
      {
        root: document.querySelector('.document-scroll-container'),
        threshold: 0.6, // Trigger when 60% visible
        rootMargin: '-10% 0px -10% 0px' // Narrow the detection area to the center
      }
    );

    const cards = document.querySelectorAll('.document-wrapper');
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [documents]);

  // Set initial active doc
  useEffect(() => {
    if (documents.length > 0 && !activeDocId) {
      setActiveDocId(documents[0].id);
    }
  }, [documents]);

  const handleCreateDocument = async () => {
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Document' }),
      });

      if (response.ok) {
        const newDoc = await response.json();
        mutateDocuments();
        router.push(`/documents/${newDoc.id}`);
      }
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  const handleDeleteHighlight = (id: string) => {
    mutateHighlights(highlights.filter(h => h.id !== id), false);
    mutateHighlights();
  };

  const handleMoveHighlight = () => {
    mutateHighlights();
    mutateDocuments();
  };

  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the document
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      mutateDocuments(documents.filter(d => d.id !== id), false);
      mutateDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, highlightId: string) => {
    e.dataTransfer.setData('text/plain', highlightId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, docId: string) => {
    e.preventDefault(); // Allow dropping
    setDragOverDocId(docId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    setDragOverDocId(null);
  };

  const handleDrop = async (e: React.DragEvent, docId: string) => {
    e.preventDefault();
    setDragOverDocId(null);
    const highlightId = e.dataTransfer.getData('text/plain');

    if (highlightId) {
      try {
        // Optimistic update
        const highlight = highlights.find(h => h.id === highlightId);
        if (highlight) {
          mutateHighlights(highlights.filter(h => h.id !== highlightId), false);
        }

        const response = await fetch(`/api/highlights/${highlightId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: docId }),
        });

        if (response.ok) {
          mutateHighlights();
          mutateDocuments();
        }
      } catch (error) {
        console.error('Error moving highlight:', error);
        mutateHighlights(); // Revert on error
      }
    }
  };

  return (
    <main style={{
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      backgroundColor: 'hsl(var(--background))',
    }}>
      <div style={{
        display: 'flex',
        width: '100%',
        maxWidth: '1000px', // Reduced max-width to bring things closer
        padding: '0 var(--space-4)',
        gap: 'var(--space-4)', // Reduced gap to minimum
        justifyContent: 'center',
      }}>
        {/* Left Column: Highlights (Sticky & Scrollable) */}
        <div style={{
          width: '300px', // Slightly reduced width
          paddingTop: 'calc(50vh - 350px)', // Align start with documents
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          height: '100vh',
          overflowY: 'auto', // Make scrollable
          scrollbarWidth: 'none', // Hide scrollbar
          paddingBottom: 'var(--space-8)',
        }}>
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: '10px' }}>
              {highlights.map((highlight) => (
                <div
                  key={highlight.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, highlight.id)}
                  style={{
                    transform: 'scale(0.95)',
                    transformOrigin: 'center', // Changed from top left to center
                    cursor: 'grab',
                  }}
                >
                  <HighlightCard
                    id={highlight.id}
                    text={highlight.text}
                    url={highlight.url}
                    title={highlight.title}
                    favicon={highlight.favicon}
                    createdAt={highlight.createdAt}
                    documentId={highlight.documentId}
                    onDelete={handleDeleteHighlight}
                    onMove={handleMoveHighlight}
                    documents={documents}
                  />
                </div>
              ))}
              {highlights.length === 0 && (
                <div style={{
                  padding: 'var(--space-4)',
                  textAlign: 'center',
                  color: 'hsl(var(--muted))',
                  border: '1px dashed hsl(var(--border))',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                }}>
                  No new highlights
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Documents (Scrollable) */}
        <div
          className="document-scroll-container"
          style={{
            flex: 1,
            height: '100vh',
            overflowY: 'auto',
            scrollSnapType: 'y mandatory',
            paddingTop: 'calc(50vh - 350px)', // Center the first item (approx half height of card)
            paddingBottom: '50vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '80px', // Consistent gap
            scrollbarWidth: 'none',
          }}
        >
          {/* Document List */}
          {documents.map((doc) => (
            <div
              key={doc.id}
              data-id={doc.id}
              className="document-wrapper"
              onDragOver={(e) => handleDragOver(e, doc.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, doc.id)}
              style={{
                scrollSnapAlign: 'center',
                width: '100%',
                maxWidth: '650px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-4)',
                opacity: activeDocId === doc.id ? 1 : 0.4, // Fade out inactive docs
                transition: 'opacity 0.3s ease',
              }}
            >
              {/* The Paper */}
              <div
                onClick={() => router.push(`/documents/${doc.id}`)}
                style={{
                  flex: 1,
                  maxWidth: '500px',
                  aspectRatio: '1 / 1.414',
                  backgroundColor: 'hsl(var(--surface))',
                  boxShadow: dragOverDocId === doc.id
                    ? '0 0 0 4px hsl(var(--primary) / 0.2), var(--shadow-xl)' // Highlight on drag over
                    : activeDocId === doc.id ? 'var(--shadow-xl)' : 'var(--shadow-md)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '40px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  overflow: 'hidden',
                  position: 'relative',
                  transform: activeDocId === doc.id ? 'scale(1)' : 'scale(0.98)',
                  border: dragOverDocId === doc.id ? '2px solid hsl(var(--primary))' : 'none',
                }}
                className="document-paper"
              >
                <h3 style={{
                  fontSize: '1.5rem',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                  marginBottom: 'var(--space-4)',
                  color: 'hsl(var(--foreground))',
                }}>
                  {doc.title}
                </h3>
                <div style={{
                  fontSize: '0.875rem',
                  color: 'hsl(var(--muted))',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  display: '-webkit-box',
                  WebkitLineClamp: 15,
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

              {/* Floating Actions - Only visible when active */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
                paddingTop: '20px',
                opacity: activeDocId === doc.id ? 1 : 0,
                pointerEvents: activeDocId === doc.id ? 'auto' : 'none',
                transition: 'opacity 0.2s ease',
                minWidth: '120px', // Reserve space
              }}>
                <button
                  onClick={() => router.push(`/documents/${doc.id}`)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'hsl(var(--foreground))',
                    color: 'hsl(var(--background))',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: 'var(--shadow-sm)',
                    textAlign: 'left',
                  }}
                >
                  Open Document
                </button>
                <button
                  onClick={handleCreateDocument}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'hsl(var(--surface))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: 'var(--shadow-sm)',
                    textAlign: 'left',
                  }}
                >
                  New Document
                </button>
                <button
                  onClick={(e) => handleDeleteDocument(doc.id, e)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#fee2e2',
                    color: '#ef4444',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: 'var(--shadow-sm)',
                    textAlign: 'left',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {documents.length === 0 && (
            <div style={{
              marginTop: '20vh',
              textAlign: 'center',
              color: 'hsl(var(--muted))',
            }}>
              <p>No documents yet.</p>
              <button
                onClick={handleCreateDocument}
                style={{
                  marginTop: 'var(--space-4)',
                  padding: '8px 16px',
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                Create your first document
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .document-paper:hover {
          transform: translateY(-2px);
        }
        .document-card:hover {
          transform: scale(1.02);
          border-color: hsl(var(--primary));
          color: hsl(var(--primary));
        }
      `}</style>
    </main>
  );
}
