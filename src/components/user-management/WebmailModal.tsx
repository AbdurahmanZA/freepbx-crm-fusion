
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ExternalLink } from "lucide-react"; // Using ExternalLink for consistency if user wants to open in new tab from modal

interface WebmailModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  webmailUrl: string;
  userName: string;
}

const WebmailModal = ({ isOpen, onOpenChange, webmailUrl, userName }: WebmailModalProps) => {
  if (!webmailUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[80vw] h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Webmail for {userName}</DialogTitle>
          <DialogDescription>
            Viewing webmail from: {webmailUrl}
            <a 
              href={webmailUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="ml-2 inline-flex items-center text-sm text-blue-500 hover:underline"
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open in new tab
            </a>
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-hidden">
          <iframe
            src={webmailUrl}
            title={`Webmail for ${userName}`}
            className="w-full h-full border-0"
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts" // Sandbox for security, adjust as needed
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WebmailModal;
