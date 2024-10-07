import { NextResponse } from 'next/server'

export async function GET() {
  const fixedModelUri = process.env.FIXED_MODEL_URI
  const fixedModelName = process.env.FIXED_MODEL_NAME

  return NextResponse.json({
    uri: fixedModelUri,
    name: fixedModelName
  })
}