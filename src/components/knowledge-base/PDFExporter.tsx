
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { KnowledgeBaseData } from "./knowledgeBaseData";

interface PDFExporterProps {
  knowledgeData: KnowledgeBaseData;
  userRole: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
}

const PDFExporter = ({ knowledgeData, userRole, variant = "default" }: PDFExporterProps) => {
  
  const generatePDFContent = () => {
    const filteredModules = knowledgeData.modules.filter(module =>
      userRole === "Administrator" || 
      userRole === "Manager" || 
      !module.requiresManagerAccess
    );

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>CRM Knowledge Base - Complete Guide</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            margin: 40px; 
            color: #333;
          }
          h1 { 
            color: #2563eb; 
            border-bottom: 3px solid #2563eb; 
            padding-bottom: 10px;
            text-align: center;
          }
          h2 { 
            color: #1e40af; 
            margin-top: 30px;
            border-left: 4px solid #2563eb;
            padding-left: 15px;
          }
          h3 { 
            color: #1e3a8a; 
            margin-top: 25px;
          }
          h4 { 
            color: #374151; 
            margin-top: 20px;
          }
          .meta-info {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
            text-align: center;
          }
          .module-header {
            background: #eff6ff;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0 15px 0;
          }
          .section {
            margin: 20px 0;
            padding: 15px;
            border-left: 3px solid #e5e7eb;
          }
          .steps {
            background: #f9fafb;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
          }
          .step {
            margin: 10px 0;
            padding: 10px;
            border-left: 3px solid #10b981;
            background: white;
          }
          .step-number {
            font-weight: bold;
            color: #059669;
          }
          .tips {
            background: #fef3c7;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            border-left: 4px solid #f59e0b;
          }
          .troubleshooting {
            background: #fef2f2;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            border-left: 4px solid #ef4444;
          }
          .issue {
            font-weight: bold;
            color: #dc2626;
          }
          .solution {
            margin-top: 5px;
            color: #374151;
          }
          .page-break {
            page-break-before: always;
          }
          ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          li {
            margin: 5px 0;
          }
          .toc {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .toc h2 {
            margin-top: 0;
            border-left: none;
            color: #1e40af;
          }
          .toc ul {
            list-style-type: none;
            padding-left: 0;
          }
          .toc li {
            margin: 8px 0;
            padding-left: 20px;
          }
        </style>
      </head>
      <body>
        <h1>CRM Knowledge Base</h1>
        <div class="meta-info">
          <p><strong>Complete User Guide & Documentation</strong></p>
          <p>Version: ${knowledgeData.version} | Last Updated: ${knowledgeData.lastUpdated}</p>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <p>User Role: ${userRole}</p>
        </div>

        <div class="toc">
          <h2>Table of Contents</h2>
          <ul>
            ${filteredModules.map((module, index) => `
              <li><strong>${index + 1}. ${module.title}</strong>
                <ul>
                  ${module.sections.map((section, sIndex) => `
                    <li>${index + 1}.${sIndex + 1} ${section.title}</li>
                  `).join('')}
                </ul>
              </li>
            `).join('')}
          </ul>
        </div>
    `;

    filteredModules.forEach((module, moduleIndex) => {
      htmlContent += `
        <div class="page-break"></div>
        <div class="module-header">
          <h2>${moduleIndex + 1}. ${module.title}</h2>
          <p><em>${module.description}</em></p>
          ${module.requiresManagerAccess ? '<p><strong>⚠️ Manager Access Required</strong></p>' : ''}
        </div>
      `;

      module.sections.forEach((section, sectionIndex) => {
        htmlContent += `
          <div class="section">
            <h3>${moduleIndex + 1}.${sectionIndex + 1} ${section.title}</h3>
            <p>${section.content}</p>
        `;

        if (section.steps && section.steps.length > 0) {
          htmlContent += `
            <div class="steps">
              <h4>📋 Step-by-Step Instructions:</h4>
          `;
          section.steps.forEach((step) => {
            htmlContent += `
              <div class="step">
                <span class="step-number">Step ${step.step}:</span> <strong>${step.title}</strong><br>
                ${step.description}
              </div>
            `;
          });
          htmlContent += `</div>`;
        }

        if (section.tips && section.tips.length > 0) {
          htmlContent += `
            <div class="tips">
              <h4>💡 Pro Tips:</h4>
              <ul>
                ${section.tips.map(tip => `<li>${tip}</li>`).join('')}
              </ul>
            </div>
          `;
        }

        if (section.troubleshooting && section.troubleshooting.length > 0) {
          htmlContent += `
            <div class="troubleshooting">
              <h4>🔧 Troubleshooting:</h4>
          `;
          section.troubleshooting.forEach((item) => {
            htmlContent += `
              <div style="margin: 10px 0;">
                <div class="issue">Issue: ${item.issue}</div>
                <div class="solution">Solution: ${item.solution}</div>
              </div>
            `;
          });
          htmlContent += `</div>`;
        }

        htmlContent += `</div>`;
      });
    });

    htmlContent += `
        <div class="page-break"></div>
        <div style="text-align: center; margin-top: 50px;">
          <h2>Thank you for using our CRM System!</h2>
          <p>For additional support, please contact your system administrator.</p>
          <p><em>This documentation was automatically generated from the CRM Knowledge Base system.</em></p>
        </div>
      </body>
      </html>
    `;

    return htmlContent;
  };

  const exportToPDF = () => {
    try {
      const htmlContent = generatePDFContent();
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load then trigger print
        setTimeout(() => {
          printWindow.print();
        }, 500);
        
        toast.success("PDF export opened in new window. Use your browser's print function to save as PDF.");
      } else {
        toast.error("Please allow popups to export PDF");
      }
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error("Failed to export PDF. Please try again.");
    }
  };

  return (
    <Button onClick={exportToPDF} variant={variant} className="flex items-center gap-2">
      <Download className="h-4 w-4" />
      Download PDF Guide
    </Button>
  );
};

export default PDFExporter;
