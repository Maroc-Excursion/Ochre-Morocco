import React, { Component, ComponentType, PropsWithChildren } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { reloadAppAsync } from 'expo';

export type ErrorFallbackProps = { error: Error; resetError: () => void };

function ErrorFallback({ resetError }: ErrorFallbackProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Pressable onPress={async () => { try { await reloadAppAsync(); } catch { resetError(); } }} style={styles.button}>
        <Text style={styles.buttonText}>Try Again</Text>
      </Pressable>
    </View>
  );
}

type State = { error: Error | null };

export class ErrorBoundary extends Component<PropsWithChildren<{ onError?: (e: Error, s: string) => void; FallbackComponent?: ComponentType<ErrorFallbackProps> }>, State> {
  state: State = { error: null };
  static defaultProps = { FallbackComponent: ErrorFallback };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: { componentStack: string }) { this.props.onError?.(error, info.componentStack); }
  resetError = () => this.setState({ error: null });
  render() {
    const { FallbackComponent } = this.props;
    return this.state.error && FallbackComponent
      ? <FallbackComponent error={this.state.error} resetError={this.resetError} />
      : this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#FDF8F2' },
  title: { fontSize: 20, fontWeight: '600', color: '#1a0f00', marginBottom: 16 },
  button: { backgroundColor: '#B8621A', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
