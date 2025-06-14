
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Lightbulb, HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { KnowledgeModule } from "./knowledgeBaseData";

interface ModuleGuideProps {
  module: KnowledgeModule;
}

const ModuleGuide = ({ module }: ModuleGuideProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{module.title}</CardTitle>
              <CardDescription className="text-base mt-2">
                {module.description}
              </CardDescription>
            </div>
            {module.requiresManagerAccess && (
              <Badge variant="secondary">Manager Access Required</Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      <Accordion type="multiple" className="space-y-4">
        {module.sections.map((section, index) => (
          <AccordionItem key={section.id} value={section.id} className="border rounded-lg px-4">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{index + 1}</Badge>
                <span className="font-medium">{section.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {section.content}
              </p>

              {section.steps && section.steps.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Step-by-Step Instructions
                  </h4>
                  <div className="space-y-3">
                    {section.steps.map((step) => (
                      <div key={step.step} className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-sm">{step.title}</h5>
                          <p className="text-sm text-muted-foreground mt-1">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {section.tips && section.tips.length > 0 && (
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <strong>Pro Tips:</strong>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {section.tips.map((tip, index) => (
                          <li key={index}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {section.troubleshooting && section.troubleshooting.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    Troubleshooting
                  </h4>
                  <div className="space-y-2">
                    {section.troubleshooting.map((item, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="font-medium text-sm flex items-center gap-2">
                          <HelpCircle className="h-3 w-3" />
                          Issue: {item.issue}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          <strong>Solution:</strong> {item.solution}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default ModuleGuide;
