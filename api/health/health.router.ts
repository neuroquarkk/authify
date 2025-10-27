import { ApiResponse } from '@utils';
import { Router } from 'express';

const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
    res.status(200).json(
        new ApiResponse(
            200,
            {
                status: 'ok',
                timestamp: new Date().toISOString(),
            },
            'health checked'
        )
    );
});

export { healthRouter };
