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
    if (this.initialized) return;

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
    }
  }

  private handleDialEnd(event: AMIEvent) {
    if (!event.uniqueid) return;

    const call = this.activeCalls.get(event.uniqueid);
    if (call && event.dialstatus) {
      // Always create a call record for DialEnd events
      this.createCallRecord(call, event.dialstatus, event);
    }
  }

  private handleHangup(event: AMIEvent) {
    if (!event.uniqueid) return;

    const call = this.activeCalls.get(event.uniqueid);
    if (call) {
      const cause = event.cause || 'Unknown';
      const causeTxt = event.causetxt || cause;
      
      // Create record for hangups that don't have a DialEnd record
      this.createCallRecord(call, causeTxt, event);

      this.activeCalls.delete(event.uniqueid);
      console.log('[AMI Call Handler] Call hangup:', call);
    }
  }

  private createCallRecord(call: ActiveCall, outcome: string, event: AMIEvent) {
    const duration = this.calculateDuration(call.startTime, new Date());
    const callType = this.determineCallType(call, event);
    
    // Use dialer call data if available
    const dialerCall = call.dialerCallId ? 
      Array.from(this.dialerCalls.values()).find(dc => dc.dialerCallId === call.dialerCallId) : 
      null;
    
    const phone = dialerCall?.phone || call.callerIdNum || 'Unknown';
    const leadName = dialerCall?.leadName || call.callerIdName || `Contact ${phone}`;
    
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
      leadName,
      phone,
      duration,
      outcome: this.mapOutcomeToStatus(outcome),
      timestamp: call.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: call.startTime.toISOString().split('T')[0],
      hasRecording: false,
      notes: `Call via ${call.channel}. Status: ${outcome}`,
      agent,
      callType,
      leadId: undefined,
      dialerCallId: call.dialerCallId
    };

    callRecordsService.addRecord(callRecord);
    console.log('[AMI Call Handler] Created call record:', callRecord);

    // Clean up dialer call data
    if (dialerCall) {
      this.dialerCalls.delete(dialerCall.phone);
    }
  }

  private calculateDuration(start: Date, end: Date): string {
    const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  private determineCallType(call: ActiveCall, event: AMIEvent): 'incoming' | 'outgoing' {
    if (call.dialerCallId || call.context === 'from-internal' || event.channel?.includes('Local/')) {
      return 'outgoing';
    }
    return 'incoming';
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
  }
}

export const amiCallRecordHandler = new AMICallRecordHandler();
