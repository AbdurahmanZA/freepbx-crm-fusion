
import { callRecordsService } from './callRecordsService';
import { amiBridgeClient } from './amiBridgeClient';

interface AMIEvent {
  event: string;
  [key: string]: string | undefined;
}

interface ActiveCall {
  uniqueId: string;
  channel: string;
  startTime: Date;
  callerIdNum?: string;
  callerIdName?: string;
  extension?: string;
  context?: string;
  dialerCallId?: string; // Track dialer-initiated calls
}

class AMICallRecordHandler {
  private activeCalls: Map<string, ActiveCall> = new Map();
  private dialerCalls: Map<string, any> = new Map(); // Track dialer call data
  private initialized: boolean = false;

  initialize() {
    if (this.initialized) {
      console.log('[AMI Call Record Handler] Already initialized');
      return;
    }

    // Listen for AMI events
    amiBridgeClient.onEvent(this.handleAMIEvent.bind(this));
    
    // Listen for dialer call initiations
    window.addEventListener('dialerCallInitiated', this.handleDialerCall.bind(this));
    
    this.initialized = true;
    console.log('[AMI Call Record Handler] Initialized - listening for call events');
  }

  private handleDialerCall(event: any) {
    const callData = event.detail;
    console.log('[AMI Call Handler] Dialer call initiated:', callData);
    
    // Store dialer call data for correlation with AMI events
    this.dialerCalls.set(callData.phone, {
      dialerCallId: callData.id,
      leadName: callData.leadName,
      phone: callData.phone,
      startTime: callData.startTime
    });

    // Create an immediate call record for dialer-initiated calls
    this.createDialerCallRecord(callData);
  }

  private createDialerCallRecord(callData: any) {
    // Get current user info
    const userStr = localStorage.getItem('crm_user');
    let agent = 'System';
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        agent = user.name || 'Unknown Agent';
      } catch (error) {
        console.error('Failed to parse user info:', error);
      }
    }

    const callRecord = {
      leadName: callData.leadName,
      phone: callData.phone,
      duration: '00:00',
      outcome: 'Dialing',
      timestamp: new Date(callData.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date(callData.startTime).toISOString().split('T')[0],
      hasRecording: false,
      notes: `Outbound call initiated via dialer`,
      agent,
      callType: 'outgoing' as const,
      leadId: undefined,
      dialerCallId: callData.id
    };

    callRecordsService.addRecord(callRecord);
    console.log('[AMI Call Handler] Created initial dialer call record:', callRecord);
  }

  private handleAMIEvent(event: AMIEvent) {
    console.log('[AMI Call Handler] Processing event:', event.event, event);
    
    switch (event.event) {
      case 'Newchannel':
        this.handleNewChannel(event);
        break;
      case 'Hangup':
        this.handleHangup(event);
        break;
      case 'DialBegin':
        this.handleDialBegin(event);
        break;
      case 'DialEnd':
        this.handleDialEnd(event);
        break;
      case 'Bridge':
        this.handleBridge(event);
        break;
    }
  }

  private handleNewChannel(event: AMIEvent) {
    if (!event.uniqueid || !event.channel) return;

    const call: ActiveCall = {
      uniqueId: event.uniqueid,
      channel: event.channel,
      startTime: new Date(),
      callerIdNum: event.calleridnum,
      callerIdName: event.calleridname,
      extension: event.exten,
      context: event.context
    };

    // Check if this matches a dialer call
    const dialerCall = Array.from(this.dialerCalls.values()).find(dc => 
      event.calleridnum && dc.phone.includes(event.calleridnum.slice(-4))
    );

    if (dialerCall) {
      call.dialerCallId = dialerCall.dialerCallId;
      console.log('[AMI Call Handler] Matched dialer call:', dialerCall);
    }

    this.activeCalls.set(event.uniqueid, call);
    console.log('[AMI Call Handler] New channel:', call);
  }

  private handleDialBegin(event: AMIEvent) {
    if (!event.uniqueid) return;

    const call = this.activeCalls.get(event.uniqueid);
    if (call) {
      call.callerIdNum = event.calleridnum || call.callerIdNum;
      call.callerIdName = event.calleridname || call.callerIdName;
      console.log('[AMI Call Handler] Dial begin for:', call);

      // Update existing dialer call record with "Ringing" status
      this.updateDialerCallRecord(call, 'Ringing');
    }
  }

  private handleBridge(event: AMIEvent) {
    console.log('[AMI Call Handler] Bridge event:', event);
    
    // Find the call by checking both channels
    const call = Array.from(this.activeCalls.values()).find(c => 
      c.channel === event.channel1 || 
      c.channel === event.channel2 ||
      c.uniqueId === event.uniqueid1 ||
      c.uniqueId === event.uniqueid2
    );

    if (call) {
      console.log('[AMI Call Handler] Call connected (bridged):', call);
      this.updateDialerCallRecord(call, 'Connected');
    }
  }

  private handleDialEnd(event: AMIEvent) {
    if (!event.uniqueid) return;

    const call = this.activeCalls.get(event.uniqueid);
    if (call && event.dialstatus) {
      console.log('[AMI Call Handler] Dial end for call:', call, 'Status:', event.dialstatus);
      
      // Update the call record with final status
      if (event.dialstatus === 'ANSWER') {
        this.updateDialerCallRecord(call, 'Answered');
      } else {
        this.updateDialerCallRecord(call, this.mapOutcomeToStatus(event.dialstatus));
      }
    }
  }

  private handleHangup(event: AMIEvent) {
    if (!event.uniqueid) return;

    const call = this.activeCalls.get(event.uniqueid);
    if (call) {
      const duration = this.calculateDuration(call.startTime, new Date());
      console.log('[AMI Call Handler] Call hangup:', call, 'Duration:', duration);

      // Update final call record with duration
      this.updateDialerCallRecord(call, 'Completed', duration);

      this.activeCalls.delete(event.uniqueid);
      
      // Clean up dialer call data
      if (call.dialerCallId) {
        const dialerCall = Array.from(this.dialerCalls.values()).find(dc => dc.dialerCallId === call.dialerCallId);
        if (dialerCall) {
          this.dialerCalls.delete(dialerCall.phone);
        }
      }
    }
  }

  private updateDialerCallRecord(call: ActiveCall, status: string, finalDuration?: string) {
    if (!call.dialerCallId) return;

    // Find the existing record by dialerCallId
    const records = callRecordsService.getRecords();
    const existingRecord = records.find(r => r.dialerCallId === call.dialerCallId);
    
    if (existingRecord) {
      const duration = finalDuration || this.calculateDuration(call.startTime, new Date());
      
      callRecordsService.updateRecord(existingRecord.id, {
        outcome: status,
        duration: duration,
        notes: `${existingRecord.notes}. Final status: ${status}`
      });
      
      console.log('[AMI Call Handler] Updated call record:', existingRecord.id, 'with status:', status);
    }
  }

  private calculateDuration(start: Date, end: Date): string {
    const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  private mapOutcomeToStatus(outcome: string): string {
    const lowerOutcome = outcome.toLowerCase();
    
    if (lowerOutcome.includes('answer')) return 'Answered';
    if (lowerOutcome.includes('busy')) return 'Busy';
    if (lowerOutcome.includes('noanswer') || lowerOutcome.includes('no answer')) return 'No Answer';
    if (lowerOutcome.includes('congestion')) return 'Network Busy';
    if (lowerOutcome.includes('cancel')) return 'Cancelled';
    if (lowerOutcome.includes('chanunavail')) return 'Unavailable';
    
    return 'Unknown';
  }

  cleanup() {
    this.activeCalls.clear();
    this.dialerCalls.clear();
    this.initialized = false;
    console.log('[AMI Call Record Handler] Cleaned up');
  }
}

export const amiCallRecordHandler = new AMICallRecordHandler();
