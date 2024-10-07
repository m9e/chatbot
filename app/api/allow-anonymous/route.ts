import { NextResponse } from 'next/server'

export async function GET() {
  const allowAnonymous = process.env.ALLOW_ANONYMOUS === 'true'
  return NextResponse.json({ allowAnonymous })
}