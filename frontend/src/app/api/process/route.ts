import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { detail: "No file provided. Please upload a document." },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { detail: "No file provided. Please upload a document." },
      { status: 400 }
    );
  }

  try {
    const backendForm = new FormData();
    backendForm.append("file", file);

    const response = await fetch(`${BACKEND_URL}/process`, {
      method: "POST",
      body: backendForm,
    });

    if (!response.ok) {
      const err = await response
        .json()
        .catch(() => ({ detail: "Backend error" }));
      return NextResponse.json(
        { detail: err.detail || `Backend returned ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("API proxy error:", error);
    return NextResponse.json(
      {
        detail:
          "Unable to process document right now. The processing service may be starting up — please try again in a moment.",
      },
      { status: 502 }
    );
  }
}
