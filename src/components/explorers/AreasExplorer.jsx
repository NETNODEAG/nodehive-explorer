import React, { useState } from 'react';
import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import { MapPin, Loader2, Search, Code } from 'lucide-react';
import CodeGenerator from '../CodeGenerator';
import { generateAreasCode } from '../../utils/codeGenerator';
import useConnectionStore from '../../store/connectionStore';

function AreasExplorer({ client, onDataFetch, isLoading, setIsLoading, setError }) {
  const { config } = useConnectionStore();
  const [formData, setFormData] = useState({
    limit: 10,
    language: ''
  });
  const [showCodeGenerator, setShowCodeGenerator] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError(null);

      const params = new DrupalJsonApiParams();
      params.addPageLimit(formData.limit);
      params.addCustomParam({ jsonapi_include: 1 });

      const queryString = params.getQueryString();
      const endpoint = `/jsonapi/nodehive_area/nodehive_area${queryString ? `?${queryString}` : ''}`;

      const response = await client.request(endpoint, {
        lang: formData.language || undefined
      });

      onDataFetch(response);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-medium flex items-center gap-2">
          <MapPin size={18} />
          Explore Areas
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <div className="space-y-4">
          {/* Language */}
          <div>
            <label className="label">Language</label>
            <input
              type="text"
              className="input mt-1"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              placeholder="en"
            />
          </div>

          {/* Limit */}
          <div>
            <label className="label">Limit</label>
            <input
              type="number"
              className="input mt-1"
              value={formData.limit}
              onChange={(e) => setFormData({ ...formData, limit: parseInt(e.target.value) })}
              min="1"
              max="50"
            />
          </div>

          <div className="card p-4">
            <h4 className="text-sm font-medium mb-2">Areas Information</h4>
            <p className="text-xs text-muted-foreground">
              Areas are content organization entities in NodeHive that help structure and categorize content.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-card pt-4 mt-6 border-t border-border space-y-2">
          <button
            type="submit"
            className="btn btn-primary btn-md w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Loading...
              </>
            ) : (
              <>
                <Search className="mr-2" size={16} />
                Load Areas
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowCodeGenerator(true)}
            className="btn btn-secondary btn-md w-full"
          >
            <Code className="mr-2" size={16} />
            Generate Code
          </button>
        </div>
      </form>

      {/* Code Generator Modal */}
      {showCodeGenerator && (
        <CodeGenerator
          code={generateAreasCode(formData, config)}
          onClose={() => setShowCodeGenerator(false)}
        />
      )}
    </div>
  );
}

export default AreasExplorer;
