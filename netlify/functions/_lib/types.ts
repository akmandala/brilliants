export type Handler = (event: { body: string | null }) => Promise<{ statusCode: number; body: string }>;
