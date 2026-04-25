// app/api/status/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/session';
import {
  getTodayWasherName,
  getNextFillUserName,
  formatDateLocal,
  getDayName,
  getBlockReason,
} from '@/lib/taskLogic';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = formatDateLocal();
    const dayName = getDayName();
    const currentUser = { id: session.user.id, name: session.user.name, email: session.user.email };

    // Check Sunday + working hours (9am–7pm)
    const block = getBlockReason();
    if (block) {
      return NextResponse.json({ blocked: true, blockCode: block.code, blockMessage: block.message, today, dayName, currentUser });
    }

    const washerName = getTodayWasherName();
    const washerUser = await prisma.user.findUnique({ where: { name: washerName } });
    if (!washerUser) {
      return NextResponse.json({ error: 'Washer user not found' }, { status: 500 });
    }

    // Auto-create DailyTask on first visit of the day
    let dailyTask = await prisma.dailyTask.findUnique({ where: { date: today } });
    if (!dailyTask) {
      dailyTask = await prisma.dailyTask.create({
        data: { date: today, washerId: washerUser.id, isWashed: false },
      });
    }

    // Get all fills for today ordered by orderIndex
    const fills = await prisma.fillLog.findMany({
      where: { date: today },
      orderBy: { orderIndex: 'asc' },
      include: { user: { select: { name: true } } },
    });

    const fillCount = fills.length;
    const nextFillUserName = getNextFillUserName(washerName, fillCount);

    // Build notifications
    const notifications = [];
    if (!dailyTask.isWashed) {
      if (currentUser.name === washerName) {
        notifications.push({ type: 'warning', message: '⚠️ You must wash the bottle before anyone can fill it!' });
      } else {
        notifications.push({ type: 'info', message: `⏳ Waiting for ${washerName} to wash the bottle first.` });
      }
    } else if (currentUser.name === nextFillUserName) {
      notifications.push({ type: 'action', message: "💧 Bottle is washed! It's your turn to fill water." });
    }

    return NextResponse.json({
      blocked: false,
      today,
      dayName,
      washer: { name: washerName, id: washerUser.id },
      isWashed: dailyTask.isWashed,
      washedAt: dailyTask.washedAt,
      fillCount,
      nextFillUser: nextFillUserName,
      fills: fills.map((f) => ({
        orderIndex: f.orderIndex,
        userName: f.user.name,
        filledAt: f.filledAt,
      })),
      currentUser,
      notifications,
    });
  } catch (err) {
    console.error('Status error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
