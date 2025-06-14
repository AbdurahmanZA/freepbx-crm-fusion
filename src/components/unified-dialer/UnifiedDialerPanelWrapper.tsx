
import React from "react";
import DialerPanel from "./DialerPanel";

type Props = {
  phoneNumber: string;
  setPhoneNumber: (v: string) => void;
  contactName: string;
  setContactName: (v: string) => void;
  userExt: string | undefined;
  isConnected: boolean;
  onCall: () => void;
};

const UnifiedDialerPanelWrapper = (props: Props) => (
  <div className="pb-1">
    <DialerPanel {...props} />
  </div>
);
export default UnifiedDialerPanelWrapper;
