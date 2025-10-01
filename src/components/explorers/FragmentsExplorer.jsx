import React, { useState, useEffect } from 'react';
import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import { Search, Loader2, ChevronDown, ChevronUp, Code, Boxes } from 'lucide-react';
import FieldSelector from '../FieldSelector';
import CodeGenerator from '../CodeGenerator';
import { generateFragmentCode } from '../../utils/codeGenerator';
import useConnectionStore from '../../store/connectionStore';

function FragmentsExplorer({ client, onDataFetch, isLoading, setIsLoading, setError }) {
  const { config } = useConnectionStore();
  const [fragmentTypes, setFragmentTypes] = useState([]);
  const [formData, setFormData] = useState({
    fragmentType: '',
    language: '',
    limit: 10,
    sort: '',
    includes: '',
    fields: []
  });
  const [availableFields, setAvailableFields] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCodeGenerator, setShowCodeGenerator] = useState(false);

  useEffect(() => {
    loadFragmentTypes();
  }, [client]);

  const loadFragmentTypes = async () => {
    try {
      // Fetch the main jsonapi index to see what's actually available
      const response = await client.request('/jsonapi');

      if (response.links) {
        // Find all nodehive_fragment--* endpoints
        const fragmentTypes = [];

        Object.keys(response.links).forEach(key => {
          if (key.startsWith('nodehive_fragment--')) {
            const fragmentType = key.replace('nodehive_fragment--', '');
            // Create a formatted label from the machine name
            const label = fragmentType
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');

            fragmentTypes.push({
              id: key,
              attributes: {
                drupal_internal__id: fragmentType,
                label: label
              }
            });
          }
        });

        setFragmentTypes(fragmentTypes);
      }
    } catch (error) {
      console.error('Failed to load fragment types:', error);
    }
  };

  const handleFragmentTypeChange = async (fragmentType) => {
    setFormData({ ...formData, fragmentType, fields: [] });

    if (!fragmentType) {
      setAvailableFields([]);
      return;
    }

    try {
      // Fetch a sample fragment to discover fields
      const params = new DrupalJsonApiParams().addPageLimit(1);
      const queryString = params.getQueryString();
      const endpoint = `/jsonapi/nodehive_fragment/${fragmentType}${queryString ? `?${queryString}` : ''}`;

      const response = await client.request(endpoint);

      if (response.data && response.data.length > 0) {
        const sampleFragment = response.data[0];
        let fields = [];

        // Check for fields in attributes
        if (sampleFragment.attributes) {
          fields = Object.keys(sampleFragment.attributes);
        }

        // Also check for direct fields
        const directFields = Object.keys(sampleFragment).filter(key =>
          !['id', 'type', 'links', 'relationships', 'attributes', 'meta'].includes(key)
        );

        // Combine and deduplicate
        const allFields = [...new Set([...fields, ...directFields])].sort();
        setAvailableFields(allFields);
      }
    } catch (error) {
      console.error('Failed to fetch fields:', error);
      setAvailableFields([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fragmentType) {
      setError('Please select a fragment type');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new DrupalJsonApiParams();

      // Add limit
      if (formData.limit > 0) {
        params.addPageLimit(formData.limit);
      }

      // Add sort
      if (formData.sort) {
        const [field, direction] = formData.sort.split(',');
        params.addSort(field, direction);
      }

      // Add includes
      if (formData.includes) {
        params.addInclude(formData.includes.split(',').map(i => i.trim()));
      }

      // Add fields
      if (formData.fields.length > 0) {
        params.addFields(`nodehive_fragment--${formData.fragmentType}`, formData.fields);
      }

      const queryString = params.getQueryString();
      const endpoint = `/jsonapi/nodehive_fragment/${formData.fragmentType}${queryString ? `?${queryString}` : ''}`;

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
          <Boxes size={18} />
          Explore Fragments
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <div className="space-y-4">
          {/* Fragment Type Selection */}
          <div>
            <label className="label">Fragment Type *</label>
            <select
              className="select mt-1"
              value={formData.fragmentType}
              onChange={(e) => handleFragmentTypeChange(e.target.value)}
              required
            >
              <option value="">Select fragment type...</option>
              {fragmentTypes.map((type) => (
                <option
                  key={type.id}
                  value={type.attributes?.drupal_internal__id || type.id}
                >
                  {type.attributes?.label || type.attributes?.drupal_internal__id || type.id}
                </option>
              ))}
            </select>
          </div>

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
              max="100"
            />
          </div>

          {/* Sort */}
          <div>
            <label className="label">Sort By</label>
            <select
              className="select mt-1"
              value={formData.sort}
              onChange={(e) => setFormData({ ...formData, sort: e.target.value })}
            >
              <option value="">Default</option>
              <option value="created,DESC">Created (Newest First)</option>
              <option value="created,ASC">Created (Oldest First)</option>
              <option value="changed,DESC">Updated (Newest First)</option>
              <option value="label,ASC">Label (A-Z)</option>
              <option value="label,DESC">Label (Z-A)</option>
            </select>
          </div>

          {/* Advanced Options */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              Advanced Options
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-4 pl-6 border-l-2 border-border">
                {/* Include Relations */}
                <div>
                  <label className="label">Include Relations</label>
                  <input
                    type="text"
                    className="input mt-1"
                    value={formData.includes}
                    onChange={(e) => setFormData({ ...formData, includes: e.target.value })}
                    placeholder="uid,field_image"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Comma-separated field names
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Field Selection */}
          {availableFields.length > 0 && (
            <FieldSelector
              fields={availableFields}
              selectedFields={formData.fields}
              onChange={(fields) => setFormData({ ...formData, fields })}
              label="Select Fields"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-card pt-4 mt-6 border-t border-border space-y-2">
          <button
            type="submit"
            className="btn btn-primary btn-md w-full"
            disabled={isLoading || !formData.fragmentType}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Loading...
              </>
            ) : (
              <>
                <Search className="mr-2" size={16} />
                Load Fragments
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowCodeGenerator(true)}
            className="btn btn-secondary btn-md w-full"
            disabled={!formData.fragmentType}
          >
            <Code className="mr-2" size={16} />
            Generate Code
          </button>
        </div>
      </form>

      {/* Code Generator Modal */}
      {showCodeGenerator && (
        <CodeGenerator
          code={generateFragmentCode(formData, config)}
          onClose={() => setShowCodeGenerator(false)}
        />
      )}
    </div>
  );
}

export default FragmentsExplorer;
