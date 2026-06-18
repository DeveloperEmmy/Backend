import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'
import { recordHttpRequest } from '../utils/metrics'

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const durationSeconds = duration / 1000

    logger.info(`${req.method} ${req.path}`, {
      correlationId: req.correlationId,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    })

    const route = req.route?.path || req.path
    recordHttpRequest(req.method, route, res.statusCode, durationSeconds)
  })

  next()
}