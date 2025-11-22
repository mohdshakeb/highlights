import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { documentId } = body;

    // If moving to a document, append the highlight text to the document
    if (documentId) {
      const highlight = await prisma.highlight.findUnique({
        where: { id },
      });

      if (highlight) {
        const document = await prisma.document.findUnique({
          where: { id: documentId },
        });

        if (document) {
          // Append highlight text to document content
          const newContent = document.content
            ? `${document.content}\n\n"${highlight.text}"\n— ${highlight.title || new URL(highlight.url).hostname}`
            : `"${highlight.text}"\n— ${highlight.title || new URL(highlight.url).hostname}`;

          await prisma.document.update({
            where: { id: documentId },
            data: { content: newContent },
          });
        }
      }
    }

    const updatedHighlight = await prisma.highlight.update({
      where: { id },
      data: {
        documentId: documentId === null ? null : documentId,
      },
    });

    return NextResponse.json(updatedHighlight);
  } catch (error) {
    console.error('Error updating highlight:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.highlight.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting highlight:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
