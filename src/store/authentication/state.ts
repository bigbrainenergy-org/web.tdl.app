export interface AuthenticationStateInterface {
  sessionToken: string;
  userId: number;
}

function state(): AuthenticationStateInterface {
  return {
    sessionToken: '',
    userId: 0,
  }
};

export default state;
