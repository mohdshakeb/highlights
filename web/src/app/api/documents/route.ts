import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const documents = await prisma.document.findMany({
            orderBy: {
                updatedAt: 'desc',
            },
            include: {
                _count: {
                    select: { highlights: true },
                },
            },
        });

        return NextResponse.json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, content = '' } = body;

        if (!title) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        const document = await prisma.document.create({
            data: {
                title,
                content,
            },
        });

        return NextResponse.json(document, { status: 201 });
    } catch (error) {
        console.error('Error creating document:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
