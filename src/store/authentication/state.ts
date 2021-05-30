export interface AuthenticationStateInterface {
  sessionToken: string;
}

function state(): AuthenticationStateInterface {
  return {
    sessionToken: ''
  }
};

export default state;
