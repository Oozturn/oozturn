import express from 'express';


export const config = {
  api: { externalResolver: true }
}

const handler = express();

const serveFiles = express.static('./uploads');
handler.use(['/api/static', '/static'], serveFiles);

export default handler;