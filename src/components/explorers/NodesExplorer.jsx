import React, { useState, useEffect } from 'react';
import { DrupalJsonApiParams } from 'drupal-jsonapi-params';
import { Search, Loader2, ChevronDown, ChevronUp, Code, Plus, X, Filter } from 'lucide-react';
import FieldSelector from '../FieldSelector';
import CodeGenerator from '../CodeGenerator';
import { generateNodeCode } from '../../utils/codeGenerator';
import useConnectionStore from '../../store/connectionStore';

function NodesExplorer({ client, onDataFetch, isLoading, setIsLoading, setError }) {
  const { config } = useConnectionStore();
  const [contentTypes, setContentTypes] = useState([]);
  const [formData, setFormData] = useState({
    contentType: '',
    language: '',
    limit: 10,
    sort: '',
    includes: '',
    fields: [],
    filters: []
  });
  const [availableFields, setAvailableFields] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showCodeGenerator, setShowCodeGenerator] = useState(false);

  useEffect(() => {
    loadContentTypes();
  }, [client]);

  const loadContentTypes = async () => {
    try {
      // Fetch the main jsonapi index to see what's actually available
      const response = await client.request('/jsonapi');

      if (response.links) {
        // Find all node--* endpoints
        const nodeTypes = [];

        Object.keys(response.links).forEach(key => {
          if (key.startsWith('node--')) {
            const machineType = key.replace('node--', '');
            // Create a formatted label from the machine name
            const label = machineType
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');

            nodeTypes.push({
              id: key,
              type: machineType,
              attributes: {
                drupal_internal__type: machineType,
                name: label
              }
            });
          }
        });

        setContentTypes(nodeTypes);
      }
    } catch (error) {
      console.error('Failed to load content types:', error);
    }
  };

  const handleContentTypeChange = async (contentType) => {
    setFormData({ ...formData, contentType, fields: [], filters: [] });

    if (!contentType) {
      setAvailableFields([]);
      return;
    }

    try {
      // Fetch a sample node to discover fields
      const params = new DrupalJsonApiParams().addPageLimit(1);
      const response = await client.getNodes(contentType, { params });

      if (response.data && response.data.length > 0) {
        const sampleNode = response.data[0];
        let fields = [];

        // Check for fields in attributes
        if (sampleNode.attributes) {
          fields = Object.keys(sampleNode.attributes);
        }

        // Also check for direct fields
        const directFields = Object.keys(sampleNode).filter(key =>
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

  const addFilter = () => {
    setFormData({
      ...formData,
      filters: [...formData.filters, { field: '', operator: '=', value: '' }]
    });
  };

  const removeFilter = (index) => {
    setFormData({
      ...formData,
      filters: formData.filters.filter((_, i) => i !== index)
    });
  };

  const updateFilter = (index, key, value) => {
    const newFilters = [...formData.filters];
    newFilters[index][key] = value;
    setFormData({ ...formData, filters: newFilters });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.contentType) {
      setError('Please select a content type');
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
        params.addFields(`node--${formData.contentType}`, formData.fields);
      }

      // Add filters
      formData.filters.forEach(filter => {
        if (filter.field && filter.value) {
          params.addFilter(filter.field, filter.value, filter.operator);
        }
      });

      const options = {
        params,
        lang: formData.language || undefined
      };

      const response = await client.getNodes(formData.contentType, options);
      onDataFetch(response);
    } catch (error) {
      // Check if error response has structured errors
      if (error.response?.errors && error.response.errors.length > 0) {
        const apiError = error.response.errors[0];
        setError({
          title: apiError.title,
          status: apiError.status,
          detail: apiError.detail,
          via: apiError.links?.via?.href
        });
      } else {
        setError({ message: error.message || String(error) });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-medium">Explore Nodes</h3>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <div className="space-y-3">
          {/* Content Type Selection */}
          <div>
            <label className="label">Content Type *</label>
            <select
              className="select mt-1"
              value={formData.contentType}
              onChange={(e) => handleContentTypeChange(e.target.value)}
              required
            >
              <option value="">Select content type...</option>
              {contentTypes.map((type) => (
                <option
                  key={type.id}
                  value={type.attributes?.drupal_internal__type || type.type}
                >
                  {type.attributes?.name || type.attributes?.drupal_internal__type || type.type}
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
              <option value="title,ASC">Title (A-Z)</option>
              <option value="title,DESC">Title (Z-A)</option>
            </select>
          </div>

          {/* Filters */}
          <div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              <Filter size={16} />
              Filters
            </button>

            {showFilters && (
              <div className="mt-2 space-y-2 pl-4 border-l-2 border-border">
                {formData.filters.map((filter, index) => (
                  <div key={index} className="flex gap-1.5 items-start">
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="text"
                        className="input w-full text-sm"
                        placeholder="Field (e.g., title)"
                        value={filter.field}
                        onChange={(e) => updateFilter(index, 'field', e.target.value)}
                      />
                      <div className="flex gap-1.5">
                        <select
                          className="select flex-1 text-sm"
                          value={filter.operator}
                          onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                        >
                          <option value="=">=</option>
                          <option value="<>">!=</option>
                          <option value=">">{'>'}</option>
                          <option value="<">{'<'}</option>
                          <option value=">=">{'>='}</option>
                          <option value="<=">{'<='}</option>
                          <option value="CONTAINS">Contains</option>
                          <option value="STARTS_WITH">Starts with</option>
                          <option value="ENDS_WITH">Ends with</option>
                          <option value="IN">In</option>
                        </select>
                        <input
                          type="text"
                          className="input flex-1 text-sm"
                          placeholder="Value"
                          value={filter.value}
                          onChange={(e) => updateFilter(index, 'value', e.target.value)}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFilter(index)}
                      className="btn btn-ghost btn-sm p-1"
                      title="Remove filter"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addFilter}
                  className="btn btn-outline btn-sm w-full"
                >
                  <Plus size={14} className="mr-1" />
                  Add Filter
                </button>
              </div>
            )}
          </div>

          {/* Include Relations */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              Include Relations
            </button>

            {showAdvanced && (
              <div className="mt-2 space-y-3 pl-4 border-l-2 border-border">
                <div>
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
        <div className="sticky bottom-0 bg-card pt-3 mt-4 border-t border-border space-y-2">
          <button
            type="submit"
            className="btn btn-primary btn-md w-full"
            disabled={isLoading || !formData.contentType}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Loading...
              </>
            ) : (
              <>
                <Search className="mr-2" size={16} />
                Load Nodes
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowCodeGenerator(true)}
            className="btn btn-secondary btn-md w-full"
            disabled={!formData.contentType}
          >
            <Code className="mr-2" size={16} />
            Generate Code
          </button>
        </div>
      </form>

      {/* Code Generator Modal */}
      {showCodeGenerator && (
        <CodeGenerator
          code={generateNodeCode(formData, config)}
          onClose={() => setShowCodeGenerator(false)}
        />
      )}
    </div>
  );
}

export default NodesExplorer;