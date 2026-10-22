import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ProfileView } from '../../components/ProfileView';
import { Button } from '../../components/ui';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { confirm, errorMessage, notify } from '../../lib/notify';

export default function Me() {
  const { me, signOut } = useAuth();
  if (!me) return null;

  const deleteAccount = async () => {
    if (!(await confirm('Delete account?', 'This permanently removes your profile, photos and messages.', 'Delete'))) return;
    try {
      await api.deleteMe();
      await signOut();
    } catch (e) {
      notify('Could not delete account', errorMessage(e));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <ProfileView profile={me} isSelf />
      <View style={styles.actions}>
        <Button title="Edit profile & photos" onPress={() => router.push('/edit-profile')} />
        <Button title="Sign out" variant="secondary" onPress={signOut} />
        <Button title="Delete account" variant="danger" onPress={deleteAccount} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: 40, width: '100%', maxWidth: 640, alignSelf: 'center' },
  actions: { padding: 16, gap: 10 },
});
