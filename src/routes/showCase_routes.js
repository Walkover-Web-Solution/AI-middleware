import { Router } from 'express';
import { addDataForShowCaseController, getAllDataForShowCaseController, updateDataForShowCaseController } from '../controllers/showCaseController.js';
import { middleware } from "../middlewares/middleware.js";
import  multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage });


const router = Router();

  // POST /showCase -> Add Data for Demo
  router.post('/add',middleware, upload.single('image'),  addDataForShowCaseController);
  
  // GET /all -> Get All Data for ShowCase
  router.get('/all',getAllDataForShowCaseController);

  // PUT /update/:id -> Update Data for ShowCase
  router.put('/update/:id',middleware, upload.single('image'),updateDataForShowCaseController);
  

export default router;
