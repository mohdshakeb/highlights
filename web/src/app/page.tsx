'use client';

import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import HighlightCard from '@/components/HighlightCard';
import DocumentPreviewCard from '@/components/DocumentPreviewCard';
import { useRouter } from 'next/navigation';
import { getCategoryStyles, CATEGORY_CONFIG, Category, getCategoryFromUrl } from '@/utils/categories';

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
  const [orderedHighlights, setOrderedHighlights] = useState<Highlight[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [newlyCreatedDocId, setNewlyCreatedDocId] = useState<string | null>(null);
  // Use SWR for real-time updates
  const { data: highlights = [], mutate: mutateHighlights } = useSWR<Highlight[]>('/api/highlights?documentId=null', fetcher, { refreshInterval: 2000 });
  const { data: documents = [], mutate: mutateDocuments } = useSWR<Document[]>('/api/documents', fetcher, { refreshInterval: 2000 });

  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [dragOverDocId, setDragOverDocId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

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
        body: JSON.stringify({ title: '' }),
      });

      if (response.ok) {
        const newDoc = await response.json();

        // Optimistically add the new document
        mutateDocuments([newDoc, ...documents], false);
        setNewlyCreatedDocId(newDoc.id);

        // Scroll to the new document after a brief delay to allow rendering
        setTimeout(() => {
          scrollToDocument(newDoc.id);
        }, 100);
      } else {
        console.error('Failed to create document');
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

  const handleDragOverDoc = (e: React.DragEvent, docId: string) => {
    e.preventDefault(); // Allow dropping
    setDragOverDocId(docId);
  };

  const handleDragLeaveDoc = (e: React.DragEvent) => {
    setDragOverDocId(null);
  };

  const handleDropOnDoc = async (e: React.DragEvent, docId: string) => {
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

  const scrollToDocument = (docId: string) => {
    const element = document.querySelector(`[data-id="${docId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleTitleUpdate = async (id: string, newTitle: string) => {
    try {
      // Optimistic update
      mutateDocuments(documents.map(d => d.id === id ? { ...d, title: newTitle } : d), false);

      await fetch(`/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });

      mutateDocuments();
    } catch (error) {
      console.error('Error updating document title:', error);
      mutateDocuments();
    }
  };

  // Filter highlights
  const filteredHighlights = selectedCategory
    ? highlights.filter(h => getCategoryFromUrl(h.url) === selectedCategory)
    : highlights;

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
        width: 'fit-content', // Only take up needed space
        maxWidth: '100%',
        padding: '0 24px', // Requested 24px padding
        gap: '24px', // Reduced gap
        justifyContent: 'center',
      }}>

        {/* LEFT COLUMN: Highlights (Sticky) */}
        <div style={{
          width: '240px', // Reduced from 300px to make sticky notes smaller
          paddingTop: 'calc(50vh - 320px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          height: '100vh',
          overflowY: 'auto',
          scrollbarWidth: 'none',
          paddingBottom: 'var(--space-8)',
        }}>
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: '10px' }}>
              {filteredHighlights.map((highlight) => (
                <div
                  key={highlight.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, highlight.id)}
                  style={{
                    transform: 'scale(0.95)',
                    transformOrigin: 'center',
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
              {filteredHighlights.length === 0 && (
                <div style={{
                  padding: 'var(--space-4)',
                  textAlign: 'center',
                  color: 'hsl(var(--muted))',
                  border: '1px dashed hsl(var(--border))',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                }}>
                  {selectedCategory ? `No ${CATEGORY_CONFIG[selectedCategory].label} highlights` : 'No new highlights'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Documents (Scrollable) */}
        <div
          className="document-scroll-container"
          style={{
            flex: 1,
            height: '100vh',
            overflowY: 'auto',
            scrollSnapType: 'y mandatory',
            paddingTop: 'calc(50vh - 318px)', // Adjusted for 450px width (~636px height -> half is 318px)
            paddingBottom: '50vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            scrollbarWidth: 'none',
          }}
        >
          {documents.map((doc) => (
            <DocumentPreviewCard
              key={doc.id}
              doc={doc}
              isActive={dragOverDocId === doc.id}
              isDragOver={dragOverDocId === doc.id}
              onDragOver={handleDragOverDoc}
              onDragLeave={handleDragLeaveDoc}
              onDrop={handleDropOnDoc}
              onDelete={handleDeleteDocument}
              onTitleUpdate={handleTitleUpdate}
              autoFocus={doc.id === newlyCreatedDocId}
            />
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

        {/* RIGHT COLUMN: Document Index (Sticky) */}
        <div style={{
          width: '250px',
          paddingTop: 'calc(50vh - 300px)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          justifyContent: 'space-between', // Push content to edges
          paddingBottom: 'calc(50vh - 300px)',
        }}>

          {/* Category Tags */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <span style={{ fontSize: '1rem', color: 'hsl(var(--foreground))', fontWeight: 500 }}>Select the source type of collected excerpts</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <button
                onClick={() => setSelectedCategory(null)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '100px',
                  border: '1px solid',
                  borderColor: selectedCategory === null ? 'hsl(var(--foreground))' : 'transparent',
                  backgroundColor: selectedCategory === null ? 'hsl(var(--foreground))' : 'hsl(var(--muted) / 0.1)',
                  color: selectedCategory === null ? 'hsl(var(--background))' : 'hsl(var(--muted))',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                All
              </button>
              {(['social', 'article', 'academic', 'ai'] as Category[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '100px',
                    border: '1px solid',
                    borderColor: selectedCategory === cat ? CATEGORY_CONFIG[cat].borderColor : 'transparent',
                    backgroundColor: selectedCategory === cat ? CATEGORY_CONFIG[cat].color : 'hsl(var(--muted) / 0.1)',
                    color: selectedCategory === cat ? CATEGORY_CONFIG[cat].textColor : 'hsl(var(--muted))',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {CATEGORY_CONFIG[cat].label}
                </button>
              ))}
            </div>
          </div>

          {/* Document List - Bottom Aligned */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1, justifyContent: 'flex-end', paddingBottom: 'var(--space-8)' }}>
            {documents.map((doc) => {
              const isActive = activeDocId === doc.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => scrollToDocument(doc.id)}
                  className="nav-item"
                  style={{
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    padding: '6px 0', // Reduced padding
                    fontSize: '0.85rem', // Reduced font size
                    color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted))',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontWeight: isActive ? 500 : 400, // Reduced weight
                    position: 'relative',
                    opacity: isActive ? 1 : 0.6, // Make inactive items more subtle
                    transition: 'opacity 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.opacity = '0.6';
                  }}
                >
                  {/* Dot Indicator */}
                  <span style={{
                    width: '6px', // Smaller dot
                    height: '6px',
                    borderRadius: '50%',
                    border: isActive ? 'none' : '1px solid currentColor', // Thinner border, use current color
                    backgroundColor: isActive ? 'hsl(var(--foreground))' : 'transparent', // Solid black for active
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }} />

                  {/* Text Label */}
                  <span
                    className="nav-text"
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      transition: 'transform 0.2s ease', // Smooth movement
                    }}
                  >
                    {doc.title}
                  </span>
                </button>
              );
            })}
            <style jsx>{`
              .nav-item:hover .nav-text {
                transform: translateX(4px); /* Move ONLY text */
                color: hsl(var(--foreground));
              }
              .nav-item:hover {
                color: hsl(var(--foreground)); /* Darken text on hover */
              }
            `}</style>
          </div>

          {/* Create Button (Bottom) */}
          <button
            onClick={handleCreateDocument}
            style={{
              padding: '8px 16px',
              backgroundColor: 'hsl(var(--foreground))',
              color: 'hsl(var(--background))',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: 'fit-content',
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.1s ease',
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            + New Document
          </button>
        </div>

      </div>
    </main>
  );
}
