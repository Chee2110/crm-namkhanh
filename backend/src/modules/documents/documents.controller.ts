import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { documentsService } from './documents.service';
import { successResponse, errorResponse } from '../../common/utils/response';

// Cấu hình lưu trữ tệp tin tải lên (tối đa 25MB)
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  }
});

const allowedMimes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png'
];

export const documentUpload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận các định dạng file: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG'));
    }
  }
});

export class DocumentsController {
  async getDocuments(req: Request, res: Response) {
    try {
      const type = req.query.type as 'CONTRACT' | 'CERTIFICATE' | undefined;
      const search = req.query.search as string | undefined;

      const result = await documentsService.getDocuments(type, search);
      return successResponse(res, result, 'Lấy danh sách tài liệu thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy danh sách tài liệu', 400);
    }
  }

  async getDocumentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await documentsService.getDocumentById(id);
      return successResponse(res, result, 'Lấy chi tiết tài liệu thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy chi tiết tài liệu', 400);
    }
  }

  async createDocument(req: Request, res: Response) {
    try {
      const { code, title, type } = req.body;
      const file = req.file;

      if (!code || !title || !type) {
        return errorResponse(res, 'Mã tài liệu, Tên tài liệu và Phân loại là bắt buộc', 400);
      }

      if (!file) {
        return errorResponse(res, 'Vui lòng chọn tệp tin đính kèm (tối đa 25MB)', 400);
      }

      const fileUrl = `/uploads/${file.filename}`;
      const currentUser = req.user!;

      const result = await documentsService.createDocument({
        code,
        title,
        type,
        fileUrl,
        fileName: Buffer.from(file.originalname, 'latin1').toString('utf8'), // Fix Unicode filename
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedById: currentUser.id
      });

      return successResponse(res, result, 'Tải lên tài liệu thành công', 201);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi tải lên tài liệu', 400);
    }
  }

  async deleteDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await documentsService.deleteDocument(id);
      return successResponse(res, null, 'Xóa tài liệu thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi khi xóa tài liệu', 400);
    }
  }

  async downloadDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const doc = await documentsService.getDocumentById(id);

      const filePath = path.join(process.cwd(), doc.fileUrl);
      if (!fs.existsSync(filePath)) {
        return errorResponse(res, 'Tệp tin không còn tồn tại trên máy chủ', 404);
      }

      return res.download(filePath, doc.fileName);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi khi tải tệp', 400);
    }
  }
}

export const documentsController = new DocumentsController();
