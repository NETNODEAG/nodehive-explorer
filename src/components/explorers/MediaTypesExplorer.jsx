import React, { useState } from 'react';
import { Loader2, Search, Layers } from 'lucide-react';

function MediaTypesExplorer({ client, onDataFetch, isLoading, setIsLoading, setError }) {
  const [limit, setLimit] = useState(50);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError(null);

      const response = await client.request('/jsonapi/media_type/media_type');
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
          <Layers size={18} />
          Media Types
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <div className="space-y-4">
          <div className="card p-4">
            <h4 className="text-sm font-medium mb-2">Information</h4>
            <p className="text-xs text-muted-foreground">
              Media types define the different kinds of media entities available in your system.
              This endpoint typically requires higher permissions as it exposes configuration.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="sticky bottom-0 bg-card pt-4 mt-6 border-t border-border">
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
                Load Media Types
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default MediaTypesExplorer;
