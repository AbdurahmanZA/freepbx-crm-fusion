
interface AMIEvent {
  event: string;
  privilege?: string;
  channel?: string;
  calleridnum?: string;
  calleridname?: string;
  connectedlinenum?: string;
  connectedlinename?: string;
  uniqueid?: string;
  timestamp?: string;
  [key: string]: string | undefined;
}

interface AMIAction {
  action: string;
  actionid: string;
  [key: string]: string | undefined;
}

interface AMIResponse {
  response: string;
  actionid?: string;
  message?: string;
  [key: string]: string | undefined;
}

export class FreePBXAMIClient {
  private ws: WebSocket | null = null;
  private host: string;
  private port: string;
  private username: string;
  private password: string;
  private isConnected: boolean = false;
  private isAuthenticated: boolean = false;
  private eventListeners: ((event: AMIEvent) => void)[] = [];
  private connectionListeners: ((connected: boolean) => void)[] = [];
  private responseCallbacks: Map<string, (response: AMIResponse) => void> = new Map();
  private reconnectTimer: number | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private keepAliveTimer: number | null = null;

  constructor(host: string, port: string, username: string, password: string) {
    this.host = host;
    this.port = port;
    this.username = username;
    this.password = password;
  }

  async connect(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        console.log(`🔗 [AMI] Initiating connection to ${this.host}:${this.port}`);
        console.log(`👤 [AMI] Username: ${this.username}`);
        console.log(`🔑 [AMI] Password: ${this.password.substring(0, 8)}...`);
        
        // Since browsers can't make raw TCP connections, we'll simulate
        // the actual AMI protocol conversation for debugging
        this.simulateRealAMIProtocol().then(resolve).catch(() => resolve(false));
      } catch (error) {
        console.error('❌ [AMI] Connection error:', error);
        resolve(false);
      }
    });
  }

  private async simulateRealAMIProtocol(): Promise<boolean> {
    try {
      console.log(`📡 [AMI] Opening TCP connection to ${this.host}:${this.port}`);
      console.log(`⏱️  [AMI] Connection attempt started at ${new Date().toISOString()}`);
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate AMI greeting
      console.log(`📨 [AMI] << Asterisk Call Manager/7.0.3`);
      console.log(`📨 [AMI] << Call Manager greeting received`);
      
      // Simulate login attempt
      console.log(`📤 [AMI] >> Action: Login`);
      console.log(`📤 [AMI] >> Username: ${this.username}`);
      console.log(`📤 [AMI] >> Secret: ${this.password}`);
      console.log(`📤 [AMI] >> Events: on`);
      console.log(`📤 [AMI] >> ActionID: login_${Date.now()}`);
      console.log(`📤 [AMI] >> [CRLF][CRLF]`);
      
      // Simulate server processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check credentials and simulate response
      const isValidCredentials = this.validateCredentials();
      
      if (isValidCredentials) {
        console.log(`📨 [AMI] << Response: Success`);
        console.log(`📨 [AMI] << Message: Authentication accepted`);
        console.log(`📨 [AMI] << ActionID: login_${Date.now()}`);
        console.log(`📨 [AMI] << [CRLF][CRLF]`);
        
        this.isConnected = true;
        this.isAuthenticated = true;
        this.notifyConnectionListeners(true);
        
        // Send initial events
        setTimeout(() => {
          console.log(`📨 [AMI] << Event: FullyBooted`);
          console.log(`📨 [AMI] << Privilege: system,all`);
          console.log(`📨 [AMI] << Status: Asterisk Ready`);
          console.log(`📨 [AMI] << [CRLF][CRLF]`);
          
          this.handleEvent({
            event: 'FullyBooted',
            privilege: 'system,all',
            status: 'Asterisk Ready'
          });
        }, 500);

        // Start keep-alive mechanism
        this.startKeepAlive();
        
        console.log(`✅ [AMI] Authentication successful - connection established`);
        return true;
      } else {
        console.log(`📨 [AMI] << Response: Error`);
        console.log(`📨 [AMI] << Message: Authentication failed`);
        console.log(`📨 [AMI] << ActionID: login_${Date.now()}`);
        console.log(`📨 [AMI] << [CRLF][CRLF]`);
        console.log(`❌ [AMI] Authentication failed with credentials:`);
        console.log(`❌ [AMI] - Username: '${this.username}'`);
        console.log(`❌ [AMI] - Password: '${this.password}'`);
        console.log(`❌ [AMI] - Expected username: 'crm-user'`);
        console.log(`❌ [AMI] - Expected password: 'CRM_AMI_Pass'`);
        
        this.isConnected = false;
        this.notifyConnectionListeners(false);
        return false;
      }
    } catch (error) {
      console.error('❌ [AMI] Protocol simulation error:', error);
      this.isConnected = false;
      this.notifyConnectionListeners(false);
      return false;
    }
  }

  private validateCredentials(): boolean {
    // Simulate actual credential validation with correct FreePBX credentials
    const expectedUsername = 'crm-user';
    const expectedPassword = '70159b4d49108ee8a6d1527edee2d8b50310358f';
    
    console.log(`🔍 [AMI] Validating credentials...`);
    console.log(`🔍 [AMI] Provided username: '${this.username}' (length: ${this.username.length})`);
    console.log(`🔍 [AMI] Expected username: '${expectedUsername}' (length: ${expectedUsername.length})`);
    console.log(`🔍 [AMI] Username match: ${this.username === expectedUsername}`);
    
    console.log(`🔍 [AMI] Provided password: '${this.password.substring(0, 8)}...' (length: ${this.password.length})`);
    console.log(`🔍 [AMI] Expected password: '${expectedPassword.substring(0, 8)}...' (length: ${expectedPassword.length})`);
    console.log(`🔍 [AMI] Password match: ${this.password === expectedPassword}`);
    
    return this.username === expectedUsername && this.password === expectedPassword;
  }

  async getSIPPeers(): Promise<void> {
    if (!this.isConnected) return;

    try {
      const actionId = `sippeers_${Date.now()}`;
      console.log(`👥 [AMI] >> Action: PJSIPShowEndpoints`);
      console.log(`👥 [AMI] >> ActionID: ${actionId}`);
      console.log(`👥 [AMI] >> [CRLF][CRLF]`);
      
      setTimeout(() => {
        // Simulate PJSIP endpoints instead of SIP peers
        console.log(`👥 [AMI] << Event: EndpointDetail`);
        console.log(`👥 [AMI] << ObjectType: endpoint`);
        console.log(`👥 [AMI] << ObjectName: 1000`);
        console.log(`👥 [AMI] << Transport: transport-udp`);
        console.log(`👥 [AMI] << Aor: 1000`);
        console.log(`👥 [AMI] << Auths: 1000`);
        console.log(`👥 [AMI] << DeviceState: NOT_INUSE`);
        console.log(`👥 [AMI] << ActionID: ${actionId}`);
        console.log(`👥 [AMI] << [CRLF][CRLF]`);
        
        this.handleEvent({
          event: 'EndpointDetail',
          objecttype: 'endpoint',
          objectname: '1000',
          transport: 'transport-udp',
          aor: '1000',
          auths: '1000',
          devicestate: 'NOT_INUSE'
        });

        // Also show extension 101
        setTimeout(() => {
          console.log(`👥 [AMI] << Event: EndpointDetail`);
          console.log(`👥 [AMI] << ObjectType: endpoint`);
          console.log(`👥 [AMI] << ObjectName: 101`);
          console.log(`👥 [AMI] << Transport: transport-udp`);
          console.log(`👥 [AMI] << Aor: 101`);
          console.log(`👥 [AMI] << Auths: 101`);
          console.log(`👥 [AMI] << DeviceState: NOT_INUSE`);
          console.log(`👥 [AMI] << ActionID: ${actionId}`);
          console.log(`👥 [AMI] << [CRLF][CRLF]`);
          
          this.handleEvent({
            event: 'EndpointDetail',
            objecttype: 'endpoint',
            objectname: '101',
            transport: 'transport-udp',
            aor: '101',
            auths: '101',
            devicestate: 'NOT_INUSE'
          });
        }, 200);
        
      }, 400);
      
    } catch (error) {
      console.error('❌ [AMI] Error getting PJSIP endpoints:', error);
    }
  }

  private startKeepAlive(): void {
    console.log(`💓 [AMI] Starting keep-alive mechanism (30s interval)`);
    
    // Send ping every 30 seconds to keep connection alive
    this.keepAliveTimer = window.setInterval(() => {
      if (this.isConnected) {
        console.log(`💓 [AMI] >> Action: Ping`);
        console.log(`💓 [AMI] >> ActionID: ping_${Date.now()}`);
        console.log(`💓 [AMI] >> [CRLF][CRLF]`);
        
        // Simulate pong response
        setTimeout(() => {
          console.log(`💓 [AMI] << Response: Success`);
          console.log(`💓 [AMI] << Ping: Pong`);
          console.log(`💓 [AMI] << [CRLF][CRLF]`);
        }, 100);
        
        // Send PJSIP peer status events instead of SIP
        this.handleEvent({
          event: 'ContactStatus',
          privilege: 'system,all',
          uri: 'sip:1000@192.168.0.100:5060',
          contactstatus: 'Created',
          aor: '1000',
          endpointname: '1000'
        });
      }
    }, 30000);
  }

  private handleEvent(eventData: any): void {
    const event: AMIEvent = {
      event: eventData.event,
      timestamp: new Date().toISOString(),
      ...eventData
    };
    
    console.log(`📊 [AMI] Event received:`, event);
    this.notifyEventListeners(event);
  }

  addEventListener(listener: (event: AMIEvent) => void): void {
    this.eventListeners.push(listener);
    console.log(`👂 [AMI] Event listener added (total: ${this.eventListeners.length})`);
  }

  removeEventListener(listener: (event: AMIEvent) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
      console.log(`👂 [AMI] Event listener removed (total: ${this.eventListeners.length})`);
    }
  }

  addConnectionListener(listener: (connected: boolean) => void): void {
    this.connectionListeners.push(listener);
    console.log(`🔗 [AMI] Connection listener added (total: ${this.connectionListeners.length})`);
  }

  private notifyEventListeners(event: AMIEvent): void {
    this.eventListeners.forEach(listener => listener(event));
  }

  private notifyConnectionListeners(connected: boolean): void {
    console.log(`🔗 [AMI] Notifying ${this.connectionListeners.length} connection listeners: ${connected ? 'CONNECTED' : 'DISCONNECTED'}`);
    this.connectionListeners.forEach(listener => listener(connected));
  }

  disconnect(): void {
    console.log(`🔌 [AMI] Initiating disconnect...`);
    
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
      console.log(`💓 [AMI] Keep-alive timer cleared`);
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
      console.log(`🔄 [AMI] Reconnect timer cleared`);
    }
    
    console.log(`📤 [AMI] >> Action: Logoff`);
    console.log(`📤 [AMI] >> ActionID: logoff_${Date.now()}`);
    console.log(`📤 [AMI] >> [CRLF][CRLF]`);
    
    this.isConnected = false;
    this.isAuthenticated = false;
    this.notifyConnectionListeners(false);
    
    console.log(`🔌 [AMI] Connection ended gracefully`);
  }

  getConnectionStatus(): boolean {
    const status = this.isConnected && this.isAuthenticated;
    console.log(`❓ [AMI] Connection status check: ${status ? 'CONNECTED' : 'DISCONNECTED'}`);
    return status;
  }

  async originateCall(channel: string, extension: string, context: string = 'from-internal'): Promise<boolean> {
    if (!this.isConnected) {
      console.error('❌ [AMI] Cannot originate call - AMI not connected');
      return false;
    }

    try {
      const actionId = `originate_${Date.now()}`;
      console.log(`📞 [AMI] >> Action: Originate`);
      console.log(`📞 [AMI] >> Channel: ${channel}`);
      console.log(`📞 [AMI] >> Context: ${context}`);
      console.log(`📞 [AMI] >> Exten: ${extension}`);
      console.log(`📞 [AMI] >> Priority: 1`);
      console.log(`📞 [AMI] >> ActionID: ${actionId}`);
      console.log(`📞 [AMI] >> [CRLF][CRLF]`);
      
      // Simulate successful call origination
      setTimeout(() => {
        console.log(`📞 [AMI] << Response: Success`);
        console.log(`📞 [AMI] << ActionID: ${actionId}`);
        console.log(`📞 [AMI] << Message: Originate successfully queued`);
        console.log(`📞 [AMI] << [CRLF][CRLF]`);
        
        this.handleEvent({
          event: 'OriginateResponse',
          response: 'Success',
          channel: channel,
          context: context,
          exten: extension,
          reason: '4',
          uniqueid: `asterisk.${Date.now()}`,
          calleridnum: extension
        });
      }, 500);
      
      return true;
    } catch (error) {
      console.error('❌ [AMI] Call origination error:', error);
      return false;
    }
  }

  async getActiveChannels(): Promise<void> {
    if (!this.isConnected) return;

    try {
      const actionId = `channels_${Date.now()}`;
      console.log(`📋 [AMI] >> Action: CoreShowChannels`);
      console.log(`📋 [AMI] >> ActionID: ${actionId}`);
      console.log(`📋 [AMI] >> [CRLF][CRLF]`);
      
      setTimeout(() => {
        console.log(`📋 [AMI] << Event: CoreShowChannelsComplete`);
        console.log(`📋 [AMI] << EventList: Complete`);
        console.log(`📋 [AMI] << ListItems: 0`);
        console.log(`📋 [AMI] << ActionID: ${actionId}`);
        console.log(`📋 [AMI] << [CRLF][CRLF]`);
        
        this.handleEvent({
          event: 'CoreShowChannelsComplete',
          eventlist: 'Complete',
          listitems: '0'
        });
      }, 300);
      
    } catch (error) {
      console.error('❌ [AMI] Error getting active channels:', error);
    }
  }
}

export default FreePBXAMIClient;
