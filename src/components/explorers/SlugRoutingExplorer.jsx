import React, { useState } from 'react';
import { Globe, Loader2, Code, ArrowRight } from 'lucide-react';
import CodeGenerator from '../CodeGenerator';
import { generateSlugRoutingCode } from '../../utils/codeGenerator';
import useConnectionStore from '../../store/connectionStore';

function SlugRoutingExplorer({ client, onDataFetch, isLoading, setIsLoading, setError }) {
  const { config } = useConnectionStore();
  const [formData, setFormData] = useState({
    slug: '',
    language: ''
  });
  const [showCodeGenerator, setShowCodeGenerator] = useState(false);

  const popularSlugs = [
    '/about',
    '/contact',
    '/node/1',
    '/products',
    '/blog'
  ];

  const handleResolveSlug = async (e) => {
    e.preventDefault();

    if (!formData.slug) {
      setError('Please enter a slug or path');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const options = {
        lang: formData.language || undefined
      };

      const response = await client.getResourceBySlug(formData.slug, options);
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
          <Globe size={18} />
          Slug Routing
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Resolve any slug or path to its resource
        </p>
      </div>

      <form onSubmit={handleResolveSlug} className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <div className="space-y-4">
          {/* Browser-like URL Bar */}
          <div>
            <label className="label text-xs mb-2">Enter Slug or Path</label>
            <div className="flex items-center gap-2 bg-secondary/50 rounded-lg border border-border p-1.5 focus-within:border-primary transition-colors">
              <Globe size={16} className="text-muted-foreground ml-2" />
              <input
                type="text"
                className="flex-1 bg-transparent outline-none text-sm px-2 py-1"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="/about, /node/1, /products/example"
                autoFocus
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm px-3"
                disabled={isLoading || !formData.slug}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <ArrowRight size={16} />
                )}
              </button>
            </div>
          </div>

          {/* Language (Optional) */}
          <div>
            <label className="label text-xs">Language (optional)</label>
            <input
              type="text"
              className="input mt-1 text-sm"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              placeholder="en, de, fr..."
            />
          </div>

          {/* Quick Examples */}
          <div className="card p-4">
            <h4 className="text-sm font-medium mb-3">Popular Paths</h4>
            <div className="space-y-2">
              {popularSlugs.map((slug) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => setFormData({ ...formData, slug })}
                  className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 w-full text-left px-2 py-1.5 rounded hover:bg-secondary/50 transition-colors"
                >
                  <ArrowRight size={12} />
                  {slug}
                </button>
              ))}
            </div>
          </div>

          {/* Info Card */}
          <div className="card p-4 bg-primary/5 border-primary/20">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Globe size={14} />
              How it works
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter any path or slug (like <code className="bg-secondary px-1 rounded">/about</code> or <code className="bg-secondary px-1 rounded">/node/123</code>)
              and get the full resource object with all its data. This uses the router to resolve the path to the actual content entity.
            </p>
          </div>
        </div>

        {/* Code Generator Button */}
        <div className="sticky bottom-0 bg-card pt-4 mt-6 border-t border-border">
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
          code={generateSlugRoutingCode(formData, config)}
          onClose={() => setShowCodeGenerator(false)}
        />
      )}
    </div>
  );
}

export default SlugRoutingExplorer;
