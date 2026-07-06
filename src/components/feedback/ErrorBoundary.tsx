import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from '../primitives/Text';
import { Pressable } from '../primitives/Pressable';
import { AlertTriangle } from 'lucide-react-native';
import { Theme } from '../../constants/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="flex-1 items-center justify-center bg-[var(--color-background)] p-6">
          <View className="w-20 h-20 rounded-full bg-[var(--color-danger-soft)] items-center justify-center mb-6">
            <AlertTriangle size={40} color={Theme.colors.danger} />
          </View>
          <Text variant="screenTitle" className="mb-2 text-center">Something went wrong</Text>
          <Text variant="body" color="muted" className="text-center mb-8">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </Text>
          <Pressable 
            onPress={this.handleRetry}
            className="bg-[var(--color-primary)] py-4 px-8 rounded-full"
            haptic="medium"
          >
            <Text variant="button" color="inverse">Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
