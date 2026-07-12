import React from "react"
import { FeatureErrorBoundary } from "./FeatureErrorBoundary"

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  featureName: string
) {
  return function WrappedComponent(props: P) {
    return (
      <FeatureErrorBoundary featureName={featureName}>
        <Component {...props} />
      </FeatureErrorBoundary>
    )
  }
}
