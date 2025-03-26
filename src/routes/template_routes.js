import { Router } from 'express';
import {addShowCaseTemplateController, getShowCaseTemplateController, updateShowCaseTemplateController} from '../controllers/templateController.js';
import { middleware } from "../middlewares/middleware.js";


const router = Router();

 

  router.post('/add',  addShowCaseTemplateController);
  
 
  router.get('/all',getShowCaseTemplateController);

  
  router.put('/update/:id',updateShowCaseTemplateController);
  

export default router;
