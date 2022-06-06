import { useMutation } from '@apollo/client';
import { useEffect, useState } from 'react';
import updateMangaEntry, {
  UpdateMangaEntryData,
  UpdateMangaEntryVariables
} from '../../apollo/mutations/updateMangaEntry';
import { MediaList } from '../../apollo/queries/mediaQuery';
import { IAniListValues } from '../types/aniList';
import useNotification from './useNotification';

export const useAniListUpdate = (entry: MediaList) => {
  const [aniListData, setAniListData] = useState<MediaList>(entry);
  const { showSuccess, showError } = useNotification();

  const [updateEntry, { error }] = useMutation<
    UpdateMangaEntryData,
    UpdateMangaEntryVariables
  >(updateMangaEntry);

  useEffect(() => {
    if (error) showError();
  }, [error]);

  const updateAniListData = async (values: IAniListValues) => {
    Object.keys(values).forEach(key => {
      if (values[key as keyof typeof values] === undefined)
        delete values[key as keyof typeof values];
    });

    if (!Object.keys(values).length) return;

    const { data } = await updateEntry({
      variables: { ...values, mediaId: entry.mediaId }
    });

    if (!data) return;

    setAniListData(prev => ({ ...prev, ...data.SaveMediaListEntry }));
  };

  const updateProgress = async (progress: number, key: keyof MediaList) => {
    if (progress === aniListData[key]) return;
    await updateAniListData({ [key]: progress });
    showSuccess(`${entry.media.title.userPreferred} entry updated`);
  };

  return { aniListData, updateAniListData, updateProgress };
};

export default useAniListUpdate;