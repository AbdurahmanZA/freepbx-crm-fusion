
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          Email Center
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SimpleEmailPanel
          contactEmail={contactEmail}
          setContactEmail={setContactEmail}
          contactName={initialContactName}
          phoneNumber={initialPhoneNumber}
          leadId={initialLeadId}
        />
      </CardContent>
    </Card>
  );
};

export default EmailCard;
