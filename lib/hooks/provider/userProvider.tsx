import { useApolloClient, useQuery } from '@apollo/client';
import { useLocalStorage } from '@mantine/hooks';
import { useNotifications } from '@mantine/notifications';
import axios from 'axios';
import { signInWithCustomToken, Unsubscribe } from 'firebase/auth';
import { useRouter } from 'next/router';
import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState
} from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import useSWR from 'swr';
import userQuery, { UserQueryData } from '../../../apollo/queries/userQuery';
import { getUserData } from '../../firebase/db';
import { auth } from '../../firebase/firebase';
import useNotification from '../useNotification';
import { IUserContext, IUserData } from './userProviderTypes';

const fetcher = async (url: string, uid: string) =>
  await axios.get<string>(url, { params: { uid } }).then(res => res.data);

const UserContext = createContext<IUserContext>({
  fullyAuthenticated: false,
  aniListUser: null,
  firebaseUser: null,
  userData: null,
  signOut: () => {}
});

export const useUser = () => useContext(UserContext);

const UserProvider: React.FC<PropsWithChildren<unknown>> = ({ children }) => {
  const { showError } = useNotification();
  const { cleanQueue, showNotification } = useNotifications();
  const apolloClient = useApolloClient();
  const { pathname } = useRouter();
  const [user, firebaseLoading, firebaseError] = useAuthState(auth);
  const [userData, setUserData] = useState<IUserData | null>(null);
  const [hasError, setHasError] = useState<unknown>();
  const [accessToken, setAccessToken] = useLocalStorage<string>({
    key: 'access_token',
    defaultValue: undefined,
    getInitialValueInEffect: true
  });

  const { data, error, loading } = useQuery<UserQueryData>(userQuery, {
    skip: !accessToken
  });

  const { data: authData } = useSWR(
    data?.Viewer && !user && pathname.includes('signin')
      ? ['/api/auth', data.Viewer.id]
      : null,
    fetcher
  );

  useEffect(() => {
    if (authData) {
      signInWithCustomToken(auth, authData);
    }
  }, [authData]);

  useEffect(() => {
    let unsubscribe: Unsubscribe | void;
    if (user) {
      try {
        unsubscribe = getUserData(user.uid, setUserData);
      } catch (error) {
        setHasError(error);
        console.log(error);
      }
    } else {
      setUserData(null);
    }

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (error || firebaseError || hasError) showError();
  }, [error, firebaseError, hasError]);

  const fullyAuthenticated =
    loading || firebaseLoading ? 'loading' : !!user && !!data?.Viewer;

  return (
    <UserContext.Provider
      value={{
        fullyAuthenticated,
        aniListUser: data?.Viewer ?? null,
        firebaseUser: user ?? null,
        userData,
        signOut: async () => {
          setAccessToken('');
          await auth.signOut();
          await apolloClient.resetStore();
          cleanQueue();
          showNotification({
            title:
              'Remember to revoke the access token from your Apps page on AniList',
            message: '',
            autoClose: 10000
          });
        }
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;