import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#ffebee', color: '#b71c1c', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h2>Algo deu errado. (Tela Branca Evitada)</h2>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem', background: 'white', padding: '1rem', border: '1px solid #ef5350' }}>
            <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>Ver Detalhes do Erro</summary>
            <br />
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
