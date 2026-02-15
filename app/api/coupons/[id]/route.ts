import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT /api/coupons/[id]
export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;
    const body = await request.json();
    
    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        title: body.title,
        emoji: body.emoji,
        desc: body.desc,
        color: body.color,
        forPartner: body.forPartner,
        points: body.points,
        redeemedAt: body.redeemedAt ? new Date(body.redeemedAt) : undefined,
      } as any
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.error('Error updating coupon:', error);
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

// DELETE /api/coupons/[id]
export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;
    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}
