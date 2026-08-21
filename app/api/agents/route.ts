import { NextResponse } from 'next/server';
import { getB8Agents } from '@/lib/agents';

export async function GET() {
  try {
    return NextResponse.json(await getB8Agents());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'agent_registry_failed' }, { status: 502 });
  }
}
