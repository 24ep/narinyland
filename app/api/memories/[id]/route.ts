import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { deleteFile, uploadMemoryImage } from '@/lib/s3';

// POST /api/memories/[id] - for FormData uploads (image updates)
export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;
    
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const url = formData.get('url') as string | null;
    const privacy = (formData.get('privacy') as string) || 'public';
    const caption = formData.get('caption') as string | null;

    const updateData: any = {};
    if (privacy !== undefined) updateData.privacy = privacy;
    if (caption !== undefined) updateData.caption = caption;
    if (url !== undefined) updateData.url = url;

    // Handle file upload
    if (file) {
      console.log('📸 Uploading new image for memory update');
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadMemoryImage(
        buffer,
        file.name,
        file.type
      );
      updateData.url = result.url;
      updateData.s3Key = result.key;
      
      // Delete old S3 file if exists
      const oldMemory = await prisma.memory.findUnique({ where: { id } });
      if (oldMemory?.s3Key) {
        await deleteFile(oldMemory.s3Key).catch(e => console.error('Failed to delete old S3 file:', e));
      }
    }

    const memory = await prisma.memory.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(memory);
  } catch (error) {
    console.error('Error updating memory with FormData:', error);
    return NextResponse.json({ error: 'Failed to update memory' }, { status: 500 });
  }
}

// PUT /api/memories/[id] - for JSON updates
export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;
    const body = await request.json();
    const { privacy, caption, sortOrder, url } = body;

    const updateData: any = {};
    if (privacy !== undefined) updateData.privacy = privacy;
    if (caption !== undefined) updateData.caption = caption;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (url !== undefined) updateData.url = url;

    const memory = await prisma.memory.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(memory);
  } catch (error) {
    console.error('Error updating memory:', error);
    return NextResponse.json({ error: 'Failed to update memory' }, { status: 500 });
  }
}

// DELETE /api/memories/[id]
export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;
    
    const memory = await prisma.memory.findUnique({ where: { id } });
    if (!memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    // Delete from S3 if it was uploaded
    if (memory.s3Key) {
      await deleteFile(memory.s3Key);
    }

    await prisma.memory.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting memory:', error);
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 });
  }
}
