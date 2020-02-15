import axios from 'axios';
import { Request } from 'express';

async function authorizeChat(
  req: Request,
  jobID: number,
  freelancerID: number
) {
  const reqUrl = process.env.BACKEND_BASE_URL + '/chats';
  const requestBody = {
    chat: {
      job_id: jobID,
      freelancer_id: freelancerID
    }
  };
  const reqHeaders = { Authorization: req.get('Authorization') };

  try {
    const response = await axios.post(reqUrl, requestBody, {
      headers: reqHeaders
    });
    return response;
  } catch (error) {
    return error;
  }
}

export { authorizeChat };
