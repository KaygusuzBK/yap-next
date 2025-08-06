export { EmailAuthProvider } from './email';
export { GoogleAuthProvider } from './google';
export { GitHubAuthProvider } from './github';
export { MicrosoftAuthProvider } from './microsoft';

export type AuthProviderType = 'email' | 'google' | 'github' | 'microsoft';

export interface IAuthProvider {
  signIn(credentials?: any): Promise<any>;
  signUp(userData?: any): Promise<any>;
  handleCallback?(): Promise<any>;
} 