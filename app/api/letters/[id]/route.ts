import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { deleteFile, uploadMemoryImage } from '@/lib/s3';

// POST /api/letters/[id] - for FormData uploads (media updates)
export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;
    
    const formData = await request.formData();
    const file = formData.get('media') as File | null;
    const fromId = formData.get('fromId') as string | null;
    const content = formData.get('content') as string | null;
    const unlockDate = formData.get('unlockDate') as string | null;

    const updateData: any = {};
    if (fromId !== undefined) updateData.fromId = fromId;
    if (content !== undefined) updateData.content = content;
    if (unlockDate !== undefined && unlockDate !== null) updateData.unlockDate = new Date(unlockDate);

    // Handle file upload
    if (file) {
      console.log('📸 Uploading new media for letter update');
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadMemoryImage(
        buffer,
        file.name,
        file.type
      );
      updateData.mediaUrl = result.url;
      updateData.mediaS3Key = result.key;
      
      // Delete old S3 file if exists
      const oldLetter = await prisma.loveLetter.findUnique({ where: { id } });
      if (oldLetter?.mediaS3Key) {
        await deleteFile(oldLetter.mediaS3Key).catch(e => console.error('Failed to delete old S3 file:', e));
      }
    }

    const letter = await prisma.loveLetter.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(letter);
  } catch (error) {
    console.error('Error updating letter with FormData:', error);
    return NextResponse.json({ error: 'Failed to update letter' }, { status: 500 });
  }
}

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
