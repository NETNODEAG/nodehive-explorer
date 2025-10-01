import React, { useState, useEffect, useRef } from 'react';
import { NodeHiveClient } from 'nodehive-js';
import Sidebar from './components/Sidebar';
import ConnectionConfig from './components/ConnectionConfig';
import EntityExplorer from './components/EntityExplorer';
import RequestPanel from './components/RequestPanel';
import DataViewer from './components/DataViewer';
import { User, Key, LogOut, ChevronDown, ExternalLink, Wifi, WifiOff, Shield } from 'lucide-react';
import clsx from 'clsx';
import useConnectionStore from './store/connectionStore';

function App() {
  const { config, setConfig, updateConfig } = useConnectionStore();
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState('nodes');
  const [requestInfo, setRequestInfo] = useState(null);
  const [responseData, setResponseData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showConnectionConfig, setShowConnectionConfig] = useState(false);
  const userMenuRef = useRef(null);

  // Check for baseUrl in URL parameters on mount and auto-connect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const baseUrlParam = params.get('baseurl') || params.get('baseUrl');

    if (baseUrlParam) {
      // Ensure it has protocol
      let fullUrl = baseUrlParam;
      if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
        fullUrl = `https://${fullUrl}`;
      }

      updateConfig({ baseUrl: fullUrl });

      // Auto-connect with the provided baseUrl
      const autoConnectConfig = {
        ...config,
        baseUrl: fullUrl
      };
      handleConnect(autoConnectConfig);
    }
  }, []); // Empty dependency array to run only once on mount

  // Click outside handler for user menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleConnect = async (config) => {
    try {
      setIsLoading(true);
      setError(null);

      // Update the global store with the current config
      setConfig(config);

      const newClient = new NodeHiveClient({
        baseUrl: config.baseUrl,
        debug: config.debug,
        timeout: config.timeout,
        defaultLanguage: config.language || undefined,
        retry: {
          enabled: config.retryEnabled,
          maxAttempts: config.retryAttempts,
          delay: 1000
        },
        auth: config.authToken ? { token: config.authToken } : undefined
      });

      // Add interceptors
      newClient.addRequestInterceptor((config, context) => {
        setRequestInfo({
          method: 'GET',
          url: context.url,
          headers: config.headers,
          timestamp: new Date().toISOString()
        });
        return config;
      });

      newClient.addResponseInterceptor((data, context) => {
        setRequestInfo(prev => ({
          ...prev,
          status: context.response?.status,
          statusText: context.response?.statusText,
          duration: Date.now() - new Date(prev?.timestamp).getTime()
        }));
        return data;
      });

      // Handle authentication if credentials provided
      if (config.useAuth && config.username && config.password) {
        try {
          const loginResult = await newClient.login(config.username, config.password);
          if (loginResult.token) {
            setAuthToken(loginResult.token);
            const userDetails = await newClient.getUserDetails();
            setUserInfo(userDetails);
          }
        } catch (authError) {
          console.error('Authentication failed:', authError);
          // Continue with connection even if auth fails
        }
      } else if (config.authToken) {
        // If token provided directly, store it
        setAuthToken(config.authToken);
        try {
          const userDetails = await newClient.getUserDetails();
          setUserInfo(userDetails);
        } catch (e) {
          // Token might be invalid or getUserDetails not available
        }
      }

      // Test connection
      await newClient.getContentTypes();

      setClient(newClient);
      setIsConnected(true);
    } catch (err) {
      setError(err.message);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (client && userInfo) {
      try {
        await client.logout();
      } catch (e) {
        // Ignore logout errors
      }
    }
    setClient(null);
    setIsConnected(false);
    setRequestInfo(null);
    setResponseData(null);
    setUserInfo(null);
    setAuthToken(null);
    setShowUserMenu(false);
  };

  const handleDataFetch = (data) => {
    setResponseData(data);
  };

  const handleLoadPagination = async (url) => {
    if (!client || !url) return;

    try {
      setIsLoading(true);
      setError(null);

      // Extract path from full URL (API returns absolute URLs)
      const urlObj = new URL(url);
      const pathWithQuery = urlObj.pathname + urlObj.search;

      const response = await client.request(pathWithQuery);
      setResponseData(response);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-screen h-screen bg-background">
      <Sidebar
        selectedEntity={selectedEntity}
        onSelectEntity={setSelectedEntity}
        isConnected={isConnected}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
          <h1 className="flex items-center gap-3 text-xl font-semibold">
            NodeHive API Explorer
            <a
              href="https://www.nodehive.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-normal text-muted-foreground hover:text-primary transition-colors ml-2 px-2 py-1 rounded-md hover:bg-secondary"
            >
              www.nodehive.com
              <ExternalLink size={12} />
            </a>
          </h1>
          <div className="flex items-center gap-4">
            {/* User Info or Anonymous Indicator */}
            {isConnected && userInfo && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-secondary transition-colors"
                >
                  <User size={16} />
                  <span className="text-sm">{userInfo.name?.[0]?.value || userInfo.name || userInfo.display_name?.[0]?.value || userInfo.display_name || userInfo.mail?.[0]?.value || userInfo.mail || 'User'}</span>
                  <ChevronDown size={14} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-card rounded-lg border border-border shadow-lg p-4 z-50">
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                          <User size={12} />
                          User Information
                        </div>
                        <div className="text-sm">
                          <p><span className="text-muted-foreground">Name:</span> {userInfo.name?.[0]?.value || userInfo.name || userInfo.display_name?.[0]?.value || userInfo.display_name || 'N/A'}</p>
                          <p><span className="text-muted-foreground">Email:</span> {userInfo.mail?.[0]?.value || userInfo.mail || 'N/A'}</p>
                          <p><span className="text-muted-foreground">Roles:</span> {Array.isArray(userInfo.roles) ? userInfo.roles.map(role => role.target_id || role).join(', ') : 'N/A'}</p>
                        </div>
                      </div>

                      {authToken && (
                        <div>
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                            <Key size={12} />
                            JWT Token
                          </div>
                          <div className="bg-secondary p-2 rounded text-xs font-mono break-all">
                            {authToken.substring(0, 50)}...
                          </div>
                          <button
                            onClick={() => navigator.clipboard.writeText(authToken)}
                            className="btn btn-ghost btn-sm mt-2 w-full"
                          >
                            Copy Full Token
                          </button>
                        </div>
                      )}

                      <button
                        onClick={handleDisconnect}
                        className="btn btn-destructive btn-sm w-full"
                      >
                        <LogOut size={14} className="mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Anonymous Connection Indicator */}
            {isConnected && !userInfo && !authToken && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted border border-border">
                <Shield size={16} className="text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Anonymous</span>
                <button
                  onClick={() => setShowConnectionConfig(true)}
                  className="text-xs text-primary hover:text-primary/80 underline ml-1"
                >
                  Login
                </button>
              </div>
            )}

            {/* Connection Status Indicator */}
            <button
              onClick={() => setShowConnectionConfig(true)}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-md transition-all hover:scale-105',
                isConnected
                  ? 'bg-card border border-border hover:border-primary/50'
                  : 'bg-card border border-destructive/50 hover:border-destructive'
              )}
            >
              <div className={clsx(
                'w-2 h-2 rounded-full',
                isConnected ? 'bg-primary animate-pulse' : 'bg-destructive'
              )} />
              {isConnected ? (
                <Wifi size={14} className="text-primary" />
              ) : (
                <WifiOff size={14} className="text-destructive" />
              )}
              <div className="flex flex-col items-end">
                <span className="text-xs font-medium text-foreground">Backend connection</span>
                {isConnected && config.baseUrl && (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {config.baseUrl.replace(/^https?:\/\//, '')}
                  </span>
                )}
              </div>
            </button>

            <ConnectionConfig
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              isConnected={isConnected}
              isLoading={isLoading}
              externalIsOpen={showConnectionConfig}
              externalSetIsOpen={setShowConnectionConfig}
            />
          </div>
        </header>

        {error && (
          <div className="flex items-center justify-between px-6 py-3 bg-destructive/10 border-b border-destructive/20 text-destructive animate-slide-in">
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-destructive hover:text-destructive/80 text-lg leading-none"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* Form Column */}
          <div className="w-[400px] border-r border-border flex flex-col">
            <EntityExplorer
              entity={selectedEntity}
              client={client}
              isConnected={isConnected}
              onDataFetch={handleDataFetch}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              setError={setError}
              userInfo={userInfo}
            />
          </div>

          {/* Request/Response Column */}
          <div className="w-[400px] border-r border-border flex flex-col">
            <RequestPanel requestInfo={requestInfo} />
          </div>

          {/* Data Viewer Column */}
          <div className="flex-1 flex flex-col min-w-[400px]">
            <DataViewer
              data={responseData}
              onLoadPagination={handleLoadPagination}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;