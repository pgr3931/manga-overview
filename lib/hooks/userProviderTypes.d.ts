import { User } from 'firebase/auth';
import { AniListUser } from '../../apollo/queries/userQuery';

export interface IUserContext {
  fullyAuthenticated: boolean | 'loading';
  aniListUser: AniListUser | null;
  firebaseUser: User | null;
  signOut: () => void;
}
