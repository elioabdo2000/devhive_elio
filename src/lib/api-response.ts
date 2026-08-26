import { NextResponse } from "next/server";

export function apiSuccess(data: unknown, message = "Success", status = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function apiError(message: string, status = 400, errors?: unknown) {
  return NextResponse.json({ success: false, message, errors }, { status });
}
