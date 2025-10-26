import { NextResponse } from 'next/server'

// Ubeswap Router address for Celo Alfajores/Sepolia
const UBESWAP_ROUTER = '0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121'

export async function GET() {
  return NextResponse.json({
    routerAddress: UBESWAP_ROUTER
  })
}
