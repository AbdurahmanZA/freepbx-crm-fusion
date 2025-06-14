
interface Callback {
  id: string;
  leadName: string;
  leadPhone: string;
  leadCompany: string;
  scheduledDate: Date;
  scheduledTime: string;
  assignedAgent: string;
  notes: string;
  priority: 'high' | 'medium' | 'low';
  status: 'scheduled' | 'completed' | 'missed';
  createdAt: Date;
  updatedAt: Date;
}

class CallbackService {
  private storageKey = 'crm_callbacks';

  getAllCallbacks(): Callback[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      
      const callbacks = JSON.parse(stored);
      return callbacks.map((callback: any) => ({
        ...callback,
        scheduledDate: new Date(callback.scheduledDate),
        createdAt: new Date(callback.createdAt),
        updatedAt: new Date(callback.updatedAt)
      }));
    } catch (error) {
      console.error('Error loading callbacks:', error);
      return [];
    }
  }

  saveCallback(callback: Omit<Callback, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Callback {
    const callbacks = this.getAllCallbacks();
    const now = new Date();
    
    const newCallback: Callback = {
      ...callback,
      id: `callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'scheduled',
      createdAt: now,
      updatedAt: now
    };

    callbacks.push(newCallback);
    this.saveCallbacks(callbacks);
    
    return newCallback;
  }

  updateCallback(id: string, updates: Partial<Callback>): Callback | null {
    const callbacks = this.getAllCallbacks();
    const index = callbacks.findIndex(c => c.id === id);
    
    if (index === -1) return null;
    
    callbacks[index] = {
      ...callbacks[index],
      ...updates,
      updatedAt: new Date()
    };
    
    this.saveCallbacks(callbacks);
    return callbacks[index];
  }

  deleteCallback(id: string): boolean {
    const callbacks = this.getAllCallbacks();
    const filtered = callbacks.filter(c => c.id !== id);
    
    if (filtered.length === callbacks.length) return false;
    
    this.saveCallbacks(filtered);
    return true;
  }

  getCallbacksForDate(date: Date): Callback[] {
    const callbacks = this.getAllCallbacks();
    const targetDate = date.toISOString().split('T')[0];
    
    return callbacks.filter(callback => {
      const callbackDate = callback.scheduledDate.toISOString().split('T')[0];
      return callbackDate === targetDate;
    });
  }

  private saveCallbacks(callbacks: Callback[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(callbacks));
    } catch (error) {
      console.error('Error saving callbacks:', error);
    }
  }
}

export const callbackService = new CallbackService();
export type { Callback };
