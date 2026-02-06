/**
 * Document Attachment Tools (SCOPE-006, P23)
 *
 * Tools for working with document attachments.
 * - get_document_attachments: List document metadata
 * - get_document_content: Download actual document binary content (P23 killer feature)
 *
 * @see SCOPE-006 in operations/ROADMAP.md
 * @see P23 - Document Download feature
 * @see LESSONS-LEARNED.md - "Binary data via Base64 en attachments via link"
 */

import { ToolDefinition } from '../types';
import { BaseTool, extractODataResults, DEFAULT_TOOL_ANNOTATIONS } from './_base';
import { buildGuidFilter, validateGuid } from '../exact/odata-query';
import { logger } from '../lib/logger';
import type { ExactODataResponse, ExactDocumentAttachment } from '@exact-mcp/shared';

/**
 * Get Document Attachments Tool
 *
 * Retrieves document attachments (bijlagen bij facturen, orders, etc.).
 */
export class GetDocumentAttachmentsTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_document_attachments',
    description:
      'Haal document bijlagen op uit Exact Online. ' +
      'Gebruik voor: factuur bijlagen, order bijlagen, document overzicht. ' +
      'Toont bestandsnaam, grootte en download URL.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        document_id: {
          type: 'string',
          description: 'Filter op specifiek document (GUID). Optioneel.',
        },
        limit: {
          type: 'number',
          description: 'Maximum aantal resultaten (1-500). Default: 100',
        },
      },
      required: [],
    },
    outputSchema: {
      type: 'object',
      properties: {
        attachments: { type: 'array' },
        count: { type: 'number' },
        summary: { type: 'object' },
        filters: { type: 'object' },
        division: { type: 'number' },
      },
      required: ['attachments', 'count', 'summary', 'filters', 'division'],
    },
    annotations: DEFAULT_TOOL_ANNOTATIONS,
  };

  async run(params: Record<string, unknown>): Promise<unknown> {
    const connection = this.getConnection();
    if (!connection) {
      return { error: 'Geen Exact Online connectie gevonden.' };
    }

    // FEATURE-001: Use default division if not specified
    const division = this.resolveDivision(connection, params.division as number | undefined);
    if (!division) {
      return { error: 'Geen administratie opgegeven en geen standaard administratie ingesteld. Gebruik list_divisions om beschikbare administraties te zien.' };
    }

    const documentId = params.document_id as string | undefined;
    const limit = Math.min(Math.max((params.limit as number) || 100, 1), 500);

    const filters: string[] = [];

    if (documentId) {
      try {
        filters.push(buildGuidFilter('Document', documentId));
      } catch (error) {
        return { error: `Ongeldig document_id formaat: ${(error as Error).message}`, division };
      }
    }

    const filterString = filters.length > 0 ? `&$filter=${encodeURIComponent(filters.join(' and '))}` : '';
    // Note: Only use API-documented fields: ID, Document, FileName, FileSize, Url
    // Removed: AttachmentFileName, AttachmentFileSize, AttachmentUrl, Created, Creator (don't exist)
    const endpoint = `/${division}/documents/DocumentAttachments?$select=ID,Document,FileName,FileSize,Url${filterString}&$top=${limit}`;

    try {
      const response = await this.exactRequest<ExactODataResponse<ExactDocumentAttachment>>(connection, endpoint);
      const attachments = extractODataResults<ExactDocumentAttachment>(response?.d as Record<string, unknown>);

      // Calculate summary
      let totalSize = 0;
      const byExtension: Record<string, number> = {};

      const formattedAttachments = attachments.map((att: ExactDocumentAttachment) => {
        const attRecord = att as unknown as Record<string, unknown>;
        const fileSize = att.FileSize || 0;
        totalSize += fileSize;

        // Extract extension
        const fileName = att.FileName || '';
        const ext = fileName.split('.').pop()?.toLowerCase() || 'unknown';
        byExtension[ext] = (byExtension[ext] || 0) + 1;

        return {
          id: att.ID,
          document_id: att.Document,
          file_name: fileName,
          file_size: fileSize,
          file_size_readable: this.formatFileSize(fileSize),
          extension: ext,
          download_url: attRecord.Url as string,
        };
      });

      return {
        attachments: formattedAttachments,
        count: formattedAttachments.length,
        summary: {
          total_size: totalSize,
          total_size_readable: this.formatFileSize(totalSize),
          by_extension: Object.entries(byExtension)
            .map(([ext, count]) => ({ extension: ext, count }))
            .sort((a, b) => b.count - a.count),
        },
        filters: { document_id: documentId },
        division,
      };
    } catch (error) {
      return {
        error: `Fout bij ophalen bijlagen: ${(error as Error).message}`,
        division,
      };
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

/**
 * Get Document Content Tool (P23 - Killer Feature)
 *
 * Downloads the actual binary content of a document/attachment from Exact Online.
 * Returns base64 encoded content that AI can process or pass to users.
 *
 * Flow:
 * 1. Fetch attachment metadata to get the download URL
 * 2. Make authenticated request to download binary content
 * 3. Return base64 encoded content
 *
 * @see P23 in operations/ROADMAP.md
 * @see LESSONS-LEARNED.md - "Binary data via Base64 en attachments via link"
 * @see Exact API: .../docs/SysAttachment.aspx?ID=guid requires auth
 */
export class GetDocumentContentTool extends BaseTool {
  definition: ToolDefinition = {
    name: 'get_document_content',
    description:
      'Download de inhoud van een document/bijlage uit Exact Online als base64. ' +
      'Gebruik voor: factuur PDF downloaden, bijlage ophalen. ' +
      'Input: attachment_id (GUID van de bijlage). ' +
      'Output: base64 gecodeerde bestandsinhoud met metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        division: {
          type: 'number',
          description: 'Administratie code (division). Optioneel: gebruikt standaard administratie indien niet opgegeven.',
        },
        attachment_id: {
          type: 'string',
          description: 'De GUID van de bijlage (attachment). Verkrijg deze via get_document_attachments.',
        },
        format: {
          type: 'string',
          enum: ['base64', 'url'],
          description: 'Output formaat: "base64" (default) voor de daadwerkelijke content, of "url" voor alleen de download URL.',
        },
      },
      required: ['attachment_id'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        attachment_id: { type: 'string' },
        file_name: { type: 'string' },
        file_size: { type: 'number' },
        file_size_readable: { type: 'string' },
        content_type: { type: 'string' },
        format: { type: 'string' },
        content: { type: 'string' },
        download_url: { type: 'string' },
        division: { type: 'number' },
      },
      required: ['success', 'attachment_id', 'division'],
    },
    annotations: DEFAULT_TOOL_ANNOTATIONS,
  };

  async run(params: Record<string, unknown>): Promise<unknown> {
    const connection = this.getConnection();
    if (!connection) {
      return { error: 'Geen Exact Online connectie gevonden.', success: false };
    }

    // FEATURE-001: Use default division if not specified
    const division = this.resolveDivision(connection, params.division as number | undefined);
    if (!division) {
      return {
        error: 'Geen administratie opgegeven en geen standaard administratie ingesteld. Gebruik list_divisions om beschikbare administraties te zien.',
        success: false,
      };
    }

    const attachmentId = params.attachment_id as string;
    const format = (params.format as string) || 'base64';

    // Validate attachment ID
    let validatedId: string;
    try {
      validatedId = validateGuid(attachmentId);
    } catch (error) {
      return {
        error: `Ongeldig attachment_id formaat: ${(error as Error).message}`,
        success: false,
        division,
      };
    }

    try {
      // Step 1: Get attachment metadata to get the download URL
      const metadataEndpoint = `/${division}/documents/DocumentAttachments?$select=ID,Document,FileName,FileSize,Url&$filter=${encodeURIComponent(buildGuidFilter('ID', validatedId))}`;
      const metadataResponse = await this.exactRequest<ExactODataResponse<ExactDocumentAttachment>>(connection, metadataEndpoint);
      const attachments = extractODataResults<ExactDocumentAttachment>(metadataResponse?.d as Record<string, unknown>);

      if (attachments.length === 0) {
        return {
          error: `Bijlage met ID "${attachmentId}" niet gevonden.`,
          success: false,
          attachment_id: attachmentId,
          division,
        };
      }

      const attachment = attachments[0];
      const attachmentRecord = attachment as unknown as Record<string, unknown>;
      const downloadUrl = attachmentRecord.Url as string;
      const fileName = attachment.FileName || 'unknown';
      const fileSize = attachment.FileSize || 0;

      // If format is 'url', return just the URL (user can download manually)
      if (format === 'url') {
        return {
          success: true,
          attachment_id: validatedId,
          document_id: attachment.Document,
          file_name: fileName,
          file_size: fileSize,
          file_size_readable: this.formatFileSize(fileSize),
          format: 'url',
          download_url: downloadUrl,
          division,
          note: 'Om de content te downloaden: gebruik de download_url met je Exact Online access token in de Authorization header.',
        };
      }

      // Step 2: Download the binary content
      if (!downloadUrl) {
        return {
          error: 'Geen download URL beschikbaar voor deze bijlage. Dit kan betekenen dat de bijlage niet toegankelijk is.',
          success: false,
          attachment_id: validatedId,
          file_name: fileName,
          division,
        };
      }

      // Make authenticated request to download the binary content
      // The URL from Exact Online is a full URL to their attachment service
      const binaryContent = await this.downloadBinaryContent(connection, downloadUrl);

      if (!binaryContent.success) {
        return {
          error: binaryContent.error,
          success: false,
          attachment_id: validatedId,
          file_name: fileName,
          division,
        };
      }

      // Determine content type from file extension
      const contentType = this.getContentType(fileName);

      return {
        success: true,
        attachment_id: validatedId,
        document_id: attachment.Document,
        file_name: fileName,
        file_size: binaryContent.actualSize || fileSize,
        file_size_readable: this.formatFileSize(binaryContent.actualSize || fileSize),
        content_type: contentType,
        format: 'base64',
        content: binaryContent.base64Content,
        division,
      };
    } catch (error) {
      logger.error('Error downloading document content', error instanceof Error ? error : undefined, {
        attachmentId: validatedId,
        division,
      });

      return {
        error: `Fout bij downloaden document: ${(error as Error).message}`,
        success: false,
        attachment_id: attachmentId,
        division,
      };
    }
  }

  /**
   * Download binary content from Exact Online attachment URL
   * Uses access token for authentication
   */
  private async downloadBinaryContent(
    connection: { accessToken: string; region: string },
    downloadUrl: string
  ): Promise<{ success: boolean; base64Content?: string; actualSize?: number; error?: string }> {
    try {
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
          Accept: '*/*',
        },
      });

      if (!response.ok) {
        // Handle common error cases
        if (response.status === 401) {
          return {
            success: false,
            error: 'Authenticatie verlopen. Probeer opnieuw of herverbind met Exact Online.',
          };
        }
        if (response.status === 403) {
          return {
            success: false,
            error: 'Geen toegang tot dit document. Controleer je rechten in Exact Online.',
          };
        }
        if (response.status === 404) {
          return {
            success: false,
            error: 'Document niet gevonden. Het bestand is mogelijk verwijderd.',
          };
        }
        return {
          success: false,
          error: `Download mislukt met status ${response.status}`,
        };
      }

      // Get the binary content as ArrayBuffer
      const arrayBuffer = await response.arrayBuffer();

      // Convert to base64
      // In Cloudflare Workers, we use btoa with proper byte handling
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64Content = this.arrayBufferToBase64(uint8Array);

      return {
        success: true,
        base64Content,
        actualSize: arrayBuffer.byteLength,
      };
    } catch (error) {
      logger.error('Binary download failed', error instanceof Error ? error : undefined);
      return {
        success: false,
        error: `Download error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Convert Uint8Array to base64 string
   * Works in Cloudflare Workers environment
   */
  private arrayBufferToBase64(uint8Array: Uint8Array): string {
    // Convert to binary string
    let binaryString = '';
    const chunkSize = 8192; // Process in chunks to avoid call stack issues

    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      for (let j = 0; j < chunk.length; j++) {
        binaryString += String.fromCharCode(chunk[j]);
      }
    }

    // Use btoa to convert to base64
    return btoa(binaryString);
  }

  /**
   * Get MIME content type from file extension
   */
  private getContentType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    const mimeTypes: Record<string, string> = {
      // Documents
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      odt: 'application/vnd.oasis.opendocument.text',
      ods: 'application/vnd.oasis.opendocument.spreadsheet',
      txt: 'text/plain',
      csv: 'text/csv',
      rtf: 'application/rtf',

      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      bmp: 'image/bmp',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      tiff: 'image/tiff',
      tif: 'image/tiff',

      // Archives
      zip: 'application/zip',
      rar: 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',

      // Other
      xml: 'application/xml',
      json: 'application/json',
      html: 'text/html',
      htm: 'text/html',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export all document tools
export const documentTools = [
  GetDocumentAttachmentsTool,
  GetDocumentContentTool,
];
