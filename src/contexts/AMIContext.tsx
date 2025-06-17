
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { amiBridgeClient } from '@/services/amiBridgeClient';

interface AMIConfig {
  host: string;
  port: string;
  username: string;
  password: string;
}

interface AMIEvent {
  event: string;
  [key: string]: string | undefined;
}

interface PendingCall {
  leadName: string;
  phone: string;
  leadId: number;
}

interface AMIContextType {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  lastEvent: AMIEvent | null;
  callEvents: AMIEvent[];
  config: AMIConfig;
  pendingCall: PendingCall | null;
  userExtension: string;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  updateConfig: (newConfig: AMIConfig) => void;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  originateCall: (channel: string, extension: string, context?: string, callerID?: string) => Promise<boolean>;
  initiateCallFromLead: (leadName: string, phone: string, leadId: number) => void;
  clearPendingCall: () => void;
  resetReconnectAttempts: () => void;
}

const AMIContext = createContext<AMIContextType | undefined>(undefined);

export const useAMIContext = () => {
  const context = useContext(AMIContext);
  if (!context) {
    throw new Error('useAMIContext must be used within an AMIProvider');
  }
  return context;
};

interface AMIProviderProps {
  children: ReactNode;
}

export const AMIProvider: React.FC<AMIProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<AMIEvent | null>(null);
  const [callEvents, setCallEvents] = useState<AMIEvent[]>([]);
  const [pendingCall, setPendingCall] = useState<PendingCall | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [reconnectTimeout, setReconnectTimeout] = useState<NodeJS.Timeout | null>(null);
  const [lastConnectionAttempt, setLastConnectionAttempt] = useState<number>(0);
  
  const maxReconnectAttempts = 10; // Increased from 5
  
  const [config, setConfig] = useState<AMIConfig>({
    host: '192.168.0.5',
    port: '5038',
    username: 'admin',
    password: 'amp111'
  });

  const userExtension = localStorage.getItem('user_extension') || '1000';

  // Monitor user login status with improved detection
  useEffect(() => {
    const checkLoginStatus = () => {
      const user = localStorage.getItem('crm_user');
      const isLoggedIn = !!user;
      
      if (isLoggedIn !== isUserLoggedIn) {
        console.log(`[AMI Context] Login status changed: ${isLoggedIn}`);
        setIsUserLoggedIn(isLoggedIn);
        
        if (!isLoggedIn) {
          console.log('[AMI Context] User logged out, disconnecting AMI');
          disconnect();
        } else if (isLoggedIn && !isConnected && !isConnecting) {
          console.log('[AMI Context] User logged in, auto-connecting AMI');
          // Small delay to ensure UI is ready
          setTimeout(() => connect(), 1000);
        }
      }
    };

    checkLoginStatus();
    const interval = setInterval(checkLoginStatus, 2000);
    
    return () => clearInterval(interval);
  }, [isUserLoggedIn, isConnected, isConnecting]);

  // Improved auto-reconnect logic
  const scheduleReconnect = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      setReconnectTimeout(null);
    }

    if (reconnectAttempts >= maxReconnectAttempts) {
      console.log(`[AMI Context] Max reconnection attempts (${maxReconnectAttempts}) reached`);
      setConnectionError(`Failed to reconnect after ${maxReconnectAttempts} attempts. Please check AMI Bridge server.`);
      return;
    }

    if (!isUserLoggedIn) {
      console.log('[AMI Context] User not logged in, skipping reconnect');
      return;
    }

    // Prevent too frequent connection attempts
    const timeSinceLastAttempt = Date.now() - lastConnectionAttempt;
    if (timeSinceLastAttempt < 5000) {
      console.log('[AMI Context] Too soon since last attempt, delaying reconnect');
    }

    const delay = Math.min(2000 * Math.pow(1.5, reconnectAttempts), 30000); // Improved backoff
    console.log(`[AMI Context] Scheduling reconnect attempt ${reconnectAttempts + 1}/${maxReconnectAttempts} in ${delay}ms`);
    
    const timeout = setTimeout(async () => {
      if (isUserLoggedIn && !isConnected && !isConnecting) {
        setReconnectAttempts(prev => prev + 1);
        setLastConnectionAttempt(Date.now());
        const success = await connect();
        if (!success) {
          scheduleReconnect();
        }
      }
    }, delay);
    
    setReconnectTimeout(timeout);
  };

  useEffect(() => {
    const handleEvent = (event: AMIEvent) => {
      setLastEvent(event);
      
      if (event.event && ['Newchannel', 'Hangup', 'DialBegin', 'DialEnd', 'Bridge'].includes(event.event)) {
        setCallEvents(prev => [event, ...prev.slice(0, 9)]);
      }
    };

    const handleStatusChange = (connected: boolean) => {
      console.log(`[AMI Context] Bridge status change: ${connected}`);
      
      if (connected && !isConnected) {
        setIsConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          setReconnectTimeout(null);
        }
        console.log('[AMI Context] Successfully connected to AMI Bridge');
      } else if (!connected && isConnected && isUserLoggedIn) {
        setIsConnected(false);
        setConnectionError('AMI Bridge connection lost');
        console.log('[AMI Context] Connection lost, scheduling reconnect');
        scheduleReconnect();
      }
    };

    amiBridgeClient.onEvent(handleEvent);
    amiBridgeClient.onStatusChange(handleStatusChange);

    return () => {
      amiBridgeClient.removeEventListener(handleEvent);
      amiBridgeClient.removeStatusListener(handleStatusChange);
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [isConnected, isUserLoggedIn, reconnectAttempts, reconnectTimeout]);

  const updateConfig = (newConfig: AMIConfig) => {
    setConfig(newConfig);
  };

  const connect = async (): Promise<boolean> => {
    if (!isUserLoggedIn) {
      console.log('[AMI Context] Cannot connect - user not logged in');
      return false;
    }

    if (isConnecting) {
      console.log('[AMI Context] Connection already in progress');
      return false;
    }

    setIsConnecting(true);
    setConnectionError(null);
    setLastConnectionAttempt(Date.now());
    
    try {
      console.log('[AMI Context] Connecting to AMI Bridge:', {
        serverUrl: 'http://192.168.0.5:3001',
        amiHost: config.host,
        amiPort: config.port,
        amiUser: config.username,
        attempt: reconnectAttempts + 1
      });
      
      const success = await amiBridgeClient.connect(config);
      
      if (success) {
        setIsConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);
        console.log('[AMI Context] Successfully connected to AMI Bridge');
      } else {
        throw new Error('AMI Bridge connection failed');
      }
      
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      setConnectionError(errorMessage);
      setIsConnected(false);
      console.error('[AMI Context] Connection error:', errorMessage);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async (): Promise<boolean> => {
    try {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        setReconnectTimeout(null);
      }
      
      const success = await amiBridgeClient.disconnect();
      setIsConnected(false);
      setConnectionError(null);
      setCallEvents([]);
      setLastEvent(null);
      setPendingCall(null);
      setReconnectAttempts(0);
      console.log('[AMI Context] Disconnected from AMI Bridge');
      return success;
    } catch (error) {
      console.error('Disconnect error:', error);
      return false;
    }
  };

  const resetReconnectAttempts = () => {
    setReconnectAttempts(0);
    setConnectionError(null);
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      setReconnectTimeout(null);
    }
  };

  const originateCall = async (
    channel: string, 
    extension: string, 
    context = 'from-internal', 
    callerID?: string
  ): Promise<boolean> => {
    try {
      console.log('[AMI Context] Originating call via bridge:', {
        channel,
        extension,
        context,
        callerID,
        userExtension
      });
      
      return await amiBridgeClient.originateCall({
        channel,
        extension,
        context,
        callerID
      });
    } catch (error) {
      console.error('Originate call error:', error);
      return false;
    }
  };

  const initiateCallFromLead = (leadName: string, phone: string, leadId: number) => {
    setPendingCall({ leadName, phone, leadId });
  };

  const clearPendingCall = () => {
    setPendingCall(null);
  };

  const contextValue: AMIContextType = {
    isConnected,
    isConnecting,
    connectionError,
    lastEvent,
    callEvents,
    config,
    pendingCall,
    userExtension,
    reconnectAttempts,
    maxReconnectAttempts,
    updateConfig,
    connect,
    disconnect,
    originateCall,
    initiateCallFromLead,
    clearPendingCall,
    resetReconnectAttempts
  };

  return (
    <AMIContext.Provider value={contextValue}>
      {children}
    </AMIContext.Provider>
  );
};
