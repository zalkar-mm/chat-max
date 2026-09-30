import axios from 'axios'

import { API_TIMEOUT_MS } from '../config/env'

import { toApiError } from './api-error'

export const greenApiClient = axios.create({
  timeout: API_TIMEOUT_MS,
  // Таймаут приходит как ETIMEDOUT, а не как общий ECONNABORTED (им же браузер отмечает обрыв).
  transitional: { clarifyTimeoutError: true },
  headers: { 'Content-Type': 'application/json' },
})

// Наружу выходит только ApiError: сырой ответ сервера (и URL с токеном) не утекает в UI и логи.
greenApiClient.interceptors.response.use(undefined, (error: unknown) =>
  Promise.reject(toApiError(error)),
)
