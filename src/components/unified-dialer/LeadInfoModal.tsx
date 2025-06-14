
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, Search } from "lucide-react";
import { callRecordsService, CallRecord } from "@/services/callRecordsService";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

// Helper: perform basic Google search for the lead (simulate, user to provide links)
const googleSearchUrl = (query: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(query)}`;

// Simulate fetching summary from OpenAI/Google Search API
const fetchLeadSummary = async ({
  name,
  email,
  phone,
}: {
  name?: string;
  email?: string;
  phone?: string;
}) => {
  if (!name && !email && !phone) {
    return "No information available.";
  }

  // Instruct user to provide an OpenAI or Perplexity key for real integration
  // For now, just return a Google link based on the best available info

  let searchQuery = name || email || phone || "";
  if (email && !name) searchQuery = email;
  if (phone && !name && !email) searchQuery = phone;

  return (
    <>
      <div className="mb-2">
        <span>Try searching on Google for more info:</span>
      </div>
      <a
        href={googleSearchUrl(searchQuery)}
        rel="noopener noreferrer"
        target="_blank"
        className="text-blue-600 underline"
      >
        Google search: {searchQuery}
      </a>
    </>
  );
};

interface LeadInfoModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    notes?: string;
  };
}

const LeadInfoModal: React.FC<LeadInfoModalProps> = ({ open, onOpenChange, lead }) => {
  const [aiSummary, setAiSummary] = useState<React.ReactNode>("Loading...");
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Get call history for this lead
  const leadRecords: CallRecord[] = React.useMemo(() => {
    if (!lead) return [];
    if (lead.id) {
      return callRecordsService.getRecords().filter(
        (rec) => rec.leadId === lead.id ||
          (lead.phone && rec.phone === lead.phone) ||
          (lead.name && rec.leadName === lead.name)
      );
    }
    if (lead.phone) {
      return callRecordsService.getRecords().filter(
        (rec) => rec.phone === lead.phone
      );
    }
    if (lead.name) {
      return callRecordsService.getRecords().filter(
        (rec) => rec.leadName === lead.name
      );
    }
    return [];
  }, [lead]);

  React.useEffect(() => {
    if (!open) return;
    setLoadingSummary(true);
    fetchLeadSummary({
      name: lead?.name,
      phone: lead?.phone,
      email: lead?.email,
    }).then((summary) => {
      setAiSummary(summary);
      setLoadingSummary(false);
    });
  }, [open, lead]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Lead Info & History
          </DialogTitle>
        </DialogHeader>
        <div className="mb-3 space-y-2">
          <div>
            <span className="font-medium">Name: </span>
            <span>{lead?.name || "N/A"}</span>
          </div>
          <div>
            <span className="font-medium">Email: </span>
            <span>{lead?.email || "N/A"}</span>
          </div>
          <div>
            <span className="font-medium">Phone: </span>
            <span>{lead?.phone || "N/A"}</span>
          </div>
          {lead?.notes && (
            <div className="bg-gray-50 rounded p-2 mt-2 text-sm">
              <span className="font-medium">Notes: </span>
              {lead.notes}
            </div>
          )}
        </div>
        <div className="bg-gray-100 rounded p-3 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Search className="h-4 w-4" />
            <span className="font-semibold text-gray-700">Summary / External Info</span>
          </div>
          <div>
            {loadingSummary ? (
              <span className="text-gray-500">Fetching info...</span>
            ) : (
              aiSummary
            )}
          </div>
        </div>
        <div>
          <div className="font-semibold text-gray-700 mb-1">Call History</div>
          {leadRecords.length === 0 ? (
            <div className="text-gray-500">No call records found for this contact.</div>
          ) : (
            <ul className="space-y-2">
              {leadRecords.map((rec) => (
                <li key={rec.id} className="bg-white rounded border px-3 py-2">
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <Badge>{rec.date}</Badge>
                    <span className="text-gray-500">{rec.timestamp}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">{rec.outcome}</span>{" "}
                    <span className="text-gray-500">({rec.duration})</span>
                  </div>
                  {rec.notes && <div className="text-xs text-gray-600 mt-1">{rec.notes}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LeadInfoModal;
