
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { FileText, Send, X } from "lucide-react";

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  templates: EmailTemplate[];
  selectedTemplateId: string | null;
  onSelectTemplate: (id: string) => void;
  onSend: () => void;
  loading?: boolean;
};

const LeadEmailTemplateDialog: React.FC<Props> = ({
  open,
  onClose,
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onSend,
  loading = false
}) => (
  <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Choose Email Template
        </DialogTitle>
      </DialogHeader>
      <div>
        <Select value={selectedTemplateId ?? ""} onValueChange={onSelectTemplate}>
          <SelectTrigger>
            <SelectValue placeholder="Pick a template" />
          </SelectTrigger>
          <SelectContent side="top" className="z-50 bg-white shadow-lg border">
            {templates.length === 0 ? (
              <div className="py-2 px-4 text-gray-400 text-sm">No templates available</div>
            ) : (
              templates.map((tpl) => (
                <SelectItem key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter className="flex gap-2 mt-2">
        <Button variant="outline" onClick={onClose}>
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <Button onClick={onSend} disabled={!selectedTemplateId || loading || templates.length === 0}>
          <Send className="h-4 w-4 mr-1" />
          Send Email
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default LeadEmailTemplateDialog;
