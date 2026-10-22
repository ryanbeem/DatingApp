import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Chip, Field } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { errorMessage } from '../../lib/notify';
import { colors } from '../../lib/theme';
import type { Role } from '../../lib/types';

export default function Register() {
  const params = useLocalSearchParams<{ role?: string }>();
  const { register } = useAuth();
  const [role, setRole] = useState<Role>(params.role === 'worker' ? 'worker' : 'seeker');
  const [firstName, setFirstName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await register({ role, first_name: firstName.trim(), birthdate: birthdate.trim(), email: email.trim(), password });
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>I am</Text>
        <View style={styles.row}>
          <Chip label="Looking for a tradesman" selected={role === 'seeker'} onPress={() => setRole('seeker')} />
          <Chip label="A tradesman" selected={role === 'worker'} onPress={() => setRole('worker')} />
        </View>
        <Field label="First name" value={firstName} onChangeText={setFirstName} autoComplete="given-name" />
        <Field label="Birthday" value={birthdate} onChangeText={setBirthdate} placeholder="YYYY-MM-DD" hint="You must be 18 or older. Only your age is shown." keyboardType="numbers-and-punctuation" />
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry hint="At least 8 characters" autoComplete="new-password" />
        <Chip label={agreed ? '✓ I am 18+ and agree to be respectful' : 'I am 18+ and agree to be respectful'} selected={agreed} onPress={() => setAgreed(!agreed)} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Create account" onPress={submit} loading={busy} disabled={!agreed || !firstName || !birthdate || !email || password.length < 8} style={{ marginTop: 8 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  form: { padding: 20, width: '100%', maxWidth: 480, alignSelf: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: colors.navy, marginBottom: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  error: { color: colors.pass, marginVertical: 8 },
});
