import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        fontSize: 64,
        background: "transparent",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      📂
    </div>,
    {
      width: 32,
      height: 32,
    },
  )
}

