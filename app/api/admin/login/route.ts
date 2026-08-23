import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Firebase removed — admin now uses demo login via POST /api/admin/login-demo
export async function POST() {
  return NextResponse.json(
    { error: 'Firebase login removed. Use demo login: POST /api/admin/login-demo' },
    { status: 410 },
  );
}