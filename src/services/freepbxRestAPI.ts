
interface FreePBXConfig {
  host: string;
  port?: string;
  username: string;
  password: string;
  useHttps?: boolean;
  apiSecret?: string;
}

interface CallOriginateRequest {
  channel: string;
  extension: string;
  context?: string;
  callerID?: string;
  timeout?: number;
}

interface CallResponse {
  success: boolean;
  message?: string;
  actionid?: string;
  error?: string;
}

interface ActiveChannel {
  channel: string;
  calleridnum: string;
  calleridname: string;
  state: string;
  context: string;
  extension: string;
  duration: number;
}

class FreePBXRestAPI {
  private config: FreePBXConfig;
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(config: FreePBXConfig) {
    this.config = config;
    const protocol = config.useHttps ? 'https' : 'http';
    const port = config.port ? `:${config.port}` : '';
    this.baseUrl = `${protocol}://${config.host}${port}`;
  }

  private async authenticate(): Promise<boolean> {
    try {
      // Use API secret if provided, otherwise fall back to username/password
      if (this.config.apiSecret) {
        console.log('FreePBX REST API: Using API secret authentication');
        this.authToken = this.config.apiSecret;
        return true;
      }

      const response = await fetch(`${this.baseUrl}/admin/api/api/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.config.username,
          password: this.config.password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.authToken = data.token;
        console.log('FreePBX REST API authenticated successfully');
        return true;
      } else {
        console.error('FreePBX authentication failed:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('FreePBX authentication error:', error);
      return false;
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.authToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error('Failed to authenticate with FreePBX');
      }
    }

    const url = `${this.baseUrl}/admin/api/api/${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Use API secret in Authorization header if available
    if (this.config.apiSecret) {
      headers['Authorization'] = `Bearer ${this.config.apiSecret}`;
    } else if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expired, re-authenticate
      this.authToken = null;
      const authenticated = await this.authenticate();
      if (authenticated) {
        return this.makeRequest(endpoint, options);
      }
      throw new Error('Authentication failed');
    }

    if (!response.ok) {
      throw new Error(`FreePBX API error: ${response.statusText}`);
    }

    return response.json();
  }

  async originateCall(request: CallOriginateRequest): Promise<CallResponse> {
    try {
      console.log('FreePBX REST API: Originating call', request);
      
      const response = await this.makeRequest('originate', {
        method: 'POST',
        body: JSON.stringify({
          Channel: request.channel,
          Extension: request.extension,
          Context: request.context || 'from-internal',
          CallerID: request.callerID,
          Timeout: request.timeout || 30,
          Async: true,
        }),
      });

      return {
        success: true,
        message: 'Call originated successfully',
        actionid: response.ActionID,
      };
    } catch (error) {
      console.error('FreePBX originate call error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getActiveChannels(): Promise<ActiveChannel[]> {
    try {
      const response = await this.makeRequest('channels');
      return response.channels || [];
    } catch (error) {
      console.error('Error getting active channels:', error);
      return [];
    }
  }

  async hangupChannel(channel: string): Promise<CallResponse> {
    try {
      await this.makeRequest('hangup', {
        method: 'POST',
        body: JSON.stringify({ Channel: channel }),
      });

      return {
        success: true,
        message: 'Channel hung up successfully',
      };
    } catch (error) {
      console.error('Error hanging up channel:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getCDR(limit: number = 50): Promise<any[]> {
    try {
      const response = await this.makeRequest(`cdr?limit=${limit}`);
      return response.cdr || [];
    } catch (error) {
      console.error('Error getting CDR:', error);
      return [];
    }
  }
}

export { FreePBXRestAPI, type FreePBXConfig, type CallOriginateRequest, type CallResponse };
