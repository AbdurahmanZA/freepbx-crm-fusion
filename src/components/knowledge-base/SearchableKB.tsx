
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KnowledgeBaseData } from "./knowledgeBaseData";

interface SearchableKBProps {
  searchTerm: string;
  knowledgeData: KnowledgeBaseData;
  userRole: string;
}

interface SearchResult {
  moduleId: string;
  moduleTitle: string;
  sectionId: string;
  sectionTitle: string;
  content: string;
  matchType: 'title' | 'content' | 'steps' | 'tips';
  requiresManagerAccess?: boolean;
}

const SearchableKB = ({ searchTerm, knowledgeData, userRole }: SearchableKBProps) => {
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const results: SearchResult[] = [];
    const term = searchTerm.toLowerCase();

    knowledgeData.modules.forEach((module) => {
      // Skip modules that require manager access if user doesn't have it
      if (module.requiresManagerAccess && userRole !== "Administrator" && userRole !== "Manager") {
        return;
      }

      module.sections.forEach((section) => {
        // Search in section title
        if (section.title.toLowerCase().includes(term)) {
          results.push({
            moduleId: module.id,
            moduleTitle: module.title,
            sectionId: section.id,
            sectionTitle: section.title,
            content: section.content,
            matchType: 'title',
            requiresManagerAccess: module.requiresManagerAccess
          });
        }

        // Search in section content
        if (section.content.toLowerCase().includes(term)) {
          results.push({
            moduleId: module.id,
            moduleTitle: module.title,
            sectionId: section.id,
            sectionTitle: section.title,
            content: section.content,
            matchType: 'content',
            requiresManagerAccess: module.requiresManagerAccess
          });
        }

        // Search in steps
        if (section.steps) {
          section.steps.forEach((step) => {
            if (step.title.toLowerCase().includes(term) || step.description.toLowerCase().includes(term)) {
              results.push({
                moduleId: module.id,
                moduleTitle: module.title,
                sectionId: section.id,
                sectionTitle: section.title,
                content: `Step ${step.step}: ${step.title} - ${step.description}`,
                matchType: 'steps',
                requiresManagerAccess: module.requiresManagerAccess
              });
            }
          });
        }

        // Search in tips
        if (section.tips) {
          section.tips.forEach((tip) => {
            if (tip.toLowerCase().includes(term)) {
              results.push({
                moduleId: module.id,
                moduleTitle: module.title,
                sectionId: section.id,
                sectionTitle: section.title,
                content: tip,
                matchType: 'tips',
                requiresManagerAccess: module.requiresManagerAccess
              });
            }
          });
        }
      });
    });

    // Remove duplicates based on moduleId + sectionId combination
    const uniqueResults = results.filter((result, index, self) =>
      index === self.findIndex((r) => r.moduleId === result.moduleId && r.sectionId === result.sectionId)
    );

    return uniqueResults;
  }, [searchTerm, knowledgeData, userRole]);

  const highlightText = (text: string, term: string) => {
    if (!term.trim()) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  if (!searchTerm.trim()) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Results</CardTitle>
        <CardDescription>
          Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchTerm}"
        </CardDescription>
      </CardHeader>
      <CardContent>
        {searchResults.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No results found. Try different keywords or check spelling.
          </p>
        ) : (
          <div className="space-y-4">
            {searchResults.map((result, index) => (
              <div key={`${result.moduleId}-${result.sectionId}-${index}`} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{result.moduleTitle}</Badge>
                  <Badge variant="secondary">{result.matchType}</Badge>
                  {result.requiresManagerAccess && (
                    <Badge variant="destructive" className="text-xs">Manager Only</Badge>
                  )}
                </div>
                <h4 className="font-medium mb-2">
                  {highlightText(result.sectionTitle, searchTerm)}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {highlightText(result.content.slice(0, 200) + (result.content.length > 200 ? '...' : ''), searchTerm)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchableKB;
