'use client';

import { use } from 'react';
import useSWR from 'swr';
import DocumentEditor from '@/components/DocumentEditor';
import SourcesSidebar from '@/components/SourcesSidebar';

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
    highlights: Highlight[];
}

export default function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    // Use SWR to fetch document data with polling
    const { data: document, error } = useSWR<Document>(`/api/documents/${id}`, fetcher, {
        refreshInterval: 2000,
        revalidateOnFocus: true
    });

    if (error) return <div>Failed to load document</div>;
    if (!document) return <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted))' }}>Loading...</div>;

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            backgroundColor: 'hsl(var(--background))',
            gap: '24px',
            padding: 'var(--space-8) var(--space-4)',
        }}>
            {/* Main Content */}
            <div style={{ flex: 1 }}>
                <DocumentEditor
                    documentId={document.id}
                    initialTitle={document.title}
                    initialContent={document.content}
                />
            </div>

            {/* Sticky Sidebar with Highlight Links */}
            {document.highlights && document.highlights.length > 0 && (
                <SourcesSidebar highlights={document.highlights} />
            )}
        </div>
    );
}
