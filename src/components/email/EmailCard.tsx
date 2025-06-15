
import React from "react";
import { Mail } from "lucide-react";
import SimpleEmailPanel from "@/components/unified-dialer/SimpleEmailPanel";

interface EmailCardProps {
  initialContactEmail?: string;
  initialContactName?: string;
  initialPhoneNumber?: string;
  initialLeadId?: string;
}

const EmailCard: React.FC<EmailCardProps> = ({
  initialContactEmail = "",
  initialContactName = "",
  initialPhoneNumber = "",
  initialLeadId
}) => {
  const [contactEmail, setContactEmail] = React.useState(initialContactEmail);

  React.useEffect(() => {
    if (initialContactEmail) {
      setContactEmail(initialContactEmail);
    }
  }, [initialContactEmail]);

  return (
    <div className="w-full">
      <div className="pb-3">
        <h3 className="text-lg flex items-center gap-2 font-semibold">
          <Mail className="h-5 w-5 text-blue-600" />
          Email Center
        </h3>
      </div>
      <div>
        <SimpleEmailPanel
          contactEmail={contactEmail}
          setContactEmail={setContactEmail}
          contactName={initialContactName}
          phoneNumber={initialPhoneNumber}
          leadId={initialLeadId}
        />
      </div>
    </div>
  );
};

export default EmailCard;
