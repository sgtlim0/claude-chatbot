export class ChatError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'ChatError'
  }
}

export class NetworkError extends ChatError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR')
    this.name = 'NetworkError'
  }
}

export class ApiError extends ChatError {
  constructor(message: string, public status?: number) {
    super(message, 'API_ERROR')
    this.name = 'ApiError'
  }
}