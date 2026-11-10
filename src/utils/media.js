import { Alert } from 'react-native';

// Photo/video pickers need native libraries that are not part of this build yet.
const notAvailable = () => {
  Alert.alert('Not available yet', 'Photo and video attachments are not enabled in this build.');
  return Promise.resolve(null);
};
export const pickImage = notAvailable;
export const pickVideo = notAvailable;
