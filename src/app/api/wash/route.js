// app/api/wash/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/session';
import { getTodayWasherName, formatDateLocal, isSunday } from '@/lib/taskLogic';

export async function POST() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isSunday()) {
      return NextResponse.json({ error: 'App is closed on Sundays. Enjoy your day off! 🌴' }, { status: 403 });
    }

    const today = formatDateLocal();
    const washerName = getTodayWasherName();

    if (session.user.name !== washerName) {
      return NextResponse.json(
        { error: `Only ${washerName} can mark the bottle as washed today.` },
        { status: 403 }
      );
    }

    const washerUser = await prisma.user.findUnique({ where: { name: washerName } });

    // Auto-create DailyTask if it doesn't exist yet (first action of the day)
    let dailyTask = await prisma.dailyTask.findUnique({ where: { date: today } });
    if (!dailyTask) {
      dailyTask = await prisma.dailyTask.create({
        data: { date: today, washerId: washerUser.id, isWashed: false },
      });
    }
    if (dailyTask.isWashed) {
      return NextResponse.json({ error: 'Bottle already marked as washed today.' }, { status: 409 });
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
