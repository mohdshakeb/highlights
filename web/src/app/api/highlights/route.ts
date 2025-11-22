import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { text, url, title, favicon, documentId } = body;

        if (!text || !url) {
            return NextResponse.json(
                { error: 'Missing required fields: text and url' },
                { status: 400 }
            );
        }

        // Create the highlight
        const highlight = await prisma.highlight.create({
            data: {
                text,
                url,
                title: title || 'Untitled',
                favicon,
                documentId: documentId || null,
            },
        });

        // If associated with a document, append the text to the document content
        if (documentId) {
            const document = await prisma.document.findUnique({
                where: { id: documentId },
                select: { content: true }
            });

            if (document) {
                const newContent = document.content
                    ? `${document.content}\n\n${text}`
                    : text;

                await prisma.document.update({
                    where: { id: documentId },
                    data: { content: newContent }
                });
            }
        }

        return NextResponse.json(highlight, {
            status: 201,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    } catch (error) {
        console.error('Error creating highlight:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            {
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
        );
    }
}

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const documentId = searchParams.get('documentId');

        const highlights = await prisma.highlight.findMany({
            where: documentId !== null
                ? { documentId: documentId === 'null' ? null : documentId }
                : undefined,
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(highlights);
    } catch (error) {
        console.error('Error fetching highlights:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
