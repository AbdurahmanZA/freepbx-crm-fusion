
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Download, Book, Users, Phone, Calendar, BarChart, Settings, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ModuleGuide from "./ModuleGuide";
import PDFExporter from "./PDFExporter";
import SearchableKB from "./SearchableKB";
import { knowledgeBaseData } from "./knowledgeBaseData";

interface KnowledgeBaseProps {
  userRole: string;
}

const KnowledgeBase = ({ userRole }: KnowledgeBaseProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("overview");

  const moduleIcons = {
    overview: HelpCircle,
    leads: Users,
    calls: Phone,
    calendar: Calendar,
    reports: BarChart,
    integrations: Settings,
    users: Users,
  };

  const filteredModules = knowledgeBaseData.modules.filter(module =>
    userRole === "Administrator" || 
    userRole === "Manager" || 
    !module.requiresManagerAccess
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Knowledge Base</h2>
          <p className="text-muted-foreground">
            Comprehensive documentation and guides for using the CRM system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">v{knowledgeBaseData.version}</Badge>
          <PDFExporter knowledgeData={knowledgeBaseData} userRole={userRole} />
        </div>
      </div>

      <Tabs value={selectedModule} onValueChange={setSelectedModule} className="space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search knowledge base..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Overview
          </TabsTrigger>
          {filteredModules.map((module) => {
            const Icon = moduleIcons[module.id as keyof typeof moduleIcons] || Book;
            return (
              <TabsTrigger key={module.id} value={module.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {module.title}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5 text-blue-600" />
                  Getting Started
                </CardTitle>
                <CardDescription>
                  New to the system? Start here for a complete walkthrough
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Learn the basics of navigating and using the CRM system effectively.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedModule("leads")}
                  className="w-full"
                >
                  Start Guide
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-green-600" />
                  Download Full Guide
                </CardTitle>
                <CardDescription>
                  Get the complete documentation as a PDF
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Download all documentation for offline access and reference.
                </p>
                <PDFExporter knowledgeData={knowledgeBaseData} userRole={userRole} variant="outline" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-purple-600" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Modules:</span>
                    <span className="font-medium">{filteredModules.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Documentation Version:</span>
                    <span className="font-medium">{knowledgeBaseData.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Last Updated:</span>
                    <span className="font-medium">{knowledgeBaseData.lastUpdated}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                Module Overview
              </CardTitle>
              <CardDescription>
                Quick access to all available modules and their purposes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {filteredModules.map((module) => {
                  const Icon = moduleIcons[module.id as keyof typeof moduleIcons] || Book;
                  const iconColors = {
                    leads: "text-blue-600",
                    calls: "text-green-600", 
                    calendar: "text-purple-600",
                    reports: "text-orange-600",
                    integrations: "text-gray-600",
                    users: "text-red-600"
                  };
                  const iconColor = iconColors[module.id as keyof typeof iconColors] || "text-primary";
                  
                  return (
                    <div 
                      key={module.id} 
                      className="flex items-start gap-3 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 hover:shadow-md transition-all duration-200"
                      onClick={() => setSelectedModule(module.id)}
                    >
                      <div className="p-2 rounded-lg bg-muted/50">
                        <Icon className={`h-5 w-5 ${iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-1">{module.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{module.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {filteredModules.map((module) => (
          <TabsContent key={module.id} value={module.id}>
            <ModuleGuide module={module} />
          </TabsContent>
        ))}
      </Tabs>

      {searchTerm && (
        <SearchableKB 
          searchTerm={searchTerm} 
          knowledgeData={knowledgeBaseData}
          userRole={userRole}
        />
      )}
    </div>
  );
};

export default KnowledgeBase;
