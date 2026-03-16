import { createHash } from "crypto";
import { ZodError } from "zod";
import { requireAuthenticatedUserForApi } from "@/lib/auth/require-user";
import { documentUploadSchema } from "@/server/modules/documents/documents.validators";
import { createCurrentUserDocument } from "@/server/modules/documents/documents.service";
import { buildDocumentStorageKey, uploadBufferToR2 } from "@/lib/storage/r2";

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUserForApi();
    const formData = await request.formData();

    const title = formData.get("title");
    const file = formData.get("file");

    const parsed = documentUploadSchema.parse({
      title,
    });

    if (!(file instanceof File)) {
      return Response.json(
        {
          success: false,
          message: "A document file is required",
        },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return Response.json(
        {
          success: false,
          message: "Only PDF, DOCX, and TXT files are supported",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return Response.json(
        {
          success: false,
          message: "File size must be 15 MB or less",
        },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const checksum = createHash("sha256").update(buffer).digest("hex");

    const storageKey = buildDocumentStorageKey({
      userId: user.id,
      fileName: file.name,
    });

    const uploaded = await uploadBufferToR2({
      key: storageKey,
      body: buffer,
      contentType: file.type,
    });

    const document = await createCurrentUserDocument({
      title: parsed.title,
      originalFileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      storageProvider: uploaded.storageProvider,
      storageBucket: uploaded.bucket,
      storageKey: uploaded.key,
      checksum,
      processingStatus: "uploaded",
    });

    return Response.json(
      {
        success: true,
        message: "Document uploaded successfully",
        document,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        {
          success: false,
          message: "Invalid upload data",
          issues: error.flatten(),
        },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    console.error("Document upload failed", error);

    return Response.json(
      {
        success: false,
        message: "Failed to upload document",
      },
      { status: 500 },
    );
  }
}
