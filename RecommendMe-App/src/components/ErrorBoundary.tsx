import React, { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error in React tree:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="w-full max-w-md space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center">
                <AlertCircle size={32} />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Something went wrong</h1>
              <p className="text-muted-foreground text-sm">
                An unexpected error occurred in the application. Don't worry, your data is safe.
              </p>
            </div>

            {/* In a real app we might only show this in development */}
            {this.state.error && (
              <div className="p-4 bg-muted/50 rounded-lg text-left overflow-auto max-h-48 border border-border/50">
                <pre className="text-[11px] font-mono text-muted-foreground break-all whitespace-pre-wrap">
                  {this.state.error.message}
                </pre>
              </div>
            )}

            <Button 
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }} 
              className="w-full"
              size="lg"
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
