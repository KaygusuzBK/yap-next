import { EmailAuthProvider } from './providers/email';
import { GoogleAuthProvider } from './providers/google';
import { GitHubAuthProvider } from './providers/github';
import { MicrosoftAuthProvider } from './providers/microsoft';
import { AuthProviderType, IAuthProvider } from './providers';

class AuthFactory {
  private static providers: Map<AuthProviderType, IAuthProvider> = new Map();

  static getProvider(type: AuthProviderType): IAuthProvider {
    if (!this.providers.has(type)) {
      switch (type) {
        case 'email':
          this.providers.set(type, new EmailAuthProvider());
          break;
        case 'google':
          this.providers.set(type, new GoogleAuthProvider());
          break;
        case 'github':
          this.providers.set(type, new GitHubAuthProvider());
          break;
        case 'microsoft':
          this.providers.set(type, new MicrosoftAuthProvider());
          break;
        default:
          throw new Error(`Desteklenmeyen auth provider: ${type}`);
      }
    }

    return this.providers.get(type)!;
  }

  static clearProviders(): void {
    this.providers.clear();
  }

  static getAvailableProviders(): AuthProviderType[] {
    return ['email', 'google', 'github', 'microsoft'];
  }
}

export { AuthFactory }; 