import React from 'react';
import {
  FileText,
  Tag,
  Menu,
  Image,
  Link,
  Database,
  Globe,
  Type,
  Boxes,
  Layers,
  FolderTree,
  MapPin
} from 'lucide-react';
import clsx from 'clsx';

const contentEntities = [
  { id: 'nodes', label: 'Nodes', icon: FileText, description: 'Content nodes' },
  { id: 'taxonomy', label: 'Taxonomy Terms', icon: Tag, description: 'Taxonomy terms' },
  { id: 'media', label: 'Media', icon: Image, description: 'Files & images' },
  { id: 'menus', label: 'Menus', icon: Menu, description: 'Menu links' },
  { id: 'texts', label: 'Texts', icon: Type, description: 'Text content' },
  { id: 'fragments', label: 'Fragments', icon: Boxes, description: 'Fragments' },
  { id: 'areas', label: 'Areas', icon: MapPin, description: 'NodeHive areas' }
];

const typeEntities = [
  { id: 'content-types', label: 'Content Types', icon: Database, description: 'Node types' },
  { id: 'media-types', label: 'Media Types', icon: Layers, description: 'Media types' },
  { id: 'fragment-types', label: 'Fragment Types', icon: FolderTree, description: 'Fragment types' },
  { id: 'taxonomy-vocabularies', label: 'Vocabularies', icon: Tag, description: 'Taxonomy vocabularies' }
];

const systemEntities = [
  { id: 'router', label: 'Router', icon: Link, description: 'URL aliases' },
  { id: 'spaces', label: 'Spaces', icon: Globe, description: 'NodeHive spaces' }
];

function Sidebar({ selectedEntity, onSelectEntity, isConnected }) {
  const renderEntityButton = (entity) => {
    const Icon = entity.icon;
    const isActive = selectedEntity === entity.id;
    const isDisabled = !isConnected;

    return (
      <button
        key={entity.id}
        className={clsx(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors group',
          {
            'bg-primary text-primary-foreground': isActive && !isDisabled,
            'hover:bg-secondary': !isActive && !isDisabled,
            'opacity-50 cursor-not-allowed': isDisabled
          }
        )}
        onClick={() => !isDisabled && onSelectEntity(entity.id)}
        disabled={isDisabled}
      >
        <Icon
          className={clsx(
            'flex-shrink-0',
            isActive && !isDisabled ? 'text-primary-foreground' : 'text-muted-foreground'
          )}
          size={18}
        />
        <div className="flex-1 min-w-0">
          <div className={clsx(
            'text-sm font-medium',
            isActive && !isDisabled ? 'text-primary-foreground' : 'text-foreground'
          )}>
            {entity.label}
          </div>
          <div className={clsx(
            'text-xs',
            isActive && !isDisabled ? 'text-primary-foreground/80' : 'text-muted-foreground'
          )}>
            {entity.description}
          </div>
        </div>
      </button>
    );
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Entities
        </h2>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {/* Content Entities */}
        <div className="mb-2">
          {contentEntities.map(renderEntityButton)}
        </div>

        {/* Divider */}
        <div className="my-3 px-3">
          <div className="border-t border-border"></div>
          <p className="text-xs text-muted-foreground mt-2 mb-1">
            Entity Types
          </p>
        </div>

        {/* Type Entities */}
        <div className="mb-2">
          {typeEntities.map(renderEntityButton)}
        </div>

        {/* Divider */}
        <div className="my-3 px-3">
          <div className="border-t border-border"></div>
          <p className="text-xs text-muted-foreground mt-2 mb-1">
            System
          </p>
        </div>

        {/* System Entities */}
        <div>
          {systemEntities.map(renderEntityButton)}
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;