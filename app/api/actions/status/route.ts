import { NextResponse } from 'next/server';
import { actionBrokerConfigured } from '@/lib/actions';

export async function GET() {
  return NextResponse.json({ configured: actionBrokerConfigured() });
}
