// app/api/status/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/session';
import { getTodayWasherName, getNextFillUserName, formatDateLocal, getDayName, isSunday } from '@/lib/taskLogic';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = formatDateLocal();
    const dayName = getDayName();

    // Sunday — app is closed
    if (isSunday()) {
      return NextResponse.json({
        isSundayOff: true,
        today,
        dayName,
        currentUser: { id: session.user.id, name: session.user.name, email: session.user.email },
      });
    }

    const washerName = getTodayWasherName();
    const washerUser = await prisma.user.findUnique({ where: { name: washerName } });
    if (!washerUser) {
      return NextResponse.json({ error: 'Washer user not found' }, { status: 500 });
    }

    // Get or create today's DailyTask
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

    // Notifications for the current user
    const currentUser = session.user;
    const notifications = [];
    if (!dailyTask.isWashed) {
      if (currentUser.name === washerName) {
        notifications.push({ type: 'warning', message: '⚠️ You need to wash the bottle today!' });
      } else {
        notifications.push({ type: 'info', message: `⏳ Bottle not washed yet. Waiting for ${washerName}.` });
      }
    }
    if (currentUser.name === nextFillUserName) {
      notifications.push({ type: 'action', message: "💧 It's your turn to fill water!" });
    }

    return NextResponse.json({
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
      currentUser: { id: currentUser.id, name: currentUser.name, email: currentUser.email },
      notifications,
    });
  } catch (err) {
    console.error('Status error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
