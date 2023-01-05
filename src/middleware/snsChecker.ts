import { NextFunction, Request, Response } from 'express';

export const snsChecker = (req: Request, res: Response, next: NextFunction) => {
  if (req.get('x-amz-sns-message-type')) {
    req.headers['content-type'] = 'application/json';
    next();
  } else {
    res.sendStatus(401);
  }
};
