import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = req.correlationId

  logger.error(`Unhandled error: ${err.message}`, {
    correlationId: requestId,
    stack: err.stack,
    path: req.path,
    method: req.method,
  })

  res.status(500).json({
    error: 'Internal server error',
    requestId,
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
}