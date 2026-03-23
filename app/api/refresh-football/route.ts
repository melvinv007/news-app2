import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/fetch-football`,
      { 
        method: 'POST', 
        headers: { 
          'x-cron-secret': process.env.CRON_SECRET! 
        } 
      }
    );
    
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to refresh football scores' }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
