import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        fontSize: 80,
        color: "black",
        background: "white",
        width: "100%",
        height: "100%",
        padding: "50px",
        textAlign: "center",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Helvetica, Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontWeight: "bold" }}>filename.website</h1>
      </div>
    </div>,
    {
      width: 1200,
      height: 1200,
    },
  )
}

