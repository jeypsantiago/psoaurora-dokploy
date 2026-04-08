import axios from 'axios';

const GMAIL_API_BASE = 'https://www.googleapis.com/gmail/v1/users/me';

export interface EmailMessage {
    id: string;
    threadId: string;
    snippet: string;
    subject: string;
    from: string;
    date: string;
    body: string;
    attachments: Attachment[];
}

export interface Attachment {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
}

export const gmailService = {
    async listMessages(accessToken: string, query: string = '') {
        const response = await axios.get(`${GMAIL_API_BASE}/messages`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { q: query, maxResults: 10 }
        });
        return response.data.messages || [];
    },

    async getMessage(accessToken: string, messageId: string): Promise<EmailMessage> {
        const response = await axios.get(`${GMAIL_API_BASE}/messages/${messageId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const payload = response.data.payload;
        const headers = payload.headers;

        const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
        const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
        const date = headers.find((h: any) => h.name === 'Date')?.value || '';

        let body = '';
        const attachments: Attachment[] = [];

        const parsePart = (part: any) => {
            if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
                if (part.body.data) {
                    body = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
                }
            }

            if (part.filename && part.body.attachmentId) {
                attachments.push({
                    id: part.body.attachmentId,
                    filename: part.filename,
                    mimeType: part.mimeType,
                    size: part.body.size
                });
            }

            if (part.parts) {
                part.parts.forEach(parsePart);
            }
        };

        parsePart(payload);

        return {
            id: response.data.id,
            threadId: response.data.threadId,
            snippet: response.data.snippet,
            subject,
            from,
            date,
            body,
            attachments
        };
    },

    async getAttachment(accessToken: string, messageId: string, attachmentId: string) {
        const response = await axios.get(`${GMAIL_API_BASE}/messages/${messageId}/attachments/${attachmentId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        return response.data.data; // Base64 encoded
    }
};
