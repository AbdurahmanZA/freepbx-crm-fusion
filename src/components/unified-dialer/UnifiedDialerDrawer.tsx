
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import UnifiedDialer from "./UnifiedDialer";

interface UnifiedDialerDrawerProps {
  onCallInitiated: (callData: {
    id: string;
    leadName: string;
    phone: string;
    duration: string;
    status: "connected" | "ringing" | "on-hold" | "ended";
    startTime: Date;
    leadId?: string;
  }) => void;
  disabled?: boolean;
  initialData?: {
    phone?: string;
    name?: string;
    email?: string;
  };
}

const UnifiedDialerDrawer: React.FC<UnifiedDialerDrawerProps> = (props) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Fixed trigger button when drawer is closed */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed top-20 right-4 z-50 h-12 w-12 rounded-full shadow-lg"
          size="icon"
          title="Open Dialer"
        >
          <Phone className="h-5 w-5" />
        </Button>
      )}

      {/* Collapsible drawer */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={`fixed top-0 right-0 h-full bg-background border-l shadow-lg transition-all duration-300 ease-in-out z-40 ${
            isOpen ? 'w-96 translate-x-0' : 'w-0 translate-x-full'
          }`}
        >
          <CollapsibleContent className="h-full">
            <div className="flex flex-col h-full">
              {/* Header with close button */}
              <div className="flex items-center justify-between p-4 border-b bg-muted/50">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  <h2 className="font-semibold">Unified Dialer</h2>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
              </div>

              {/* Content area */}
              <div className="flex-1 overflow-y-auto p-4">
                <UnifiedDialer {...props} />
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Backdrop overlay when open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default UnifiedDialerDrawer;
