// app/api/fill/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/session';
import {
  getTodayWasherName,
  getNextFillUserName,
  validateFillTurn,
  formatDateLocal,
  getBlockReason,
} from '@/lib/taskLogic';

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
    const washerUser = await prisma.user.findUnique({ where: { name: washerName } });

    // Auto-create DailyTask if needed
    let dailyTask = await prisma.dailyTask.findUnique({ where: { date: today } });
    if (!dailyTask) {
      dailyTask = await prisma.dailyTask.create({
        data: { date: today, washerId: washerUser.id, isWashed: false },
      });
    }

    // LOOPHOLE FIX: Bottle MUST be washed before anyone can fill
    if (!dailyTask.isWashed) {
      return NextResponse.json(
        { error: `Bottle must be washed by ${washerName} before anyone can fill it.` },
        { status: 403 }
      );
    }

    // Re-read live fill count to prevent race conditions
    const fillCount = await prisma.fillLog.count({ where: { date: today } });

    // Validate it's this user's turn
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
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Fill already recorded. Refresh and try again.' }, { status: 409 });
    }
    console.error('Fill error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
