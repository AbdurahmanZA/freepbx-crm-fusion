
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FreePBXRestAPI, type FreePBXConfig } from '@/services/freepbxRestAPI';
import { WebRTCService, type WebRTCConfig } from '@/services/webrtcService';

interface FreePBXContextType {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  config: FreePBXConfig;
  updateConfig: (newConfig: FreePBXConfig) => void;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  originateCall: (channel: string, extension: string, context?: string) => Promise<boolean>;
  hangupCall: () => Promise<boolean>;
  getActiveChannels: () => Promise<any[]>;
  getCDR: (limit?: number) => Promise<any[]>;
  currentCall: any;
  callStatus: 'idle' | 'connecting' | 'connected' | 'ended';
}

const FreePBXContext = createContext<FreePBXContextType | undefined>(undefined);

export const useFreePBX = () => {
  const context = useContext(FreePBXContext);
  if (!context) {
    throw new Error('useFreePBX must be used within a FreePBXProvider');
  }
  return context;
};

interface FreePBXProviderProps {
  children: ReactNode;
}

export const FreePBXProvider: React.FC<FreePBXProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'ended'>('idle');
  
  const [config, setConfig] = useState<FreePBXConfig>({
    host: '192.168.0.5',
    username: 'admin',
    password: 'amp111',
    useHttps: false,
  });

  const [restAPI, setRestAPI] = useState<FreePBXRestAPI | null>(null);
  const [webrtcService, setWebRTCService] = useState<WebRTCService | null>(null);

  // Initialize services when config changes
  useEffect(() => {
    const newRestAPI = new FreePBXRestAPI(config);
    setRestAPI(newRestAPI);

    const webrtcConfig: WebRTCConfig = {
      wsUrl: `ws://${config.host}:8088/ws`,
      stunServers: ['stun:stun.l.google.com:19302'],
      username: config.username,
      password: config.password,
    };
    
    const newWebRTCService = new WebRTCService(webrtcConfig);
    
    // Set up WebRTC event handlers
    newWebRTCService.on('connected', () => {
      console.log('WebRTC connected');
      setIsConnected(true);
      setConnectionError(null);
    });

    newWebRTCService.on('disconnected', () => {
      console.log('WebRTC disconnected');
      setIsConnected(false);
    });

    newWebRTCService.on('call_initiated', (data: any) => {
      setCurrentCall(data);
      setCallStatus('connecting');
    });

    newWebRTCService.on('call_connected', (sessionId: string) => {
      setCallStatus('connected');
    });

    newWebRTCService.on('call_ended', (sessionId: string) => {
      setCallStatus('ended');
      setTimeout(() => {
        setCurrentCall(null);
        setCallStatus('idle');
      }, 2000);
    });

    newWebRTCService.on('call_error', (error: any) => {
      console.error('WebRTC call error:', error);
      setConnectionError(`Call error: ${error.message || error}`);
      setCallStatus('ended');
    });

    setWebRTCService(newWebRTCService);
  }, [config]);

  const updateConfig = (newConfig: FreePBXConfig) => {
    setConfig(newConfig);
  };

  const connect = async (): Promise<boolean> => {
    if (isConnecting || isConnected) return false;
    
    setIsConnecting(true);
    setConnectionError(null);

    try {
      if (webrtcService) {
        const success = await webrtcService.connect();
        if (success) {
          console.log('FreePBX connection established successfully');
          return true;
        } else {
          throw new Error('Failed to connect to FreePBX WebRTC service');
        }
      }
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      setConnectionError(errorMessage);
      console.error('FreePBX connection error:', errorMessage);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async (): Promise<boolean> => {
    try {
      if (webrtcService) {
        webrtcService.disconnect();
      }
      setIsConnected(false);
      setConnectionError(null);
      setCurrentCall(null);
      setCallStatus('idle');
      console.log('Disconnected from FreePBX');
      return true;
    } catch (error) {
      console.error('Disconnect error:', error);
      return false;
    }
  };

  const originateCall = async (
    channel: string, 
    extension: string, 
    context = 'from-internal'
  ): Promise<boolean> => {
    try {
      console.log('Originating call via FreePBX REST API + WebRTC:', {
        channel,
        extension,
        context
      });

      // Use WebRTC for browser-based calling
      if (webrtcService) {
        return await webrtcService.initiateCall(extension);
      }
      
      return false;
    } catch (error) {
      console.error('Originate call error:', error);
      return false;
    }
  };

  const hangupCall = async (): Promise<boolean> => {
    if (webrtcService) {
      return await webrtcService.hangupCall();
    }
    return false;
  };

  const getActiveChannels = async (): Promise<any[]> => {
    if (restAPI) {
      return await restAPI.getActiveChannels();
    }
    return [];
  };

  const getCDR = async (limit: number = 50): Promise<any[]> => {
    if (restAPI) {
      return await restAPI.getCDR(limit);
    }
    return [];
  };

  const contextValue: FreePBXContextType = {
    isConnected,
    isConnecting,
    connectionError,
    config,
    updateConfig,
    connect,
    disconnect,
    originateCall,
    hangupCall,
    getActiveChannels,
    getCDR,
    currentCall,
    callStatus
  };

  return (
    <FreePBXContext.Provider value={contextValue}>
      {children}
    </FreePBXContext.Provider>
  );
};
