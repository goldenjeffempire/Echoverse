import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'isomorphic-dompurify';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, } from '@dnd-kit/sortable';
import { useSortable, } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Wand2, Layout, Code, Eye, Save, Download, Sparkles, Plus, Grid3X3, Type, Image, MousePointer, Settings } from 'lucide-react';
function SortableComponent({ component, index, onEdit, onDelete }) {
    const { attributes, listeners, setNodeRef, transform, transition, } = useSortable({ id: component.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    return (<div ref={setNodeRef} style={style} {...attributes} {...listeners} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">{component.name}</h4>
        <div className="flex gap-2">
          <button onClick={(e) => {
            e.stopPropagation();
            onEdit(component);
        }} className="text-blue-600 hover:text-blue-800 text-sm">
            Edit
          </button>
          <button onClick={(e) => {
            e.stopPropagation();
            onDelete(index);
        }} className="text-red-600 hover:text-red-800 text-sm">
            Delete
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-600">{component.preview}</p>
      <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
        Type: {component.type}
      </div>
    </div>);
}
export default function WebsiteBuilder() {
    const [currentView, setCurrentView] = useState('design');
    const [selectedPage, setSelectedPage] = useState('');
    const [websiteData, setWebsiteData] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activePanel, setActivePanel] = useState('ai');
    const [generationParams, setGenerationParams] = useState({
        description: '',
        businessType: '',
        style: 'modern',
        pages: ['home', 'about', 'contact'],
        colorScheme: 'professional',
        features: []
    });
    const [pageComponents, setPageComponents] = useState([]);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [selectedComponent, setSelectedComponent] = useState(null);
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
    }));
    // Update page components when selectedPage changes
    useEffect(() => {
        if (websiteData && selectedPage) {
            const currentPage = websiteData.pages.find(p => p.id === selectedPage);
            if (currentPage) {
                setPageComponents(currentPage.components || []);
            }
        }
    }, [websiteData, selectedPage]);
    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;
        // Guard against dragging outside the canvas or invalid over target
        if (!over || active.id === over.id) {
            return; // No reordering needed
        }
        setPageComponents((items) => {
            const oldIndex = items.findIndex(item => item.id === active.id);
            const newIndex = items.findIndex(item => item.id === over.id);
            // Bounds checking to prevent arrayMove errors
            if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
                return items; // Return unchanged if indexes are invalid
            }
            // Safe to reorder
            const newItems = arrayMove(items, oldIndex, newIndex);
            // Update the website data
            if (websiteData) {
                const updatedWebsite = { ...websiteData };
                const pageIndex = updatedWebsite.pages.findIndex(p => p.id === selectedPage);
                if (pageIndex !== -1) {
                    updatedWebsite.pages[pageIndex].components = newItems;
                    setWebsiteData(updatedWebsite);
                }
            }
            return newItems;
        });
    }, [selectedPage, websiteData]);
    const handleEditComponent = useCallback((component) => {
        setSelectedComponent(component);
        setIsEditorOpen(true);
    }, []);
    const handleDeleteComponent = useCallback((index) => {
        const newComponents = pageComponents.filter((_, i) => i !== index);
        setPageComponents(newComponents);
        // Update the website data
        if (websiteData) {
            const updatedWebsite = { ...websiteData };
            const pageIndex = updatedWebsite.pages.findIndex(p => p.id === selectedPage);
            if (pageIndex !== -1) {
                updatedWebsite.pages[pageIndex].components = newComponents;
                setWebsiteData(updatedWebsite);
            }
        }
    }, [pageComponents, selectedPage, websiteData]);
    const handleGenerateWebsite = useCallback(async () => {
        if (!generationParams.description || !generationParams.businessType) {
            alert('Please provide a description and business type');
            return;
        }
        setIsGenerating(true);
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                alert('Please log in to use the AI Website Builder');
                window.location.href = '/auth';
                return;
            }
            const response = await fetch('/api/ai/generate-complete-website', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(generationParams),
            });
            if (response.status === 401 || response.status === 403) {
                alert('Your session has expired. Please log in again.');
                localStorage.removeItem('accessToken');
                window.location.href = '/auth';
                return;
            }
            if (response.ok) {
                const data = await response.json();
                setWebsiteData(data.website);
                // Fix: Set selectedPage to the first generated page ID
                if (data.website.pages && data.website.pages.length > 0) {
                    setSelectedPage(data.website.pages[0].id);
                }
                setCurrentView('design');
            }
            else {
                const error = await response.json();
                alert(`Generation failed: ${error.message}`);
            }
        }
        catch (error) {
            console.error('Website generation error:', error);
            alert('Failed to generate website. Please try again.');
        }
        finally {
            setIsGenerating(false);
        }
    }, [generationParams]);
    const handleGenerateComponent = useCallback(async (type, description) => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                alert('Please log in to generate components');
                return;
            }
            const response = await fetch('/api/ai/generate-component', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    type,
                    description,
                    style: websiteData?.theme?.layout || 'modern'
                }),
            });
            if (response.status === 401 || response.status === 403) {
                alert('Your session has expired. Please log in again.');
                localStorage.removeItem('accessToken');
                window.location.href = '/auth';
                return;
            }
            if (response.ok) {
                const data = await response.json();
                // Add component to current page
                if (websiteData) {
                    const updatedWebsite = { ...websiteData };
                    const pageIndex = updatedWebsite.pages.findIndex(p => p.id === selectedPage);
                    if (pageIndex !== -1) {
                        updatedWebsite.pages[pageIndex].components.push(data.component);
                        setWebsiteData(updatedWebsite);
                    }
                }
            }
            else {
                const error = await response.json();
                alert(`Component generation failed: ${error.message}`);
            }
        }
        catch (error) {
            console.error('Component generation error:', error);
            alert('Failed to generate component. Please try again.');
        }
    }, [websiteData, selectedPage]);
    return (<div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <motion.div initial={{ x: -300 }} animate={{ x: 0 }} className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wand2 className="text-blue-600"/>
            AI Website Builder
          </h1>
          <p className="text-gray-600 text-sm mt-1">Create stunning websites with AI</p>
        </div>

        {/* Panel Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'ai', label: 'AI Generate', icon: Sparkles },
            { id: 'components', label: 'Components', icon: Grid3X3 },
            { id: 'templates', label: 'Templates', icon: Layout },
            { id: 'settings', label: 'Settings', icon: Settings }
        ].map(({ id, label, icon: Icon }) => (<button key={id} onClick={() => setActivePanel(id)} className={`flex-1 px-3 py-2 text-xs font-medium flex items-center justify-center gap-1 transition-colors ${activePanel === id
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
              <Icon size={14}/>
              {label}
            </button>))}
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activePanel === 'ai' && (<motion.div key="ai" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe Your Website
                  </label>
                  <textarea value={generationParams.description} onChange={(e) => setGenerationParams(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe what kind of website you want..." className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" rows={4}/>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Type
                  </label>
                  <select value={generationParams.businessType} onChange={(e) => setGenerationParams(prev => ({ ...prev, businessType: e.target.value }))} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Select business type...</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="retail">Retail Store</option>
                    <option value="services">Professional Services</option>
                    <option value="portfolio">Portfolio</option>
                    <option value="blog">Blog</option>
                    <option value="nonprofit">Non-Profit</option>
                    <option value="startup">Startup</option>
                    <option value="agency">Agency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Design Style
                  </label>
                  <select value={generationParams.style} onChange={(e) => setGenerationParams(prev => ({ ...prev, style: e.target.value }))} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="modern">Modern</option>
                    <option value="classic">Classic</option>
                    <option value="minimal">Minimal</option>
                    <option value="creative">Creative</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color Scheme
                  </label>
                  <select value={generationParams.colorScheme} onChange={(e) => setGenerationParams(prev => ({ ...prev, colorScheme: e.target.value }))} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="professional">Professional</option>
                    <option value="vibrant">Vibrant</option>
                    <option value="warm">Warm</option>
                    <option value="cool">Cool</option>
                    <option value="monochrome">Monochrome</option>
                  </select>
                </div>

                <button onClick={handleGenerateWebsite} disabled={isGenerating || !generationParams.description || !generationParams.businessType} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {isGenerating ? (<>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </>) : (<>
                      <Sparkles size={18}/>
                      Generate Website
                    </>)}
                </button>
              </motion.div>)}

            {activePanel === 'components' && (<motion.div key="components" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-4 space-y-3">
                {[
                { type: 'hero', name: 'Hero Section', icon: Type },
                { type: 'navbar', name: 'Navigation', icon: Layout },
                { type: 'card', name: 'Content Card', icon: Grid3X3 },
                { type: 'gallery', name: 'Image Gallery', icon: Image },
                { type: 'form', name: 'Contact Form', icon: MousePointer },
                { type: 'testimonial', name: 'Testimonials', icon: Type },
                { type: 'pricing', name: 'Pricing Table', icon: Grid3X3 },
                { type: 'footer', name: 'Footer', icon: Layout }
            ].map(({ type, name, icon: Icon }) => (<button key={type} onClick={() => {
                    const description = prompt(`Describe the ${name} you want to create:`);
                    if (description) {
                        handleGenerateComponent(type, description);
                    }
                }} className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3">
                    <Icon size={18} className="text-gray-500"/>
                    <div>
                      <div className="font-medium text-gray-900">{name}</div>
                      <div className="text-xs text-gray-500">AI-generated component</div>
                    </div>
                    <Plus size={16} className="text-gray-400 ml-auto"/>
                  </button>))}
              </motion.div>)}

            {activePanel === 'templates' && (<motion.div key="templates" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-4">
                <div className="text-center text-gray-500 py-8">
                  <Layout size={48} className="mx-auto mb-4 opacity-50"/>
                  <p>Template gallery coming soon!</p>
                  <p className="text-sm mt-1">Browse pre-built templates</p>
                </div>
              </motion.div>)}

            {activePanel === 'settings' && (<motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-4">
                <div className="text-center text-gray-500 py-8">
                  <Settings size={48} className="mx-auto mb-4 opacity-50"/>
                  <p>Website settings coming soon!</p>
                  <p className="text-sm mt-1">Customize themes and settings</p>
                </div>
              </motion.div>)}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {websiteData?.name || 'New Website'}
            </h2>
            {websiteData && (<div className="flex items-center gap-2">
                {websiteData.pages.map((page) => (<button key={page.id} onClick={() => setSelectedPage(page.id)} className={`px-3 py-1 text-sm rounded-md transition-colors ${selectedPage === page.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
                    {page.name}
                  </button>))}
              </div>)}
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex rounded-lg bg-gray-100 p-1">
              {[
            { id: 'design', icon: Layout, label: 'Design' },
            { id: 'code', icon: Code, label: 'Code' },
            { id: 'preview', icon: Eye, label: 'Preview' }
        ].map(({ id, icon: Icon, label }) => (<button key={id} onClick={() => setCurrentView(id)} className={`px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1 transition-colors ${currentView === id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'}`}>
                  <Icon size={16}/>
                  {label}
                </button>))}
            </div>

            {/* Action Buttons */}
            {websiteData && (<div className="flex items-center gap-2">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                  <Save size={16}/>
                  Save
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <Download size={16}/>
                  Export
                </button>
              </div>)}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-hidden">
          {!websiteData ? (<div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Wand2 size={64} className="mx-auto text-gray-400 mb-4"/>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Ready to build your website?
                </h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  Use our AI-powered website builder to create a professional website in minutes.
                  Just describe what you want and we'll handle the rest.
                </p>
                <button onClick={() => setActivePanel('ai')} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto">
                  <Sparkles size={18}/>
                  Start Building
                </button>
              </div>
            </div>) : (<div className="h-full bg-white">
              {currentView === 'design' && (<div className="h-full p-6">
                  <div className="border border-gray-200 rounded-lg h-full bg-white flex">
                    {/* Page Content Area */}
                    <div className="flex-1 p-6 overflow-auto">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {websiteData.pages.find(p => p.id === selectedPage)?.title || 'Page'}
                        </h3>
                        <div className="prose max-w-none mb-6" dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(websiteData.pages.find(p => p.id === selectedPage)?.content || '<p>No content generated yet</p>', {
                        ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'strong', 'em', 'img', 'blockquote', 'code', 'pre', 'br', 'div', 'span'],
                        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id'],
                        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
                    })
                }}/>
                      </div>
                      
                      {/* Components Section */}
                      <div className="border-t border-gray-200 pt-6">
                        <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                          <Grid3X3 size={18}/>
                          Page Components
                          <span className="text-sm text-gray-500">({pageComponents.length})</span>
                        </h4>
                        
                        {pageComponents.length === 0 ? (<div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                            <Grid3X3 size={48} className="mx-auto text-gray-400 mb-2"/>
                            <p className="text-gray-600">No components yet</p>
                            <p className="text-sm text-gray-500">Generate components using the sidebar</p>
                          </div>) : (<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={pageComponents.map(c => c.id)} strategy={verticalListSortingStrategy}>
                              <div className="space-y-4">
                                {pageComponents.map((component, index) => (<SortableComponent key={component.id} component={component} index={index} onEdit={handleEditComponent} onDelete={handleDeleteComponent}/>))}
                              </div>
                            </SortableContext>
                          </DndContext>)}
                      </div>
                    </div>
                    
                    {/* Quick Add Panel */}
                    <div className="w-64 border-l border-gray-200 p-4 bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-3">Quick Add</h4>
                      <div className="space-y-2">
                        {[
                    { type: 'hero', name: 'Hero' },
                    { type: 'card', name: 'Card' },
                    { type: 'form', name: 'Form' },
                    { type: 'gallery', name: 'Gallery' }
                ].map(({ type, name }) => (<button key={type} onClick={() => {
                        const description = prompt(`Describe the ${name} component:`);
                        if (description) {
                            handleGenerateComponent(type, description);
                        }
                    }} className="w-full text-left p-2 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                            Add {name}
                          </button>))}
                      </div>
                    </div>
                  </div>
                </div>)}

              {currentView === 'code' && (<div className="h-full p-6">
                  <div className="border border-gray-200 rounded-lg h-full bg-gray-900">
                    <pre className="h-full overflow-auto p-6 text-green-400 text-sm font-mono">
                      {websiteData.pages.find(p => p.id === selectedPage)?.content || 'No content'}
                    </pre>
                  </div>
                </div>)}

              {currentView === 'preview' && (<div className="h-full bg-gray-100 p-6">
                  <div className="mx-auto max-w-4xl bg-white rounded-lg shadow-lg h-full">
                    <iframe className="w-full h-full rounded-lg" srcDoc={`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <style>
                              body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
                              * { box-sizing: border-box; }
                            </style>
                          </head>
                          <body>
                            ${websiteData.pages.find(p => p.id === selectedPage)?.content || 'No content'}
                          </body>
                        </html>
                      `} title="Website Preview"/>
                  </div>
                </div>)}
            </div>)}
        </div>
      </div>
    </div>);
}
