import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { emailService } from "@/services/emailService";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  MapPin,
  DollarSign,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  User,
  Building,
  Tag,
  Clock,
  Star,
  StarOff,
  FileText,
  Send,
  Eye,
  X,
  AlertCircle
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  source: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  agentId: string;
  company: string;
  title: string;
  industry: string;
  notes: string;
  priority: string;
  lastContacted: string;
  estimatedValue: number;
  tags: string[];
}

const initialLead: Lead = {
  id: "",
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  source: "",
  status: "",
  createdAt: "",
  updatedAt: "",
  agentId: "",
  company: "",
  title: "",
  industry: "",
  notes: "",
  priority: "",
  lastContacted: "",
  estimatedValue: 0,
  tags: [],
};

// Permanent dummy leads with specified contact details
const dummyLeads: Lead[] = [
  {
    id: "lead_dummy_1",
    name: "Ahmed Hassan",
    phone: "0629145963",
    email: "admin@abdurahman.co.za",
    address: "123 Business Street",
    city: "Cape Town",
    state: "Western Cape",
    zip: "8001",
    source: "Website",
    status: "New",
    createdAt: "2024-06-15",
    updatedAt: "2024-06-15",
    agentId: "agent1",
    company: "Tech Solutions Ltd",
    title: "CTO",
    industry: "Technology",
    notes: "Interested in enterprise software solutions",
    priority: "High",
    lastContacted: "2024-06-15",
    estimatedValue: 50000,
    tags: ["hot-lead", "enterprise"]
  },
  {
    id: "lead_dummy_2",
    name: "Sarah Williams",
    phone: "0629145963",
    email: "admin@abdurahman.co.za",
    address: "456 Commerce Ave",
    city: "Johannesburg",
    state: "Gauteng",
    zip: "2000",
    source: "Referral",
    status: "Contacted",
    createdAt: "2024-06-14",
    updatedAt: "2024-06-16",
    agentId: "agent2",
    company: "Marketing Pro Inc",
    title: "Marketing Director",
    industry: "Marketing",
    notes: "Looking for CRM integration solutions",
    priority: "Medium",
    lastContacted: "2024-06-16",
    estimatedValue: 25000,
    tags: ["warm-lead", "integration"]
  },
  {
    id: "lead_dummy_3",
    name: "Michael Johnson",
    phone: "0629145963",
    email: "admin@abdurahman.co.za",
    address: "789 Industrial Blvd",
    city: "Durban",
    state: "KwaZulu-Natal",
    zip: "4000",
    source: "Cold Call",
    status: "In Progress",
    createdAt: "2024-06-13",
    updatedAt: "2024-06-17",
    agentId: "agent1",
    company: "Manufacturing Corp",
    title: "Operations Manager",
    industry: "Manufacturing",
    notes: "Needs call center solution for customer support",
    priority: "High",
    lastContacted: "2024-06-17",
    estimatedValue: 75000,
    tags: ["call-center", "support"]
  },
  {
    id: "lead_dummy_4",
    name: "Lisa Chen",
    phone: "0629145963",
    email: "admin@abdurahman.co.za",
    address: "321 Finance Plaza",
    city: "Pretoria",
    state: "Gauteng",
    zip: "0001",
    source: "LinkedIn",
    status: "New",
    createdAt: "2024-06-17",
    updatedAt: "2024-06-17",
    agentId: "agent3",
    company: "Financial Services Group",
    title: "IT Manager",
    industry: "Finance",
    notes: "Evaluating communication platforms",
    priority: "Medium",
    lastContacted: "",
    estimatedValue: 35000,
    tags: ["finance", "communication"]
  },
  {
    id: "lead_dummy_5",
    name: "David Brown",
    phone: "0629145963",
    email: "admin@abdurahman.co.za",
    address: "654 Retail Center",
    city: "Port Elizabeth",
    state: "Eastern Cape",
    zip: "6000",
    source: "Trade Show",
    status: "Closed",
    createdAt: "2024-06-10",
    updatedAt: "2024-06-16",
    agentId: "agent2",
    company: "Retail Chain Ltd",
    title: "Store Manager",
    industry: "Retail",
    notes: "Successfully implemented our solution",
    priority: "Low",
    lastContacted: "2024-06-16",
    estimatedValue: 15000,
    tags: ["closed-won", "retail"]
  }
];

const LeadManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [currentLead, setCurrentLead] = useState<Lead>(initialLead);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<string | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = () => {
    try {
      const storedLeads = localStorage.getItem("leads");
      let allLeads = [...dummyLeads]; // Always start with dummy leads
      
      if (storedLeads) {
        const userLeads = JSON.parse(storedLeads);
        // Add user-created leads that don't conflict with dummy leads
        const nonDummyLeads = userLeads.filter((lead: Lead) => !lead.id.startsWith("lead_dummy_"));
        allLeads = [...allLeads, ...nonDummyLeads];
      }
      
      setLeads(allLeads);
    } catch (error) {
      console.error("Error fetching leads from localStorage:", error);
      // Fallback to just dummy leads if there's an error
      setLeads(dummyLeads);
      toast({
        title: "Warning",
        description: "Using default leads due to storage error.",
        variant: "destructive",
      });
    }
  };

  const saveLeads = (newLeads: Lead[]) => {
    try {
      // Only save non-dummy leads to localStorage
      const userLeads = newLeads.filter(lead => !lead.id.startsWith("lead_dummy_"));
      localStorage.setItem("leads", JSON.stringify(userLeads));
      setLeads(newLeads);
    } catch (error) {
      console.error("Error saving leads to localStorage:", error);
      toast({
        title: "Error Saving Leads",
        description: "Failed to save leads to local storage.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentLead((prevLead) => ({
      ...prevLead,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentLead((prevLead) => ({
      ...prevLead,
      [name]: value,
    }));
  };

  const handleSelectValueChange = (name: string, value: string) => {
    setCurrentLead((prevLead) => ({
      ...prevLead,
      [name]: value,
    }));
  };

  const addLead = () => {
    setIsEditing(false);
    setCurrentLead(initialLead);
  };

  const editLead = (lead: Lead) => {
    setIsEditing(true);
    setCurrentLead(lead);
  };

  const saveLead = () => {
    if (!currentLead.name || !currentLead.phone || !currentLead.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (isEditing) {
      const updatedLeads = leads.map((lead) =>
        lead.id === currentLead.id ? { ...currentLead, updatedAt: new Date().toISOString().split('T')[0] } : lead
      );
      saveLeads(updatedLeads);
      toast({
        title: "Lead Updated",
        description: `${currentLead.name} has been updated successfully.`,
      });
    } else {
      const newLead = { 
        ...currentLead, 
        id: `lead_${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };
      saveLeads([...leads, newLead]);
      toast({
        title: "Lead Added",
        description: `${currentLead.name} has been added successfully.`,
      });
    }
    setCurrentLead(initialLead);
    setIsEditing(false);
  };

  const deleteLead = (leadId: string) => {
    // Prevent deleting dummy leads
    if (leadId.startsWith("lead_dummy_")) {
      toast({
        title: "Cannot Delete",
        description: "Demo leads cannot be deleted.",
        variant: "destructive",
      });
      return;
    }

    const leadToDelete = leads.find(lead => lead.id === leadId);
    if (!leadToDelete) {
      toast({
        title: "Lead Not Found",
        description: "The lead you are trying to delete does not exist.",
        variant: "destructive",
      });
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete ${leadToDelete.name}?`);
    if (confirmDelete) {
      const updatedLeads = leads.filter((lead) => lead.id !== leadId);
      saveLeads(updatedLeads);
      toast({
        title: "Lead Deleted",
        description: `${leadToDelete.name} has been deleted successfully.`,
      });
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const sortLeads = (column: string) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedLeads = React.useMemo(() => {
    const sortableLeads = [...leads];
    sortableLeads.sort((a, b) => {
      const columnA = a[sortColumn as keyof Lead];
      const columnB = b[sortColumn as keyof Lead];

      if (columnA < columnB) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (columnA > columnB) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
    return sortableLeads;
  }, [leads, sortColumn, sortDirection]);

  const filteredLeads = React.useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    return sortedLeads.filter((lead) => {
      return (
        lead.name.toLowerCase().includes(lowerCaseQuery) ||
        lead.email.toLowerCase().includes(lowerCaseQuery) ||
        lead.phone.toLowerCase().includes(lowerCaseQuery) ||
        lead.company.toLowerCase().includes(lowerCaseQuery)
      );
    });
  }, [searchQuery, sortedLeads]);

  const openEmailDialog = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setCurrentLead(lead);
      setShowEmailDialog(true);
    } else {
      toast({
        title: "Lead Not Found",
        description: "Could not find the lead to send email.",
        variant: "destructive"
      });
    }
  };

  const closeEmailDialog = () => {
    setShowEmailDialog(false);
    setSelectedEmailTemplate(null);
  };

  const handleEmailTemplateSelect = (templateId: string) => {
    setSelectedEmailTemplate(templateId);
  };

  const emailTemplates = emailService.getTemplates();

  const sendEmailToLead = async (leadId: string, templateId: string) => {
    if (!currentLead?.email) {
      toast({
        title: "No Email Address",
        description: "This lead doesn't have an email address.",
        variant: "destructive"
      });
      return;
    }

    if (!emailService.isConfigured()) {
      toast({
        title: "Email Not Configured",
        description: "Please configure EmailJS in Integration Settings first.",
        variant: "destructive"
      });
      return;
    }

    try {
      const templates = emailService.getTemplates();
      const template = templates.find(t => t.id === templateId);
      
      if (!template) {
        toast({
          title: "Template Not Found",
          description: "Selected email template could not be found.",
          variant: "destructive"
        });
        return;
      }

      let emailBody = template.body;
      if (currentLead.name) {
        emailBody = emailBody.replace(/Dear Customer/g, `Dear ${currentLead.name}`);
      }

      const result = await emailService.sendEmail({
        to: currentLead.email,
        subject: template.subject,
        body: emailBody,
        from_name: user?.name,
        from_email: user?.email
      });
      
      if (result.success) {
        emailService.logEmail({
          to: currentLead.email,
          subject: template.subject,
          body: emailBody,
          from_name: user?.name,
          from_email: user?.email
        }, 'sent');

        toast({
          title: "Email Sent Successfully",
          description: `Email sent to ${currentLead.name} at ${currentLead.email}`,
        });

        setShowEmailDialog(false);
        setSelectedEmailTemplate(null);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Email send error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: "Email Send Failed",
        description: `Could not send email: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  const handleDialLead = (lead: Lead) => {
    if (!lead.phone) {
      toast({
        title: "No Phone Number",
        description: "This lead doesn't have a phone number.",
        variant: "destructive"
      });
      return;
    }

    const event = new CustomEvent('openDialerForLead', { 
      detail: { 
        phone: lead.phone, 
        name: lead.name,
        email: lead.email 
      } 
    });
    window.dispatchEvent(event);

    toast({
      title: "Dialer Opened",
      description: `Opening dialer for ${lead.name}`,
    });
  };

  return (
    <div>
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Lead Management</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={addLead}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
            <Input
              type="search"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={handleSearch}
              className="max-w-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => sortLeads("name")}
                  >
                    Name
                    {sortColumn === "name" && (
                      <span>{sortDirection === "asc" ? " ▲" : " ▼"}</span>
                    )}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => sortLeads("email")}
                  >
                    Email
                    {sortColumn === "email" && (
                      <span>{sortDirection === "asc" ? " ▲" : " ▼"}</span>
                    )}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => sortLeads("phone")}
                  >
                    Phone
                    {sortColumn === "phone" && (
                      <span>{sortDirection === "asc" ? " ▲" : " ▼"}</span>
                    )}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => sortLeads("company")}
                  >
                    Company
                    {sortColumn === "company" && (
                      <span>{sortDirection === "asc" ? " ▲" : " ▼"}</span>
                    )}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => sortLeads("status")}
                  >
                    Status
                    {sortColumn === "status" && (
                      <span>{sortDirection === "asc" ? " ▲" : " ▼"}</span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {lead.name}
                      {lead.id.startsWith("lead_dummy_") && (
                        <Badge variant="secondary" className="ml-2 text-xs">Demo</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.company}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={
                        lead.status === "New" ? "default" :
                        lead.status === "Contacted" ? "secondary" :
                        lead.status === "In Progress" ? "outline" :
                        "destructive"
                      }>
                        {lead.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => editLead(lead)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDialLead(lead)}>
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEmailDialog(lead.id)}>
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteLead(lead.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditing} onOpenChange={() => setIsEditing(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Lead" : "Add Lead"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={currentLead.name}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                type="text"
                id="phone"
                name="phone"
                value={currentLead.phone}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={currentLead.email}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                type="text"
                id="company"
                name="company"
                value={currentLead.company}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                type="text"
                id="title"
                name="title"
                value={currentLead.title}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                type="text"
                id="industry"
                name="industry"
                value={currentLead.industry}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                type="text"
                id="address"
                name="address"
                value={currentLead.address}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                type="text"
                id="city"
                name="city"
                value={currentLead.city}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                type="text"
                id="state"
                name="state"
                value={currentLead.state}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="zip">Zip</Label>
              <Input
                type="text"
                id="zip"
                name="zip"
                value={currentLead.zip}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="source">Source</Label>
              <Input
                type="text"
                id="source"
                name="source"
                value={currentLead.source}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={currentLead.status} onValueChange={(value) => handleSelectValueChange('status', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={currentLead.priority} onValueChange={(value) => handleSelectValueChange('priority', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="estimatedValue">Estimated Value</Label>
              <Input
                type="number"
                id="estimatedValue"
                name="estimatedValue"
                value={currentLead.estimatedValue}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            value={currentLead.notes}
            onChange={handleInputChange}
            className="mt-2"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={saveLead}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEmailDialog} onOpenChange={closeEmailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Choose Email Template
            </DialogTitle>
          </DialogHeader>
          <div>
            <Select value={selectedEmailTemplate ?? ""} onValueChange={handleEmailTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Pick a template" />
              </SelectTrigger>
              <SelectContent side="top" className="z-50 bg-white shadow-lg border">
                {emailTemplates.length === 0 ? (
                  <div className="py-2 px-4 text-gray-400 text-sm">No templates available</div>
                ) : (
                  emailTemplates.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="flex gap-2 mt-2">
            <Button variant="outline" onClick={closeEmailDialog}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button 
              onClick={() => sendEmailToLead(currentLead.id, selectedEmailTemplate || "")} 
              disabled={!selectedEmailTemplate || isEmailLoading || emailTemplates.length === 0}
            >
              <Send className="h-4 w-4 mr-1" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadManagement;
