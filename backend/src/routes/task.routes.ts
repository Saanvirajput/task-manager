import { Router } from 'express';
import { getTasks, createTask, updateTask, deleteTask, extractTasksFromPdf } from '../controllers/task.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

import { getTaskComments, addComment } from '../controllers/comment.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', getTasks);
router.post('/', upload.single('attachment'), createTask);
router.post('/extract-pdf', upload.single('attachment'), extractTasksFromPdf);
router.put('/:id', upload.single('attachment'), updateTask);
router.delete('/:id', deleteTask);

// Comment routes
router.get('/:id/comments', getTaskComments);
router.post('/:id/comments', addComment);

export default router;
