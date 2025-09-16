import { NextResponse } from "next/server"

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)
  
  if (error instanceof ApiError) {
    return NextResponse.json(
      { 
        error: error.message, 
        code: error.code,
        success: false 
      },
      { status: error.statusCode }
    )
  }
  
  if (error instanceof Error) {
    return NextResponse.json(
      { 
        error: error.message,
        success: false 
      },
      { status: 500 }
    )
  }
  
  return NextResponse.json(
    { 
      error: 'Bilinmeyen bir hata oluştu',
      success: false 
    },
    { status: 500 }
  )
}

export function validateRequest(data: unknown, requiredFields: string[]): void {
  if (!data || typeof data !== 'object') {
    throw new ApiError('Geçersiz istek verisi', 400, 'INVALID_REQUEST_DATA')
  }
  
  const obj = data as Record<string, unknown>
  const missingFields = requiredFields.filter(field => 
    obj[field] === undefined || obj[field] === null || obj[field] === ''
  )
  
  if (missingFields.length > 0) {
    throw new ApiError(
      `Eksik alanlar: ${missingFields.join(', ')}`,
      400,
      'MISSING_REQUIRED_FIELDS'
    )
  }
}

export function createSuccessResponse<T>(data: T, message?: string): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message,
  })
}

export async function withErrorHandling<T>(
  handler: () => Promise<T>
): Promise<NextResponse> {
  try {
    const result = await handler()
    return createSuccessResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}
