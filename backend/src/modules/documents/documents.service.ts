import fs from 'fs';
import path from 'path';
import { prisma } from '../../config/db';

export class DocumentsService {
  async getDocuments(type?: 'CONTRACT' | 'CERTIFICATE', search?: string) {
    const where: any = {};
    if (type) {
      where.type = type;
    }
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } }
      ];
    }

    return await prisma.legalDocument.findMany({
      where,
      include: {
        uploadedBy: {
          select: { id: true, code: true, fullName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getDocumentById(id: string) {
    const doc = await prisma.legalDocument.findUnique({
      where: { id },
      include: { uploadedBy: true }
    });
    if (!doc) throw new Error('Hồ sơ tài liệu không tồn tại');
    return doc;
  }

  async createDocument(data: {
    code: string;
    title: string;
    type: 'CONTRACT' | 'CERTIFICATE';
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedById?: string;
  }) {
    const code = data.code.trim().toUpperCase();
    const existing = await prisma.legalDocument.findUnique({ where: { code } });
    if (existing) {
      throw new Error(`Mã tài liệu / chứng chỉ '${code}' đã tồn tại`);
    }

    return await prisma.legalDocument.create({
      data: {
        code,
        title: data.title.trim(),
        type: data.type,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        uploadedById: data.uploadedById
      },
      include: {
        uploadedBy: {
          select: { id: true, fullName: true }
        }
      }
    });
  }

  async deleteDocument(id: string) {
    const doc = await prisma.legalDocument.findUnique({ where: { id } });
    if (!doc) throw new Error('Hồ sơ tài liệu không tồn tại');

    // Xóa file vật lý nếu có
    if (doc.fileUrl && doc.fileUrl.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), doc.fileUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          // Ignore error if file deletion fails
        }
      }
    }

    return await prisma.legalDocument.delete({ where: { id } });
  }
}

export const documentsService = new DocumentsService();
