import { NextRequest, NextResponse } from 'next/server';
import { federatedSearch } from '@/lib/federated';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  const data = await federatedSearch(query, 12);
  return NextResponse.json(data);
}
