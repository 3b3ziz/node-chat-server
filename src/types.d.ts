interface DecodedToken {
  user_id: number;
  type: 'Freelancer' | 'Client' | 'Admin';
  first_name: string;
  last_name: string;
  activated?: boolean;
  exp: number;
}

declare namespace Express {
  export interface Request {
    decodedToken?: DecodedToken;
  }
}
