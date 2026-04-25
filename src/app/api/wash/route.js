// app/api/wash/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/session';
import { getTodayWasherName, formatDateLocal, getBlockReason } from '@/lib/taskLogic';

export async function POST() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Block outside 9am–7pm and on Sundays
    const block = getBlockReason();
    if (block) {
      return NextResponse.json({ error: block.message }, { status: 403 });
    }

    const today = formatDateLocal();
    const washerName = getTodayWasherName();

    // Only today's assigned washer can mark washed
    if (session.user.name !== washerName) {
      return NextResponse.json(
        { error: `Only ${washerName} can wash the bottle today.` },
        { status: 403 }
      );
    }

    const washerUser = await prisma.user.findUnique({ where: { name: washerName } });

    // Auto-create DailyTask if needed
    let dailyTask = await prisma.dailyTask.findUnique({ where: { date: today } });
    if (!dailyTask) {
      dailyTask = await prisma.dailyTask.create({
        data: { date: today, washerId: washerUser.id, isWashed: false },
      });
    }

    if (dailyTask.isWashed) {
      return NextResponse.json({ error: 'Bottle is already marked as washed today.' }, { status: 409 });
    }

    const updated = await prisma.dailyTask.update({
      where: { date: today },
      data: { isWashed: true, washedAt: new Date() },
    });

    return NextResponse.json({ success: true, washedAt: updated.washedAt });
  } catch (err) {
    console.error('Wash error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
