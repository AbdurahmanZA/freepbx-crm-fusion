
interface WebRTCConfig {
  wsUrl: string;
  stunServers: string[];
  username: string;
  password: string;
}

interface CallSession {
  id: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  status: 'idle' | 'connecting' | 'connected' | 'ended';
}

class WebRTCService {
  private config: WebRTCConfig;
  private websocket: WebSocket | null = null;
  private currentSession: CallSession | null = null;
  private eventHandlers: Map<string, Function> = new Map();

  constructor(config: WebRTCConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    try {
      this.websocket = new WebSocket(this.config.wsUrl);
      
      this.websocket.onopen = () => {
        console.log('WebRTC WebSocket connected');
        this.authenticate();
      };

      this.websocket.onmessage = (event) => {
        this.handleWebSocketMessage(JSON.parse(event.data));
      };

      this.websocket.onclose = () => {
        console.log('WebRTC WebSocket disconnected');
        this.emit('disconnected');
      };

      this.websocket.onerror = (error) => {
        console.error('WebRTC WebSocket error:', error);
        this.emit('error', error);
      };

      return true;
    } catch (error) {
      console.error('WebRTC connection error:', error);
      return false;
    }
  }

  private authenticate() {
    if (this.websocket) {
      this.websocket.send(JSON.stringify({
        action: 'authenticate',
        username: this.config.username,
        password: this.config.password,
      }));
    }
  }

  private handleWebSocketMessage(message: any) {
    console.log('WebRTC message:', message);
    
    switch (message.type) {
      case 'authenticated':
        this.emit('connected');
        break;
      case 'incoming_call':
        this.handleIncomingCall(message);
        break;
      case 'call_ended':
        this.handleCallEnded(message);
        break;
      case 'offer':
        this.handleOffer(message);
        break;
      case 'answer':
        this.handleAnswer(message);
        break;
      case 'ice_candidate':
        this.handleIceCandidate(message);
        break;
    }
  }

  async initiateCall(phoneNumber: string): Promise<boolean> {
    try {
      // Get user media (microphone)
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      // Create peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: this.config.stunServers.map(url => ({ urls: url })),
      });

      // Create call session
      this.currentSession = {
        id: `call_${Date.now()}`,
        localStream,
        remoteStream: null,
        peerConnection,
        status: 'connecting',
      };

      // Set up peer connection event handlers
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.websocket) {
          this.websocket.send(JSON.stringify({
            type: 'ice_candidate',
            candidate: event.candidate,
            sessionId: this.currentSession?.id,
          }));
        }
      };

      peerConnection.ontrack = (event) => {
        if (this.currentSession) {
          this.currentSession.remoteStream = event.streams[0];
          this.emit('remote_stream', event.streams[0]);
        }
      };

      // Add local stream to peer connection
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });

      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send call request via WebSocket
      if (this.websocket) {
        this.websocket.send(JSON.stringify({
          type: 'initiate_call',
          phoneNumber,
          offer,
          sessionId: this.currentSession.id,
        }));
      }

      this.emit('call_initiated', { phoneNumber, sessionId: this.currentSession.id });
      return true;
    } catch (error) {
      console.error('Error initiating WebRTC call:', error);
      this.emit('call_error', error);
      return false;
    }
  }

  async hangupCall(): Promise<boolean> {
    if (this.currentSession) {
      // Close peer connection
      if (this.currentSession.peerConnection) {
        this.currentSession.peerConnection.close();
      }

      // Stop local stream
      if (this.currentSession.localStream) {
        this.currentSession.localStream.getTracks().forEach(track => track.stop());
      }

      // Notify server
      if (this.websocket) {
        this.websocket.send(JSON.stringify({
          type: 'hangup',
          sessionId: this.currentSession.id,
        }));
      }

      this.currentSession.status = 'ended';
      this.emit('call_ended', this.currentSession.id);
      this.currentSession = null;
      
      return true;
    }
    return false;
  }

  private async handleOffer(message: any) {
    if (this.currentSession && this.currentSession.peerConnection) {
      await this.currentSession.peerConnection.setRemoteDescription(message.offer);
      const answer = await this.currentSession.peerConnection.createAnswer();
      await this.currentSession.peerConnection.setLocalDescription(answer);

      if (this.websocket) {
        this.websocket.send(JSON.stringify({
          type: 'answer',
          answer,
          sessionId: this.currentSession.id,
        }));
      }
    }
  }

  private async handleAnswer(message: any) {
    if (this.currentSession && this.currentSession.peerConnection) {
      await this.currentSession.peerConnection.setRemoteDescription(message.answer);
      this.currentSession.status = 'connected';
      this.emit('call_connected', this.currentSession.id);
    }
  }

  private async handleIceCandidate(message: any) {
    if (this.currentSession && this.currentSession.peerConnection) {
      await this.currentSession.peerConnection.addIceCandidate(message.candidate);
    }
  }

  private handleIncomingCall(message: any) {
    this.emit('incoming_call', message);
  }

  private handleCallEnded(message: any) {
    if (this.currentSession) {
      this.currentSession.status = 'ended';
      this.hangupCall();
    }
  }

  on(event: string, handler: Function) {
    this.eventHandlers.set(event, handler);
  }

  private emit(event: string, data?: any) {
    const handler = this.eventHandlers.get(event);
    if (handler) {
      handler(data);
    }
  }

  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    if (this.currentSession) {
      this.hangupCall();
    }
  }

  getCurrentSession(): CallSession | null {
    return this.currentSession;
  }
}

export { WebRTCService, type WebRTCConfig, type CallSession };
