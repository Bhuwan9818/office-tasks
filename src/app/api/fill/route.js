// app/api/fill/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/session';
import { getTodayWasherName, getNextFillUserName, validateFillTurn, formatDateLocal } from '@/lib/taskLogic';

export async function POST() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = formatDateLocal();
    const washerName = getTodayWasherName();

    const dailyTask = await prisma.dailyTask.findUnique({ where: { date: today } });
    if (!dailyTask) {
      return NextResponse.json({ error: 'Daily task not initialized. Refresh first.' }, { status: 404 });
    }

    // Re-read live fill count to prevent race conditions
    const fillCount = await prisma.fillLog.count({ where: { date: today } });

    const isValid = validateFillTurn(session.user.name, washerName, fillCount);
    if (!isValid) {
      const expected = getNextFillUserName(washerName, fillCount);
      return NextResponse.json(
        { error: `It's ${expected}'s turn to fill, not yours.` },
        { status: 403 }
      );
    }

    const fillLog = await prisma.fillLog.create({
      data: {
        date: today,
        userId: session.user.id,
        orderIndex: fillCount + 1,
        dailyTaskId: dailyTask.id,
        filledAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      orderIndex: fillLog.orderIndex,
      filledAt: fillLog.filledAt,
    });
  } catch (err) {
    if (err.code === 'anjali002') {
      return NextResponse.json({ error: 'Fill already recorded. Refresh and try again.' }, { status: 409 });
    }
    console.error('Fill error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
