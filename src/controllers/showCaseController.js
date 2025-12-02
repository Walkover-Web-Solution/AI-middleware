import showcaseService from '../db_services/showCaseDbservice.js';

export const getAllDataForShowCaseController = async (req, res, next) => {
    const data = await showcaseService.getAll();
    res.locals = {
        success: true,
        message: "Showcase data fetched successfully",
        data
    };
    req.statusCode = 200;
    return next();
};
