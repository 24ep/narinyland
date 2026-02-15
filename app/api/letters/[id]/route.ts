import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { deleteFile } from '@/lib/s3';

// DELETE /api/letters/[id]
export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;

    const letter = await prisma.loveLetter.findUnique({ where: { id } });
    if (!letter) {
      return NextResponse.json({ error: 'Letter not found' }, { status: 404 });
    }

    if (letter.mediaS3Key) {
      await deleteFile(letter.mediaS3Key);
    }

    await prisma.loveLetter.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting letter:', error);
    return NextResponse.json({ error: 'Failed to delete letter' }, { status: 500 });
  }
}

// PUT /api/letters/[id]
export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;
    const body = await request.json();

    const letter = await prisma.loveLetter.update({
      where: { id },
      data: {
        folder: body.folder,
        isRead: body.isRead,
        readAt: body.readAt ? new Date(body.readAt) : undefined,
      } as any
    });

    return NextResponse.json(letter);
  } catch (error) {
    console.error('Error updating letter:', error);
    return NextResponse.json({ error: 'Failed to update letter' }, { status: 500 });
  }
}
