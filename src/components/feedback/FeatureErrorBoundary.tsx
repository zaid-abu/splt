import React from "react"
import { View, Text, Pressable } from "react-native"
import { AlertTriangle } from "lucide-react-native"

interface Props {
  children: React.ReactNode
  featureName: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class FeatureErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[${this.props.featureName}] Error:`, error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-canvas items-center justify-center p-8">
          <AlertTriangle size={48} color="#E85D5D" />
          <Text className="font-sora-semibold text-lg text-ink mt-4 text-center">
            Something went wrong in {this.props.featureName}
          </Text>
          <Text className="font-ibmplexsans text-sm text-muted mt-2 text-center">
            {this.state.error?.message ?? "An unexpected error occurred"}
          </Text>
          <Pressable
            onPress={this.handleRetry}
            className="mt-6 bg-ink px-8 py-3 rounded-full"
            accessibilityLabel="Try again"
            accessibilityRole="button"
          >
            <Text className="font-ibmplexsans-semibold text-base text-white">Try again</Text>
          </Pressable>
        </View>
      )
    }
    return this.props.children
  }
}
